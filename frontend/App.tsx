import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Arena from './pages/Arena';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Matchmaking from './pages/Matchmaking';
import Friends from './pages/Friends';
import RecentBattles from './pages/RecentBattles';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';

function AppContent() {
  useEffect(() => {
    // Block forward navigation permanently
    const blockForwardNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Initial block
    blockForwardNavigation();

    // Block on popstate (back/forward button)
    window.addEventListener('popstate', blockForwardNavigation);

    return () => {
      window.removeEventListener('popstate', blockForwardNavigation);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matchmaking"
              element={
                <ProtectedRoute>
                  <Matchmaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/arena/:battleId"
              element={
                <ProtectedRoute>
                  <Arena />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <PublicProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <Friends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/battles"
              element={
                <ProtectedRoute>
                  <RecentBattles />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
    );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
