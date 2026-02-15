import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Target, TrendingUp, Award, Flame, ArrowLeft, UserPlus, UserCheck, UserX, X } from 'lucide-react';
import axios from 'axios';
import { friendAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface User {
  username: string;
  level: number;
  xp: number;
  rankedXP?: number;
  rank?: string;
  league?: string;
  trophies?: number;
  legendTrophies?: number;
  wins: number;
  losses: number;
  totalBattles: number;
  currentStreak: number;
  longestStreak: number;
  currentWinStreak: number;
  longestWinStreak: number;
}

interface FriendshipStatus {
  status: 'none' | 'friends' | 'request-sent' | 'request-received';
  friendshipId?: string;
}

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUser();
    loadFriendshipStatus();
  }, [userId]);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!userId || userId === currentUser?._id) return;
    try {
      // Get the user's friends, pending, and sent requests
      const [friendsData, pendingData, sentData] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getPendingRequests(),
        friendAPI.getSentRequests()
      ]);

      // Check if already friends
      const isFriend = friendsData.friends?.some((f: any) => f._id === userId);
      if (isFriend) {
        const friend = friendsData.friends?.find((f: any) => f._id === userId);
        setFriendshipStatus({ status: 'friends', friendshipId: friend?.friendshipId });
        return;
      }

      // Check if request received
      const receivedRequest = pendingData.requests?.find((r: any) => r.user._id === userId);
      if (receivedRequest) {
        setFriendshipStatus({ 
          status: 'request-received', 
          friendshipId: receivedRequest.requestId 
        });
        return;
      }

      // Check if request sent
      const sentRequest = sentData.requests?.find((r: any) => r.user._id === userId);
      if (sentRequest) {
        setFriendshipStatus({ 
          status: 'request-sent', 
          friendshipId: sentRequest.requestId 
        });
        return;
      }

      setFriendshipStatus({ status: 'none' });
    } catch (error) {
      console.error('Failed to load friendship status:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await friendAPI.sendFriendRequest(userId);
      setSuccessMessage('Friend request sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadFriendshipStatus();
    } catch (error: any) {
      console.error('Failed to send friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendshipStatus.friendshipId) return;
    setActionLoading(true);
    try {
      await friendAPI.cancelFriendRequest(friendshipStatus.friendshipId);
      setSuccessMessage('Friend request cancelled');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadFriendshipStatus();
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipStatus.friendshipId) return;
    setActionLoading(true);
    try {
      await friendAPI.acceptFriendRequest(friendshipStatus.friendshipId);
      setSuccessMessage('Friend request accepted!');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadFriendshipStatus();
    } catch (error: any) {
      console.error('Failed to accept request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!friendshipStatus.friendshipId) return;
    setActionLoading(true);
    try {
      await friendAPI.declineFriendRequest(friendshipStatus.friendshipId);
      setSuccessMessage('Friend request declined');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadFriendshipStatus();
    } catch (error: any) {
      console.error('Failed to decline request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipStatus.friendshipId || !confirm('Are you sure you want to remove this friend?')) return;
    setActionLoading(true);
    try {
      await friendAPI.removeFriend(friendshipStatus.friendshipId);
      setSuccessMessage('Friend removed');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadFriendshipStatus();
    } catch (error: any) {
      console.error('Failed to remove friend:', error);
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-400 text-xl mb-4">User not found</p>
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Back to Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            {successMessage}
          </div>
        )}

        <button
          onClick={() => navigate('/leaderboard')}
          className="mb-6 flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Leaderboard</span>
        </button>

        <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-8 mb-8">
          <div className="flex items-start space-x-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-white">{user.level}</span>
              </div>
              <div className={`mt-4 text-center bg-gradient-to-r ${rankColor} text-white px-4 py-2 rounded-lg font-bold shadow-lg`}>
                {displayRank}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{user.username}</h1>
              <p className="text-cyan-400 text-lg mb-6">Level {user.level} Warrior</p>

              {/* Friend Action Buttons - Only show if not viewing own profile */}
              {userId !== currentUser?._id && (
                <div className="mb-6">
                  {friendshipStatus.status === 'none' && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-5 h-5" />
                      {actionLoading ? 'Sending...' : 'Add Friend'}
                    </button>
                  )}
                  {friendshipStatus.status === 'request-sent' && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      {actionLoading ? 'Canceling...' : 'Cancel Friend Request'}
                    </button>
                  )}
                  {friendshipStatus.status === 'request-received' && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleAcceptRequest}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50"
                      >
                        <UserCheck className="w-5 h-5" />
                        {actionLoading ? 'Accepting...' : 'Accept Friend Request'}
                      </button>
                      <button
                        onClick={handleDeclineRequest}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <UserX className="w-5 h-5" />
                        Decline
                      </button>
                    </div>
                  )}
                  {friendshipStatus.status === 'friends' && (
                    <div className="flex gap-3 items-center">
                      <span className="text-green-400 font-bold flex items-center gap-2 text-lg">
                        <UserCheck className="w-5 h-5" />
                        Friends
                      </span>
                      <button
                        onClick={handleRemoveFriend}
                        disabled={actionLoading}
                        className="bg-red-600/80 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                      >
                        {actionLoading ? 'Removing...' : 'Remove Friend'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">XP Progress</span>
                  <span className="text-cyan-400">{user.xp} / {user.level * 100}</span>
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
                      {user.trophies || 0}
                    </span>
                  </div>
                </div>
                {(user.legendTrophies || 0) > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Legend Trophies</span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Award className="w-4 h-4 fill-yellow-400" />
                        {user.legendTrophies}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4 border border-orange-500/30">
                  <Flame className="w-8 h-8 text-orange-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.currentStreak || 0} 🔥</p>
                  <p className="text-gray-400 text-sm">Daily Streak</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-purple-500/30">
                  <Trophy className="w-8 h-8 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.longestStreak || 0} 📅</p>
                  <p className="text-gray-400 text-sm">Longest Daily</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-yellow-500/30">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.currentWinStreak || 0} 🏆</p>
                  <p className="text-gray-400 text-sm">Win Streak</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-green-500/30">
                  <Award className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.longestWinStreak || 0} 👑</p>
                  <p className="text-gray-400 text-sm">Best Win Streak</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.wins || 0}</p>
                  <p className="text-gray-400 text-sm">Wins</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Target className="w-8 h-8 text-red-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.losses || 0}</p>
                  <p className="text-gray-400 text-sm">Losses</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{winRate}%</p>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <Award className="w-8 h-8 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-white">{user.totalBattles || 0}</p>
                  <p className="text-gray-400 text-sm">Total Battles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
