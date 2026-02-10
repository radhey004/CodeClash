import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardAPI } from '../services/api';
import { Trophy, Medal, Award, Eye, Users, Crown, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
  rankedXP?: number;
  trophies?: number;
  legendTrophies?: number;
  rankLeague?: string;
  wins: number;
  losses: number;
  totalBattles: number;
  winRate: string;
  seasonParticipated?: boolean;
  isCurrentUser?: boolean;
}

interface MyLeagueData {
  league: string;
  totalPlayers?: number;
  currentUserRank?: number;
  message?: string;
  players: LeaderboardEntry[];
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'myLeague' | 'topPlayers'>('myLeague');
  const [myLeagueData, setMyLeagueData] = useState<MyLeagueData | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'myLeague') {
        const data = await leaderboardAPI.getMyLeague();
        setMyLeagueData(data);
      } else {
        const data = await leaderboardAPI.getTopPlayers();
        setTopPlayers(data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

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

  const renderLeaderboardTable = (entries: LeaderboardEntry[]) => (
    <div className="bg-gray-800 border border-cyan-500/30 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Player</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">League</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Trophies</th>
              {activeTab === 'topPlayers' && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                  <span className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    Legend
                  </span>
                </th>
              )}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Level</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">W/L</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Win Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {entries.map((entry) => (
              <tr
                key={entry.rank}
                onClick={() => navigate(`/profile/${entry.userId}`)}
                className={`hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  entry.rank <= 3 ? 'bg-gray-700/30' : ''
                } ${entry.isCurrentUser ? 'bg-cyan-900/20 border-l-4 border-cyan-500' : ''}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${entry.isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>
                      {entry.username}
                      {entry.isCurrentUser && <span className="ml-2 text-xs text-cyan-400">(You)</span>}
                    </span>
                    <Eye className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold bg-gradient-to-r ${getRankColor(entry.rankLeague)} text-white`}>
                    {entry.rankLeague || 'Unranked'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {entry.trophies || 0}
                  </span>
                </td>
                {activeTab === 'topPlayers' && (
                  <td className="px-6 py-4">
                    {(entry.legendTrophies || 0) > 0 ? (
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        {entry.legendTrophies}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className="text-cyan-400 font-semibold">{entry.level}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    <span className="text-green-400">{entry.wins}</span>
                    <span className="text-gray-500"> / </span>
                    <span className="text-red-400">{entry.losses}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-400">{entry.winRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No rankings yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Leaderboard</h1>
          <p className="text-gray-400">Compete in leagues and climb the ranks</p>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 border border-cyan-500/30 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setActiveTab('myLeague')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'myLeague'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              My League
            </button>
            <button
              onClick={() => setActiveTab('topPlayers')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'topPlayers'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              Top Players
            </button>
          </div>
        </div>

        {/* League Info Banner */}
        {activeTab === 'myLeague' && myLeagueData && (
          <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-cyan-500/30 rounded-lg p-6">
            {myLeagueData.message ? (
              <div className="text-center">
                <div className="text-gray-400 mb-2">{myLeagueData.message}</div>
                <button
                  onClick={() => navigate('/matchmaking')}
                  className="mt-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  Start First Battle
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{myLeagueData.league}</h2>
                  <p className="text-gray-400">
                    Your Rank: <span className="text-cyan-400 font-bold">#{myLeagueData.currentUserRank}</span>
                    {' '}of{' '}
                    <span className="text-white">{myLeagueData.totalPlayers}</span> players
                  </p>
                </div>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${getRankColor(myLeagueData.league)} flex items-center justify-center`}>
                  <Trophy className="w-10 h-10 text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-cyan-400 text-xl">Loading...</div>
          </div>
        ) : (
          <>
            {activeTab === 'myLeague' && myLeagueData && !myLeagueData.message && renderLeaderboardTable(myLeagueData.players)}
            {activeTab === 'topPlayers' && renderLeaderboardTable(topPlayers)}
          </>
        )}

        {/* Season Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Season ends on the last Monday of each month</p>
          <p className="mt-1">Complete a PvP battle after reset to rejoin your league</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
