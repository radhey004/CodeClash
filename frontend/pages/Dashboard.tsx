import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { battleAPI, friendAPI } from '../services/api';
import { Swords, Trophy, Target, TrendingUp, Users, Flame, Zap, Award, Star, UserPlus, Eye } from 'lucide-react';

interface Player {
  _id: string;
  username: string;
  level?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  totalBattles?: number;
}

interface Battle {
  _id: string;
  problem: { 
    title: string; 
    difficulty: string;
    description: string;
    constraints: string[];
  } | null;
  players: Player[];
  winner?: { username: string };
  status: string;
  createdAt: string;
  isPractice?: boolean;
  solved?: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentBattles, setRecentBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadRecentBattles();
  }, []);

  const loadRecentBattles = async () => {
    try {
      const battles = await battleAPI.getUserBattles();
      setRecentBattles(battles.slice(0, 5));
    } catch (error) {
      console.error('Failed to load battles:', error);
    }
  };

  const handleStartBattle = async () => {
    setLoading(true);
    try {
      const battle = await battleAPI.createBattle();
      navigate(`/arena/${battle._id}`);
    } catch (error) {
      console.error('Failed to create battle:', error);
      alert('Failed to start battle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBattleClick = (battle: Battle) => {
    setSelectedBattle(battle);
    setShowProblemModal(true);
  };

  const handleViewProfile = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const handleSendFriendRequest = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingRequest(userId);
    try {
      await friendAPI.sendFriendRequest(userId);
      alert('Friend request sent!');
    } catch (error: any) {
      alert(error.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const winRate = user?.totalBattles ? Math.min(((user.wins || 0) / user.totalBattles * 100), 100).toFixed(1) : 0;
  const xpProgress = user ? (user.xp / (user.level * 100)) * 100 : 0;

  const getRankColor = (rank?: string) => {
    switch (rank) {
      case 'Legend League': return 'from-purple-600 via-pink-600 to-red-600';
      case 'Champion League': return 'from-yellow-500 via-orange-500 to-red-500';
      case 'Master League': return 'from-indigo-500 via-purple-500 to-pink-500';
      case 'Crystal League': return 'from-cyan-500 via-blue-500 to-indigo-500';
      case 'Gold League': return 'from-yellow-400 via-yellow-500 to-amber-600';
      case 'Silver League': return 'from-gray-300 via-gray-400 to-gray-500';
      case 'Bronze League': return 'from-amber-700 via-orange-800 to-amber-900';
      case 'Unranked':
      default: 
        return 'from-gray-600 to-gray-700';
    }
  };

  const rankColor = getRankColor(user?.rank);
  const displayRank = user?.rank || 'Unranked';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400">Ready to dominate the arena?</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Player Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl">
              <div className="text-center mb-6">
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                  <div className="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {user?.level}
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user?.username}</h2>
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <p className="text-cyan-400 font-semibold">Level {user?.level}</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400 font-medium">XP Progress</span>
                  <span className="text-cyan-400 font-bold">{user?.xp} / {user ? user.level * 100 : 0}</span>
                </div>
                <div className="relative w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20"></div>
                  <div
                    className="relative bg-gradient-to-r from-cyan-500 to-blue-600 h-4 rounded-full transition-all duration-500 shadow-lg shadow-cyan-500/50"
                    style={{ width: `${xpProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleStartBattle}
                  disabled={loading}
                  className="relative group bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
                  <div className="relative flex flex-col items-center space-y-1">
                    <Swords className="w-5 h-5" />
                    <span>{loading ? 'Starting...' : 'Practice'}</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/matchmaking')}
                  className="relative group bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl font-bold text-sm hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
                  <div className="relative flex flex-col items-center space-y-1">
                    <Users className="w-5 h-5" />
                    <span>PvP Battle</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-cyan-400" />
                Battle Statistics
              </h3>
              <div className="space-y-3">
                <div className={`flex items-center justify-between bg-gradient-to-r ${rankColor} bg-opacity-10 border-2 rounded-lg p-3 hover:border-opacity-70 transition-all`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${rankColor} rounded-lg flex items-center justify-center`}>
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-300 font-medium">Rank</span>
                  </div>
                  <span className={`font-bold text-sm bg-gradient-to-r ${rankColor} bg-clip-text text-transparent`}>{displayRank}</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 hover:border-purple-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Trophies</span>
                  </div>
                  <span className="text-white font-bold text-xl">{user?.trophies || 0}</span>
                </div>

                {(user?.legendTrophies || 0) > 0 && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-lg p-3 hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <span className="text-gray-300 font-medium">Legend Trophies</span>
                    </div>
                    <span className="text-yellow-400 font-bold text-xl">{user?.legendTrophies}</span>
                  </div>
                )}

                <div className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-3 hover:border-green-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Wins</span>
                  </div>
                  <span className="text-white font-bold text-xl">{user?.wins || 0}</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg p-3 hover:border-red-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-red-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Losses</span>
                  </div>
                  <span className="text-white font-bold text-xl">{user?.losses || 0}</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-3 hover:border-green-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Win Rate</span>
                  </div>
                  <span className="text-white font-bold text-xl">{winRate}%</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-3 hover:border-orange-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Daily Streak</span>
                  </div>
                  <span className="text-white font-bold text-xl">{user?.currentStreak || 0} 🔥</span>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 hover:border-purple-500/50 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-300 font-medium">Win Streak</span>
                  </div>
                  <span className="text-white font-bold text-xl">{user?.currentWinStreak || 0} 🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Battles */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Swords className="w-6 h-6 mr-3 text-cyan-400" />
                  Recent Battles
                </h3>
                {recentBattles.length > 0 && (
                  <button
                    onClick={() => navigate('/battles')}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center space-x-1 bg-cyan-500/10 px-4 py-2 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
                  >
                    <span>View All</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {recentBattles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full animate-pulse"></div>
                    <Swords className="w-20 h-20 text-gray-600" />
                  </div>
                  <p className="text-gray-400 text-lg font-medium mb-2">No battles yet</p>
                  <p className="text-gray-500 text-sm">Start your first battle to see your history here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBattles.map((battle, index) => {
                    if (!battle.problem) return null;
                    
                    const isWin = battle.winner?.username === user?.username;
                    const opponent = battle.players?.find(p => p.username !== user?.username);
                    const isLeaved = battle.status === 'in-progress' && !battle.winner;
                    const isPractice = battle.players?.length === 1 || battle.isPractice;
                    
                    return (
                      <div
                        key={battle._id}
                        className="group bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 hover:border-cyan-500/50 hover:bg-gray-800/50 transition-all cursor-pointer transform hover:scale-[1.02]"
                        onClick={() => handleBattleClick(battle)}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-2 h-2 rounded-full ${
                                isWin ? 'bg-green-400' : battle.winner ? 'bg-red-400' : 'bg-gray-400'
                              }`}></div>
                              <h4 className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                                {battle.problem.title || 'Unknown Problem'}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-3 ml-5 flex-wrap gap-2">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                battle.problem.difficulty === 'Easy' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                battle.problem.difficulty === 'Medium' 
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {battle.problem.difficulty || 'Medium'}
                              </span>
                              {isPractice ? (
                                <span className="text-xs text-cyan-400 flex items-center font-semibold">
                                  <Target className="w-3 h-3 mr-1" />
                                  Practice
                                </span>
                              ) : opponent ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-400 flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    vs
                                  </span>
                                  <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-1 border border-gray-600/30">
                                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">{opponent.level || 1}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-white">{opponent.username}</span>
                                    <button
                                      onClick={(e) => handleViewProfile(opponent._id, e)}
                                      className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
                                      title="View Profile"
                                    >
                                      <Eye className="w-3 h-3 text-cyan-400" />
                                    </button>
                                    <button
                                      onClick={(e) => handleSendFriendRequest(opponent._id, e)}
                                      disabled={sendingRequest === opponent._id}
                                      className="p-1 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50"
                                      title="Send Friend Request"
                                    >
                                      <UserPlus className="w-3 h-3 text-green-400" />
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                              <span className="text-xs text-gray-500 flex items-center">
                                <span className="w-1 h-1 bg-gray-600 rounded-full mr-2"></span>
                                {new Date(battle.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            {isPractice && battle.solved ? (
                              <div className="px-4 py-2 rounded-lg font-bold text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                                ✓ Solved
                              </div>
                            ) : battle.winner ? (
                              <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                isWin
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {isWin ? '✓ Victory' : '✗ Defeat'}
                              </div>
                            ) : (
                              <div className="px-4 py-2 rounded-lg font-bold text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                ⚠ Leaved
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Description Modal */}
      {showProblemModal && selectedBattle && selectedBattle.problem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-cyan-500/30 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{selectedBattle.problem.title}</h2>
              <button
                onClick={() => setShowProblemModal(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedBattle.problem.description}
                </p>
              </div>

              {selectedBattle.problem.constraints && selectedBattle.problem.constraints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">Constraints</h3>
                  <ul className="space-y-2">
                    {selectedBattle.problem.constraints.map((constraint, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start">
                        <span className="text-cyan-400 mr-2">•</span>
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowProblemModal(false)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
