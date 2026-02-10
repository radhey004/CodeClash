  import { Link, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  import { Swords, Trophy, User, LogOut, Users, History } from 'lucide-react';
  import { useState } from 'react';
  
  const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
      if ((window as any).battleInProgress && location.pathname.includes('/arena/')) {
        e.preventDefault();
        (window as any).showBattleLeaveConfirm?.();
      }
    };
  
    const handleLogout = () => {
      logout();
      navigate('/');
      setShowLogoutConfirm(false);
    };
  
    return (
      <>
        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-2 border-red-500 rounded-xl p-8 max-w-md w-full">
              <div className="text-center mb-6">
                <LogOut className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Logout</h2>
                <p className="text-gray-400">
                  Are you sure you want to logout?
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

      <nav className="bg-gray-900 border-b border-cyan-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CodeClash
              </span>
            </Link>
  
            {user ? (
              <div className="flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  onClick={(e) => handleNavClick(e, '/dashboard')}
                  className="text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/battles"
                  onClick={(e) => handleNavClick(e, '/battles')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <Swords className="w-4 h-4" />
                  <span>Battles</span>
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={(e) => handleNavClick(e, '/leaderboard')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  to="/friends"
                  onClick={(e) => handleNavClick(e, '/friends')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span>Friends</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={(e) => handleNavClick(e, '/profile')}
                  className="flex items-center space-x-1 text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-400">{user.username}</p>
                    <p className="text-xs text-gray-400">Level {user.level}</p>
                  </div>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-cyan-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      </>
    );
  };
  
  export default Navbar;
