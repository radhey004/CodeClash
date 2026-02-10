import { Link, useNavigate } from 'react-router-dom';
import { Code, Swords, Trophy, Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePlayNow = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            Battle with Code. Conquer with Logic.
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Enter the arena where coding skills determine victory. Challenge players worldwide in real-time 1v1 coding battles.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handlePlayNow}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Play Now
            </button>
            {!user && (
              <Link
                to="/login"
                className="border-2 border-cyan-500 text-cyan-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cyan-500/10 transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-8 hover:border-cyan-500 transition-all">
            <div className="bg-cyan-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Multi-Language Support</h3>
            <p className="text-gray-400">
              Code in C++, Python, or Java. Choose your weapon and dominate the battlefield.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-8 hover:border-blue-500 transition-all">
            <div className="bg-blue-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Swords className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Battles</h3>
            <p className="text-gray-400">
              Face off against opponents in intense 1v1 coding duels. May the best coder win.
            </p>
          </div>

          <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-8 hover:border-purple-500 transition-all">
            <div className="bg-purple-500/10 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Competitive Ranking</h3>
            <p className="text-gray-400">
              Climb the leaderboard, earn XP, and prove you're the ultimate coding champion.
            </p>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-12">
            <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">1</div>
                <h4 className="text-white font-semibold mb-1">Create Account</h4>
                <p className="text-gray-400 text-sm">Sign up and enter the arena</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">2</div>
                <h4 className="text-white font-semibold mb-1">Start Battle</h4>
                <p className="text-gray-400 text-sm">Get matched with a problem</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">3</div>
                <h4 className="text-white font-semibold mb-1">Code Solution</h4>
                <p className="text-gray-400 text-sm">Solve faster than your opponent</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-pink-400 mb-2">4</div>
                <h4 className="text-white font-semibold mb-1">Win & Level Up</h4>
                <p className="text-gray-400 text-sm">Earn XP and climb ranks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                CodeClash
              </h3>
              <p className="text-gray-400 text-sm">
                The ultimate platform for competitive coding battles. Challenge, compete, and conquer.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/leaderboard" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 CodeClash. All rights reserved. Built with passion for coders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
