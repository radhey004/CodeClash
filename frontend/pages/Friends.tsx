/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { friendAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

// Vite provides import.meta.env types automatically; no need to redeclare them.

interface User {
  _id: string;
  username: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  friendshipStatus?: string;
  friendshipId?: string;
  friendsSince?: string;
}

interface FriendRequest {
  requestId: string;
  user: User;
  createdAt: string;
}

interface ChallengeData {
  challengeId: string;
  challenger: {
    id: string;
    username: string;
    level: number;
  };
  opponent: {
    id: string;
    username: string;
    level: number;
  };
  difficulty: string;
}

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());
  const [incomingChallenge, setIncomingChallenge] = useState<ChallengeData | null>(null);

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
    loadSentRequests();
  }, []);

  useEffect(() => {
    // Setup socket connection
    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket');
      if (user) {
        newSocket.emit('user-online', { userId: user._id, username: user.username });
      }
    });

    newSocket.on('friend-online', ({ userId }) => {
      setOnlineFriends(prev => new Set(prev).add(userId));
    });

    newSocket.on('friend-offline', ({ userId }) => {
      setOnlineFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('challenge-received', (challengeData: ChallengeData) => {
      setIncomingChallenge(challengeData);
    });

    newSocket.on('challenge-accepted', ({ battleId }) => {
      console.log('Challenge accepted, navigating to battle:', battleId);
      setIncomingChallenge(null);
      navigate(`/arena/${battleId}`);
    });

    newSocket.on('challenge-sent', (challengeData: ChallengeData) => {
      console.log('Challenge sent:', challengeData);
      setSuccessMessage(`Challenge sent to ${challengeData.opponent.username}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    });

    newSocket.on('challenge-declined', ({ opponentUsername }) => {
      setError(`${opponentUsername} declined your challenge`);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('challenge-expired', () => {
      setIncomingChallenge(null);
      setError('Challenge expired');
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('error', ({ message }) => {
      setError(message || 'An error occurred');
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      newSocket.close();
    };
  }, [user, navigate]);

  const loadFriends = async () => {
    try {
      const data = await friendAPI.getFriends();
      setFriends(data.friends || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await friendAPI.getPendingRequests();
      setPendingRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadSentRequests = async () => {
    try {
      const data = await friendAPI.getSentRequests();
      setSentRequests(data.requests || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await friendAPI.searchUsers(searchQuery);
      setSearchResults(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (recipientId: string) => {
    setLoading(true);
    setError('');
    try {
      await friendAPI.sendFriendRequest(recipientId);
      await handleSearch(); // Refresh search results
      await loadSentRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      await friendAPI.acceptFriendRequest(requestId);
      await loadPendingRequests();
      await loadFriends();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      await friendAPI.declineFriendRequest(requestId);
      await loadPendingRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setLoading(true);
    setError('');
    try {
      await friendAPI.cancelFriendRequest(requestId);
      await loadSentRequests();
      await handleSearch(); // Refresh search results
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    setLoading(true);
    setError('');
    try {
      await friendAPI.removeFriend(friendshipId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeFriend = (friendId: string) => {
    if (!socket || !user) {
      setError('Not connected to server');
      return;
    }
    
    console.log('Sending challenge:', { challengerId: user._id, opponentId: friendId });
    socket.emit('send-friend-challenge', {
      challengerId: user._id,
      opponentId: friendId
    });
  };

  const handleAcceptChallenge = () => {
    if (!socket || !incomingChallenge) return;
    console.log('Accepting challenge:', incomingChallenge.challengeId);
    socket.emit('accept-friend-challenge', { challengeId: incomingChallenge.challengeId });
    // Don't set to null here - wait for challenge-accepted event
  };

  const handleDeclineChallenge = () => {
    if (!socket || !incomingChallenge) return;
    socket.emit('decline-friend-challenge', { challengeId: incomingChallenge.challengeId });
    setIncomingChallenge(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Friends</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 animate-pulse">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200 animate-pulse">
            {successMessage}
          </div>
        )}

        {/* Incoming Challenge Modal */}
        {incomingChallenge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">Challenge Received!</h2>
              <p className="text-gray-300 mb-2">
                <span className="text-purple-400 font-bold">{incomingChallenge.challenger.username}</span>
                {' '}has challenged you to a battle!
              </p>
              <p className="text-gray-400 text-sm mb-6">
                Problem difficulty: <span className="text-yellow-400">{incomingChallenge.difficulty}</span>
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleAcceptChallenge}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold"
                >
                  Accept
                </button>
                <button
                  onClick={handleDeclineChallenge}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-bold"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🌍 Search Players
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                You don't have any friends yet. Search for users to add!
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="bg-gray-800 p-6 rounded-lg flex items-center justify-between hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate(`/profile/${friend._id}`)}
                      className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      <span className="text-white font-bold text-xl">
                        {friend.username[0].toUpperCase()}
                      </span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/profile/${friend._id}`)}
                          className="text-white font-bold hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                        >
                          {friend.username}
                          <Eye className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {onlineFriends.has(friend._id) ? (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-green-400 text-xs font-semibold">Online</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs font-semibold">Offline</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">
                        Level {friend.level} • {friend.wins}W / {friend.losses}L
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {onlineFriends.has(friend._id) ? (
                      <button
                        onClick={() => handleChallengeFriend(friend._id)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-5 py-2 rounded-lg font-bold shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
                      >
                        ⚔️ Challenge
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-600 text-gray-400 px-5 py-2 rounded-lg font-bold cursor-not-allowed opacity-50"
                      >
                        Offline
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveFriend(friend.friendshipId!)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Pending Requests</h2>
              {pendingRequests.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                  No pending friend requests
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-800 p-6 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => navigate(`/profile/${request.user._id}`)}
                          className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                          <span className="text-white font-bold text-xl">
                            {request.user.username[0].toUpperCase()}
                          </span>
                        </button>
                        <div>
                          <button
                            onClick={() => navigate(`/profile/${request.user._id}`)}
                            className="text-white font-bold hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                          >
                            {request.user.username}
                            <Eye className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <p className="text-gray-400 text-sm">
                            Level {request.user.level} • {request.user.wins}W / {request.user.losses}L
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.requestId)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                          disabled={loading}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.requestId)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                          disabled={loading}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-4">Sent Requests</h2>
              {sentRequests.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                  No sent friend requests
                </div>
              ) : (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-gray-800 p-6 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => navigate(`/profile/${request.user._id}`)}
                          className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer"
                        >
                          <span className="text-white font-bold text-xl">
                            {request.user.username[0].toUpperCase()}
                          </span>
                        </button>
                        <div>
                          <button
                            onClick={() => navigate(`/profile/${request.user._id}`)}
                            className="text-white font-bold hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                          >
                            {request.user.username}
                            <Eye className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <p className="text-gray-400 text-sm">
                            Level {request.user.level} • Pending
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.requestId)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-2xl">🌍</span> Find Players Across the Globe
              </h3>
              <p className="text-gray-400 text-sm">
                Search for players worldwide and expand your friend network
              </p>
            </div>
            <div className="mb-6 flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search users by username..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.length === 0 && searchQuery && !loading && (
                <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                  No users found
                </div>
              )}
              {searchResults.map((searchUser) => (
                <div
                  key={searchUser._id}
                  className="bg-gray-800 p-6 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate(`/profile/${searchUser._id}`)}
                      className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      <span className="text-white font-bold text-xl">
                        {searchUser.username[0].toUpperCase()}
                      </span>
                    </button>
                    <div>
                      <button
                        onClick={() => navigate(`/profile/${searchUser._id}`)}
                        className="text-white font-bold hover:text-cyan-400 transition-colors flex items-center gap-1 group"
                      >
                        {searchUser.username}
                        <Eye className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <p className="text-gray-400 text-sm">
                        Level {searchUser.level} • {searchUser.wins}W / {searchUser.losses}L
                      </p>
                    </div>
                  </div>
                  <div>
                    {searchUser.friendshipStatus === 'friends' && (
                      <span className="text-green-400 font-bold">Friends ✓</span>
                    )}
                    {searchUser.friendshipStatus === 'request-sent' && (
                      <button
                        onClick={() => handleCancelRequest(searchUser.friendshipId!)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold"
                        disabled={loading}
                      >
                        Cancel Request
                      </button>
                    )}
                    {searchUser.friendshipStatus === 'request-received' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(searchUser.friendshipId!)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
                          disabled={loading}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(searchUser.friendshipId!)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
                          disabled={loading}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {searchUser.friendshipStatus === 'none' && (
                      <button
                        onClick={() => handleSendFriendRequest(searchUser._id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold"
                        disabled={loading}
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
