import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Trophy,
    Crown,
    Coins,
    TrendingUp,
    Sparkles
} from 'lucide-react';

/* ─── DESIGN TOKENS ─── */
const T = {
    cream: '#fcfaf5',
    white: '#ffffff',
    forest: '#1a3300',
    terracotta: '#cb5521',
    yellow: '#ffe95c',
    mint: '#d5f5c2',
    blush: '#f6d0ff',
    teal: '#a8e5e5',
    muted: 'rgba(26,51,0,0.55)',
    border: '1.5px solid #1a3300',
    shadow: '4px 4px 0px rgba(26,51,0,0.12)',
    shadowHard: '4px 4px 0px #1a3300',
    radius: '12px',
    fontDisplay: "'Bricolage Grotesque', 'Outfit', sans-serif",
    fontBody: "'Inter', sans-serif",
    fontMono: "'Roboto Mono', monospace",
};

/* ─── REUSABLE CARD COMPONENT ─── */
const Card = ({ children, style, className = '', hoverable = false, color, ...props }) => {
    const [hovered, setHovered] = useState(false);
    const colorMap = {
        mint: { bg: T.mint, borderLeft: '4px solid #7bc96b' },
        blush: { bg: T.blush, borderLeft: '4px solid #c77dff' },
        teal: { bg: T.teal, borderLeft: '4px solid #5bb5b5' },
        terracotta: { bg: T.white, borderLeft: `4px solid ${T.terracotta}` },
        yellow: { bg: T.white, borderLeft: `4px solid ${T.yellow}` },
        cream: { bg: T.cream, borderLeft: `4px solid ${T.forest}` },
    };
    const colorStyle = color && colorMap[color] ? colorMap[color] : {};
    return (
        <div
            className={className}
            style={{
                backgroundColor: colorStyle.bg || T.white,
                border: T.border,
                borderLeft: colorStyle.borderLeft || T.border,
                borderRadius: T.radius,
                boxShadow: hovered && hoverable ? T.shadowHard : T.shadow,
                transform: hovered && hoverable ? 'translate(-2px, -2px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                ...style,
            }}
            onMouseEnter={() => hoverable && setHovered(true)}
            onMouseLeave={() => hoverable && setHovered(false)}
            {...props}
        >
            {children}
        </div>
    );
};

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError("Please log in to view rankings.");
                setLoading(false);
                return;
            }

            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const response = await axios.get('http://localhost:5000/api/gamification/leaderboard', config);

            if (response.data.success) {
                let apiLeaderboard = response.data.leaderboard || [];
                let apiUserStats = response.data.userStats || {
                    currentRank: 1,
                    walletBalance: 250,
                    totalPoints: 2500,
                    username: "Demo Student"
                };

                // Inject demo students to populate leaderboard if empty or has only current user
                if (apiLeaderboard.length <= 1) {
                    const currentUserXP = apiUserStats.totalPoints || apiUserStats.points || 2500;
                    const currentUserName = apiUserStats.username || "Demo Student";

                    const demoStudents = [
                        { username: "Samiul Alam", points: 3450, isDemo: true },
                        { username: "Nabila Rahman", points: 3120, isDemo: true },
                        { username: "Rafid Hasan", points: 2850, isDemo: true },
                        { username: "Anika Tabassum", points: 2350, isDemo: true },
                        { username: "Fahim Chowdhury", points: 2100, isDemo: true },
                        { username: "Zareen Subah", points: 1850, isDemo: true },
                        { username: "Abrar Ishraq", points: 1600, isDemo: true },
                        { username: "Tasnim Chowdhury", points: 1350, isDemo: true },
                    ];

                    const userEntry = {
                        username: currentUserName,
                        points: currentUserXP,
                        isCurrentUser: true
                    };

                    const mergedList = [...demoStudents];
                    
                    const userExists = mergedList.some(s => s.username === currentUserName);
                    if (!userExists) {
                        mergedList.push(userEntry);
                    }

                    mergedList.sort((a, b) => b.points - a.points);

                    const rankedList = mergedList.map((student, index) => ({
                        ...student,
                        rank: index + 1
                    }));

                    setLeaderboard(rankedList);

                    const userRankIndex = rankedList.findIndex(s => s.isCurrentUser);
                    const updatedRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;

                    setUserStats({
                        currentRank: updatedRank,
                        walletBalance: apiUserStats.walletBalance || 250,
                        totalPoints: currentUserXP,
                        username: currentUserName
                    });
                } else {
                    setLeaderboard(apiLeaderboard);
                    setUserStats(apiUserStats);
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            if (err.response?.status === 401) setError("Session expired. Please Login again.");
            else if (err.response?.status === 404) setError("API endpoint not found (404). Check backend.");
            else setError("Failed to load leaderboard.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );

    if (error) return (
        <div className="text-center text-red-500 p-8 bg-red-100 rounded-xl border-2 border-red-500/20 m-10">
            <p className="font-bold">{error}</p>
        </div>
    );

    const topThree = leaderboard.slice(0, 3);
    const restList = leaderboard.slice(3);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-24 p-6" style={{ fontFamily: T.fontBody, color: T.forest }}>
            
            {/* 1. Header Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card hoverable color="teal" style={{ padding: '1.25rem' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Global Rank</p>
                            <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2rem', color: T.forest, lineHeight: 1 }}>#{userStats?.currentRank || '-'}</h2>
                        </div>
                        <div style={{
                            width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: T.white, border: T.border, color: T.forest, boxShadow: '2px 2px 0px #1a3300'
                        }}>
                            <Trophy size={20} />
                        </div>
                    </div>
                </Card>

                <Card hoverable color="yellow" style={{ padding: '1.25rem' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Wallet</p>
                            <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2rem', color: T.forest, lineHeight: 1 }}>{userStats?.walletBalance || 0}</h2>
                        </div>
                        <div style={{
                            width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: T.white, border: T.border, color: T.forest, boxShadow: '2px 2px 0px #1a3300'
                        }}>
                            <Coins size={20} />
                        </div>
                    </div>
                </Card>

                <Card hoverable color="blush" style={{ padding: '1.25rem' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Total XP</p>
                            <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2rem', color: T.forest, lineHeight: 1 }}>{userStats?.totalPoints || 0} XP</h2>
                        </div>
                        <div style={{
                            width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: T.white, border: T.border, color: T.forest, boxShadow: '2px 2px 0px #1a3300'
                        }}>
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* 2. Top 3 Podium (Only if data exists) */}
            {topThree.length > 0 && (
                <Card style={{ padding: '2rem 1.5rem 0 1.5rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.terracotta, fontFamily: T.fontMono }}>Weekly Arena</p>
                            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest, marginTop: '0.1rem' }}>Top Performers Podium</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', backgroundColor: T.cream, border: T.border, borderRadius: 100, fontSize: '0.6rem', fontWeight: 800 }}>
                            <Sparkles size={12} className="text-amber-500" /> Leaderboard Live
                        </div>
                    </div>

                    <div className="flex items-end justify-center gap-2 md:gap-4 max-w-lg mx-auto">
                        {/* Rank 2 (Left) */}
                        {topThree[1] && (
                            <div className="flex flex-col items-center flex-1">
                                <div className="w-14 h-14 rounded-full bg-[#f1f5f9] border-2 border-[#1a3300] flex items-center justify-center text-xl mb-1.5 shadow-[2px_2px_0px_#1a3300]">🥈</div>
                                <p style={{ fontFamily: T.fontDisplay, fontWeight: 800, color: T.forest, fontSize: '0.85rem' }} className="text-center truncate max-w-[80px] md:max-w-[120px]">{topThree[1].username}</p>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', color: T.muted, fontWeight: 700 }} className="text-center">{topThree[1].points} XP</p>
                                
                                {/* Pillar */}
                                <div 
                                    style={{ 
                                        height: '80px', 
                                        width: '100%', 
                                        backgroundColor: T.teal, 
                                        border: T.border, 
                                        borderRadius: '10px 10px 0 0',
                                        boxShadow: '4px 4px 0px rgba(26,51,0,0.12)',
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2rem', color: 'rgba(26,51,0,0.25)' }}>2</span>
                                </div>
                            </div>
                        )}

                        {/* Rank 1 (Center) */}
                        {topThree[0] && (
                            <div className="flex flex-col items-center flex-1 z-10">
                                <Crown className="text-amber-500 mb-0.5 animate-bounce" size={20} />
                                <div className="w-16 h-16 rounded-full bg-[#fdf2e9] border-2 border-[#1a3300] flex items-center justify-center text-2xl mb-1.5 shadow-[3px_3px_0px_#1a3300]">🥇</div>
                                <p style={{ fontFamily: T.fontDisplay, fontWeight: 900, color: T.forest, fontSize: '0.95rem' }} className="text-center truncate max-w-[90px] md:max-w-[130px]">{topThree[0].username}</p>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.7rem', color: T.terracotta, fontWeight: 800 }} className="text-center">{topThree[0].points} XP</p>
                                
                                {/* Pillar */}
                                <div 
                                    style={{ 
                                        height: '115px', 
                                        width: '100%', 
                                        backgroundColor: T.yellow, 
                                        border: T.border, 
                                        borderRadius: '10px 10px 0 0',
                                        boxShadow: '4px 4px 0px rgba(26,51,0,0.2)',
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '3rem', color: 'rgba(26,51,0,0.3)' }}>1</span>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 (Right) */}
                        {topThree[2] && (
                            <div className="flex flex-col items-center flex-1">
                                <div className="w-14 h-14 rounded-full bg-[#f1f5f9] border-2 border-[#1a3300] flex items-center justify-center text-xl mb-1.5 shadow-[2px_2px_0px_#1a3300]">🥉</div>
                                <p style={{ fontFamily: T.fontDisplay, fontWeight: 800, color: T.forest, fontSize: '0.85rem' }} className="text-center truncate max-w-[80px] md:max-w-[120px]">{topThree[2].username}</p>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', color: T.muted, fontWeight: 700 }} className="text-center">{topThree[2].points} XP</p>
                                
                                {/* Pillar */}
                                <div 
                                    style={{ 
                                        height: '60px', 
                                        width: '100%', 
                                        backgroundColor: T.mint, 
                                        border: T.border, 
                                        borderRadius: '10px 10px 0 0',
                                        boxShadow: '4px 4px 0px rgba(26,51,0,0.12)',
                                        marginTop: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <span style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.75rem', color: 'rgba(26,51,0,0.25)' }}>3</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* 3. The List */}
            <Card style={{ padding: 0 }}>
                <div 
                    className="flex justify-between items-center p-3.5 px-6" 
                    style={{ borderBottom: T.border, background: '#f5f1e6', borderRadius: '12px 12px 0 0' }}
                >
                    <div className="flex items-center gap-4">
                        <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, width: '2.5rem' }}>Rank</span>
                        <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>Student</span>
                    </div>
                    <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>Total XP</span>
                </div>

                <div className="divide-y divide-solid" style={{ borderColor: 'rgba(26,51,0,0.08)' }}>
                    {restList.length > 0 ? (
                        restList.map((user) => (
                            <div 
                                key={user.rank || user.username} 
                                className="flex items-center justify-between p-4 px-6 transition-all"
                                style={{ 
                                    backgroundColor: user.isCurrentUser ? 'rgba(255, 233, 92, 0.15)' : T.white,
                                    borderLeft: user.isCurrentUser ? `4px solid ${T.terracotta}` : 'none',
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <span style={{ fontFamily: T.fontMono, fontSize: '0.82rem', fontWeight: 800, color: T.muted, width: '2.5rem' }}>#{user.rank}</span>
                                    <div className="flex items-center gap-3">
                                        <div 
                                            style={{
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                backgroundColor: user.isCurrentUser ? T.yellow : T.mint, 
                                                border: '1.5px solid #1a3300',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontFamily: T.fontDisplay,
                                                fontWeight: 800,
                                                fontSize: '0.8rem',
                                                color: T.forest,
                                                boxShadow: '1px 1px 0px #1a3300'
                                            }}
                                        >
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ 
                                            fontFamily: T.fontDisplay, 
                                            fontWeight: user.isCurrentUser ? 900 : 800, 
                                            color: T.forest,
                                            fontSize: '0.9rem'
                                        }}>
                                            {user.username} {user.isCurrentUser && '(You)'}
                                        </span>
                                    </div>
                                </div>
                                <span style={{ fontFamily: T.fontMono, fontWeight: 800, color: T.terracotta, fontSize: '0.9rem' }}>{user.points} XP</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center" style={{ fontFamily: T.fontBody, color: T.muted, fontStyle: 'italic', fontSize: '0.85rem' }}>
                            No other students in the arena yet. Keep scoring!
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Leaderboard;