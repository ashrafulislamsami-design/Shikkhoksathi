import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Play, Trophy,
    ArrowRight, Activity, Zap, ArrowLeft,
    Bell, Loader2
} from 'lucide-react';
import MockTestConfigModal from '../MockTestConfigModal';
import StudentSidebar from '../StudentSidebar';
import SmartLoader from '../ui/SmartLoader';
import AlertModal from '../ui/AlertModal';
import ProfileAvatar from '../ProfileAvatar';
import { MovingBorder } from '../ui/moving-border';

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

const MockTestHubSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        {/* Stats Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div 
                    key={i} 
                    className="p-5 flex items-center justify-between"
                    style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #1a3300',
                        boxShadow: '4px 4px 0px rgba(26,51,0,0.12)',
                        borderRadius: '12px',
                        height: '78px'
                    }}
                >
                    <div className="space-y-2">
                        <div className="h-2 w-16 bg-[#1a3300]/10 rounded" />
                        <div className="h-5 w-20 bg-[#1a3300]/20 rounded" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-[#1a3300]/10" />
                </div>
            ))}
        </div>

        {/* Daily Challenge Card Skeleton */}
        <div 
            className="p-6 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{
                backgroundColor: '#ffffff',
                border: '2px solid #1a3300',
                boxShadow: '4px 4px 0px #1a3300',
                borderRadius: '16px',
                height: '110px'
            }}
        >
            <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-[#1a3300]/20 rounded" />
                <div className="h-3 w-72 bg-[#1a3300]/10 rounded mt-2" />
            </div>
            <div className="w-32 h-10 bg-[#1a3300]/10 rounded-xl flex-shrink-0" />
        </div>

        {/* Grid Skeletons */}
        <div className="space-y-4">
            <div className="h-4 w-32 bg-[#1a3300]/20 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5].map(i => (
                    <div 
                        key={i} 
                        className="p-5 flex flex-col justify-between"
                        style={{
                            backgroundColor: '#ffffff',
                            border: '2px solid #1a3300',
                            boxShadow: '4px 4px 0px #1a3300',
                            borderRadius: '16px',
                            height: '140px'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-lg bg-[#1a3300]/10" />
                            <div className="h-2 w-12 bg-[#1a3300]/10 rounded" />
                        </div>
                        <div className="space-y-2 mt-4">
                            <div className="h-3 w-28 bg-[#1a3300]/20 rounded" />
                            <div className="h-2.5 w-36 bg-[#1a3300]/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* ─── REUSABLE CARD COMPONENT ─── */
const Card = ({ children, style, className = '', hoverable = false, color, ...props }) => {
    const [hovered, setHovered] = useState(false);
    const colorMap = {
        mint: { bg: T.mint, borderLeft: '4px solid #7bc96b' },
        blush: { bg: T.blush, borderLeft: '4px solid #c77dff' },
        teal: { bg: T.teal, borderLeft: '4px solid #5bb5b5' },
        terracotta: { bg: T.white, borderLeft: `4px solid ${T.terracotta}` },
        yellow: { bg: T.white, borderLeft: `4px solid ${T.yellow}` },
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

const MockTestHub = ({ user }) => {
    const navigate = useNavigate();
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingContext, setLoadingContext] = useState(null);
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        streak: 0,
        points: 0
    });
    const [history, setHistory] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    // Fetch Real Data from Backend
    useEffect(() => {
        const fetchHubData = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                };
                const response = await axios.get('http://localhost:5000/api/tests/hub-data', config);

                if (response.data.success) {
                    const { stats, history } = response.data.data;
                    setStats(stats);
                    setHistory(history);
                }
            } catch (error) {
                console.error('Failed to fetch hub data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHubData();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const res = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(res.data.data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    };

    const markNotificationRead = async (id) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, config);
            setNotifications(notifications.filter(n => n._id !== id));
            navigate('/tutoring');
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    const startTest = async (config, context = null) => {
        setIsGenerating(true);
        setRetryCount(0);
        setLoadingContext(context);
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt <= MAX_RETRIES) {
            try {
                if (attempt > 0) {
                    setRetryCount(attempt);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                const requestConfig = {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                };

                // Map modal config to API payload
                const payload = {
                    testType: config.testType,
                    subject: config.subject,
                    classLevel: config.classLevel || config.targetClass,
                    language: config.language,
                    questionCount: config.questionCount,
                    questionType: config.questionType || 'mcq',
                    chapter: config.chapter || '1',
                    topic: 'General'
                };

                const response = await axios.post('http://localhost:5000/api/tests/generate', payload, requestConfig);

                if (response.data.success) {
                    const testId = response.data.test?._id || response.data.testId || response.data.data?.testId;
                    if (testId) {
                        navigate(`/test/${testId}`);
                        setIsGenerating(false);
                        return;
                    }
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                // Cycle loop
            }
            attempt++;
        }

        setIsGenerating(false);
        setAlertMessage('Assessment Engine is busy or the requested topic is currently unavailable. Please try a different subject.');
    };

    const startDailyChallenge = () => {
        startTest({
            testType: 'topic_specific',
            subject: 'Mathematics',
            classLevel: user?.profile?.class || '10',
            language: user?.profile?.preferredLanguage || 'english',
            questionCount: 10,
            isChallenge: true
        }, 'challenge');
    };



    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: T.fontBody, color: T.forest }}>
            <style>{`
                .force-white {
                    color: #ffffff !important;
                }
                .force-cream {
                    color: #fcfaf5 !important;
                }
            `}</style>
            {isGenerating && <SmartLoader isRetrying={retryCount > 0} retryCount={retryCount} context={loadingContext} />}
            <AlertModal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Assessment Engine" message={alertMessage} />
            {/* Sidebar */}
            <StudentSidebar user={user} />

            {/* Main Content */}
            <div 
                className="flex-1 overflow-y-auto relative no-scrollbar"
                style={{
                    backgroundColor: T.cream,
                    backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255,233,92,0.15) 0%, transparent 50%)',
                    backgroundSize: '48px 48px, 48px 48px, 100% 100%',
                }}
            >
                <div className="p-8 max-w-7xl mx-auto">
                    {loading ? (
                        <MockTestHubSkeleton />
                    ) : (
                        <>

                    {/* Back to Dashboard Navigation */}
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex items-center gap-2 transition-all mb-6 group text-xs font-bold uppercase tracking-wider"
                        style={{
                            padding: '0.5rem 0.8rem',
                            backgroundColor: T.white,
                            border: T.border,
                            borderRadius: '8px',
                            boxShadow: '2px 2px 0px #1a3300',
                            color: T.forest,
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; e.currentTarget.style.backgroundColor = T.yellow; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; e.currentTarget.style.backgroundColor = T.white; }}
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10 relative">
                        <div>
                            <h1 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2.5rem', color: T.forest, letterSpacing: '-0.02em', lineHeight: 1.1 }} className="italic">
                                Mock Test Hub
                            </h1>
                            <p style={{ color: T.muted, fontSize: '0.9rem', fontWeight: 500, marginTop: '0.25rem' }}>
                                Your central command for practice, analytics, and challenges.
                            </p>
                        </div>

                        {/* Top-Right Info & Actions */}
                        <div className="flex gap-4 items-center self-start md:self-auto">
                            {/* Streak Badge */}
                            <div 
                                className="flex items-center gap-2.5"
                                style={{
                                    padding: '0.65rem 1rem',
                                    backgroundColor: T.white,
                                    border: T.border,
                                    borderRadius: T.radius,
                                    boxShadow: T.shadow,
                                }}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: T.yellow, border: '1.5px solid #1a3300', color: T.forest
                                }}>
                                    <Zap size={16} fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, fontFamily: T.fontMono, lineHeight: 1 }}>Streak</span>
                                    <span style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '0.95rem', color: T.forest }}>{stats.streak} Days</span>
                                </div>
                            </div>

                            {/* Notifications bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative flex items-center justify-center transition-all"
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: T.radius,
                                        backgroundColor: T.white,
                                        border: T.border,
                                        boxShadow: T.shadow,
                                        color: T.forest,
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadow; }}
                                >
                                    <Bell size={20} />
                                    {notifications.length > 0 && (
                                        <span 
                                            className="absolute top-0 right-0 w-5 h-5 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                                            style={{
                                                backgroundColor: T.terracotta,
                                                border: '1.5px solid #1a3300',
                                                transform: 'translate(25%, -25%)'
                                            }}
                                        >
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div 
                                        className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                        style={{ border: T.border, boxShadow: '6px 6px 0px #1a3300' }}
                                    >
                                        <div className="p-4 border-b flex justify-between items-center bg-[#f5f1e6]" style={{ borderBottom: T.border }}>
                                            <h3 style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.forest }}>Notifications</h3>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: T.terracotta, backgroundColor: 'rgba(203,85,33,0.08)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                                                {notifications.length} New
                                            </span>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length > 0 ? notifications.map(n => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => markNotificationRead(n._id)}
                                                    className="p-4 border-b hover:bg-[#fcfaf5] transition-all cursor-pointer group"
                                                    style={{ borderBottom: '1px solid rgba(26,51,0,0.08)' }}
                                                >
                                                    <p style={{ fontSize: '0.75rem', color: T.forest, fontWeight: 500, lineHeight: 1.4 }} className="group-hover:text-[#cb5521] transition-colors">{n.message}</p>
                                                    <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, fontFamily: T.fontMono, marginTop: '0.35rem' }}>
                                                        {new Date(n.createdAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            )) : (
                                                <div className="p-8 text-center">
                                                    <p style={{ fontSize: '0.75rem', color: T.muted, fontStyle: 'italic', fontWeight: 500 }}>No new notifications</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile Avatar */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 44,
                                height: 44,
                                borderRadius: T.radius,
                                backgroundColor: T.white,
                                border: T.border,
                                boxShadow: T.shadow,
                            }}>
                                <ProfileAvatar user={user} size="md" showSettings={true} />
                            </div>
                        </div>
                    </div>

                    {/* Action Center */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Start New Test */}
                        <div 
                            className="lg:col-span-2 relative group cursor-pointer"
                            onClick={() => setIsConfigModalOpen(true)}
                            style={{
                                border: T.border,
                                borderRadius: '26px',
                                boxShadow: T.shadowHard,
                                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = T.shadowHard;
                            }}
                        >
                            <MovingBorder
                                duration={4}
                                borderWidth={2.5}
                                radius={24}
                                colors={[T.yellow, T.terracotta, T.teal, T.blush]}
                                outerClassName="h-full w-full"
                                className="h-full w-full"
                            >
                                <div 
                                    className="relative p-7 h-full flex flex-col justify-between gap-8 z-10 overflow-hidden"
                                    style={{
                                        background: 'radial-gradient(circle at 0% 0%, rgba(203, 85, 33, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255, 233, 92, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(213, 245, 194, 0.1) 0%, transparent 40%), #1a3300',
                                        borderRadius: '24px',
                                        minHeight: '220px',
                                    }}
                                >
                                    {/* Noise or subtle pattern */}
                                    <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                    
                                    {/* Glow overlays */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ffe95c]/8 rounded-full blur-3xl group-hover:bg-[#ffe95c]/15 transition-all duration-500"></div>
                                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#cb5521]/8 rounded-full blur-3xl group-hover:bg-[#cb5521]/15 transition-all duration-500"></div>

                                    <div className="flex justify-between items-start relative z-20">
                                        <div 
                                            className="transition-transform duration-300 group-hover:scale-110"
                                            style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: T.yellow,
                                                border: T.border,
                                                color: T.forest,
                                                boxShadow: '2px 2px 0px #1a3300',
                                            }}
                                        >
                                            <Play size={24} className="fill-current text-[#1a3300]" />
                                        </div>
                                        
                                        <span 
                                            style={{
                                                padding: '0.35rem 0.75rem',
                                                backgroundColor: 'rgba(255, 233, 92, 0.1)',
                                                color: T.yellow,
                                                borderRadius: 100,
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                border: '1.5px solid rgba(255, 233, 92, 0.3)',
                                                fontFamily: T.fontMono,
                                            }}
                                        >
                                            Customizable
                                        </span>
                                    </div>
                                    
                                    <div className="relative z-20">
                                        <div 
                                            className="force-cream text-[#fcfaf5]" 
                                            style={{ 
                                                fontFamily: T.fontDisplay, 
                                                fontWeight: 900, 
                                                fontSize: '1.8rem', 
                                                letterSpacing: '-0.01em', 
                                                marginBottom: '0.4rem',
                                                color: T.cream,
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            Start New Assessment
                                        </div>
                                        <p style={{ color: 'rgba(252, 250, 245, 0.8)', fontSize: '0.82rem', fontWeight: 500, lineHeight: 1.5, maxWidth: '460px' }}>
                                            Configure your perfect practice session. Choose subject, topic, difficulty, and language.
                                        </p>
                                    </div>
                                </div>
                            </MovingBorder>
                        </div>

                        {/* Daily Challenge */}
                        <Card 
                            hoverable 
                            style={{
                                backgroundColor: T.cream,
                                border: T.border,
                                boxShadow: T.shadow,
                            }}
                        >
                            <div className="relative p-7 h-full flex flex-col justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Trophy size={16} className="text-amber-500" />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.terracotta, fontFamily: T.fontMono }}>
                                            Daily Challenge
                                        </span>
                                    </div>
                                    <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.5rem', color: T.forest, letterSpacing: '-0.01em', marginBottom: '0.15rem' }}>
                                        Vector Geometry
                                    </h3>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.muted, fontFamily: T.fontMono }}>
                                        Class 10 • Mathematics
                                    </p>

                                    <div 
                                        className="mt-5 flex items-center gap-2.5 w-fit"
                                        style={{
                                            padding: '0.4rem 0.75rem',
                                            backgroundColor: T.yellow,
                                            border: '1.5px solid #1a3300',
                                            borderRadius: '8px',
                                            boxShadow: '2px 2px 0px rgba(26,51,0,0.12)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: T.forest, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: T.fontMono }}>Reward:</span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: T.forest }}>+50 Coins</span>
                                    </div>
                                </div>

                                <button
                                    onClick={startDailyChallenge}
                                    className="w-full py-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    style={{
                                        backgroundColor: T.terracotta,
                                        color: T.cream,
                                        border: `2px solid ${T.forest}`,
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        boxShadow: '3px 3px 0px #1a3300',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                >
                                    Accept Challenge <ArrowRight size={16} />
                                </button>
                            </div>
                        </Card>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                        {/* Recent Activity */}
                        <div 
                            className="lg:col-span-12 p-7 shadow-xl"
                            style={{
                                backgroundColor: T.white,
                                border: T.border,
                                borderRadius: T.radius,
                                boxShadow: T.shadow,
                            }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest }} className="flex items-center gap-2">
                                    <Activity size={20} className="text-[#cb5521]" /> Recent Activity
                                </h3>
                                <button 
                                    className="transition-colors"
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        color: T.muted,
                                        cursor: 'pointer',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = T.terracotta; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; }}
                                >
                                    View All
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                {history.length > 0 ? history.map((test) => {
                                    // Custom colors based on score
                                    let scoreColors = { bg: T.mint, text: T.forest };
                                    if (test.score >= 80) {
                                        scoreColors = { bg: T.mint, text: T.forest };
                                    } else if (test.score >= 50) {
                                        scoreColors = { bg: T.teal, text: T.forest };
                                    } else {
                                        scoreColors = { bg: T.blush, text: T.forest };
                                    }

                                    return (
                                        <div 
                                            key={test.id} 
                                            className="group flex items-center justify-between transition-all cursor-pointer"
                                            style={{
                                                padding: '1rem 1.25rem',
                                                backgroundColor: T.cream,
                                                border: '1.5px solid rgba(26,51,0,0.12)',
                                                borderRadius: '10px',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(26,51,0,0.06)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,51,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div 
                                                    className="w-12 h-12 flex items-center justify-center font-bold text-base"
                                                    style={{
                                                        borderRadius: '8px',
                                                        backgroundColor: scoreColors.bg,
                                                        border: '1.5px solid #1a3300',
                                                        color: scoreColors.text,
                                                        fontFamily: T.fontDisplay,
                                                        boxShadow: '2px 2px 0px #1a3300',
                                                    }}
                                                >
                                                    {test.score}%
                                                </div>
                                                <div>
                                                    <h4 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '0.9rem', color: T.forest }}>{test.subject}</h4>
                                                    <p style={{ fontSize: '0.72rem', color: T.muted, fontWeight: 500 }} className="mt-0.5">{test.topic} • {test.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span 
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        fontFamily: T.fontMono,
                                                        backgroundColor: test.difficulty === 'Hard' ? T.blush : test.difficulty === 'Medium' ? T.teal : T.mint,
                                                        color: T.forest,
                                                        padding: '0.25rem 0.55rem',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(26,51,0,0.15)',
                                                    }}
                                                >
                                                    {test.difficulty}
                                                </span>
                                                <button 
                                                    className="p-2 transition-colors"
                                                    style={{
                                                        borderRadius: '6px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        color: T.muted,
                                                        cursor: 'pointer',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = T.forest; e.currentTarget.style.backgroundColor = 'rgba(26,51,0,0.06)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                >
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div 
                                        className="p-8 text-center flex flex-col items-center gap-4 max-w-sm mx-auto"
                                        style={{
                                            backgroundColor: T.cream,
                                            border: T.border,
                                            borderRadius: T.radius,
                                            boxShadow: '4px 4px 0px rgba(26,51,0,0.08)'
                                        }}
                                    >
                                        <div 
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: T.yellow,
                                                border: T.border,
                                                color: T.forest,
                                                boxShadow: '2px 2px 0px #1a3300',
                                            }}
                                        >
                                            <Trophy size={22} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1rem', color: T.forest }}>No Test Attempts</h4>
                                            <p style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 500, lineHeight: 1.5, marginTop: '0.35rem' }}>
                                                Take AI-adaptive exams to analyze your syllabus readiness and build your career pathway roadmap.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsConfigModalOpen(true)}
                                            className="px-5 py-2.5 transition-all cursor-pointer"
                                            style={{
                                                backgroundColor: T.forest,
                                                color: T.cream,
                                                fontWeight: 800,
                                                fontSize: '0.72rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                border: T.border,
                                                borderRadius: '8px',
                                                boxShadow: '2px 2px 0px #1a3300',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                        >
                                            Begin First Assessment
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <MockTestConfigModal
                        isOpen={isConfigModalOpen}
                        onClose={() => setIsConfigModalOpen(false)}
                        onStart={startTest}
                        user={user}
                        preselectedSubject={null}
                    />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MockTestHub;
