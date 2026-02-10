import Battle from '../models/Battle.js';
import User from '../models/User.js';
import { executeCode } from '../services/codeExecutor.js';
import { generateProblem } from '../services/geminiService.js';

export const createBattle = async (req, res) => {
  try {
    // Generate AI problem
    const user = await User.findById(req.user._id);
    const problemData = await generateProblem({
      league: user.league || 'Unranked',
      level: user.level || 1,
      xp: user.xp || 0
    });

    if (!problemData) {
      return res.status(404).json({ message: 'Failed to generate problem' });
    }

    const battle = await Battle.create({
      players: [req.user._id],
      problem: problemData,
      status: 'active'
    });

    const populatedBattle = await Battle.findById(battle._id)
      .populate('players', 'username level');

    res.status(201).json(populatedBattle);
  } catch (error) {
    console.error('Battle creation error:', error.message);
    
    // Handle quota exceeded errors with appropriate status code
    if (error.message && error.message.includes('quota exceeded')) {
      return res.status(429).json({ 
        message: error.message,
        retryAfter: 30 // Suggest retry after 30 seconds
      });
    }
    
    // Handle other specific errors
    if (error.message && error.message.includes('API key')) {
      return res.status(503).json({ 
        message: 'AI service is currently unavailable. Please try again later.' 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const submitCode = async (req, res) => {
  try {
    const { battleId, code, language } = req.body;

    if (!battleId || !code || !language) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const battle = await Battle.findById(battleId);

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    if (battle.status === 'completed') {
      return res.status(400).json({ message: 'Battle already completed' });
    }

    const problem = battle.problem;
    const results = await executeCode(code, language, problem.testCases);

    const testCasesPassed = results.filter(r => r.passed).length;
    const allPassed = testCasesPassed === problem.testCases.length;
    const executionTime = results.reduce((sum, r) => sum + (r.time || 0), 0);

    const submission = {
      userId: req.user._id,
      code,
      language,
      submittedAt: new Date(),
      executionTime,
      passed: allPassed,
      testCasesPassed,
      totalTestCases: problem.testCases.length
    };

    battle.submissions.push(submission);

    if (allPassed) {
      battle.winner = req.user._id;
      battle.status = 'completed';
      battle.completedAt = new Date();

      const user = await User.findById(req.user._id);
      user.wins += 1;
      user.totalBattles += 1;
      user.updateStreak();
      user.incrementWinStreak();
      user.addXP(problem.xpReward);
      await user.save();
    }

    await battle.save();

    res.json({
      success: allPassed,
      testCasesPassed,
      totalTestCases: problem.testCases.length,
      executionTime,
      results,
      battle
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBattle = async (req, res) => {
  try {
    const battle = await Battle.findById(req.params.id)
      .populate('players', 'username level xp')
      .populate('winner', 'username');

    if (!battle) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    res.json(battle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserBattles = async (req, res) => {
  try {
    console.log('getUserBattles called for user:', req.user._id);
    const battles = await Battle.find({
      players: req.user._id
    })
      .populate('players', 'username level xp wins losses totalBattles')
      .populate('winner', 'username')
      .sort({ createdAt: -1 })
      .limit(20);

    console.log('Found battles:', battles.length);
    res.json(battles);
  } catch (error) {
    console.error('Error in getUserBattles:', error);
    res.status(500).json({ message: error.message });
  }
};
