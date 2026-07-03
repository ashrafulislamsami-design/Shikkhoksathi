import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import {
    LayoutDashboard,
    BookOpen,
    Briefcase,
    Trophy,
    TrendingUp,
    Clock,
    CheckCircle,
    Target,
    ChevronRight,
    Brain,
    Rocket,
    Map,
    Zap,
    Loader2,
    Sparkles,
    Bell,
    Users,
    User as UserIcon,
    Coins,
    Video,
    Youtube
} from 'lucide-react';
import MockTestConfigModal from './MockTestConfigModal';
import SmartLoader from './ui/SmartLoader';
import AlertModal from './ui/AlertModal';
import Leaderboard from './Leaderboard';
import StudentProfile from './StudentProfile';
import ProfileAvatar from './ProfileAvatar';
import PeerTutoring from './PeerTutoring';
import { SkillGapsTab, CareerPathwaysTab } from './CareerDashboardLogic';
import StudentSidebar from './StudentSidebar';

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

/* ─── SECTION HEADER ─── */
const SectionHeader = ({ tag, title, icon: Icon, iconBg }) => (
    <div className="flex justify-between items-center mb-5">
        <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.terracotta, fontFamily: T.fontMono }}>
                {tag}
            </p>
            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.05rem', color: T.forest, marginTop: '0.2rem', letterSpacing: '-0.01em' }}>
                {title}
            </h3>
        </div>
        {Icon && (
            <div style={{
                width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: iconBg || T.mint, border: T.border, color: T.forest,
            }}>
                <Icon size={20} />
            </div>
        )}
    </div>
);

/* ─── STAT PILL ─── */
const StatPill = ({ icon: Icon, label, value, accentColor, accentBg }) => (
    <Card hoverable style={{ padding: '1.25rem 1.5rem' }}>
        <div className="flex items-center gap-4">
            <div style={{
                width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: accentBg || T.yellow, border: T.border, color: accentColor || T.forest, flexShrink: 0,
            }}>
                <Icon size={22} />
            </div>
            <div>
                <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, fontFamily: T.fontMono, lineHeight: 1, marginBottom: '0.35rem' }}>
                    {label}
                </p>
                <p style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.5rem', color: T.forest, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {value}
                </p>
            </div>
        </div>
    </Card>
);

/* ─── STUDY STAT ROW ─── */
const StudyStatRow = ({ icon: Icon, label, value, iconBg }) => (
    <div className="flex items-center gap-3" style={{ padding: '0.8rem 0', borderBottom: '1px solid rgba(26,51,0,0.08)' }}>
        <div style={{
            width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: iconBg || T.mint, border: '1px solid rgba(26,51,0,0.15)', color: T.forest, flexShrink: 0,
        }}>
            <Icon size={16} />
        </div>
        <div className="flex-1">
            <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, fontFamily: T.fontMono }}>
                {label}
            </p>
        </div>
        <p style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '0.95rem', color: T.forest }}>
            {value}
        </p>
    </div>
);


