import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Swords, Check, AlertCircle } from 'lucide-react';

const ChooseUsername = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await userAPI.updateUsername(username.trim());
      if (user) {
        updateUser({ ...user, username: data.username });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20"
            />
          ) : (
            <Swords className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          )}
          <h2 className="text-4xl font-bold text-white mb-2">Choose Your Name</h2>
          <p className="text-gray-400">Pick a username for the coding arena</p>
        </div>

        <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors text-lg"
                placeholder="CodeWarrior"
                required
                minLength={3}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                At least 3 characters. This is how other players will see you.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || username.trim().length < 3}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Enter the Arena
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChooseUsername;
