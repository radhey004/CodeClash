import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Users, Zap, Clock, Trophy } from 'lucide-react';

const Matchmaking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searching, setSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [matchFound, setMatchFound] = useState(false);
  const [opponent, setOpponent] = useState<any>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to matchmaking server');
    });

    newSocket.on('queue-status', ({ queueSize }) => {
      setQueueSize(queueSize);
    });

    newSocket.on('match-found', ({ battleId, opponent }) => {
      console.log('Match found!', battleId, opponent);
      setMatchFound(true);
      setOpponent(opponent);
      
      // Navigate to battle after showing match found screen
      setTimeout(() => {
        navigate(`/arena/${battleId}`);
      }, 3000);
    });

    newSocket.on('error', ({ message }) => {
      alert(message);
      setSearching(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const startMatchmaking = async () => {
    if (!socket || !user) return;
    
    // Enter fullscreen mode when user clicks Find Match
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
    
    setSearching(true);
    socket.emit('join-queue', {
      userId: user._id,
      username: user.username
    });
  };

  const cancelMatchmaking = () => {
    if (!socket || !user) return;
    
    socket.emit('leave-queue', { userId: user._id });
    setSearching(false);
    setQueueSize(0);
  };

  if (matchFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-8 max-w-md w-full text-center animate-pulse">
          <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Match Found!</h2>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">{user?.username[0].toUpperCase()}</span>
              </div>
              <p className="text-cyan-400">{user?.username}</p>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">{opponent?.username[0].toUpperCase()}</span>
              </div>
              <p className="text-red-400">{opponent?.username}</p>
            </div>
          </div>
          <p className="text-gray-300">Entering battle arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Enter Ranked Match</h1>
          <p className="text-gray-300">Problem difficulty is automatically matched to your league!</p>
        </div>

        <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-8">
          {!searching ? (
            <>
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Your Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm">League</p>
                    <p className="text-yellow-400 text-lg font-bold">{user?.league || 'Unranked'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Trophies</p>
                    <p className="text-purple-400 text-lg font-bold">{user?.trophies || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Wins</p>
                    <p className="text-green-400 text-2xl font-bold">{user?.wins || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Losses</p>
                    <p className="text-red-400 text-2xl font-bold">{user?.losses || 0}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startMatchmaking}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
              >
                <Users className="w-6 h-6" />
                <span>Find Match</span>
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-white mb-2">Searching for opponent...</h2>
                <p className="text-gray-300 mb-1">League: <span className="text-yellow-400">{user?.league || 'Unranked'}</span></p>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center text-yellow-400 mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Matchmaking Tips</span>
                </div>
                <ul className="text-gray-300 text-sm space-y-1 text-left">
                  <li>• Matched with players in similar leagues</li>
                  <li>• First to solve all test cases wins</li>
                  <li>• Winner gets 2x XP reward</li>
                  <li>• Both players solve the same problem</li>
                </ul>
              </div>

              <button
                onClick={cancelMatchmaking}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Cancel Search
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 w-full text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Matchmaking;