const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* ── Quick Stats Skeletons ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div 
                    key={i} 
                    className="p-4 flex items-center gap-3"
                    style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #1a3300',
                        boxShadow: '4px 4px 0px rgba(26,51,0,0.12)',
                        borderRadius: '12px',
                        height: '68px'
                    }}
                >
                    <div className="w-9 h-9 rounded-lg bg-[#1a3300]/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-2 w-16 bg-[#1a3300]/10 rounded" />
                        <div className="h-4 w-24 bg-[#1a3300]/20 rounded" />
                    </div>
                </div>
            ))}
        </div>

        {/* ── Radar + Study Stats Skeletons ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Radar Card Skeleton */}
            <div 
                className="p-6"
                style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #1a3300',
                    boxShadow: '4px 4px 0px #1a3300',
                    borderRadius: '16px',
                    height: '380px'
                }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-[#1a3300]/10" />
                    <div className="space-y-2">
                        <div className="h-3 w-28 bg-[#1a3300]/20 rounded" />
                        <div className="h-2 w-36 bg-[#1a3300]/10 rounded" />
                    </div>
                </div>
                <div className="mx-auto w-48 h-48 rounded-full border-2 border-dashed border-[#1a3300]/20 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1a3300]/20" />
                </div>
            </div>

            {/* Study Time / Subject Skeletons */}
            <div 
                className="p-6"
                style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #1a3300',
                    boxShadow: '4px 4px 0px #1a3300',
                    borderRadius: '16px',
                    height: '380px'
                }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-[#1a3300]/10" />
                    <div className="space-y-2">
                        <div className="h-3 w-28 bg-[#1a3300]/20 rounded" />
                        <div className="h-2 w-36 bg-[#1a3300]/10 rounded" />
                    </div>
                </div>
                <div className="space-y-3.5">
                    {[1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className="p-4 flex items-center justify-between"
                            style={{
                                border: '2px solid #1a3300',
                                borderRadius: '12px',
                                height: '62px'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-md bg-[#1a3300]/10" />
                                <div className="h-3 w-24 bg-[#1a3300]/20 rounded" />
                            </div>
                            <div className="h-4 w-12 bg-[#1a3300]/10 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════
   MAIN STUDENT DASHBOARD COMPONENT
   ═══════════════════════════════════════════ */
const StudentDashboard = ({ user: propUser, onUserUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(propUser);
    const [activeTab, setActiveTab] = useState(() => {
        return location.state?.activeTab || 'overview';
    });
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState(null);
    const [careerData, setCareerData] = useState(null);
    const [gamificationData, setGamificationData] = useState(null);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSubject, setActiveSubject] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [videoRecs, setVideoRecs] = useState([]);
    const [videoRecsLoading, setVideoRecsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };

            const [perfRes, careerRes, gameRes] = await Promise.all([
                axios.get('http://localhost:5000/api/performance/dashboard', config),
                axios.get('http://localhost:5000/api/career/roadmaps', config),
                axios.get('http://localhost:5000/api/game/profile', config)
            ]);

            setPerformanceData(perfRes.data.data);
            setCareerData(careerRes.data.data);
            setGamificationData(gameRes.data.data);
            fetchNotifications();
            fetchVideoRecommendations();
        } catch (err) {
            console.error('Data fetch error:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCareerRoadmap = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            setLoading(true);
            const response = await axios.post('http://localhost:5000/api/career/roadmap', {}, config);
            if (response.data.success) {
                setCareerData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch career roadmap:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTest = async (config) => {
        setIsGenerating(true);
        setRetryCount(0);
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt <= MAX_RETRIES) {
            try {
                if (attempt > 0) {
                    setRetryCount(attempt);
                    console.log(`Generation incomplete. Retrying... (Attempt ${attempt}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                const requestConfig = {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                };

                const response = await axios.post('http://localhost:5000/api/tests/generate', {
                    testType: config.testType,
                    subject: config.subject,
                    classLevel: config.classLevel || config.targetClass,
                    language: config.language,
                    questionCount: config.questionCount,
                    questionType: config.questionType || 'mcq',
                    chapter: config.chapter || '1'
                }, requestConfig);

                if (response.data.success) {
                    const testId = response.data.test?._id || response.data.testId || response.data.data?.testId;
                    if (testId) {
                        navigate(`/test/${testId}`);
                        setIsGenerating(false);
                        return;
                    }
                }
            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
            }
            attempt++;
        }

        setIsGenerating(false);
        setAlertMessage('Assessment Engine is busy or the requested topic is currently unavailable. Please try a different subject.');
    };

    const fetchVideoRecommendations = useCallback(async () => {
        setVideoRecsLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const res = await axios.get('http://localhost:5000/api/performance/video-recommendations', config);
            if (res.data.success) {
                setVideoRecs(res.data.data);
            }
        } catch (err) {
            console.error('Fetch video recommendations error:', err);
        } finally {
            setVideoRecsLoading(false);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const res = await axios.get('http://localhost:5000/api/notifications', config);
            setNotifications(res.data.data);
        } catch (err) {
            console.error('Fetch notifications error:', err);
        }
    }, []);

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

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        }
    }, [propUser]);

    useEffect(() => {
        fetchData();
        fetchNotifications();
        const notificationInterval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(notificationInterval);
    }, [fetchData, fetchNotifications]);

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    const [generationAttempted, setGenerationAttempted] = useState(false);

    useEffect(() => {
        if (activeTab === 'career' && !careerData && !loading && !isGenerating && !generationAttempted) {
            setGenerationAttempted(true);
            fetchCareerRoadmap();
        }
    }, [activeTab, careerData, loading, isGenerating, generationAttempted]);



    /* ─── RADAR DATA ─── */
    const defaultSubjects = ['Mathematics', 'General Science', 'English', 'Bangla', 'ICT'];
    const radarData = defaultSubjects.map(sub => {
        const existing = performanceData?.subjectReadiness?.find(
            sr => sr.subject.toLowerCase() === sub.toLowerCase() ||
                  (sub === 'General Science' && sr.subject.toLowerCase() === 'science') ||
                  (sub === 'Mathematics' && sr.subject.toLowerCase() === 'math')
        );
        return {
            subject: sub,
            A: existing ? existing.readiness || existing.score : 20,
            fullMark: 100
        };
    });

    /* ─── TAB TITLE CONFIG ─── */
    const tabMeta = {
        overview: { title: `Welcome back, ${user?.name?.split(' ').pop()}!`, sub: 'Here is your AI-powered performance analysis.' },
        career: { title: 'Career Roadmaps', sub: 'Personalized pathways based on your performance and interests.' },
        tests: { title: 'Mock Tests', sub: 'Practice with AI-adaptive mock tests aligned to NCTB syllabus.' },
        game: { title: 'Hall of Champions', sub: 'Compete, earn, and unlock rewards through gamified learning.' },
        tutoring: { title: 'Peer Tutoring', sub: 'Connect with peers and expert tutors for personalized guidance.' },
        profile: { title: 'Your Profile', sub: 'Manage your account settings and preferences.' },
    };

    const currentMeta = tabMeta[activeTab] || tabMeta.overview;

    /* ─── SUBJECT CARD COLORS ─── */
    const subjectColors = {
        'Mathematics': { bg: T.yellow, icon: T.forest },
        'Bangla': { bg: T.mint, icon: T.forest },
        'English': { bg: T.teal, icon: T.forest },
        'Science': { bg: T.blush, icon: T.forest },
        'ICT': { bg: T.white, icon: T.terracotta, borderLeft: `4px solid ${T.terracotta}` },
    };

    return (
        <div className="flex h-screen overflow-hidden" style={{ fontFamily: T.fontBody, color: T.forest }}>
            {isGenerating && <SmartLoader isRetrying={retryCount > 0} retryCount={retryCount} />}
            <AlertModal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Assessment Engine" message={alertMessage} />

            {/* Sidebar */}
            <StudentSidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div
                className="flex-1 overflow-y-auto relative p-5 md:p-10 mt-14 md:mt-0"
                style={{
                    backgroundColor: T.cream,
                    backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255,233,92,0.15) 0%, transparent 50%)',
                    backgroundSize: '48px 48px, 48px 48px, 100% 100%',
                }}
            >
                {/* ─── PAGE HEADER ─── */}
                <div className="mb-8">
                    <h1 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: T.forest, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                        {currentMeta.title}
                    </h1>
                    <p style={{ color: T.muted, fontSize: '0.88rem', marginTop: '0.35rem' }}>
                        {currentMeta.sub}
                    </p>
                </div>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* ═══ OVERVIEW TAB ═══ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* ── Quick Stats ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatPill icon={Coins} label="Shiksha Coins" value={gamificationData?.shikshaCoins || 0} accentBg={T.yellow} />
                            <StatPill icon={Zap} label="Current Streak" value={`${gamificationData?.streak?.current || 0} Days`} accentBg={T.blush} accentColor={T.forest} />
                            <StatPill icon={TrendingUp} label="Lifetime Progress" value={`${gamificationData?.lifetimePoints || 0} XP`} accentBg={T.teal} />
                        </div>

                        {/* ── Radar + Study Stats ── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {/* Readiness Radar */}
                            <Card style={{ padding: '1.5rem' }}>
                                <SectionHeader tag="Readiness Radar" title="NCTB Syllabus Mastery" icon={Brain} iconBg={T.mint} />
                                <div style={{ height: 300, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#1a3300" opacity={0.15} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#1a3300', fontSize: 11, fontWeight: 700 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="Readiness"
                                                dataKey="A"
                                                stroke="#1a3300"
                                                strokeWidth={2}
                                                fill="#ffe95c"
                                                fillOpacity={0.55}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Study Statistics */}
                            <Card style={{ padding: '1.5rem' }}>
                                <SectionHeader tag="Study Statistics" title="Your Progress Summary" icon={CheckCircle} iconBg={T.teal} />
                                <div>
                                    <StudyStatRow
                                        icon={Clock}
                                        label="Total Study Time"
                                        value={`${Math.floor((performanceData?.studyStats?.totalStudyTime || 0) / 60)}h ${(performanceData?.studyStats?.totalStudyTime || 0) % 60}m`}
                                        iconBg={T.mint}
                                    />
                                    <StudyStatRow
                                        icon={CheckCircle}
                                        label="Average Accuracy"
                                        value={`${performanceData?.studyStats?.averageAccuracy || 0}%`}
                                        iconBg={T.yellow}
                                    />
                                    <StudyStatRow
                                        icon={Target}
                                        label="Tests Completed"
                                        value={performanceData?.studyStats?.testsCompleted || 0}
                                        iconBg={T.blush}
                                    />
                                </div>

                                {/* Quick Action */}
                                <button
                                    onClick={() => setActiveTab('tests')}
                                    className="w-full mt-5 flex items-center justify-center gap-2"
                                    style={{
                                        padding: '0.75rem', backgroundColor: T.forest, color: T.cream, border: `2px solid ${T.forest}`,
                                        borderRadius: 8, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                        boxShadow: '3px 3px 0px rgba(26,51,0,0.2)', transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(26,51,0,0.2)'; }}
                                >
                                    Take a Practice Test <ChevronRight size={16} />
                                </button>
                            </Card>
                        </div>

                        {/* ── Career Pathways + Predictions ── */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {/* Future Pathways */}
                            <Card style={{ padding: '1.5rem' }}>
                                <SectionHeader tag="Future Pathways" title="Career Recommendations" icon={Rocket} iconBg={T.mint} />
                                <div className="space-y-3">
                                    {(() => {
                                        let displayPaths = [];
                                        if (careerData && careerData.metrics) {
                                            displayPaths = [
                                                {
                                                    track: careerData.careerTitle,
                                                    match: careerData.metrics.matchScore || 'Match found',
                                                    desc: careerData.analysis?.split('.')[0] + '.' || 'Personalized career analysis.',
                                                    bg: T.mint,
                                                },
                                                {
                                                    track: 'Bridge Gap: ' + (careerData.skillGaps?.[0]?.name || 'Next Skill'),
                                                    match: 'Priority',
                                                    desc: 'Improve your profile to unlock higher tiers.',
                                                    bg: T.teal,
                                                }
                                            ];
                                        } else if (careerData && careerData.pathways && careerData.pathways.length > 0) {
                                            displayPaths = careerData.pathways.slice(0, 2).map((p, idx) => ({
                                                track: p.title || p.careerTitle,
                                                match: p.matchScore ? `${p.matchScore}% Match` : 'Recommended',
                                                desc: p.description || 'Pathway determined by aptitude.',
                                                duration: p.estimatedDuration || p.metrics?.estimatedDuration || '4 Years',
                                                bg: idx === 0 ? T.mint : T.teal,
                                            }));
                                        } else {
                                            displayPaths = [
                                                { track: 'Engineering', match: '92% Match', desc: 'Based on high Math & Physics scores.', bg: T.mint },
                                                { track: 'Software Tech', match: '88% Match', desc: 'NSDA-certified vocational paths.', bg: T.teal },
                                            ];
                                        }

                                        return displayPaths.map((path, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 cursor-pointer"
                                                style={{
                                                    padding: '1rem',
                                                    backgroundColor: T.cream,
                                                    border: '1px solid rgba(26,51,0,0.12)',
                                                    borderRadius: 10,
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onClick={() => setActiveTab('career')}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(26,51,0,0.1)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,51,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <div style={{
                                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: path.bg, border: '1px solid rgba(26,51,0,0.15)', color: T.forest, flexShrink: 0,
                                                }}>
                                                    <Map size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <p style={{ fontWeight: 800, color: T.forest, fontSize: '0.88rem' }}>{path.track}</p>
                                                        <span style={{
                                                            fontSize: '0.6rem', fontWeight: 800, color: T.terracotta,
                                                            textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: T.fontMono,
                                                            backgroundColor: 'rgba(203,85,33,0.08)', padding: '0.2rem 0.5rem', borderRadius: 4,
                                                        }}>
                                                            {path.match}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: T.muted, marginTop: '0.15rem' }}>{path.desc}</p>
                                                    {path.duration && (
                                                        <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(26,51,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem', fontFamily: T.fontMono }}>
                                                            ● {path.duration}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight size={16} style={{ color: 'rgba(26,51,0,0.25)', flexShrink: 0 }} />
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </Card>

                            {/* Board Exam Predictions */}
                            <Card style={{ padding: '1.5rem' }}>
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.terracotta, fontFamily: T.fontMono }}>
                                            Recommended for You
                                        </p>
                                        <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.05rem', color: T.forest, marginTop: '0.2rem' }}>
                                            2026 Board Exam Predictions
                                        </h3>
                                    </div>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.3rem 0.7rem', backgroundColor: T.yellow, border: T.border,
                                        borderRadius: 100, fontSize: '0.6rem', fontWeight: 800, color: T.forest,
                                        textTransform: 'uppercase', letterSpacing: '0.06em',
                                    }}>
                                        <Zap size={12} /> Active
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { subject: 'Mathematics', topic: 'Trigonometry', chance: '95% Probable' },
                                        { subject: 'Science', topic: 'Electricity', chance: '88% Probable' },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center"
                                            style={{
                                                padding: '1rem',
                                                backgroundColor: T.cream,
                                                border: '1px solid rgba(26,51,0,0.12)',
                                                borderRadius: 10,
                                            }}
                                        >
                                            <div>
                                                <p style={{ fontSize: '0.6rem', fontWeight: 800, color: T.terracotta, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: T.fontMono }}>
                                                    {item.subject}
                                                </p>
                                                <p style={{ fontWeight: 800, color: T.forest, fontSize: '0.9rem', marginTop: '0.15rem' }}>
                                                    {item.topic}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: 800, color: T.forest,
                                                backgroundColor: T.mint, padding: '0.3rem 0.6rem',
                                                borderRadius: 100, border: '1px solid rgba(26,51,0,0.12)',
                                            }}>
                                                {item.chance}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* ── YouTube Recommendations ── */}
                        <Card style={{ padding: '1.5rem' }}>
                            <SectionHeader tag="More Ways to Learn" title="AI-Curated YouTube Lessons for Weak Zones" icon={Youtube} iconBg="#fee2e2" />

                            {videoRecsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin" size={32} style={{ color: T.terracotta }} />
                                </div>
                            ) : videoRecs && videoRecs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {videoRecs.map((rec, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col justify-between"
                                            style={{
                                                padding: '1.25rem',
                                                backgroundColor: T.cream,
                                                border: '1px solid rgba(26,51,0,0.12)',
                                                borderRadius: 10,
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.boxShadow = '2px 2px 0px rgba(26,51,0,0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(26,51,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span style={{
                                                        fontSize: '0.55rem', fontWeight: 800, backgroundColor: 'rgba(26,51,0,0.06)',
                                                        color: T.forest, padding: '0.2rem 0.5rem', borderRadius: 4,
                                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: T.fontMono,
                                                    }}>
                                                        {rec.subject}
                                                    </span>
                                                    <Video size={14} style={{ color: 'rgba(26,51,0,0.25)' }} />
                                                </div>
                                                <h4 style={{ fontWeight: 800, color: T.forest, fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.4rem' }} className="line-clamp-2">
                                                    {rec.title}
                                                </h4>
                                                <p style={{ fontSize: '0.72rem', color: T.muted, fontStyle: 'italic', marginBottom: '0.8rem' }} className="line-clamp-2">
                                                    "{rec.reason}"
                                                </p>
                                            </div>
                                            <a
                                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.searchQuery)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2"
                                                style={{
                                                    width: '100%', padding: '0.65rem',
                                                    backgroundColor: T.terracotta, color: T.cream,
                                                    borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                                    textDecoration: 'none', border: `1.5px solid ${T.terracotta}`,
                                                    transition: 'all 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; }}
                                            >
                                                Watch Lesson <ChevronRight size={14} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10" style={{ backgroundColor: T.cream, borderRadius: 10, border: '1px dashed rgba(26,51,0,0.15)' }}>
                                    <Rocket size={36} style={{ color: 'rgba(26,51,0,0.12)', margin: '0 auto 0.75rem auto', display: 'block' }} />
                                    <p style={{ fontWeight: 700, color: T.forest, fontSize: '0.88rem' }}>Keep practicing!</p>
                                    <p style={{ color: T.muted, fontSize: '0.75rem', marginTop: '0.25rem' }}>Complete more tests to unlock personalized video recommendations.</p>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* ═══ TESTS TAB ═══ */}
                {activeTab === 'tests' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['Mathematics', 'Bangla', 'English', 'Science', 'ICT'].map(subject => {
                            const colors = subjectColors[subject] || { bg: T.white, icon: T.forest };
                            return (
                                <Card key={subject} hoverable style={{ padding: '1.5rem' }} color={subject === 'ICT' ? 'terracotta' : undefined}>
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: colors.bg, border: T.border, color: colors.icon, marginBottom: '1rem',
                                            }}>
                                                <Target size={22} />
                                            </div>
                                            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.15rem', color: T.forest, marginBottom: '0.4rem' }}>
                                                {subject}
                                            </h3>
                                            <p style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.5 }}>
                                                Adaptive test covering latest NCTB curriculum topics.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => { setActiveSubject(subject); setIsModalOpen(true); }}
                                            className="w-full flex items-center justify-center gap-2"
                                            style={{
                                                marginTop: '1.25rem', padding: '0.7rem',
                                                backgroundColor: T.forest, color: T.cream,
                                                border: `2px solid ${T.forest}`, borderRadius: 8,
                                                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                                boxShadow: '3px 3px 0px rgba(26,51,0,0.15)',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(26,51,0,0.15)'; }}
                                        >
                                            Start Assessment <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* ═══ CAREER TAB ═══ */}
                {activeTab === 'career' && (
                    <div className="space-y-6">
                        {careerData ? (
                            <div className="space-y-5">
                                {careerData.analysis && (
                                    <Card style={{ padding: '1.25rem' }} color="mint">
                                        <div className="flex items-start gap-3">
                                            <Sparkles size={16} style={{ color: T.terracotta, flexShrink: 0, marginTop: 2 }} />
                                            <p style={{ fontSize: '0.88rem', fontWeight: 500, color: T.forest, lineHeight: 1.6 }}>
                                                {careerData.analysis}
                                            </p>
                                        </div>
                                    </Card>
                                )}
                                <CareerPathwaysTab data={careerData} />
                                <SkillGapsTab skills={careerData.skillGaps} />
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Loader2 className="animate-spin mx-auto mb-4" size={36} style={{ color: T.terracotta }} />
                                <p style={{ fontWeight: 700, color: T.forest }}>Analyzing your potential...</p>
                                <p style={{ color: T.muted, fontSize: '0.78rem', marginTop: '0.3rem' }}>Generating personalized roadmap...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ GAME TAB ═══ */}
                {activeTab === 'game' && (
                    <div>
                        <Leaderboard />
                    </div>
                )}

                {/* ═══ TUTORING TAB ═══ */}
                {activeTab === 'tutoring' && (
                    <div className="space-y-6">
                        <PeerTutoring user={user} />
                    </div>
                )}

                {/* ═══ PROFILE TAB ═══ */}
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        <StudentProfile user={user} onProfileUpdate={(updatedUser) => {
                            setUser(updatedUser);
                            onUserUpdate?.(updatedUser);
                        }} />
                    </div>
                )}
                    </>
                )}
            </div>

            <MockTestConfigModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onStart={startTest}
                preselectedSubject={activeSubject}
                user={user}
            />
        </div>
    );
};

export default StudentDashboard;
