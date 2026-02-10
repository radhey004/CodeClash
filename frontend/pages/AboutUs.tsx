import { useEffect } from 'react';
import { Code, Swords, Trophy, Zap, Target, Users, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            About CodeClash
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Where competitive coding meets real-time battles. Join thousands of developers 
            sharpening their skills through intense 1v1 coding challenges.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-20 bg-gray-800/50 rounded-2xl p-8 md:p-12 border border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <Target className="w-10 h-10 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            CodeClash was created with a simple yet powerful goal: to make competitive programming 
            more engaging, accessible, and fun. We believe that the best way to improve coding skills 
            is through real-time challenges against peers. Our platform brings together developers from 
            around the world to compete, learn, and grow in a dynamic environment that mirrors real-world 
            problem-solving scenarios.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
              <div className="bg-cyan-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Swords className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Battles</h3>
              <p className="text-gray-400">
                Face off against opponents in live 1v1 coding challenges with instant feedback
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-blue-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Ranking System</h3>
              <p className="text-gray-400">
                Climb through ranks from Bronze to Legendary with a competitive ELO system
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors">
              <div className="bg-purple-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multiple Languages</h3>
              <p className="text-gray-400">
                Code in your preferred language with support for Python, JavaScript, C++, and more
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors">
              <div className="bg-green-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Execution</h3>
              <p className="text-gray-400">
                Fast code execution and real-time result validation
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Community First</h3>
              <p className="text-gray-400">
                Building a supportive community where developers help each other grow and succeed
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Global Access</h3>
              <p className="text-gray-400">
                Making competitive programming accessible to developers everywhere, regardless of background
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Fair Play</h3>
              <p className="text-gray-400">
                Ensuring a level playing field with robust matchmaking and anti-cheat measures
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-8 md:p-12 border border-cyan-500/20 mb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-12">CodeClash by the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <div className="text-gray-400">Battles Fought</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
                100+
              </div>
              <div className="text-gray-400">Problems</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-red-500 bg-clip-text text-transparent mb-2">
                15+
              </div>
              <div className="text-gray-400">Languages</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gray-800/50 rounded-2xl p-12 border border-gray-700">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Join the Battle?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Start your journey today and compete with developers from around the world
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              to="/leaderboard"
              className="bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-600 transition-all transform hover:scale-105"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
