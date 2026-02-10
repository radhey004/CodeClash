import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { battleAPI, friendAPI } from '../services/api';
import { Swords, Trophy, Target, Users, Eye, UserPlus, ArrowLeft, Calendar, Clock, Award } from 'lucide-react';

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
  winner?: { username: string; _id?: string };
  status: string;
  createdAt: string;
  completedAt?: string;
  isPractice?: boolean;
  solved?: boolean;
  submissions?: any[];
}

const RecentBattles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      console.log('Loading battles...');
      setError(null);
      const data = await battleAPI.getUserBattles();
      console.log('Battles loaded:', data);
      setBattles(data);
    } catch (error) {
      console.error('Failed to load battles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load battles';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleSendFriendRequest = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingRequest(userId);
    try {
      await friendAPI.sendFriendRequest(userId);
      alert('Friend request sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleBattleClick = (battle: Battle) => {
    setSelectedBattle(battle);
    setShowDetailsModal(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading battles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500 rounded-lg p-6">
          <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Battles</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setLoading(true);
                loadBattles();
              }}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Battle History
          </h1>
          <p className="text-gray-400">View all your recent battles and opponents</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Total Wins</p>
                <p className="text-white text-2xl font-bold">{user?.wins || 0}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">Total Losses</p>
                <p className="text-white text-2xl font-bold">{user?.losses || 0}</p>
              </div>
              <Target className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Battles</p>
                <p className="text-white text-2xl font-bold">{user?.totalBattles || 0}</p>
              </div>
              <Swords className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Win Rate</p>
                <p className="text-white text-2xl font-bold">
                  {user?.totalBattles ? Math.min(((user.wins || 0) / user.totalBattles * 100), 100).toFixed(0) : 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Battles List */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Swords className="w-6 h-6 mr-3 text-cyan-400" />
            All Battles ({battles.length})
          </h2>

          {battles.length === 0 ? (
            <div className="text-center py-16">
              <Swords className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium mb-2">No battles yet</p>
              <p className="text-gray-500 text-sm mb-6">Start your first battle to begin your journey!</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all"
              >
                Start a Battle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {battles.map((battle, index) => {
                if (!battle.problem) return null;
                
                const isWin = battle.winner?.username === user?.username;
                const opponent = battle.players?.find(p => p.username !== user?.username);
                const isPractice = battle.players?.length === 1 || battle.isPractice;
                
                return (
                  <div
                    key={battle._id}
                    className="group bg-gray-900/50 border border-gray-700/50 rounded-xl p-5 hover:border-cyan-500/50 hover:bg-gray-800/50 transition-all cursor-pointer"
                    onClick={() => handleBattleClick(battle)}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left: Battle Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isWin ? 'bg-green-400 shadow-lg shadow-green-400/50' : 
                            battle.winner ? 'bg-red-400 shadow-lg shadow-red-400/50' : 
                            'bg-gray-400'
                          }`}></div>
                          <h4 className="text-white font-bold text-lg group-hover:text-cyan-400 transition-colors">
                            {battle.problem.title}
                          </h4>
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getDifficultyColor(battle.problem.difficulty)}`}>
                            {battle.problem.difficulty}
                          </span>
                        </div>

                        {/* Opponent Info */}
                        {!isPractice && opponent && (
                          <div className="ml-6 mb-3">
                            <div className="flex items-center space-x-3 bg-gray-800/70 rounded-lg px-4 py-3 border border-gray-700/50 w-fit">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">Opponent:</span>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">{opponent.level || 1}</span>
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{opponent.username}</p>
                                  {opponent.totalBattles !== undefined && (
                                    <p className="text-xs text-gray-500">
                                      {opponent.wins || 0}W - {opponent.losses || 0}L
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewProfile(opponent._id);
                                  }}
                                  className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors border border-cyan-500/30"
                                  title="View Profile"
                                >
                                  <Eye className="w-4 h-4 text-cyan-400" />
                                </button>
                                <button
                                  onClick={(e) => handleSendFriendRequest(opponent._id, e)}
                                  disabled={sendingRequest === opponent._id}
                                  className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors border border-green-500/30 disabled:opacity-50"
                                  title="Send Friend Request"
                                >
                                  <UserPlus className="w-4 h-4 text-green-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {isPractice && (
                          <div className="ml-6 text-cyan-400 text-sm flex items-center font-semibold">
                            <Target className="w-4 h-4 mr-2" />
                            Practice Mode
                          </div>
                        )}

                        {/* Battle Metadata */}
                        <div className="ml-6 flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(battle.createdAt)}
                          </span>
                          {battle.completedAt && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Completed {formatDate(battle.completedAt)}
                            </span>
                          )}
                          <span className="text-gray-600">•</span>
                          <span>Status: {battle.status}</span>
                        </div>
                      </div>

                      {/* Right: Result Badge */}
                      <div className="text-right flex-shrink-0 ml-4">
                        {isPractice && battle.solved ? (
                          <div className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/20">
                            <span className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4" />
                              <span>Solved</span>
                            </span>
                          </div>
                        ) : battle.winner ? (
                          <div className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg ${
                            isWin
                              ? 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30 shadow-green-500/20'
                              : 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 shadow-red-500/20'
                          }`}>
                            {isWin ? (
                              <span className="flex items-center space-x-2">
                                <Trophy className="w-4 h-4" />
                                <span>Victory</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-2">
                                <Target className="w-4 h-4" />
                                <span>Defeat</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="px-6 py-3 rounded-xl font-bold text-sm bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            Leaved
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

      {/* Battle Details Modal */}
      {showDetailsModal && selectedBattle && selectedBattle.problem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-cyan-500/30 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{selectedBattle.problem.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
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
                  onClick={() => setShowDetailsModal(false)}
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

export default RecentBattles;
