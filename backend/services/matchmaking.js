// Matchmaking service for 1v1 battles with league-based matching
class MatchmakingQueue {
  constructor() {
    this.queue = []; // Single unified queue for all players
    
    // League tier system for matchmaking
    this.leagueTiers = {
      'Unranked': 0,
      'Bronze League': 1,
      'Silver League': 2,
      'Gold League': 3,
      'Crystal League': 4,
      'Master League': 5,
      'Champion League': 6,
      'Legend League': 7
    };

    // Matchmaking expansion thresholds (in milliseconds)
    this.SAME_LEAGUE_WINDOW = 15000; // 15 seconds - only same league
    this.ADJACENT_LEAGUE_WINDOW = 30000; // 30 seconds - ±1 league
    this.WIDE_SEARCH_WINDOW = 45000; // 45 seconds - ±2 leagues
  }

  // Get appropriate problem difficulty based on player league with distribution
  getProblemDifficulty(league) {
    const tier = this.leagueTiers[league] || 0;
    const random = Math.random() * 100; // 0-100 for percentage
    
    // Unranked, Bronze, Silver: Always Easy
    if (tier <= 2) {
      return 'Easy';
    }
    
    // Gold, Crystal, Master: 30% Easy, 70% Medium (no Hard)
    if (tier >= 3 && tier <= 5) {
      if (random < 30) {
        return 'Easy';
      } else {
        return 'Medium';
      }
    }
    
    // Champion, Legend: 10% Easy, 30% Medium, 60% Hard
    if (tier >= 6) {
      if (random < 10) {
        return 'Easy';
      } else if (random < 40) { // 10 + 30 = 40
        return 'Medium';
      } else {
        return 'Hard';
      }
    }
    
    // Fallback (should not reach here)
    return 'Medium';
  }

  addPlayer(userId, username, socketId, league = 'Unranked', trophies = 0) {
    const existingIndex = this.queue.findIndex(p => p.userId === userId);
    if (existingIndex !== -1) {
      this.queue.splice(existingIndex, 1);
    }

    this.queue.push({
      userId,
      username,
      socketId,
      league,
      trophies,
      leagueTier: this.leagueTiers[league] || 0,
      joinedAt: Date.now()
    });

    console.log(`Player ${username} (${league}, ${trophies} trophies) added to queue. Queue size: ${this.queue.length}`);
  }

  findMatch(userId) {
    if (this.queue.length < 2) {
      return null;
    }

    const currentPlayerIndex = this.queue.findIndex(p => p.userId === userId);
    if (currentPlayerIndex === -1) return null;

    const currentPlayer = this.queue[currentPlayerIndex];
    const waitTime = Date.now() - currentPlayer.joinedAt;

    // Determine search range based on wait time
    let maxTierDiff;
    if (waitTime < this.SAME_LEAGUE_WINDOW) {
      maxTierDiff = 0; // Same league only
    } else if (waitTime < this.ADJACENT_LEAGUE_WINDOW) {
      maxTierDiff = 1; // ±1 league
    } else if (waitTime < this.WIDE_SEARCH_WINDOW) {
      maxTierDiff = 2; // ±2 leagues
    } else {
      maxTierDiff = 3; // ±3 leagues (but still prevent extreme mismatches)
    }

    // Find the best opponent
    let bestOpponent = null;
    let bestScore = Infinity;

    for (let i = 0; i < this.queue.length; i++) {
      if (i === currentPlayerIndex) continue;
      
      const candidate = this.queue[i];
      const tierDiff = Math.abs(candidate.leagueTier - currentPlayer.leagueTier);
      
      // Skip if tier difference is too large
      if (tierDiff > maxTierDiff) continue;
      
      // Prevent extreme mismatches (e.g., Unranked vs Champion/Legend)
      if (this.isExtremeMismatch(currentPlayer.leagueTier, candidate.leagueTier)) {
        continue;
      }

      // Calculate match score (lower is better)
      // Prioritize: 1) League similarity, 2) Trophy similarity, 3) Wait time
      const trophyDiff = Math.abs(candidate.trophies - currentPlayer.trophies);
      const candidateWaitTime = Date.now() - candidate.joinedAt;
      
      const score = 
        (tierDiff * 1000) +          // League difference (most important)
        (trophyDiff * 0.1) +         // Trophy difference
        (candidateWaitTime * -0.001); // Slightly prefer players who waited longer

      if (score < bestScore) {
        bestScore = score;
        bestOpponent = candidate;
      }
    }

    if (bestOpponent) {
      // Remove both players from queue
      this.queue.splice(this.queue.indexOf(bestOpponent), 1);
      this.queue.splice(this.queue.indexOf(currentPlayer), 1);
      
      const tierDiff = Math.abs(bestOpponent.leagueTier - currentPlayer.leagueTier);
      const avgLeagueTier = Math.round((currentPlayer.leagueTier + bestOpponent.leagueTier) / 2);
      const avgLeague = Object.keys(this.leagueTiers).find(key => this.leagueTiers[key] === avgLeagueTier) || currentPlayer.league;
      const difficulty = this.getProblemDifficulty(avgLeague);
      
      console.log(`Match found: ${currentPlayer.username} (${currentPlayer.league}) vs ${bestOpponent.username} (${bestOpponent.league}) - Tier diff: ${tierDiff}, Difficulty: ${difficulty}`);
      
      return { player1: currentPlayer, player2: bestOpponent, difficulty };
    }

    return null;
  }

  isExtremeMismatch(tier1, tier2) {
    // Prevent matching Unranked/Bronze with Champion/Legend
    const diff = Math.abs(tier1 - tier2);
    
    // Don't match if difference is > 4 tiers (e.g., Bronze vs Champion)
    if (diff > 4) return true;
    
    // Don't match Unranked with Master/Champion/Legend
    if ((tier1 === 0 && tier2 >= 5) || (tier2 === 0 && tier1 >= 5)) {
      return true;
    }
    
    return false;
  }

  removePlayer(userId) {
    const index = this.queue.findIndex(p => p.userId === userId);
    if (index !== -1) {
      const removed = this.queue.splice(index, 1)[0];
      console.log(`Player ${removed.username} (${removed.league}) removed from queue`);
      return true;
    }
    return false;
  }

  getQueueStatus() {
    return this.queue.length;
  }

  // Get detailed queue info (for debugging/admin)
  getQueueDetails() {
    return this.queue.map(p => ({
      userId: p.userId,
      username: p.username,
      league: p.league,
      trophies: p.trophies,
      waitTime: Math.floor((Date.now() - p.joinedAt) / 1000)
    }));
  }
}

export default new MatchmakingQueue();
