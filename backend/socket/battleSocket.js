import Battle from '../models/Battle.js';
import User from '../models/User.js';
import Friend from '../models/Friend.js';
import matchmakingQueue from '../services/matchmaking.js';
import { executeCode } from '../services/codeExecutor.js';
import { analyzeCodeQuality, calculateBattleScore } from '../services/codeQualityAnalyzer.js';
import { generateProblem, generateEditorial, generateCodeImprovements } from '../services/geminiService.js';

/**
 * Helper function to provide a default editorial if AI generation fails
 * @param {Object} problem - The problem object
 * @returns {Object} Default editorial object
 */
function getDefaultEditorial(problem) {
  return {
    summary: `"${problem.title}" is a ${problem.difficulty.toLowerCase()} level challenge that tests your problem-solving skills. ${problem.description.substring(0, 200)}${problem.description.length > 200 ? '...' : ''}`,
    approach: `This is a ${problem.difficulty} problem that can be solved by carefully analyzing the problem requirements and implementing a solution that handles all test cases within the time limit of ${problem.timeLimit} seconds.`,
    optimalSolution: `// Solution will vary based on the problem and language used\n// Focus on:\n// 1. Understanding the problem requirements\n// 2. Identifying edge cases\n// 3. Implementing an efficient algorithm\n// 4. Testing thoroughly`,
    timeComplexity: "Varies based on approach",
    spaceComplexity: "Varies based on approach",
    keyTakeaways: [
      "Read and understand the problem statement carefully",
      "Consider edge cases and constraints",
      "Test your solution with the provided test cases",
      "Optimize for both time and space complexity when possible"
    ],
    commonMistakes: [
      "Not handling edge cases properly",
      "Exceeding time or memory limits",
      "Misunderstanding the problem requirements"
    ]
  };
}

/**
 * Helper function to get or generate a problem for battle
 * Uses AI to generate problems based on user profiles
 * @param {string} difficulty - Problem difficulty
 * @param {Array} players - Array of player user IDs
 * @returns {Promise<Object>} Problem data object
 */
async function getProblemForBattle(difficulty, players) {
  try {
    // Get user profiles to determine problem characteristics
    const users = await User.find({ _id: { $in: players } }).lean();
    
    // Calculate average user profile for problem generation
    const avgLevel = users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length;
    const avgXP = users.reduce((sum, u) => sum + (u.xp || 0), 0) / users.length;
    
    // Use the league of the first player or determine from difficulty
    let league = users[0]?.league || 'Unranked';
    
    // Generate problem using AI
    const problemData = await generateProblem({
      league,
      level: Math.round(avgLevel),
      xp: Math.round(avgXP)
    });
    
    // Override difficulty if needed
    problemData.difficulty = difficulty;
    
    return problemData;
  } catch (error) {
    console.error('Error generating AI problem:', error);
    throw new Error('Failed to generate problem');
  }
}

