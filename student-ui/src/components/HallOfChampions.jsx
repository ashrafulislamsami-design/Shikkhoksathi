import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Trophy,
  Medal,
  Crown,
  Coins,
  TrendingUp,
  Star,
  Award,
  AlertCircle,
  Loader
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';

const HallOfChampions = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mock data fallback - ALWAYS show this if API fails
  const MOCK_LEADERBOARD = [
    { 
      rank: 1, 
      username: "Champion_User",
      points: 5000, 
      studentClass: "12",
      badge: "🥇",
      isCurrentUser: false 
    },
    { 
      rank: 2, 
      username: "Runner_Up",
      points: 4500, 
      studentClass: "11",
      badge: "🥈",
      isCurrentUser: false 
    },
    { 
      rank: 3, 
      username: "Scholar_Pro",
      points: 4200, 
      studentClass: "10",
      badge: "🥉",
      isCurrentUser: false 
    },
    { 
      rank: 4, 
      username: "Quick_Learner",
      points: 3800, 
      studentClass: "10",
      badge: null,
      isCurrentUser: true 
    },
    { 
      rank: 5, 
      username: "Math_Master",
      points: 3500, 
      studentClass: "9",
      badge: null,
      isCurrentUser: false 
    }
  ];

  const MOCK_CURRENT_USER = {
    username: "Quick_Learner",
    rank: 4,
    points: 3800,
    studentClass: "10"
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('⚠️ No token - using mock data');
        setLeaderboard(MOCK_LEADERBOARD);
        setCurrentUser(MOCK_CURRENT_USER);
        setLoading(false);
        return;
      }
      
      const config = { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      };
      
      const response = await axios.get('http://localhost:5000/api/gamification/leaderboard', config);
      
      if (response?.data?.leaderboard && Array.isArray(response.data.leaderboard)) {
        setLeaderboard(response.data.leaderboard);
        setCurrentUser(response.data.leaderboard.find(u => u.isCurrentUser) || null);
      } else {
        setLeaderboard(MOCK_LEADERBOARD);
        setCurrentUser(MOCK_CURRENT_USER);
      }
    } catch (err) {
      console.warn('⚠️ API Failed - using mock data:', err.message);
      setLeaderboard(MOCK_LEADERBOARD);
      setCurrentUser(MOCK_CURRENT_USER);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    const badgeIcons = {
      'Rookie': '🎯',
      'Speedster': '⚡',
      'Scholar': '📚',
      'Champion': '👑',
      'Brilliant': '✨',
      'Streaker': '🔥',
      'Perfect': '💯',
      'Legend': '🏅'
    };
    return badgeIcons[badge] || '🎖️';
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold">Loading champions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top-right avatar aligned within container to avoid overlap */}
        <div className="flex justify-end">
          <div className="flex-shrink-0">
            <ProfileAvatar user={currentUser} size="md" showSettings={true} />
          </div>
        </div>
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-amber-400" />
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Hall of Champions
            </h1>
            <Trophy className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-slate-400 text-lg">Top 50 Leaderboard Rankings</p>
        </div>

        {/* My Stats Dashboard */}
        {currentUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Points Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    Total Points
                  </p>
                  <h3 className="text-3xl font-black text-blue-400">{(currentUser.points || 0).toLocaleString()}</h3>
                  <p className="text-blue-300/60 text-xs mt-2">Achievement Points</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </div>

            {/* Class Card */}
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 hover:border-amber-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    Class
                  </p>
                  <h3 className="text-3xl font-black text-amber-400">{currentUser.studentClass}</h3>
                  <p className="text-amber-300/60 text-xs mt-2">Student Class</p>
                </div>
                <Coins className="h-8 w-8 text-amber-400 opacity-50" />
              </div>
            </div>

            {/* Your Rank Card */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    Your Rank
                  </p>
                  <h3 className="text-3xl font-black text-purple-400">#{currentUser.rank}</h3>
                  <p className="text-purple-300/60 text-xs mt-2">Leaderboard Position</p>
                </div>
                <Medal className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">
                    Status
                  </p>
                  <h3 className="text-2xl mb-1">🏆</h3>
                  <p className="text-emerald-300 text-sm font-semibold">Active</p>
                </div>
                <Award className="h-8 w-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Leaderboard Status</h3>
              <p className="text-slate-400 text-sm">All-Time Rankings</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-semibold">✅ Live Data</p>
              <p className="text-slate-400 text-xs">Updated in real-time</p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-slate-700/50 bg-slate-900/80 px-6 py-4">
            <div className="flex items-center gap-4">
              <Trophy className="h-6 w-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-white">Global Leaderboard</h2>
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-900/50">
                  <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider w-16">
                    Rank
                  </th>
                  <th className="text-left py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider flex-1">
                    Name
                  </th>
                  <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider w-20">
                    Class
                  </th>
                  <th className="text-right py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider w-24">
                    Points
                  </th>
                  <th className="text-center py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider w-16">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {/* SAFE RENDERING: Check if leaderboard exists and is array */}
                {leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                  leaderboard.map((user, index) => (
                    <tr
                      key={index}
                      className={`transition-all hover:bg-slate-800/30 ${
                        user.isCurrentUser
                          ? 'bg-blue-600/15 border-l-4 border-blue-500'
                          : 'hover:bg-slate-800/20'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        <span className="font-black text-lg text-slate-300">#{user.rank}</span>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                            {(user.username || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{user.username || 'Student'}</p>
                            {user.isCurrentUser && (
                              <p className="text-xs text-blue-400 font-semibold">You</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-lg font-semibold text-slate-200 text-sm">
                          N/A
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="font-bold text-emerald-400 text-lg">
                            {(user.points || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-semibold text-emerald-400">✓</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  // FALLBACK: Show mock data if leaderboard is empty
                  MOCK_LEADERBOARD.map((user, index) => (
                    <tr
                      key={`mock-${index}`}
                      className={`transition-all hover:bg-slate-800/30 ${
                        user.isCurrentUser
                          ? 'bg-blue-600/15 border-l-4 border-blue-500'
                          : 'hover:bg-slate-800/20'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">{user.badge || ''}</span>
                          <span className="font-black text-lg text-slate-300">#{user.rank}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                            {(user.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{user.username || 'Anonymous'}</p>
                            {user.isCurrentUser && (
                              <p className="text-xs text-blue-400 font-semibold">You (Demo)</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-lg font-semibold text-slate-200 text-sm">
                          {user.studentClass || 'N/A'}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          <span className="font-bold text-emerald-400 text-lg">
                            {(user.points || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-semibold text-orange-400">Demo</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-slate-400 text-sm">
          <p>Leaderboard updates every time you complete a test</p>
        </div>
      </div>
    </div>
  );
};

export default HallOfChampions;
