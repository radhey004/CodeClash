// import User from '../models/User.js';

// export const getLeaderboard = async (req, res) => {
//   try {
//     const { type = 'global' } = req.query;

//     let dateFilter = {};

//     if (type === 'weekly') {
//       const oneWeekAgo = new Date();
//       oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
//       dateFilter = { updatedAt: { $gte: oneWeekAgo } };
//     }

//     const users = await User.find(dateFilter)
//       .select('username level xp wins losses totalBattles')
//       .sort({ xp: -1, level: -1, wins: -1 })
//       .limit(100);

//     const leaderboard = users.map((user, index) => ({
//       rank: index + 1,
//       username: user.username,
//       level: user.level,
//       xp: user.xp,
//       wins: user.wins,
//       losses: user.losses,
//       totalBattles: user.totalBattles,
//       winRate: user.totalBattles > 0 ? ((user.wins / user.totalBattles) * 100).toFixed(1) : 0
//     }));

//     res.json(leaderboard);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




import User from '../models/User.js';

export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'global' } = req.query;

    let dateFilter = {};

    if (type === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { updatedAt: { $gte: oneWeekAgo } };
    }

    const users = await User.find(dateFilter)
      .select('username level xp rankedXP rank league trophies legendTrophies wins losses totalBattles seasonParticipated')
      .limit(1000); // Get more users for proper sorting

    // Calculate win rate and filter users with at least 1 battle
    const usersWithStats = users
      .filter(user => user.totalBattles > 0)
      .map(user => ({
        userId: user._id,
        username: user.username,
        level: user.level,
        xp: user.xp,
        rankedXP: user.rankedXP || 0,
        trophies: user.trophies || 0,
        legendTrophies: user.legendTrophies || 0,
        rankLeague: user.league || user.rank || 'Unranked',
        wins: user.wins,
        losses: user.losses,
        totalBattles: user.totalBattles,
        seasonParticipated: user.seasonParticipated || false,
        winRate: Math.min(((user.wins / user.totalBattles) * 100), 100).toFixed(1)
      }))
      .sort((a, b) => {
        // Primary sort: trophies (descending)
        if (b.trophies !== a.trophies) {
          return b.trophies - a.trophies;
        }
        // Secondary sort: win rate (descending)
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        }
        // Tertiary sort: total battles (descending) - rewards active players
        if (b.totalBattles !== a.totalBattles) {
          return b.totalBattles - a.totalBattles;
        }
        // Final sort: total wins (descending)
        return b.wins - a.wins;
      })
      .slice(0, 100); // Limit to top 100

    const leaderboard = usersWithStats.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyLeague = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user hasn't participated this season, return empty league
    if (!currentUser.seasonParticipated || currentUser.league === 'Unranked') {
      return res.json({
        league: 'Unranked',
        message: 'Complete a PvP battle to join a league',
        players: [],
        currentUserRank: null
      });
    }

    // Get all users in the same league
    const leagueUsers = await User.find({
      league: currentUser.league,
      seasonParticipated: true
    })
      .select('username level xp rankedXP rank league trophies legendTrophies wins losses totalBattles')
      .limit(500);

    // Sort and rank
    const rankedUsers = leagueUsers
      .map(user => ({
        userId: user._id,
        username: user.username,
        level: user.level,
        xp: user.xp,
        trophies: user.trophies || 0,
        legendTrophies: user.legendTrophies || 0,
        rankLeague: user.league,
        wins: user.wins,
        losses: user.losses,
        totalBattles: user.totalBattles,
        winRate: user.totalBattles > 0 ? Math.min(((user.wins / user.totalBattles) * 100), 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => {
        if (b.trophies !== a.trophies) return b.trophies - a.trophies;
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) return parseFloat(b.winRate) - parseFloat(a.winRate);
        return b.wins - a.wins;
      })
      .map((user, index) => ({
        rank: index + 1,
        ...user,
        isCurrentUser: user.userId.toString() === req.user._id.toString()
      }));

    const currentUserRank = rankedUsers.findIndex(u => u.userId.toString() === req.user._id.toString()) + 1;

    res.json({
      league: currentUser.league,
      totalPlayers: rankedUsers.length,
      currentUserRank,
      players: rankedUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopPlayers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('username level xp rankedXP rank league trophies legendTrophies wins losses totalBattles seasonParticipated')
      .limit(1000);

    // Get top players across all leagues
    const topPlayers = users
      .filter(user => user.totalBattles > 0)
      .map(user => ({
        userId: user._id,
        username: user.username,
        level: user.level,
        xp: user.xp,
        trophies: user.trophies || 0,
        legendTrophies: user.legendTrophies || 0,
        rankLeague: user.league || 'Unranked',
        wins: user.wins,
        losses: user.losses,
        totalBattles: user.totalBattles,
        seasonParticipated: user.seasonParticipated || false,
        winRate: Math.min(((user.wins / user.totalBattles) * 100), 100).toFixed(1)
      }))
      .sort((a, b) => {
        // Sort by legend trophies first (if any)
        if (b.legendTrophies !== a.legendTrophies) {
          return b.legendTrophies - a.legendTrophies;
        }
        // Then by current trophies
        if (b.trophies !== a.trophies) {
          return b.trophies - a.trophies;
        }
        // Then by win rate
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        }
        return b.wins - a.wins;
      })
      .slice(0, 100)
      .map((user, index) => ({
        rank: index + 1,
        ...user
      }));

    res.json(topPlayers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};