export const setupBattleSocket = (io) => {
  const activeBattles = new Map(); // battleId -> battle state
  const onlineUsers = new Map(); // userId -> socketId
  const pendingChallenges = new Map(); // challengeId -> challenge data
  const disconnectTimers = new Map(); // userId -> timeout
  const battleTimers = new Map(); // battleId -> timeout for battle time limit
  const lastChanceTimers = new Map(); // battleId -> timeout for last chance period

  // Periodic matchmaking retry for league-based expansion
  // Every 5 seconds, retry matching for all waiting players
  const matchmakingInterval = setInterval(async () => {
    try {
      const queueSize = matchmakingQueue.getQueueStatus();
      if (queueSize < 2) return;

      // Get queue details to retry matching
      const queuedPlayers = matchmakingQueue.getQueueDetails();
      
      // Try to match each player (the findMatch function handles league-based logic)
      for (const playerInfo of queuedPlayers) {
        const match = matchmakingQueue.findMatch(playerInfo.userId);
        
        if (match) {
          // Use the difficulty determined by matchmaking
          const { difficulty } = match;
          
          // Generate AI problem for battle
          const problem = await getProblemForBattle(difficulty, [match.player1.userId, match.player2.userId]);

          if (!problem) continue;

          const battle = await Battle.create({
            players: [match.player1.userId, match.player2.userId],
            problem: problem,
            status: 'active',
            mode: 'ranked'
          });

          const populatedBattle = await Battle.findById(battle._id)
            .populate('players', 'username level xp league trophies');

          // Notify both players
          const battleData = {
            battleId: battle._id,
            battle: populatedBattle,
            opponent: null
          };

          // Emit to player 1
          io.to(match.player1.socketId).emit('match-found', {
            ...battleData,
            opponent: {
              username: match.player2.username,
              userId: match.player2.userId,
              league: match.player2.league,
              trophies: match.player2.trophies
            }
          });

          // Emit to player 2
          io.to(match.player2.socketId).emit('match-found', {
            ...battleData,
            opponent: {
              username: match.player1.username,
              userId: match.player1.userId,
              league: match.player1.league,
              trophies: match.player1.trophies
            }
          });

          // Initialize battle state
          activeBattles.set(battle._id.toString(), {
            players: [
              { userId: match.player1.userId, socketId: match.player1.socketId, ready: false, completed: false },
              { userId: match.player2.userId, socketId: match.player2.socketId, ready: false, completed: false }
            ],
            startTime: Date.now()
          });

          // Set battle timeout
          startBattleTimer(battle._id.toString(), problem.timeLimit);

          console.log(`[Periodic Matchmaking] Battle ${battle._id} created: ${match.player1.username} (${match.player1.league}) vs ${match.player2.username} (${match.player2.league}) - Difficulty: ${difficulty}`);
        }
      }
    } catch (error) {
      console.error('Error in periodic matchmaking:', error);
    }
  }, 5000); // Run every 5 seconds

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // User comes online
    socket.on('user-online', async ({ userId, username }) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${username} (${userId}) is now online`);
      
      // Cancel any pending disconnect timer
      if (disconnectTimers.has(userId)) {
        clearTimeout(disconnectTimers.get(userId));
        disconnectTimers.delete(userId);
        console.log(`Cancelled forfeit timer for reconnected user ${userId}`);
      }
      
      // Notify friends that this user is online
      try {
        const friends = await Friend.getFriends(userId);
        friends.forEach(friend => {
          const friendSocketId = onlineUsers.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend-online', {
              userId,
              username
            });
          }
        });
      } catch (error) {
        console.error('Error notifying friends:', error);
      }
    });

    // Send friend challenge
    socket.on('send-friend-challenge', async ({ challengerId, opponentId }) => {
      try {
        // Verify they are friends
        const areFriends = await Friend.areFriends(challengerId, opponentId);
        if (!areFriends) {
          socket.emit('error', { message: 'You can only challenge friends' });
          return;
        }

        const [challenger, opponent] = await Promise.all([
          User.findById(challengerId),
          User.findById(opponentId)
        ]);

        if (!challenger || !opponent) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        // Automatically determine difficulty based on average league
        const challengerLeague = challenger.league || 'Unranked';
        const opponentLeague = opponent.league || 'Unranked';
        
        const challengerTier = matchmakingQueue.leagueTiers[challengerLeague] || 0;
        const opponentTier = matchmakingQueue.leagueTiers[opponentLeague] || 0;
        const avgLeagueTier = Math.round((challengerTier + opponentTier) / 2);
        
        const avgLeague = Object.keys(matchmakingQueue.leagueTiers).find(
          key => matchmakingQueue.leagueTiers[key] === avgLeagueTier
        ) || 'Unranked';
        const difficulty = matchmakingQueue.getProblemDifficulty(avgLeague);

        console.log(`Challenge difficulty calculation: ${challengerLeague} (${challengerTier}) + ${opponentLeague} (${opponentTier}) = ${avgLeague} -> ${difficulty}`);

        const challengeId = `${challengerId}-${opponentId}-${Date.now()}`;
        const challengeData = {
          challengeId,
          challenger: {
            id: challengerId,
            username: challenger.username,
            level: challenger.level,
            league: challengerLeague
          },
          opponent: {
            id: opponentId,
            username: opponent.username,
            level: opponent.level,
            league: opponentLeague
          },
          difficulty,
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000 // 1 minute to accept
        };

        pendingChallenges.set(challengeId, challengeData);

        // Set auto-decline timeout
        setTimeout(() => {
          if (pendingChallenges.has(challengeId)) {
            pendingChallenges.delete(challengeId);
            socket.emit('challenge-expired', { challengeId });
            
            const opponentSocketId = onlineUsers.get(opponentId);
            if (opponentSocketId) {
              io.to(opponentSocketId).emit('challenge-expired', { challengeId });
            }
          }
        }, 60000);

        // Send challenge to opponent
        const opponentSocketId = onlineUsers.get(opponentId);
        if (opponentSocketId) {
          io.to(opponentSocketId).emit('challenge-received', challengeData);
          socket.emit('challenge-sent', challengeData);
          console.log(`Challenge sent from ${challenger.username} to ${opponent.username} (${difficulty})`);
        } else {
          socket.emit('error', { message: 'User is offline' });
          console.log(`Challenge failed: ${opponent.username} is offline`);
        }
      } catch (error) {
        console.error('Error sending friend challenge:', error);
        console.error('Error stack:', error.stack);
        socket.emit('error', { message: error.message || 'Failed to send challenge' });
      }
    });

    // Accept friend challenge
    socket.on('accept-friend-challenge', async ({ challengeId }) => {
      try {
        const challengeData = pendingChallenges.get(challengeId);
        
        if (!challengeData) {
          socket.emit('error', { message: 'Challenge not found or expired' });
          return;
        }

        pendingChallenges.delete(challengeId);

        console.log(`Looking for problem with difficulty: ${challengeData.difficulty}`);
        
        // Generate AI problem for this friend battle
        const difficulty = challengeData.difficulty;
        const problem = await getProblemForBattle(difficulty, [challengeData.challenger.id, challengeData.opponent.id]);

        if (!problem) {
          socket.emit('error', { message: 'Failed to generate problem for this difficulty' });
          
          // Also notify the challenger
          const challengerSocketId = onlineUsers.get(challengeData.challenger.id);
          if (challengerSocketId) {
            io.to(challengerSocketId).emit('error', { message: 'Challenge failed: Could not generate problem' });
          }
          return;
        }

        const battle = await Battle.create({
          players: [challengeData.challenger.id, challengeData.opponent.id],
          problem: problem,
          status: 'active',
          isFriendBattle: true,
          mode: 'practice'
        });

        const populatedBattle = await Battle.findById(battle._id)
          .populate('players', 'username level xp');

        // Initialize battle state
        activeBattles.set(battle._id.toString(), {
          players: [
            { 
              userId: challengeData.challenger.id, 
              socketId: onlineUsers.get(challengeData.challenger.id), 
              ready: false, 
              completed: false 
            },
            { 
              userId: challengeData.opponent.id, 
              socketId: onlineUsers.get(challengeData.opponent.id), 
              ready: false, 
              completed: false 
            }
          ],
          startTime: Date.now(),
          isFriendBattle: true
        });

        // Set battle timeout
        startBattleTimer(battle._id.toString(), problem.timeLimit);

        // Notify both players
        const challengerSocketId = onlineUsers.get(challengeData.challenger.id);
        const opponentSocketId = onlineUsers.get(challengeData.opponent.id);
        
        if (challengerSocketId) {
          io.to(challengerSocketId).emit('challenge-accepted', {
            battleId: battle._id,
            battle: populatedBattle,
            opponent: {
              username: challengeData.opponent.username,
              userId: challengeData.opponent.id
            }
          });
          console.log(`Sent challenge-accepted to challenger ${challengeData.challenger.username}`);
        }

        if (opponentSocketId) {
          io.to(opponentSocketId).emit('challenge-accepted', {
            battleId: battle._id,
            battle: populatedBattle,
            opponent: {
              username: challengeData.challenger.username,
              userId: challengeData.challenger.id
            }
          });
          console.log(`Sent challenge-accepted to opponent ${challengeData.opponent.username}`);
        }

        console.log(`Friend battle ${battle._id} created between ${challengeData.challenger.username} and ${challengeData.opponent.username}`);
      } catch (error) {
        console.error('Error accepting friend challenge:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Decline friend challenge
    socket.on('decline-friend-challenge', ({ challengeId }) => {
      const challengeData = pendingChallenges.get(challengeId);
      
      if (challengeData) {
        pendingChallenges.delete(challengeId);
        
        const challengerSocketId = onlineUsers.get(challengeData.challenger.id);
        if (challengerSocketId) {
          io.to(challengerSocketId).emit('challenge-declined', {
            opponentUsername: challengeData.opponent.username
          });
        }
        
        socket.emit('challenge-declined-confirmed');
      }
    });

    // sole.log('Client connected:', socket.id);

    // Join matchmaking queue
    socket.on('join-queue', async ({ userId, username }) => {
      try {
        console.log(`${username} joining matchmaking queue`);
        
        // Fetch user data to get league and trophies for matchmaking
        const user = await User.findById(userId).lean();
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const league = user.league || 'Unranked';
        const trophies = user.trophies || 0;
        
        matchmakingQueue.addPlayer(userId, username, socket.id, league, trophies);
        
        // Emit queue status
        const queueSize = matchmakingQueue.getQueueStatus();
        socket.emit('queue-status', { queueSize });

        // Try to find a match
        const match = matchmakingQueue.findMatch(userId);
        
        if (match) {
          // Use the difficulty determined by matchmaking
          const { difficulty } = match;
          
          // Generate AI problem for battle
          const problem = await getProblemForBattle(difficulty, [match.player1.userId, match.player2.userId]);

          if (!problem) {
            socket.emit('error', { message: 'Failed to generate problem' });
            return;
          }

          const battle = await Battle.create({
            players: [match.player1.userId, match.player2.userId],
            problem: problem,
            status: 'active',
            mode: 'ranked'
          });

          const populatedBattle = await Battle.findById(battle._id)
            .populate('players', 'username level xp league trophies');

          // Notify both players
          const battleData = {
            battleId: battle._id,
            battle: populatedBattle,
            opponent: null
          };

          // Emit to player 1
          io.to(match.player1.socketId).emit('match-found', {
            ...battleData,
            opponent: {
              username: match.player2.username,
              userId: match.player2.userId,
              league: match.player2.league,
              trophies: match.player2.trophies
            }
          });

          // Emit to player 2
          io.to(match.player2.socketId).emit('match-found', {
            ...battleData,
            opponent: {
              username: match.player1.username,
              userId: match.player1.userId,
              league: match.player1.league,
              trophies: match.player1.trophies
            }
          });

          // Initialize battle state
          activeBattles.set(battle._id.toString(), {
            players: [
              { userId: match.player1.userId, socketId: match.player1.socketId, ready: false, completed: false },
              { userId: match.player2.userId, socketId: match.player2.socketId, ready: false, completed: false }
            ],
            startTime: Date.now()
          });

          // Set battle timeout
          startBattleTimer(battle._id.toString(), problem.timeLimit);

          console.log(`Battle ${battle._id} created: ${match.player1.username} (${match.player1.league}) vs ${match.player2.username} (${match.player2.league}) - Difficulty: ${difficulty}`);
        }
      } catch (error) {
        console.error('Error in join-queue:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave queue
    socket.on('leave-queue', ({ userId }) => {
      matchmakingQueue.removePlayer(userId);
      socket.emit('left-queue');
    });

    // Join battle room
    socket.on('join-battle', ({ battleId, userId }) => {
      try {
        if (!battleId || !userId) {
          console.error('Invalid join-battle request: missing battleId or userId');
          socket.emit('error', { message: 'Invalid request parameters' });
          return;
        }

        socket.join(battleId);
        console.log(`User ${userId} joined battle ${battleId}`);
        
        // Update player's socketId in activeBattles
        const battleState = activeBattles.get(battleId);
        if (battleState) {
          const player = battleState.players.find(p => p.userId === userId);
          if (player) {
            player.socketId = socket.id;
            console.log(`Updated socketId for user ${userId} in battle ${battleId}`);
          } else {
            console.warn(`Player ${userId} not found in battle state for ${battleId}`);
          }
        } else {
          console.warn(`Battle state not found for ${battleId}`);
        }
        
        // Cancel disconnect timer if user reconnected
        if (disconnectTimers.has(userId)) {
          clearTimeout(disconnectTimers.get(userId));
          disconnectTimers.delete(userId);
        console.log(`Cancelled forfeit timer for user ${userId}`);
      }
      } catch (error) {
        console.error('Error in join-battle:', error);
        socket.emit('error', { message: 'Failed to join battle' });
      }
    });

    // Leave battle (explicit user action - immediate forfeit, no grace period)
    socket.on('leave-battle', async ({ battleId, userId }) => {
      try {
        console.log(`User ${userId} explicitly left battle ${battleId}`);
        
        const battle = await Battle.findById(battleId);
        
        if (!battle || battle.status !== 'active') {
          return; // Battle already completed or not found
        }
        
        // Find the opponent
        const opponentId = battle.players.find(p => p.toString() !== userId);
        
        if (opponentId) {
          // Mark opponent as winner
          battle.winner = opponentId;
          battle.status = 'completed';
          battle.completedAt = new Date();
          await battle.save();
          
          // Update stats based on battle mode
          const winnerUser = await User.findById(opponentId);
          const loserUser = await User.findById(userId);
          
          const xpChanges = {};
          if (battle.mode === 'ranked') {
            // Ranked battle - winner gets XP, player who left loses 15 XP
            const winnerRankedXP = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
            const winnerRegularXP = battle.problem.xpReward * 2;
            
            xpChanges[opponentId] = { rankedXP: winnerRankedXP, regularXP: winnerRegularXP, mode: 'ranked' };
            xpChanges[userId] = { rankedXP: -15, regularXP: 0, mode: 'ranked' };
            
            if (winnerUser) {
              winnerUser.addRankedXP(winnerRankedXP);
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              
              // Place in league if haven't participated this season
              if (!winnerUser.seasonParticipated) {
                winnerUser.placeInLeague();
              }
              
              winnerUser.xp += winnerRegularXP;
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              await winnerUser.save();
            }
            
            // Player who left loses 15 ranked XP
            if (loserUser) {
              loserUser.addRankedXP(-15);
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              loserUser.resetWinStreak();
              
              await loserUser.save();
            }
          } else {
            // Practice battle - normal XP only
            const winnerRegularXP = battle.problem.xpReward * 2;
            
            xpChanges[opponentId] = { rankedXP: 0, regularXP: winnerRegularXP, mode: 'practice' };
            xpChanges[userId] = { rankedXP: 0, regularXP: 0, mode: 'practice' };
            
            if (winnerUser) {
              winnerUser.xp += winnerRegularXP;
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              await winnerUser.save();
            }
            
            if (loserUser) {
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              loserUser.resetWinStreak();
              await loserUser.save();
            }
          }
          
          // Notify the remaining player
          const finalBattle = await Battle.findById(battleId)
            .populate('players', 'username level xp')
            .populate('winner', 'username level xp');
          
          // Get submissions for editorial
          let finalPlayer1Submission = null;
          let finalPlayer2Submission = null;
          if (Array.isArray(finalBattle.players) && finalBattle.players.length > 0 && finalBattle.players[0] && finalBattle.players[0]._id) {
            finalPlayer1Submission = finalBattle.submissions.find(
              s => s.userId?.toString() === finalBattle.players[0]._id.toString()
            );
          }
          if (Array.isArray(finalBattle.players) && finalBattle.players.length > 1 && finalBattle.players[1] && finalBattle.players[1]._id) {
            finalPlayer2Submission = finalBattle.submissions.find(
              s => s.userId?.toString() === finalBattle.players[1]._id.toString()
            );
          }
          
          // Generate AI editorial even when opponent leaves
          let aiEditorial = null;
          try {
            const winnerSubmission = finalBattle.winner 
              ? finalBattle.submissions.find(s => s.userId.toString() === finalBattle.winner._id.toString())
              : finalPlayer1Submission || finalPlayer2Submission;
              
            if (winnerSubmission && finalBattle.problem) {
              aiEditorial = await generateEditorial(
                finalBattle.problem,
                {
                  code: winnerSubmission.code,
                  language: winnerSubmission.language
                },
                {
                  testCasesPassed: winnerSubmission.testCasesPassed,
                  totalTestCases: winnerSubmission.totalTestCases,
                  executionTime: winnerSubmission.executionTime
                }
              );
              
              finalBattle.problem.editorial = aiEditorial;
              await finalBattle.save();
            }
          } catch (error) {
            console.error('Error generating AI editorial when opponent left:', error);
            aiEditorial = finalBattle.problem.editorial;
          }
          
          // Generate AI improvements for both players
          let aiImprovements = {};
          try {
            if (finalPlayer1Submission) {
              aiImprovements.player1 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer1Submission.code,
                finalPlayer1Submission.language,
                finalPlayer1Submission.testCasesPassed,
                finalPlayer1Submission.totalTestCases
              );
            }
            if (finalPlayer2Submission) {
              aiImprovements.player2 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer2Submission.code,
                finalPlayer2Submission.language,
                finalPlayer2Submission.testCasesPassed,
                finalPlayer2Submission.totalTestCases
              );
            }
          } catch (error) {
            console.error('Error generating AI improvements when opponent left:', error);
            aiImprovements = {};
          }
          
          io.to(battleId).emit('battle-complete', {
            winner: finalBattle.winner,
            battle: finalBattle,
            opponentLeft: true,
            editorial: aiEditorial || finalBattle.problem.editorial || getDefaultEditorial(finalBattle.problem),
            aiImprovements: aiImprovements,
            playerCodes: {
              player1: finalPlayer1Submission ? { code: finalPlayer1Submission.code, language: finalPlayer1Submission.language } : null,
              player2: finalPlayer2Submission ? { code: finalPlayer2Submission.code, language: finalPlayer2Submission.language } : null
            },
            xpChanges: xpChanges
          });
          
          console.log(`Battle ${battleId} ended - ${finalBattle.winner.username} wins by forfeit (opponent left)`);
          
          // Clean up
          activeBattles.delete(battleId);
          
          // Cancel any pending disconnect timer for this user
          if (disconnectTimers.has(userId)) {
            clearTimeout(disconnectTimers.get(userId));
            disconnectTimers.delete(userId);
          }
          
          // Clear battle timer since battle is complete
          if (battleTimers.has(battleId)) {
            clearTimeout(battleTimers.get(battleId));
            battleTimers.delete(battleId);
          }
          
          // Clear last chance timer if exists
          if (lastChanceTimers.has(battleId)) {
            clearTimeout(lastChanceTimers.get(battleId));
            lastChanceTimers.delete(battleId);
          }
        }
      } catch (error) {
        console.error('Error handling leave-battle:', error);
      }
    });

    // Player typing (show live updates to opponent)
    socket.on('code-update', ({ battleId, userId, code }) => {
      try {
        if (!battleId || !userId || code === undefined) {
          return; // Silently ignore invalid updates
        }
        socket.to(battleId).emit('opponent-typing', { userId, codeLength: code.length });
      } catch (error) {
        console.error('Error in code-update:', error);
      }
    });

    // Submit code
    socket.on('submit-code', async ({ battleId, userId, code, language }) => {
      try {
        // Validate inputs
        if (!battleId || !userId || !code || !language) {
          console.error('Invalid submit-code request:', { battleId, userId, hasCode: !!code, language });
          socket.emit('error', { message: 'Missing required parameters' });
          return;
        }

        const battle = await Battle.findById(battleId);
        
        if (!battle) {
          console.error(`Battle not found: ${battleId}`);
          socket.emit('error', { message: 'Battle not found' });
          return;
        }

        if (battle.status === 'completed') {
          console.log(`Submission rejected - battle ${battleId} already completed`);
          socket.emit('submission-result', {
            success: false,
            error: 'Battle already completed',
            battleCompleted: true
          });
          return;
        }

        // Validate code submission
        if (!code || code.trim().length === 0) {
          socket.emit('submission-result', {
            success: false,
            testCasesPassed: 0,
            totalTestCases: battle.problem.testCases.length,
            executionTime: 0,
            results: [],
            isWinner: false,
            battleCompleted: false,
            error: 'Code cannot be empty'
          });
          return;
        }

        // Execute code
        const problem = battle.problem;
        
        // Validate that test cases have expected outputs
        if (!problem.testCases || problem.testCases.length === 0) {
          socket.emit('error', { message: 'Problem has no test cases' });
          return;
        }

        const results = await executeCode(code, language, problem.testCases);

        const testCasesPassed = results.filter(r => r.passed).length;
        const allPassed = testCasesPassed === problem.testCases.length;
        const executionTime = results.reduce((sum, r) => sum + (r.time || 0), 0);

        console.log(`Submission by ${userId}: ${testCasesPassed}/${problem.testCases.length} test cases passed`);

        // Calculate code quality score
        const qualityAnalysis = analyzeCodeQuality(code, language, results);
        
        // Calculate correctness percentage
        const correctnessPercentage = (testCasesPassed / problem.testCases.length) * 100;
        
        // Calculate overall battle score
        const battleScore = calculateBattleScore(
          correctnessPercentage,
          qualityAnalysis.score,
          executionTime,
          problem.timeLimit
        );

        const submission = {
          userId,
          code,
          language,
          submittedAt: new Date(),
          executionTime,
          passed: allPassed,
          testCasesPassed,
          totalTestCases: problem.testCases.length,
          scores: battleScore.breakdown,
          qualityAnalysis: {
            readability: qualityAnalysis.breakdown.readability,
            efficiency: qualityAnalysis.breakdown.efficiency,
            bestPractices: qualityAnalysis.breakdown.bestPractices,
            rating: qualityAnalysis.rating
          },
          results: results.map(r => ({
            passed: r.passed,
            error: r.error || null,
            time: r.time,
            memory: r.memory,
            output: r.output,
            expected: r.expected,
            statusDescription: r.statusDescription,
            diffAnalysis: r.diffAnalysis,
            inputPreview: r.inputPreview
          }))
        };

        // Add total score to submission
        submission.scores.total = battleScore.totalScore;

        // Generate improvement suggestions for scores between 80-99
        let improvementSuggestions = [];
        if (battleScore.totalScore >= 80 && battleScore.totalScore < 100) {
          if (battleScore.breakdown.quality < 30) {
            improvementSuggestions.push('Improve code quality: Focus on better variable naming, add comments, and follow best practices.');
          }
          if (battleScore.breakdown.speed < 20) {
            improvementSuggestions.push('Optimize for speed: Reduce execution time by improving algorithm efficiency.');
          }
          if (battleScore.percentages.correctness < 100) {
            improvementSuggestions.push('Achieve 100% correctness: Review edge cases and ensure all test cases pass.');
          }
          if (qualityAnalysis.breakdown.readability < 40) {
            improvementSuggestions.push('Enhance readability: Use descriptive names, proper indentation, and clear code structure.');
          }
          if (qualityAnalysis.breakdown.efficiency < 30) {
            improvementSuggestions.push('Increase efficiency: Consider better data structures or algorithms to reduce time/space complexity.');
          }
          if (qualityAnalysis.breakdown.bestPractices < 30) {
            improvementSuggestions.push('Follow best practices: Avoid hardcoded values, use proper error handling, and write modular code.');
          }
        }
        submission.improvementSuggestions = improvementSuggestions;

        battle.submissions.push(submission);

        // Mark player as completed ONLY if they passed all test cases
        const battleState = activeBattles.get(battleId);
        const playerState = battleState?.players.find(p => p.userId === userId);
        
        if (playerState && allPassed) {
          playerState.completed = true;
          playerState.completedAt = Date.now();
          playerState.score = battleScore.totalScore;
        } else if (playerState && !allPassed) {
          // Update score even if not completed (for final comparison if time runs out)
          playerState.score = battleScore.totalScore;
        }

        // Check if both players have submitted or battle should end
        let winner = null;
        const allPlayersCompleted = battleState?.players.every(p => p.completed);
        
        if (allPlayersCompleted) {
          // Both players completed - determine winner immediately
          const player1 = battleState.players[0];
          const player2 = battleState.players[1];
          
          if (player1.score > player2.score) {
            winner = player1.userId;
          } else if (player2.score > player1.score) {
            winner = player2.userId;
          } else {
            // Tie - whoever submitted first wins
            winner = player1.completedAt < player2.completedAt ? player1.userId : player2.userId;
          }
          
          battle.winner = winner;
          battle.status = 'completed';
          battle.completedAt = new Date();
          
          console.log(`Battle ${battleId} completed! Winner: ${winner} with scores: ${player1.userId}=${player1.score}, ${player2.userId}=${player2.score}`);

          // Award XP and update stats based on battle mode
          const winnerUser = await User.findById(winner);
          const loserId = battle.players.find(p => p.toString() !== winner.toString());
          const loserUser = await User.findById(loserId);
          
          // Store XP changes to send to clients
          const xpChanges = {};
          
          if (battle.mode === 'ranked') {
            // Ranked battle - award ranked XP
            const winnerRankedXP = Math.floor(Math.random() * (35 - 20 + 1)) + 20; // Random 20-35
            const loserRankedXP = -(Math.floor(Math.random() * (15 - 10 + 1)) + 10); // Random -10 to -15
            const winnerRegularXP = problem.xpReward * 2;
            const loserRegularXP = Math.floor(problem.xpReward / 2);
            
            xpChanges[winner] = { 
              rankedXP: winnerRankedXP, 
              regularXP: winnerRegularXP,
              mode: 'ranked'
            };
            xpChanges[loserId] = { 
              rankedXP: loserRankedXP, 
              regularXP: loserRegularXP,
              mode: 'ranked'
            };
            
            if (winnerUser) {
              winnerUser.addRankedXP(winnerRankedXP); // This now updates league and rank
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              
              // Also add regular XP for leveling
              winnerUser.xp += winnerRegularXP;
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              
              await winnerUser.save();
            }

            if (loserUser) {
              loserUser.addRankedXP(loserRankedXP); // This now updates league and rank
              loserUser.xp += loserRegularXP;
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              loserUser.resetWinStreak();
              
              await loserUser.save();
            }
          } else {
            // Practice battle - normal XP only
            const winnerRegularXP = problem.xpReward * 2;
            const loserRegularXP = Math.floor(problem.xpReward / 2);
            
            xpChanges[winner] = { 
              rankedXP: 0, 
              regularXP: winnerRegularXP,
              mode: 'practice'
            };
            xpChanges[loserId] = { 
              rankedXP: 0, 
              regularXP: loserRegularXP,
              mode: 'practice'
            };
            
            if (winnerUser) {
              winnerUser.xp += winnerRegularXP;
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              
              await winnerUser.save();
            }

            if (loserUser) {
              loserUser.xp += loserRegularXP;
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              loserUser.resetWinStreak();
              await loserUser.save();
            }
          }
          
          // Store XP changes in battle state for later emission
          battleState.xpChanges = xpChanges;
        } else if (battleState?.players.some(p => p.completed)) {
          // One player successfully completed (all tests passed) - start last chance timer
          startLastChanceTimer(battleId, battle);
          
          // Notify opponent they have limited time
          const completedPlayer = battleState.players.find(p => p.completed);
          const waitingPlayer = battleState.players.find(p => !p.completed);
          
          if (waitingPlayer?.socketId) {
            io.to(waitingPlayer.socketId).emit('opponent-finished', {
              message: 'Your opponent solved the problem! You have 60 seconds to submit.',
              timeRemaining: 60
            });
            console.log(`Last chance notification sent to player ${waitingPlayer.userId}`);
          }
        }

        // Handle practice mode completion with AI editorial
        const isPracticeMode = battle.mode === 'practice' || battle.players.length === 1;
        if (isPracticeMode && allPassed) {
          battle.solved = true;
          battle.status = 'completed';
          battle.completedAt = new Date();
          battle.winner = userId;
          
          // Award XP for practice mode completion
          const practiceUser = await User.findById(userId);
          const regularXP = problem.xpReward;
          
          if (practiceUser) {
            practiceUser.xp += regularXP;
            const xpNeeded = practiceUser.level * 100;
            if (practiceUser.xp >= xpNeeded) {
              practiceUser.level += 1;
              practiceUser.xp -= xpNeeded;
            }
            await practiceUser.save();
          }
          
          // Generate AI editorial for practice mode
          let practiceEditorial = null;
          let practiceImprovements = [];
          try {
            practiceEditorial = await generateEditorial(
              problem,
              { code, language },
              {
                testCasesPassed,
                totalTestCases: problem.testCases.length,
                executionTime
              }
            );
            
            // Generate AI improvements for practice mode
            practiceImprovements = await generateCodeImprovements(
              problem,
              code,
              language,
              testCasesPassed,
              problem.testCases.length
            );
            
            // Update battle's problem editorial
            battle.problem.editorial = practiceEditorial;
          } catch (error) {
            console.error('Error generating practice editorial:', error);
            practiceEditorial = problem.editorial;
            practiceImprovements = [];
          }
          
          // Store editorial for emission
          battle._practiceEditorial = practiceEditorial || problem.editorial;
          battle._practiceImprovements = practiceImprovements;
        }

        await battle.save();

        // Emit result to the submitter with score breakdown
        socket.emit('submission-result', {
          success: allPassed,
          testCasesPassed,
          totalTestCases: problem.testCases.length,
          executionTime,
          results: results.map(r => ({ passed: r.passed, error: r.error, time: r.time, memory: r.memory })),
          score: battleScore,
          qualityAnalysis: qualityAnalysis,
          isWinner: isPracticeMode ? allPassed : (winner === userId),
          battleCompleted: battle.status === 'completed',
          editorial: (isPracticeMode && allPassed) ? (battle._practiceEditorial || problem.editorial) : undefined,
          aiImprovements: (isPracticeMode && allPassed) ? battle._practiceImprovements : undefined,
          isPractice: isPracticeMode,
          solved: isPracticeMode && allPassed
        });

        // Emit to opponent with score info
        socket.to(battleId).emit('opponent-submitted', {
          userId,
          passed: allPassed,
          testCasesPassed,
          totalTestCases: problem.testCases.length,
          score: battleScore.totalScore
        });

        // If battle is complete, notify both players with AI-generated editorial
        if (battle.status === 'completed') {
          const finalBattle = await Battle.findById(battleId)
            .populate('players', 'username level xp')
            .populate('winner', 'username level xp');

          // Get both submissions for comparison
          const player1Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[0]._id.toString()
          );
          const player2Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[1]._id.toString()
          );

          // Generate AI editorial for the battle
          let aiEditorial = null;
          try {
            // Use the winner's solution for editorial generation, or first submission if no clear winner
            const winnerSubmission = finalBattle.winner 
              ? finalBattle.submissions.find(s => s.userId.toString() === finalBattle.winner._id.toString())
              : player1Submission || player2Submission;
              
            if (winnerSubmission && finalBattle.problem) {
              aiEditorial = await generateEditorial(
                finalBattle.problem,
                {
                  code: winnerSubmission.code,
                  language: winnerSubmission.language
                },
                {
                  testCasesPassed: winnerSubmission.testCasesPassed,
                  totalTestCases: winnerSubmission.totalTestCases,
                  executionTime: winnerSubmission.executionTime
                }
              );
              
              // Update the battle's problem editorial
              finalBattle.problem.editorial = aiEditorial;
              await finalBattle.save();
            }
          } catch (error) {
            console.error('Error generating AI editorial:', error);
            // Use existing editorial as fallback
            aiEditorial = finalBattle.problem.editorial;
          }

          // Generate AI improvements for both players' code
          let aiImprovements = {};
          try {
            if (player1Submission) {
              aiImprovements.player1 = await generateCodeImprovements(
                finalBattle.problem,
                player1Submission.code,
                player1Submission.language,
                player1Submission.testCasesPassed,
                player1Submission.totalTestCases
              );
            }
            if (player2Submission) {
              aiImprovements.player2 = await generateCodeImprovements(
                finalBattle.problem,
                player2Submission.code,
                player2Submission.language,
                player2Submission.testCasesPassed,
                player2Submission.totalTestCases
              );
            }
          } catch (error) {
            console.error('Error generating AI improvements:', error);
            aiImprovements = {};
          }

          // Get XP changes from battle state
          const stateData = activeBattles.get(battleId);
          const xpData = stateData?.xpChanges || {};
          
          io.to(battleId).emit('battle-complete', {
            winner: finalBattle.winner,
            battle: finalBattle,
            editorial: aiEditorial || finalBattle.problem.editorial || getDefaultEditorial(finalBattle.problem),
            aiImprovements: aiImprovements,
            playerCodes: {
              player1: player1Submission ? { code: player1Submission.code, language: player1Submission.language } : null,
              player2: player2Submission ? { code: player2Submission.code, language: player2Submission.language } : null
            },
            xpChanges: xpData
          });

          activeBattles.delete(battleId);
          
          // Clear battle timer since battle is complete
          if (battleTimers.has(battleId)) {
            clearTimeout(battleTimers.get(battleId));
            battleTimers.delete(battleId);
          }
          
          // Clear last chance timer if exists
          if (lastChanceTimers.has(battleId)) {
            clearTimeout(lastChanceTimers.get(battleId));
            lastChanceTimers.delete(battleId);
          }
        }
      } catch (error) {
        console.error('Error in submit-code:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Function to start battle timer
    const startBattleTimer = (battleId, timeLimit) => {
      const timer = setTimeout(async () => {
        try {
          console.log(`Time expired for battle ${battleId}`);
          
          const battle = await Battle.findById(battleId);
          if (!battle || battle.status !== 'active') {
            return; // Battle already completed
          }

          const battleState = activeBattles.get(battleId);
          if (!battleState) return;

          // Determine winner based on submissions
          let winner = null;
          const player1 = battleState.players[0];
          const player2 = battleState.players[1];

          // Get latest submissions for both players
          const player1Submission = battle.submissions
            .filter(s => s.userId.toString() === player1.userId)
            .sort((a, b) => b.submittedAt - a.submittedAt)[0];
          
          const player2Submission = battle.submissions
            .filter(s => s.userId.toString() === player2.userId)
            .sort((a, b) => b.submittedAt - a.submittedAt)[0];

          const player1Score = player1Submission?.scores?.total || 0;
          const player2Score = player2Submission?.scores?.total || 0;

          // Determine winner by score
          if (player1Score > player2Score) {
            winner = player1.userId;
          } else if (player2Score > player1Score) {
            winner = player2.userId;
          } else if (player1Submission && player2Submission) {
            // Both have same score - whoever submitted first wins
            winner = player1Submission.submittedAt < player2Submission.submittedAt 
              ? player1.userId 
              : player2.userId;
          } else if (player1Submission) {
            // Only player 1 submitted
            winner = player1.userId;
          } else if (player2Submission) {
            // Only player 2 submitted
            winner = player2.userId;
          }
          // If neither submitted, battle ends in a draw (no winner)

          battle.status = 'completed';
          battle.completedAt = new Date();
          if (winner) {
            battle.winner = winner;
          }
          await battle.save();

          // Award XP based on battle mode
          const xpChanges = {};
          if (winner) {
            const winnerUser = await User.findById(winner);
            const loserId = battle.players.find(p => p.toString() !== winner.toString());
            const loserUser = await User.findById(loserId);
            
            if (battle.mode === 'ranked') {
              // Ranked battle - award ranked XP
              const winnerRankedXP = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
              const loserRankedXP = -(Math.floor(Math.random() * (15 - 10 + 1)) + 10);
              const winnerRegularXP = battle.problem.xpReward * 2;
              const loserRegularXP = Math.floor(battle.problem.xpReward / 2);
              
              xpChanges[winner] = { rankedXP: winnerRankedXP, regularXP: winnerRegularXP, mode: 'ranked' };
              xpChanges[loserId] = { rankedXP: loserRankedXP, regularXP: loserRegularXP, mode: 'ranked' };
              
              if (winnerUser) {
                winnerUser.addRankedXP(winnerRankedXP); // This now updates league and rank
                winnerUser.wins += 1;
                winnerUser.totalBattles += 1;
                winnerUser.updateStreak();
                winnerUser.incrementWinStreak();
                
                winnerUser.xp += winnerRegularXP;
                const xpNeeded = winnerUser.level * 100;
                if (winnerUser.xp >= xpNeeded) {
                  winnerUser.level += 1;
                  winnerUser.xp -= xpNeeded;
                }
                await winnerUser.save();
              }

              if (loserUser) {
                loserUser.addRankedXP(loserRankedXP); // This now updates league and rank
                loserUser.xp += loserRegularXP;
                loserUser.losses += 1;
                loserUser.totalBattles += 1;
                loserUser.updateStreak();
                loserUser.resetWinStreak();
                
                await loserUser.save();
              }
            } else {
              // Practice battle - normal XP only
              const winnerRegularXP = battle.problem.xpReward * 2;
              const loserRegularXP = Math.floor(battle.problem.xpReward / 2);
              
              xpChanges[winner] = { rankedXP: 0, regularXP: winnerRegularXP, mode: 'practice' };
              xpChanges[loserId] = { rankedXP: 0, regularXP: loserRegularXP, mode: 'practice' };
              
              if (winnerUser) {
                winnerUser.xp += winnerRegularXP;
                winnerUser.wins += 1;
                winnerUser.totalBattles += 1;
                winnerUser.updateStreak();
                winnerUser.incrementWinStreak();
                const xpNeeded = winnerUser.level * 100;
                if (winnerUser.xp >= xpNeeded) {
                  winnerUser.level += 1;
                  winnerUser.xp -= xpNeeded;
                }
                await winnerUser.save();
              }

              if (loserUser) {
                loserUser.xp += loserRegularXP;
                loserUser.losses += 1;
                loserUser.totalBattles += 1;
                loserUser.updateStreak();
                loserUser.resetWinStreak();
                await loserUser.save();
              }
            }
          } else {
            // No winner - both players draw
            for (const playerId of battle.players) {
              const player = await User.findById(playerId);
              if (player) {
                player.xp += Math.floor(battle.problem.xpReward / 4); // Small XP for draw
                player.totalBattles += 1;
                player.updateStreak();
                await player.save();
              }
            }
          }

          // Notify both players
          const finalBattle = await Battle.findById(battleId)
            .populate('players', 'username level xp')
            .populate('winner', 'username level xp');

          // Get both submissions for comparison
          const finalPlayer1Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[0]._id.toString()
          );
          const finalPlayer2Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[1]._id.toString()
          );

          // Generate AI editorial for last chance completion
          let aiEditorial = null;
          try {
            const winnerSubmission = finalBattle.winner 
              ? finalBattle.submissions.find(s => s.userId.toString() === finalBattle.winner._id.toString())
              : finalPlayer1Submission || finalPlayer2Submission;
              
            if (winnerSubmission && finalBattle.problem) {
              aiEditorial = await generateEditorial(
                finalBattle.problem,
                {
                  code: winnerSubmission.code,
                  language: winnerSubmission.language
                },
                {
                  testCasesPassed: winnerSubmission.testCasesPassed,
                  totalTestCases: winnerSubmission.totalTestCases,
                  executionTime: winnerSubmission.executionTime
                }
              );
              
              finalBattle.problem.editorial = aiEditorial;
              await finalBattle.save();
            }
          } catch (error) {
            console.error('Error generating AI editorial for last chance:', error);
            aiEditorial = finalBattle.problem.editorial;
          }

          // Generate AI improvements for both players
          let aiImprovements = {};
          try {
            if (finalPlayer1Submission) {
              aiImprovements.player1 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer1Submission.code,
                finalPlayer1Submission.language,
                finalPlayer1Submission.testCasesPassed,
                finalPlayer1Submission.totalTestCases
              );
            }
            if (finalPlayer2Submission) {
              aiImprovements.player2 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer2Submission.code,
                finalPlayer2Submission.language,
                finalPlayer2Submission.testCasesPassed,
                finalPlayer2Submission.totalTestCases
              );
            }
          } catch (error) {
            console.error('Error generating AI improvements for timeout:', error);
            aiImprovements = {};
          }

          io.to(battleId).emit('battle-complete', {
            winner: finalBattle.winner,
            battle: finalBattle,
            editorial: aiEditorial || finalBattle.problem.editorial || getDefaultEditorial(finalBattle.problem),
            timeExpired: true,
            aiImprovements: aiImprovements,
            playerCodes: {
              player1: finalPlayer1Submission ? { code: finalPlayer1Submission.code, language: finalPlayer1Submission.language } : null,
              player2: finalPlayer2Submission ? { code: finalPlayer2Submission.code, language: finalPlayer2Submission.language } : null
            },
            xpChanges: xpChanges
          });

          console.log(`Battle ${battleId} ended by timeout. Winner: ${winner || 'Draw'}`);
          
          // Clean up
          activeBattles.delete(battleId);
          battleTimers.delete(battleId);
        } catch (error) {
          console.error('Error handling battle timeout:', error);
        }
      }, timeLimit * 1000); // Convert seconds to milliseconds

      battleTimers.set(battleId, timer);
      console.log(`Battle timer set for ${battleId}: ${timeLimit} seconds`);
    };

    // Function to start last chance timer (60 seconds for opponent to submit)
    const startLastChanceTimer = (battleId, battle) => {
      // Don't start if already exists
      if (lastChanceTimers.has(battleId)) {
        return;
      }

      const timer = setTimeout(async () => {
        try {
          console.log(`Last chance period expired for battle ${battleId}`);
          
          // Re-fetch battle to check current status
          const currentBattle = await Battle.findById(battleId);
          if (!currentBattle || currentBattle.status !== 'active') {
            return; // Battle already completed
          }

          const battleState = activeBattles.get(battleId);
          if (!battleState) return;

          // Check if both completed now
          const allCompleted = battleState.players.every(p => p.completed);
          if (allCompleted) {
            return; // Battle will end normally through submission logic
          }

          // End battle - one player submitted, other didn't
          const player1 = battleState.players[0];
          const player2 = battleState.players[1];

          let winner = null;
          if (player1.completed && !player2.completed) {
            winner = player1.userId;
          } else if (player2.completed && !player1.completed) {
            winner = player2.userId;
          } else {
            // Both completed - compare scores
            winner = player1.score > player2.score ? player1.userId : player2.userId;
          }

          currentBattle.winner = winner;
          currentBattle.status = 'completed';
          currentBattle.completedAt = new Date();
          await currentBattle.save();

          // Award XP based on battle mode
          const winnerUser = await User.findById(winner);
          const loserId = currentBattle.players.find(p => p.toString() !== winner.toString());
          const loserUser = await User.findById(loserId);
          
          const xpChanges = {};
          if (currentBattle.mode === 'ranked') {
            // Ranked battle - award ranked XP
            const winnerRankedXP = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
            const loserRankedXP = -(Math.floor(Math.random() * (15 - 10 + 1)) + 10);
            const winnerRegularXP = currentBattle.problem.xpReward * 2;
            const loserRegularXP = Math.floor(currentBattle.problem.xpReward / 2);
            
            xpChanges[winner] = { rankedXP: winnerRankedXP, regularXP: winnerRegularXP, mode: 'ranked' };
            xpChanges[loserId] = { rankedXP: loserRankedXP, regularXP: loserRegularXP, mode: 'ranked' };
            
            if (winnerUser) {
              winnerUser.addRankedXP(winnerRankedXP);
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              
              // Place in league if haven't participated this season
              if (!winnerUser.seasonParticipated) {
                winnerUser.placeInLeague();
              }
              
              winnerUser.xp += winnerRegularXP;
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              await winnerUser.save();
            }

            if (loserUser) {
              loserUser.addRankedXP(loserRankedXP); // This now updates league and rank
              loserUser.xp += loserRegularXP;
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              
              loserUser.resetWinStreak();
              await loserUser.save();
            }
          } else {
            // Practice battle - normal XP only
            const winnerRegularXP = currentBattle.problem.xpReward * 2;
            const loserRegularXP = Math.floor(currentBattle.problem.xpReward / 2);
            
            xpChanges[winner] = { rankedXP: 0, regularXP: winnerRegularXP, mode: 'practice' };
            xpChanges[loserId] = { rankedXP: 0, regularXP: loserRegularXP, mode: 'practice' };
            
            if (winnerUser) {
              winnerUser.xp += winnerRegularXP;
              winnerUser.wins += 1;
              winnerUser.totalBattles += 1;
              winnerUser.updateStreak();
              winnerUser.incrementWinStreak();
              const xpNeeded = winnerUser.level * 100;
              if (winnerUser.xp >= xpNeeded) {
                winnerUser.level += 1;
                winnerUser.xp -= xpNeeded;
              }
              await winnerUser.save();
            }

            if (loserUser) {
              loserUser.xp += loserRegularXP;
              loserUser.losses += 1;
              loserUser.totalBattles += 1;
              loserUser.updateStreak();
              loserUser.resetWinStreak();
              await loserUser.save();
            }
          }

          // Notify players
          const finalBattle = await Battle.findById(battleId)
            .populate('players', 'username level xp')
            .populate('winner', 'username level xp');

          const finalPlayer1Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[0]._id.toString()
          );
          const finalPlayer2Submission = finalBattle.submissions.find(
            s => s.userId.toString() === finalBattle.players[1]._id.toString()
          );

          // Generate AI editorial for last chance timeout
          let aiEditorial = null;
          try {
            const winnerSubmission = finalBattle.winner 
              ? finalBattle.submissions.find(s => s.userId.toString() === finalBattle.winner._id.toString())
              : finalPlayer1Submission || finalPlayer2Submission;
              
            if (winnerSubmission && finalBattle.problem) {
              aiEditorial = await generateEditorial(
                finalBattle.problem,
                {
                  code: winnerSubmission.code,
                  language: winnerSubmission.language
                },
                {
                  testCasesPassed: winnerSubmission.testCasesPassed,
                  totalTestCases: winnerSubmission.totalTestCases,
                  executionTime: winnerSubmission.executionTime
                }
              );
              
              finalBattle.problem.editorial = aiEditorial;
              await finalBattle.save();
            }
          } catch (error) {
            console.error('Error generating AI editorial for last chance timeout:', error);
            aiEditorial = finalBattle.problem.editorial;
          }

          // Generate AI improvements for both players
          let aiImprovements = {};
          try {
            if (finalPlayer1Submission) {
              aiImprovements.player1 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer1Submission.code,
                finalPlayer1Submission.language,
                finalPlayer1Submission.testCasesPassed,
                finalPlayer1Submission.totalTestCases
              );
            }
            if (finalPlayer2Submission) {
              aiImprovements.player2 = await generateCodeImprovements(
                finalBattle.problem,
                finalPlayer2Submission.code,
                finalPlayer2Submission.language,
                finalPlayer2Submission.testCasesPassed,
                finalPlayer2Submission.totalTestCases
              );
            }
          } catch (error) {
            console.error('Error generating AI improvements for last chance timeout:', error);
            aiImprovements = {};
          }

          io.to(battleId).emit('battle-complete', {
            winner: finalBattle.winner,
            battle: finalBattle,
            editorial: aiEditorial || finalBattle.problem.editorial || getDefaultEditorial(finalBattle.problem),
            lastChanceExpired: true,
            aiImprovements: aiImprovements,
            playerCodes: {
              player1: finalPlayer1Submission ? { code: finalPlayer1Submission.code, language: finalPlayer1Submission.language } : null,
              player2: finalPlayer2Submission ? { code: finalPlayer2Submission.code, language: finalPlayer2Submission.language } : null
            },
            xpChanges: xpChanges
          });

          console.log(`Battle ${battleId} ended after last chance period. Winner: ${winner}`);
          
          // Clean up
          activeBattles.delete(battleId);
          lastChanceTimers.delete(battleId);
          
          // Clear main battle timer too
          if (battleTimers.has(battleId)) {
            clearTimeout(battleTimers.get(battleId));
            battleTimers.delete(battleId);
          }
        } catch (error) {
          console.error('Error handling last chance timeout:', error);
        }
      }, 60000); // 60 seconds

      lastChanceTimers.set(battleId, timer);
      console.log(`Last chance timer set for battle ${battleId}: 60 seconds`);
    };

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      let disconnectedUserId = null;
      
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          
          // Notify friends that this user is offline
          Friend.getFriends(userId).then(friends => {
            friends.forEach(friend => {
              const friendSocketId = onlineUsers.get(friend._id.toString());
              if (friendSocketId) {
                io.to(friendSocketId).emit('friend-offline', { userId });
              }
            });
          }).catch(err => console.error('Error notifying friends of offline:', err));
          
          break;
        }
      }
      
      // Handle player leaving active battle with grace period
      for (const [battleId, state] of activeBattles.entries()) {
        const player = state.players.find(p => p.socketId === socket.id);
        if (player && disconnectedUserId) {
          console.log(`Player ${disconnectedUserId} disconnected from battle ${battleId} - starting 10s grace period`);
          
          // Set a timer to award victory if player doesn't reconnect
          const timer = setTimeout(async () => {
            try {
              console.log(`Grace period expired for user ${disconnectedUserId} in battle ${battleId}`);
              
              // Check if battle is still active
              const battle = await Battle.findById(battleId);
              
              if (battle && battle.status === 'active') {
                // Find the opponent
                const opponentId = battle.players.find(p => p.toString() !== disconnectedUserId);
                
                if (opponentId) {
                  // Mark opponent as winner
                  battle.winner = opponentId;
                  battle.status = 'completed';
                  battle.completedAt = new Date();
                  await battle.save();
                  
                  // Update stats based on battle mode
                  const winnerUser = await User.findById(opponentId);
                  const loserUser = await User.findById(disconnectedUserId);
                  
                  const xpChanges = {};
                  if (battle.mode === 'ranked') {
                    // Ranked battle - winner gets XP, disconnected player loses 15 XP
                    const winnerRankedXP = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
                    const winnerRegularXP = battle.problem.xpReward * 2;
                    
                    xpChanges[opponentId] = { rankedXP: winnerRankedXP, regularXP: winnerRegularXP, mode: 'ranked' };
                    xpChanges[disconnectedUserId] = { rankedXP: -15, regularXP: 0, mode: 'ranked' };
                    
                    if (winnerUser) {
                      winnerUser.addRankedXP(winnerRankedXP);
                      winnerUser.wins += 1;
                      winnerUser.totalBattles += 1;
                      winnerUser.updateStreak();
                      winnerUser.incrementWinStreak();
                      
                      // Place in league if haven't participated this season
                      if (!winnerUser.seasonParticipated) {
                        winnerUser.placeInLeague();
                      }
                      
                      winnerUser.xp += winnerRegularXP;
                      const xpNeeded = winnerUser.level * 100;
                      if (winnerUser.xp >= xpNeeded) {
                        winnerUser.level += 1;
                        winnerUser.xp -= xpNeeded;
                      }
                      await winnerUser.save();
                    }
                    
                    // Disconnected player loses 15 ranked XP
                    if (loserUser) {
                      loserUser.addRankedXP(-15); // This now updates league and rank
                      loserUser.losses += 1;
                      loserUser.totalBattles += 1;
                      loserUser.updateStreak();
                      loserUser.resetWinStreak();
                      
                      await loserUser.save();
                    }
                  } else {
                    // Practice battle - normal XP only
                    const winnerRegularXP = battle.problem.xpReward * 2;
                    
                    xpChanges[opponentId] = { rankedXP: 0, regularXP: winnerRegularXP, mode: 'practice' };
                    xpChanges[disconnectedUserId] = { rankedXP: 0, regularXP: 0, mode: 'practice' };
                    
                    if (winnerUser) {
                      winnerUser.xp += winnerRegularXP;
                      winnerUser.wins += 1;
                      winnerUser.totalBattles += 1;
                      winnerUser.updateStreak();
                      winnerUser.incrementWinStreak();
                      const xpNeeded = winnerUser.level * 100;
                      if (winnerUser.xp >= xpNeeded) {
                        winnerUser.level += 1;
                        winnerUser.xp -= xpNeeded;
                      }
                      await winnerUser.save();
                    }
                    
                    if (loserUser) {
                      loserUser.losses += 1;
                      loserUser.totalBattles += 1;
                      loserUser.updateStreak();
                      loserUser.resetWinStreak();
                      await loserUser.save();
                    }
                  }
                  
                  // Notify the remaining player
                  const finalBattle = await Battle.findById(battleId)
                    .populate('players', 'username level xp')
                    .populate('winner', 'username level xp');
                  
                  // Get submissions for editorial
                  const finalPlayer1Submission = finalBattle.submissions.find(
                    s => s.userId.toString() === finalBattle.players[0]._id.toString()
                  );
                  const finalPlayer2Submission = finalBattle.submissions.find(
                    s => s.userId.toString() === finalBattle.players[1]._id.toString()
                  );
                  
                  // Generate AI editorial even when opponent leaves
                  let aiEditorial = null;
                  try {
                    const winnerSubmission = finalBattle.winner 
                      ? finalBattle.submissions.find(s => s.userId.toString() === finalBattle.winner._id.toString())
                      : finalPlayer1Submission || finalPlayer2Submission;
                      
                    if (winnerSubmission && finalBattle.problem) {
                      aiEditorial = await generateEditorial(
                        finalBattle.problem,
                        {
                          code: winnerSubmission.code,
                          language: winnerSubmission.language
                        },
                        {
                          testCasesPassed: winnerSubmission.testCasesPassed,
                          totalTestCases: winnerSubmission.totalTestCases,
                          executionTime: winnerSubmission.executionTime
                        }
                      );
                      
                      finalBattle.problem.editorial = aiEditorial;
                      await finalBattle.save();
                    }
                  } catch (error) {
                    console.error('Error generating AI editorial when opponent left:', error);
                    aiEditorial = finalBattle.problem.editorial;
                  }
                  
                  // Generate AI improvements for both players
                  let aiImprovements = {};
                  try {
                    if (finalPlayer1Submission) {
                      aiImprovements.player1 = await generateCodeImprovements(
                        finalBattle.problem,
                        finalPlayer1Submission.code,
                        finalPlayer1Submission.language,
                        finalPlayer1Submission.testCasesPassed,
                        finalPlayer1Submission.totalTestCases
                      );
                    }
                    if (finalPlayer2Submission) {
                      aiImprovements.player2 = await generateCodeImprovements(
                        finalBattle.problem,
                        finalPlayer2Submission.code,
                        finalPlayer2Submission.language,
                        finalPlayer2Submission.testCasesPassed,
                        finalPlayer2Submission.totalTestCases
                      );
                    }
                  } catch (error) {
                    console.error('Error generating AI improvements when opponent left:', error);
                    aiImprovements = {};
                  }
                  
                  io.to(battleId).emit('battle-complete', {
                    winner: finalBattle.winner,
                    battle: finalBattle,
                    opponentLeft: true,
                    editorial: aiEditorial || finalBattle.problem.editorial || getDefaultEditorial(finalBattle.problem),
                    aiImprovements: aiImprovements,
                    playerCodes: {
                      player1: finalPlayer1Submission ? { code: finalPlayer1Submission.code, language: finalPlayer1Submission.language } : null,
                      player2: finalPlayer2Submission ? { code: finalPlayer2Submission.code, language: finalPlayer2Submission.language } : null
                    },
                    xpChanges: xpChanges
                  });
                  
                  console.log(`Battle ${battleId} ended - opponent left, ${finalBattle.winner.username} wins`);
                  
                  // Clean up
                  activeBattles.delete(battleId);
                  disconnectTimers.delete(disconnectedUserId);
                  
                  // Clear battle timer since battle is complete
                  if (battleTimers.has(battleId)) {
                    clearTimeout(battleTimers.get(battleId));
                    battleTimers.delete(battleId);
                  }
                  
                  // Clear last chance timer if exists
                  if (lastChanceTimers.has(battleId)) {
                    clearTimeout(lastChanceTimers.get(battleId));
                    lastChanceTimers.delete(battleId);
                  }
                }
              }
            } catch (error) {
              console.error('Error handling battle forfeit:', error);
            }
          }, 10000); // 10 second grace period
          
          disconnectTimers.set(disconnectedUserId, timer);
        }
      }
    });
  });
};
