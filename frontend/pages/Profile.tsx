import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { battleAPI } from '../services/api';
import { Trophy, Target, TrendingUp, Clock, Award, Flame, Users } from 'lucide-react';

interface Battle {
  _id: string;
  problem?: { 
    title: string; 
    difficulty: string;
    description: string;
    constraints: string[];
  } | null;
  players: Array<{ _id: string; username: string }>;
  winner?: { username: string };
  status: string;
  createdAt: string;
  isPractice?: boolean;
  solved?: boolean;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [showProblemModal, setShowProblemModal] = useState(false);

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      const data = await battleAPI.getUserBattles();
      setBattles(data);
    } catch (error) {
      console.error('Failed to load battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBattleClick = (battle: Battle) => {
    setSelectedBattle(battle);
    setShowProblemModal(true);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-8 mb-8">
          <div className="flex items-start space-x-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-white">{user?.level}</span>
              </div>
              <div className={`mt-4 text-center bg-gradient-to-r ${rankColor} text-white px-4 py-2 rounded-lg font-bold shadow-lg`}>
                {displayRank}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{user?.username}</h1>
              <p className="text-cyan-400 text-lg mb-6">Level {user?.level}</p>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">XP Progress</span>
                  <span className="text-cyan-400">{user?.xp} / {user ? user.level * 100 : 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${xpProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Trophies</span>
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {user?.trophies || 0}
                    </span>
                  </div>
                </div>
                {(user?.legendTrophies || 0) > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Legend Trophies</span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Award className="w-4 h-4 fill-yellow-400" />
                        {user?.legendTrophies}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4 border border-orange-500/30">
                  <Flame className="w-8 h-8 text-orange-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.currentStreak || 0} 🔥</p>
                  <p className="text-gray-400 text-sm">Daily Streak</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-purple-500/30">
                  <Trophy className="w-8 h-8 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.longestStreak || 0} 📅</p>
                  <p className="text-gray-400 text-sm">Longest Daily</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-yellow-500/30">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.currentWinStreak || 0} 🏆</p>
                  <p className="text-gray-400 text-sm">Win Streak</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-green-500/30">
                  <Award className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.longestWinStreak || 0} 👑</p>
                  <p className="text-gray-400 text-sm">Best Win Streak</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.wins || 0}</p>
                  <p className="text-gray-400 text-sm">Wins</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Target className="w-8 h-8 text-red-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.losses || 0}</p>
                  <p className="text-gray-400 text-sm">Losses</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{winRate}%</p>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Award className="w-8 h-8 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user?.totalBattles || 0}</p>
                  <p className="text-gray-400 text-sm">Total Battles</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Battle History</span>
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-cyan-400">Loading battles...</div>
            </div>
          ) : battles.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No battles yet</p>
              <p className="text-gray-500 text-sm">Start battling to build your history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {battles.map((battle) => {
                if (!battle.problem) return null;
                
                const isWin = battle.winner?.username === user?.username;
                const opponent = battle.players?.find(p => p.username !== user?.username);
                const isLeaved = battle.status === 'in-progress' && !battle.winner;
                const isPractice = battle.players?.length === 1 || battle.isPractice;

                return (
                  <div
                    key={battle._id}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
                    onClick={() => handleBattleClick(battle)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-2">
                          {battle.problem.title || 'Unknown Problem'}
                        </h4>
                        <div className="flex items-center space-x-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            battle.problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                            battle.problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {battle.problem.difficulty || 'Unknown'}
                          </span>
                          {isPractice ? (
                            <span className="text-xs text-cyan-400 flex items-center font-semibold">
                              <Target className="w-3 h-3 mr-1" />
                              Practice
                            </span>
                          ) : opponent ? (
                            <span className="text-xs text-gray-400 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              vs {opponent.username}
                            </span>
                          ) : null}
                          <span className="text-xs text-gray-500">
                            {new Date(battle.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {isPractice && battle.solved ? (
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 font-semibold">Solved</span>
                          </div>
                        ) : battle.winner ? (
                          <div className="flex items-center space-x-2">
                            {isWin ? (
                              <>
                                <Trophy className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-semibold">Victory</span>
                              </>
                            ) : (
                              <>
                                <Target className="w-5 h-5 text-red-400" />
                                <span className="text-red-400 font-semibold">Defeat</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">⚠ Leaved</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Problem Description Modal */}
        {showProblemModal && selectedBattle && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-cyan-500/30 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{selectedBattle.problem?.title}</h2>
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
                    {selectedBattle.problem?.description}
                  </p>
                </div>

                {selectedBattle.problem?.constraints && selectedBattle.problem.constraints.length > 0 && (
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
    </div>
  );
};

export default Profile;
