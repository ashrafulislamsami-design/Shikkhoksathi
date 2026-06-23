import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Users, ChevronRight, X, Clock,
    Bell, Video, Zap,
    TrendingUp, TrendingDown, Eye, Star
} from 'lucide-react';
import StudentSidebar from './StudentSidebar';
import { useMemo } from 'react';

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

const PeerTutoring = ({ user, hideSidebar = false }) => {
    const isTeacher = hideSidebar || user?.role === 'teacher' || localStorage.getItem('role') === 'teacher';
    const [tutors, setTutors] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        topic: '',
        description: '',
        strengths: '',
        weaknesses: '',
        preferredTime: '',
        recipientId: ''
    });
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Acceptance Modal State
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [acceptanceData, setAcceptanceData] = useState({
        sessionType: 'live',
        meetingLink: '',
        recordingLink: '',
        scheduledAt: ''
    });

    // Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Broadcast Confirmation State
    const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

    // Evaluation Modal State
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [evaluationSessionId, setEvaluationSessionId] = useState(null);
    const [evaluationData, setEvaluationData] = useState({ rating: 0, comment: '' });
    const [evaluationLoading, setEvaluationLoading] = useState(false);

    // Tutor Profile Modal State
    const [showTutorProfile, setShowTutorProfile] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [tutorFeedback, setTutorFeedback] = useState({ averageRating: null, totalReviews: 0, feedback: [] });
    const [tutorFeedbackLoading, setTutorFeedbackLoading] = useState(false);

    // Teacher Stats Calculation
    const stats = useMemo(() => {
        if (!isTeacher || !sessions) return null;
        const total = sessions.length;
        const rejected = sessions.filter(s => s.status === 'rejected').length;
        const accepted = sessions.filter(s => s.status === 'accepted' || s.status === 'completed').length;
        const ratio = total > 0 ? Math.round((accepted / total) * 100) : 0;
        return { total, rejected, accepted, ratio, isGood: ratio >= 50 };
    }, [sessions, isTeacher]);

    const fetchData = useCallback(async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const [tutorsRes, sessionsRes, notifRes] = await Promise.all([
                axios.get('http://localhost:5000/api/tutoring/tutors', config),
                axios.get('http://localhost:5000/api/tutoring/my-sessions', config),
                axios.get('http://localhost:5000/api/notifications', config)
            ]);

            setTutors(tutorsRes.data.data);
            setSessions(sessionsRes.data.data);
            setNotifications(notifRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.post('http://localhost:5000/api/tutoring/request', formData, config);
            setIsModalOpen(false);
            setFormData({
                topic: '',
                description: '',
                strengths: '',
                weaknesses: '',
                preferredTime: '',
                recipientId: ''
            });
            fetchData();
            alert('Tutoring request sent successfully!');
        } catch (error) {
            console.error('Error creating request:', error);
            alert('Failed to send request: ' + (error.response?.data?.message || error.message));
        }
    };

    const markAsRead = async (id) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, config);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const updateStatus = async (sessionId, status, extraData = {}) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.put(`http://localhost:5000/api/tutoring/request/${sessionId}`, { status, ...extraData }, config);
            fetchData();
            setShowAcceptModal(false);
            if (status === 'accepted') {
                alert('Session accepted successfully!');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Action failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAcceptClick = (sessionId) => {
        setSelectedSessionId(sessionId);
        setShowAcceptModal(true);
    };

    const handleAcceptanceSubmit = (e) => {
        e.preventDefault();
        updateStatus(selectedSessionId, 'accepted', acceptanceData);
    };

    const handleBroadcastClick = () => {
        setShowBroadcastConfirm(true);
    };

    const confirmBroadcast = () => {
        setShowBroadcastConfirm(false);
        setFormData({ ...formData, recipientId: '' });
        setIsModalOpen(true);
    };

    // Handle meeting link click - track in backend
    const handleMeetingLinkClick = async (sessionId, link) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.put(`http://localhost:5000/api/tutoring/request/${sessionId}/link-clicked`, {}, config);
            // Update local state
            setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, requesterLinkClicked: true } : s));
        } catch (error) {
            console.error('Error marking link clicked:', error);
        }
        // Open the link
        window.open(link, '_blank');
    };

    // Check if evaluation is allowed for a session (Student to Teacher only - One-Way)
    const canEvaluate = (session) => {
        const isRequester = session.requester._id === (user?.id || user?._id);
        const isPastScheduled = !session.scheduledAt || new Date() > new Date(session.scheduledAt);
        const hasClickedLink = session.requesterLinkClicked;

        // Only students (requesters) can evaluate - ONE-WAY flow
        // Must have clicked link AND past scheduled time AND not already evaluated
        if (isRequester) {
            return hasClickedLink && isPastScheduled && !session.requesterEvaluation?.rating;
        }

        // Teachers (recipients) cannot evaluate
        return false;
    };

    // Open evaluation modal
    const openEvaluationModal = (sessionId) => {
        setEvaluationSessionId(sessionId);
        setEvaluationData({ rating: 0, comment: '' });
        setShowEvaluationModal(true);
    };

    // Open tutor profile modal and fetch feedback
    const openTutorProfile = async (tutor) => {
        setSelectedTutor(tutor);
        setShowTutorProfile(true);
        setTutorFeedbackLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/tutoring/feedback/${tutor._id}`);
            if (response.data.success) {
                setTutorFeedback(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tutor feedback:', error);
            setTutorFeedback({ averageRating: null, totalReviews: 0, feedback: [] });
        }
        setTutorFeedbackLoading(false);
    };

    // Submit evaluation
    const submitEvaluation = async () => {
        if (evaluationData.rating < 1) {
            alert('Please select a rating');
            return;
        }
        setEvaluationLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.post(`http://localhost:5000/api/tutoring/request/${evaluationSessionId}/evaluate`, evaluationData, config);
            setShowEvaluationModal(false);
            fetchData();
            alert('Thank you for your feedback!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit evaluation');
        } finally {
            setEvaluationLoading(false);
        }
    };

    return (
        <div className={hideSidebar ? "w-full min-h-screen" : "flex h-screen overflow-hidden"} style={{ fontFamily: T.fontBody, color: T.forest }}>
            <style>{`
                .force-white {
                    color: #ffffff !important;
                }
                .force-cream {
                    color: #fcfaf5 !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(26, 51, 0, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(26, 51, 0, 0.4);
                }
            `}</style>
            {!hideSidebar && <StudentSidebar user={user} />}

            <div 
                className={hideSidebar ? "relative p-4 md:p-8 min-h-screen overflow-y-auto" : "flex-1 overflow-y-auto relative p-8 custom-scrollbar"}
                style={{
                    backgroundColor: T.cream,
                    backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255,233,92,0.15) 0%, transparent 50%)',
                    backgroundSize: '48px 48px, 48px 48px, 100% 100%',
                }}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10 relative">
                        <div>
                            <div className="flex items-center gap-3">
                                <Users className="text-[#cb5521] shrink-0" size={32} />
                                <div style={{ fontFamily: T.fontDisplay, fontSize: '2.5rem', fontWeight: 900, color: T.forest }} className="italic tracking-tight leading-none">
                                    Peer Tutoring
                                </div>
                            </div>
                            <p style={{ color: T.muted, fontWeight: 500, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Connect with mentors and master your subjects together.
                            </p>
                        </div>
                        <div className="flex gap-4 relative items-center self-end sm:self-auto">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-3.5 transition-all relative"
                                style={{
                                    backgroundColor: T.white,
                                    border: T.border,
                                    borderRadius: '10px',
                                    boxShadow: T.shadow,
                                    color: T.forest,
                                    cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = T.shadowHard; e.currentTarget.style.backgroundColor = T.yellow; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.backgroundColor = T.white; }}
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span 
                                        className="absolute top-[-4px] right-[-4px] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                                        style={{
                                            backgroundColor: T.terracotta,
                                            border: T.border,
                                        }}
                                    >
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div 
                                    className="absolute top-16 right-0 w-80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300"
                                    style={{
                                        backgroundColor: T.white,
                                        border: T.border,
                                        borderRadius: T.radius,
                                        boxShadow: T.shadowHard,
                                    }}
                                >
                                    <div 
                                        className="p-4 flex justify-between items-center"
                                        style={{
                                            borderBottom: T.border,
                                            backgroundColor: T.cream,
                                        }}
                                    >
                                        <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.forest }}>
                                            Notifications
                                        </span>
                                        <span 
                                            className="text-[9px] font-bold"
                                            style={{
                                                backgroundColor: T.mint,
                                                border: '1px solid rgba(26,51,0,0.15)',
                                                color: T.forest,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontFamily: T.fontMono,
                                            }}
                                        >
                                            {notifications.length} New
                                        </span>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? notifications.map(n => (
                                            <div
                                                key={n._id}
                                                onClick={() => markAsRead(n._id)}
                                                className="p-4 hover:bg-zinc-50 transition-all cursor-pointer group"
                                                style={{
                                                    borderBottom: '1px solid rgba(26,51,0,0.08)',
                                                }}
                                            >
                                                <p style={{ fontSize: '0.8rem', color: T.forest, fontWeight: 500, lineHeight: 1.4 }} className="group-hover:text-[#cb5521] transition-colors">{n.message}</p>
                                                <p style={{ fontSize: '0.65rem', color: T.muted, fontFamily: T.fontMono }} className="mt-1.5 font-bold uppercase tracking-wider">{new Date(n.createdAt).toLocaleTimeString()}</p>
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
                    </div>

                    {/* Teacher Stats Dashboard */}
                    {isTeacher && stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <Card 
                                hoverable
                                style={{
                                    padding: '1.75rem',
                                    backgroundColor: T.white,
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/20 to-transparent rounded-bl-full pointer-events-none" />
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }} className="mb-4">Total Requests</p>
                                <div className="flex items-end justify-between">
                                    <div style={{ fontFamily: T.fontDisplay, fontSize: '3rem', fontWeight: 900, color: T.forest }} className="italic leading-none">{stats.total}</div>
                                    <div 
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: T.teal,
                                            border: T.border,
                                            color: T.forest,
                                            boxShadow: '3px 3px 0px #1a3300',
                                        }}
                                    >
                                        <Bell size={22} />
                                    </div>
                                </div>
                            </Card>

                            <Card 
                                hoverable
                                style={{
                                    padding: '1.75rem',
                                    backgroundColor: T.white,
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-100/20 to-transparent rounded-bl-full pointer-events-none" />
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }} className="mb-4">Rejected/Deleted</p>
                                <div className="flex items-end justify-between">
                                    <div style={{ fontFamily: T.fontDisplay, fontSize: '3rem', fontWeight: 900, color: T.forest }} className="italic leading-none">{stats.rejected}</div>
                                    <div 
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: T.blush,
                                            border: T.border,
                                            color: T.forest,
                                            boxShadow: '3px 3px 0px #1a3300',
                                        }}
                                    >
                                        <X size={22} />
                                    </div>
                                </div>
                            </Card>

                            <Card 
                                hoverable
                                style={{
                                    padding: '1.75rem',
                                    backgroundColor: T.white,
                                    position: 'relative',
                                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/20 to-transparent rounded-bl-full pointer-events-none" />
                                <div className="flex items-center gap-2 mb-4">
                                    <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>Acceptance Ratio</p>
                                    <span 
                                        style={{
                                            fontSize: '0.6rem',
                                            fontWeight: 800,
                                            fontFamily: T.fontMono,
                                            textTransform: 'uppercase',
                                            backgroundColor: stats.isGood ? T.mint : T.blush,
                                            color: T.forest,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(26,51,0,0.15)',
                                        }}
                                    >
                                        {stats.isGood ? 'Good' : 'Needs Improvement'}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div style={{ fontFamily: T.fontDisplay, fontSize: '3rem', fontWeight: 900, color: T.forest }} className="italic leading-none">{stats.ratio}%</div>
                                    <div 
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: T.yellow,
                                            border: T.border,
                                            color: T.forest,
                                            boxShadow: '3px 3px 0px #1a3300',
                                        }}
                                    >
                                        {stats.isGood ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Content Sections */}
                    <div className="pb-20 space-y-12">
                        {/* Student: Available Mentors Section */}
                        {!isTeacher && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Users className="text-[#cb5521]" size={22} />
                                    <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="italic uppercase">
                                        Available Mentors
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {/* "Can't Decide" centerpiece card */}
                                    <Card
                                        style={{
                                            backgroundColor: T.yellow,
                                            padding: '1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'between',
                                            boxShadow: T.shadow,
                                            borderLeft: `4px solid ${T.terracotta}`,
                                        }}
                                        hoverable
                                    >
                                        <div className="flex-1">
                                            <div 
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 10,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: T.white,
                                                    border: T.border,
                                                    color: T.forest,
                                                    boxShadow: '2.5px 2.5px 0px #1a3300',
                                                    marginBottom: '1.25rem',
                                                }}
                                            >
                                                <Users size={24} />
                                            </div>
                                            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.15rem', color: T.forest }} className="mb-2">Can't Decide</div>
                                            <p style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 500, lineHeight: 1.5 }} className="mb-6">
                                                Can't find a specific tutor? Send your request to all available teachers and peer tutors in the ShikkhokSathi system.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleBroadcastClick}
                                            className="w-full py-3 transition-all cursor-pointer text-center font-bold"
                                            style={{
                                                backgroundColor: T.forest,
                                                color: T.cream,
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.08em',
                                                border: T.border,
                                                borderRadius: '8px',
                                                boxShadow: '2px 2px 0px #1a3300',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                        >
                                            Request All!
                                        </button>
                                    </Card>

                                    {/* Individual Tutor cards */}
                                    {tutors.map(tutor => (
                                        <Card
                                            key={tutor._id}
                                            style={{
                                                backgroundColor: T.white,
                                                padding: '1.5rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'between',
                                                boxShadow: T.shadow,
                                            }}
                                            hoverable
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div 
                                                        style={{
                                                            width: 52,
                                                            height: 52,
                                                            borderRadius: 12,
                                                            backgroundColor: T.mint,
                                                            border: T.border,
                                                            color: T.forest,
                                                            fontSize: '1.25rem',
                                                            fontWeight: 900,
                                                            fontFamily: T.fontDisplay,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '2px 2px 0px #1a3300',
                                                        }}
                                                        className="italic"
                                                    >
                                                        {tutor.name[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.05rem', color: T.forest }}>{tutor.name}</div>
                                                        <p style={{ fontSize: '0.62rem', color: T.muted, fontWeight: 700, fontFamily: T.fontMono }} className="uppercase tracking-wider mt-0.5">
                                                            {tutor.role} • {tutor.profile?.school || 'School'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-6">
                                                    <div style={{ fontSize: '0.62rem', color: T.muted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Subjects</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {tutor.profile?.strengths?.length > 0 ? tutor.profile.strengths.slice(0, 3).map((sub, i) => (
                                                            <span 
                                                                key={i} 
                                                                style={{
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 700,
                                                                    backgroundColor: i === 0 ? T.mint : i === 1 ? T.blush : T.teal,
                                                                    color: T.forest,
                                                                    border: '1.5px solid #1a3300',
                                                                    borderRadius: '6px',
                                                                    padding: '2px 6px',
                                                                }}
                                                            >
                                                                {sub}
                                                            </span>
                                                        )) : (
                                                            <span style={{ fontSize: '0.72rem', color: T.muted, fontStyle: 'italic' }}>Various subjects</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-auto">
                                                <button
                                                    onClick={() => openTutorProfile(tutor)}
                                                    className="flex-1 py-2.5 transition-all cursor-pointer font-bold text-center flex items-center justify-center gap-1.5"
                                                    style={{
                                                        backgroundColor: T.white,
                                                        color: T.forest,
                                                        fontSize: '0.68rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        border: T.border,
                                                        borderRadius: '8px',
                                                        boxShadow: '2px 2px 0px #1a3300',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                >
                                                    <Eye size={12} /> Profile
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, recipientId: tutor._id });
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="flex-1 py-2.5 transition-all cursor-pointer font-bold text-center flex items-center justify-center gap-1.5"
                                                    style={{
                                                        backgroundColor: T.teal,
                                                        color: T.forest,
                                                        fontSize: '0.68rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        border: T.border,
                                                        borderRadius: '8px',
                                                        boxShadow: '2px 2px 0px #1a3300',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.teal; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                >
                                                    Request <ChevronRight size={12} />
                                                </button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Shared: Session List Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Zap className="text-[#cb5521]" size={22} />
                                <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="italic uppercase">
                                    {isTeacher ? 'Incoming & Active Requests' : 'Your Tutoring Sessions'}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {(() => {
                                    const filteredSessions = isTeacher
                                        ? sessions.filter(s => s.status !== 'rejected')
                                        : sessions;

                                    return filteredSessions.length > 0 ? filteredSessions.map(session => {
                                        const isPending = session.status === 'pending';
                                        const isAccepted = session.status === 'accepted';
                                        const isCompleted = session.status === 'completed';
                                        const statusColor = isPending ? T.yellow : isAccepted ? T.teal : isCompleted ? T.mint : T.blush;

                                        return (
                                            <Card 
                                                key={session._id} 
                                                style={{
                                                    backgroundColor: T.white,
                                                    padding: '1.5rem',
                                                    boxShadow: T.shadow,
                                                    borderLeft: `5px solid ${statusColor}`,
                                                }}
                                            >
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                    <div className="flex items-center gap-5">
                                                        <div 
                                                            style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 12,
                                                                backgroundColor: statusColor,
                                                                border: T.border,
                                                                color: T.forest,
                                                                fontSize: '1.2rem',
                                                                fontWeight: 900,
                                                                fontFamily: T.fontDisplay,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                boxShadow: '2.5px 2.5px 0px #1a3300',
                                                            }}
                                                            className="italic shrink-0"
                                                        >
                                                            {session.topic[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <div style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.15rem', color: T.forest }}>{session.topic}</div>
                                                                <span 
                                                                    style={{
                                                                        fontSize: '0.58rem',
                                                                        fontWeight: 800,
                                                                        fontFamily: T.fontMono,
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.06em',
                                                                        backgroundColor: statusColor,
                                                                        color: T.forest,
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(26,51,0,0.2)',
                                                                    }}
                                                                >
                                                                    {session.status}
                                                                </span>
                                                            </div>
                                                            <p style={{ fontSize: '0.7rem', color: T.muted, fontFamily: T.fontMono, fontWeight: 700 }} className="uppercase mt-1.5">
                                                                {session.requester._id === (user?.id || user?._id) ? `Teacher: ${session.recipient?.name || 'Assigned'}` : `Student: ${session.requester.name}`}
                                                                {" • "}Requested {new Date(session.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                                                        {isTeacher && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(session);
                                                                    setShowDetailModal(true);
                                                                }}
                                                                className="px-4 py-2 transition-all cursor-pointer font-bold text-center flex items-center gap-1.5"
                                                                style={{
                                                                    backgroundColor: T.white,
                                                                    color: T.forest,
                                                                    fontSize: '0.68rem',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.06em',
                                                                    border: T.border,
                                                                    borderRadius: '8px',
                                                                    boxShadow: '2px 2px 0px #1a3300',
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                            >
                                                                <Eye size={12} /> Details
                                                            </button>
                                                        )}
                                                        
                                                        {session.status === 'pending' && (session.recipient?._id === (user?.id || user?._id) || !session.recipient) && session.requester._id !== (user?.id || user?._id) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptClick(session._id)}
                                                                    className="px-4 py-2 transition-all cursor-pointer font-bold text-center"
                                                                    style={{
                                                                        backgroundColor: T.mint,
                                                                        color: T.forest,
                                                                        fontSize: '0.68rem',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.06em',
                                                                        border: T.border,
                                                                        borderRadius: '8px',
                                                                        boxShadow: '2px 2px 0px #1a3300',
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.mint; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => updateStatus(session._id, 'rejected')}
                                                                    className="px-4 py-2 transition-all cursor-pointer font-bold text-center"
                                                                    style={{
                                                                        backgroundColor: T.white,
                                                                        color: T.terracotta,
                                                                        fontSize: '0.68rem',
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.06em',
                                                                        border: T.border,
                                                                        borderRadius: '8px',
                                                                        boxShadow: '2px 2px 0px #1a3300',
                                                                    }}
                                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.blush; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.color = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {session.status === 'accepted' && session.requester._id === (user?.id || user?._id) && (
                                                            <button
                                                                onClick={() => updateStatus(session._id, 'completed')}
                                                                className="px-5 py-2 transition-all cursor-pointer font-bold text-center"
                                                                style={{
                                                                    backgroundColor: T.yellow,
                                                                    color: T.forest,
                                                                    fontSize: '0.72rem',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.08em',
                                                                    border: T.border,
                                                                    borderRadius: '8px',
                                                                    boxShadow: '2.5px 2.5px 0px #1a3300',
                                                                }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-1.5px,-1.5px)'; e.currentTarget.style.boxShadow = '3.5px 3.5px 0px #1a3300'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #1a3300'; }}
                                                            >
                                                                Mark Completed
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {session.status === 'accepted' && (
                                                    <div 
                                                        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 p-4"
                                                        style={{
                                                            backgroundColor: T.cream,
                                                            border: T.border,
                                                            borderRadius: T.radius,
                                                        }}
                                                    >
                                                        <div className="flex flex-col gap-1">
                                                            <span style={{ fontFamily: T.fontMono, fontSize: '0.6rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest">Scheduled At</span>
                                                            <div style={{ color: T.forest, fontWeight: 700, fontSize: '0.8rem' }} className="flex items-center gap-2">
                                                                <Clock size={14} style={{ color: T.terracotta }} />
                                                                {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled'}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span style={{ fontFamily: T.fontMono, fontSize: '0.6rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest">
                                                                {session.sessionType === 'recorded' ? 'Google Drive Link' : 'Meeting Link'}
                                                            </span>
                                                            {session.sessionType === 'recorded' ? (
                                                                session.recordingLink ? (
                                                                    <button
                                                                        onClick={() => handleMeetingLinkClick(session._id, session.recordingLink)}
                                                                        className="flex items-center gap-1.5 hover:underline font-bold text-left bg-transparent border-none cursor-pointer p-0"
                                                                        style={{ color: T.terracotta, fontSize: '0.8rem' }}
                                                                    >
                                                                        <Video size={14} /> View Recording
                                                                    </button>
                                                                ) : <span style={{ color: T.muted, fontStyle: 'italic', fontSize: '0.75rem' }}>Not provided</span>
                                                            ) : (
                                                                session.meetingLink ? (
                                                                    <button
                                                                        onClick={() => handleMeetingLinkClick(session._id, session.meetingLink)}
                                                                        className="flex items-center gap-1.5 hover:underline font-bold text-left bg-transparent border-none cursor-pointer p-0"
                                                                        style={{ color: T.terracotta, fontSize: '0.8rem' }}
                                                                    >
                                                                        <Video size={14} /> Join Session
                                                                    </button>
                                                                ) : <span style={{ color: T.muted, fontStyle: 'italic', fontSize: '0.75rem' }}>Not provided</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span style={{ fontFamily: T.fontMono, fontSize: '0.6rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest">Type</span>
                                                            <div style={{ color: T.forest, fontWeight: 800, fontSize: '0.75rem' }} className="flex items-center gap-1.5 uppercase">
                                                                <Zap size={12} style={{ color: T.yellow }} />
                                                                {session.sessionType?.replace('_', ' ') || 'Direct'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {session.status === 'accepted' && canEvaluate(session) && (
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={() => openEvaluationModal(session._id)}
                                                            className="px-4 py-2 transition-all cursor-pointer font-bold text-center flex items-center gap-1.5"
                                                            style={{
                                                                backgroundColor: T.yellow,
                                                                color: T.forest,
                                                                fontSize: '0.68rem',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.06em',
                                                                border: T.border,
                                                                borderRadius: '8px',
                                                                boxShadow: '2px 2px 0px #1a3300',
                                                            }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                                                        >
                                                            <Star size={12} /> Rate Session
                                                        </button>
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    }) : (
                                        <div 
                                            className="p-10 text-center flex flex-col items-center gap-6 max-w-lg mx-auto mt-8 relative overflow-hidden"
                                            style={{
                                                backgroundColor: T.white,
                                                border: '2px dashed rgba(26,51,0,0.25)',
                                                borderRadius: T.radius,
                                                boxShadow: T.shadow,
                                                backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,233,92,0.06) 0%, transparent 40%)',
                                            }}
                                        >


                                            <div 
                                                style={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 14,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: T.yellow,
                                                    border: T.border,
                                                    color: T.forest,
                                                    boxShadow: '3px 3px 0px #1a3300',
                                                }}
                                            >
                                                <Users size={28} />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="italic tracking-tight">
                                                    {isTeacher ? 'Waiting for Student Requests' : 'Start Learning Together'}
                                                </div>
                                                <p style={{ fontSize: '0.82rem', color: T.muted, fontWeight: 500, lineHeight: 1.6, maxWidth: '350px', margin: '0 auto' }}>
                                                    {isTeacher 
                                                        ? 'No student requests are currently pending. Keep this screen open to pick up real-time mentoring and class study requests.' 
                                                        : 'Struggling with math, science or grammar? Connect with peer mentors or certified teachers for collaborative learning sessions.'}
                                                </p>
                                            </div>
                                            {!isTeacher && (
                                                <button
                                                    onClick={handleBroadcastClick}
                                                    className="px-6 py-3 transition-all cursor-pointer font-bold mt-2"
                                                    style={{
                                                        backgroundColor: T.forest,
                                                        color: T.cream,
                                                        fontSize: '0.72rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                        border: T.border,
                                                        borderRadius: '8px',
                                                        boxShadow: '3px 3px 0px #1a3300',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-1.5px,-1.5px)'; e.currentTarget.style.boxShadow = '4.5px 4.5px 0px #1a3300'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                                >
                                                    Request Mentorship Now
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-xl p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '8px 8px 0px #1a3300',
                        }}
                    >
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="absolute top-5 right-5 transition-transform hover:scale-105"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: T.border,
                                backgroundColor: T.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.forest,
                                boxShadow: '1.5px 1.5px 0px #1a3300',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.5rem', color: T.forest }} className="mb-6 italic uppercase">
                            Request Mentorship
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Subject (e.g. Mathematics, Physics)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Which subject do you need help with?"
                                    className="w-full focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: T.cream,
                                        border: T.border,
                                        borderRadius: '8px',
                                        padding: '0.85rem 1.25rem',
                                        color: T.forest,
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                    }}
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">What are your Strong Zones?</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Algebra, Trigonometry, Logic"
                                    className="w-full focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: T.cream,
                                        border: T.border,
                                        borderRadius: '8px',
                                        padding: '0.85rem 1.25rem',
                                        color: T.forest,
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                    }}
                                    value={formData.strengths}
                                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">What do you need help with? (Weak Zones)</label>
                                <textarea
                                    required
                                    placeholder="Describe specific concepts you find difficult"
                                    rows="3"
                                    className="w-full focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: T.cream,
                                        border: T.border,
                                        borderRadius: '8px',
                                        padding: '0.85rem 1.25rem',
                                        color: T.forest,
                                        fontWeight: '500',
                                        fontSize: '0.85rem',
                                        resize: 'none',
                                    }}
                                    value={formData.weaknesses}
                                    onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Preferred Time (e.g. 10:30 AM)</label>
                                <input
                                    type="text"
                                    required
                                    pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$"
                                    placeholder="10:00 AM"
                                    className="w-full focus:outline-none transition-all"
                                    style={{
                                        backgroundColor: T.cream,
                                        border: T.border,
                                        borderRadius: '8px',
                                        padding: '0.85rem 1.25rem',
                                        color: T.forest,
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                    }}
                                    value={formData.preferredTime}
                                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                                />
                                <p style={{ fontSize: '0.62rem', color: T.muted, fontStyle: 'italic', fontWeight: 'bold' }} className="mt-1 ml-1">Must be in format like 04:00 PM or 9:30 AM</p>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-4 transition-all cursor-pointer font-bold"
                                style={{
                                    backgroundColor: T.yellow,
                                    color: T.forest,
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    border: T.border,
                                    borderRadius: '8px',
                                    boxShadow: '4px 4px 0px #1a3300',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                            >
                                {formData.recipientId ? 'Send Request to Mentor' : 'Send Broadcast Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showAcceptModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setShowAcceptModal(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-lg p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '8px 8px 0px #1a3300',
                        }}
                    >
                        <button 
                            onClick={() => setShowAcceptModal(false)} 
                            className="absolute top-5 right-5 transition-transform hover:scale-105"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: T.border,
                                backgroundColor: T.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.forest,
                                boxShadow: '1.5px 1.5px 0px #1a3300',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="mb-6 italic uppercase">
                            Accept Session
                        </div>
                        <form onSubmit={handleAcceptanceSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Session Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAcceptanceData({ ...acceptanceData, sessionType: 'live' })}
                                        className="py-3 transition-all cursor-pointer font-bold"
                                        style={{
                                            backgroundColor: acceptanceData.sessionType === 'live' ? T.teal : T.white,
                                            color: T.forest,
                                            fontSize: '0.75rem',
                                            border: T.border,
                                            borderRadius: '8px',
                                            boxShadow: acceptanceData.sessionType === 'live' ? '3px 3px 0px #1a3300' : '1.5px 1.5px 0px #1a3300',
                                            transform: acceptanceData.sessionType === 'live' ? 'translate(-1.5px, -1.5px)' : 'none',
                                        }}
                                    >
                                        Live Session
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAcceptanceData({ ...acceptanceData, sessionType: 'recorded' })}
                                        className="py-3 transition-all cursor-pointer font-bold"
                                        style={{
                                            backgroundColor: acceptanceData.sessionType === 'recorded' ? T.teal : T.white,
                                            color: T.forest,
                                            fontSize: '0.75rem',
                                            border: T.border,
                                            borderRadius: '8px',
                                            boxShadow: acceptanceData.sessionType === 'recorded' ? '3px 3px 0px #1a3300' : '1.5px 1.5px 0px #1a3300',
                                            transform: acceptanceData.sessionType === 'recorded' ? 'translate(-1.5px, -1.5px)' : 'none',
                                        }}
                                    >
                                        Recorded
                                    </button>
                                </div>
                            </div>

                            {acceptanceData.sessionType === 'live' ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Google Meet Link</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://meet.google.com/..."
                                            className="w-full focus:outline-none transition-all"
                                            style={{
                                                backgroundColor: T.cream,
                                                border: T.border,
                                                borderRadius: '8px',
                                                padding: '0.85rem 1.25rem',
                                                color: T.forest,
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                            }}
                                            value={acceptanceData.meetingLink}
                                            onChange={(e) => setAcceptanceData({ ...acceptanceData, meetingLink: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Scheduled Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full focus:outline-none transition-all"
                                            style={{
                                                backgroundColor: T.cream,
                                                border: T.border,
                                                borderRadius: '8px',
                                                padding: '0.85rem 1.25rem',
                                                color: T.forest,
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                            }}
                                            value={acceptanceData.scheduledAt}
                                            onChange={(e) => setAcceptanceData({ ...acceptanceData, scheduledAt: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-1.5">
                                    <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Google Drive Link</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://drive.google.com/..."
                                        className="w-full focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: T.cream,
                                            border: T.border,
                                            borderRadius: '8px',
                                            padding: '0.85rem 1.25rem',
                                            color: T.forest,
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                        }}
                                        value={acceptanceData.recordingLink}
                                        onChange={(e) => setAcceptanceData({ ...acceptanceData, recordingLink: e.target.value })}
                                    />
                                </div>
                            )}
                            <button 
                                type="submit" 
                                className="w-full py-4 transition-all cursor-pointer font-bold"
                                style={{
                                    backgroundColor: T.yellow,
                                    color: T.forest,
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    border: T.border,
                                    borderRadius: '8px',
                                    boxShadow: '4px 4px 0px #1a3300',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                            >
                                Confirm Acceptance
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setShowDetailModal(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '8px 8px 0px #1a3300',
                        }}
                    >
                        <button 
                            onClick={() => setShowDetailModal(false)} 
                            className="absolute top-5 right-5 transition-transform hover:scale-105"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: T.border,
                                backgroundColor: T.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.forest,
                                boxShadow: '1.5px 1.5px 0px #1a3300',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-5 mb-8">
                            <div 
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 14,
                                    backgroundColor: T.mint,
                                    border: T.border,
                                    color: T.forest,
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    fontFamily: T.fontDisplay,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '2.5px 2.5px 0px #1a3300',
                                }}
                                className="italic"
                            >
                                {selectedRequest.requester.name[0]}
                            </div>
                            <div>
                                <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.6rem', color: T.forest }} className="italic tracking-tight">{selectedRequest.requester.name}</div>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mt-0.5">
                                    Class {selectedRequest.requester.studentClass || 'N/A'} • {selectedRequest.requester.stream || 'General'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <h4 style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-[#cb5521]" /> Request Strengths
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedRequest.strengths ? (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: T.mint, color: T.forest, border: '1.5px solid #1a3300', borderRadius: '6px', padding: '3px 8px' }} className="uppercase">{selectedRequest.strengths}</span>
                                    ) : (
                                        selectedRequest.requester.profile?.strengths?.length > 0 ? selectedRequest.requester.profile.strengths.map((s, i) => (
                                            <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: T.mint, color: T.forest, border: '1.5px solid #1a3300', borderRadius: '6px', padding: '3px 8px' }} className="uppercase">{s}</span>
                                        )) : <span style={{ color: T.muted, fontStyle: 'italic', fontSize: '0.75rem' }}>No data provided</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest flex items-center gap-1.5">
                                    <TrendingDown size={12} className="text-[#cb5521]" /> Request Weaknesses
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedRequest.weaknesses ? (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: T.blush, color: T.forest, border: '1.5px solid #1a3300', borderRadius: '6px', padding: '3px 8px' }} className="uppercase">{selectedRequest.weaknesses}</span>
                                    ) : (
                                        selectedRequest.requester.profile?.weaknesses?.length > 0 ? selectedRequest.requester.profile.weaknesses.map((w, i) => (
                                            <span key={i} style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: T.blush, color: T.forest, border: '1.5px solid #1a3300', borderRadius: '6px', padding: '3px 8px' }} className="uppercase">{w}</span>
                                        )) : <span style={{ color: T.muted, fontStyle: 'italic', fontSize: '0.75rem' }}>No data provided</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div 
                            className="p-5 space-y-4"
                            style={{
                                backgroundColor: T.cream,
                                border: T.border,
                                borderRadius: T.radius,
                            }}
                        >
                            <div>
                                <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-1">Subject / Topic</div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: T.forest }}>{selectedRequest.topic}</p>
                            </div>
                            <div>
                                <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-1">Description</div>
                                <p style={{ fontSize: '0.85rem', color: T.forest, fontWeight: 500, lineHeight: 1.5 }} className="leading-relaxed">{selectedRequest.description}</p>
                            </div>
                            <div 
                                className="flex justify-between items-center pt-3"
                                style={{ borderTop: '1px dashed rgba(26,51,0,0.15)' }}
                            >
                                <div>
                                    <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-0.5">Preferred Time</div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: T.forest }}>{selectedRequest.preferredTime}</p>
                                </div>
                                <div className="text-right">
                                    <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-0.5">Request Date</div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: T.forest }}>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBroadcastConfirm && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setShowBroadcastConfirm(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-md p-8 text-center"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '6px 6px 0px #1a3300',
                        }}
                    >
                        <div 
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 14,
                                backgroundColor: T.yellow,
                                border: T.border,
                                color: T.forest,
                                boxShadow: '2.5px 2.5px 0px #1a3300',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                            }}
                        >
                            <Zap size={32} />
                        </div>
                        <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="mb-3 italic uppercase">
                            Request All?
                        </div>
                        <p style={{ fontSize: '0.85rem', color: T.muted, fontWeight: 500, lineHeight: 1.5 }} className="mb-8 leading-relaxed">
                            Do you want to request all mentors? This will send your request notification to every available teacher and peer tutor in ShikkhokSathi.
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={confirmBroadcast}
                                className="py-3 transition-all cursor-pointer font-bold text-center"
                                style={{
                                    backgroundColor: T.teal,
                                    color: T.forest,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    border: T.border,
                                    borderRadius: '8px',
                                    boxShadow: '2px 2px 0px #1a3300',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.teal; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowBroadcastConfirm(false)}
                                className="py-3 transition-all cursor-pointer font-bold text-center"
                                style={{
                                    backgroundColor: T.white,
                                    color: T.forest,
                                    fontSize: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    border: T.border,
                                    borderRadius: '8px',
                                    boxShadow: '2px 2px 0px #1a3300',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.cream; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaluationModal && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setShowEvaluationModal(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-md p-8"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '8px 8px 0px #1a3300',
                        }}
                    >
                        <button 
                            onClick={() => setShowEvaluationModal(false)} 
                            className="absolute top-5 right-5 transition-transform hover:scale-105"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: T.border,
                                backgroundColor: T.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.forest,
                                boxShadow: '1.5px 1.5px 0px #1a3300',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center mb-6">
                            <div 
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    backgroundColor: T.yellow,
                                    border: T.border,
                                    color: T.forest,
                                    boxShadow: '2.5px 2.5px 0px #1a3300',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1rem auto',
                                }}
                            >
                                <Star size={28} />
                            </div>
                            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }} className="italic uppercase">
                                Rate This Session
                            </div>
                            <p style={{ fontSize: '0.8rem', color: T.muted, fontWeight: 500 }} className="mt-1">
                                Your feedback helps improve the tutoring experience.
                            </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setEvaluationData({ ...evaluationData, rating: star })}
                                    className="p-1 transition-transform hover:scale-110 cursor-pointer bg-transparent border-none"
                                    style={{
                                        color: evaluationData.rating >= star ? T.terracotta : 'rgba(26,51,0,0.2)',
                                    }}
                                >
                                    <Star size={28} fill={evaluationData.rating >= star ? T.terracotta : 'none'} />
                                </button>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <div className="mb-6">
                            <label style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1 mb-2">Your Feedback (Optional)</label>
                            <textarea
                                value={evaluationData.comment}
                                onChange={(e) => setEvaluationData({ ...evaluationData, comment: e.target.value })}
                                placeholder="Share your learning experience..."
                                rows="3"
                                className="w-full focus:outline-none transition-all"
                                style={{
                                    backgroundColor: T.cream,
                                    border: T.border,
                                    borderRadius: '8px',
                                    padding: '0.85rem 1.25rem',
                                    color: T.forest,
                                    fontWeight: '500',
                                    fontSize: '0.85rem',
                                    resize: 'none',
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={submitEvaluation}
                            disabled={evaluationLoading || evaluationData.rating < 1}
                            className="w-full py-4 transition-all cursor-pointer font-bold"
                            style={{
                                backgroundColor: T.yellow,
                                color: T.forest,
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: T.border,
                                borderRadius: '8px',
                                boxShadow: '4px 4px 0px #1a3300',
                                opacity: (evaluationLoading || evaluationData.rating < 1) ? 0.5 : 1,
                                cursor: (evaluationLoading || evaluationData.rating < 1) ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => { if (!evaluationLoading && evaluationData.rating >= 1) { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                        >
                            {evaluationLoading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tutor Profile Modal */}
            {showTutorProfile && selectedTutor && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 backdrop-blur-sm" 
                        style={{ backgroundColor: 'rgba(26,51,0,0.15)' }}
                        onClick={() => setShowTutorProfile(false)}
                    ></div>
                    <div 
                        className="relative w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh] custom-scrollbar"
                        style={{
                            backgroundColor: T.white,
                            border: '2.5px solid #1a3300',
                            borderRadius: '16px',
                            boxShadow: '8px 8px 0px #1a3300',
                        }}
                    >
                        <button 
                            onClick={() => setShowTutorProfile(false)} 
                            className="absolute top-5 right-5 transition-transform hover:scale-105"
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                border: T.border,
                                backgroundColor: T.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: T.forest,
                                boxShadow: '1.5px 1.5px 0px #1a3300',
                                cursor: 'pointer',
                                zIndex: 10,
                            }}
                        >
                            <X size={16} />
                        </button>

                        {/* Tutor Header */}
                        <div className="flex items-center gap-5 mb-6">
                            <div 
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 14,
                                    backgroundColor: T.mint,
                                    border: T.border,
                                    color: T.forest,
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    fontFamily: T.fontDisplay,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '2.5px 2.5px 0px #1a3300',
                                }}
                                className="italic"
                            >
                                {selectedTutor.name?.[0] || '?'}
                            </div>
                            <div>
                                <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.6rem', color: T.forest }} className="italic tracking-tight">{selectedTutor.name}</div>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mt-0.5">
                                    {selectedTutor.role} • {selectedTutor.profile?.school || 'School'}
                                </p>
                            </div>
                        </div>

                        {/* Expertise */}
                        <div className="mb-6">
                            <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-2">Expertise / Strengths</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedTutor.profile?.strengths?.length > 0 ? (
                                    selectedTutor.profile.strengths.map((s, i) => (
                                        <span 
                                            key={i} 
                                            style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                backgroundColor: i % 3 === 0 ? T.mint : i % 3 === 1 ? T.blush : T.teal,
                                                color: T.forest,
                                                border: '1.5px solid #1a3300',
                                                borderRadius: '6px',
                                                padding: '3px 8px',
                                            }}
                                            className="uppercase"
                                        >
                                            {s}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ color: T.muted, fontStyle: 'italic', fontSize: '0.75rem' }}>Various Subjects</span>
                                )}
                            </div>
                        </div>

                        {/* Ratings Section */}
                        <div 
                            className="p-5 mb-6"
                            style={{
                                backgroundColor: T.cream,
                                border: T.border,
                                borderRadius: T.radius,
                            }}
                        >
                            <div style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest mb-4">Student Reviews</div>

                            {tutorFeedbackLoading ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-2">
                                    <div className="w-8 h-8 border-2 border-dashed border-forest rounded-full animate-spin"></div>
                                    <span style={{ fontFamily: T.fontMono, fontSize: '0.65rem', color: T.muted }} className="uppercase font-bold">Fetching evaluations...</span>
                                </div>
                            ) : tutorFeedback.totalReviews === 0 ? (
                                <div className="text-center py-6">
                                    <Star className="mx-auto text-[#1a3300]/20 mb-2" size={32} />
                                    <div style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '0.95rem', color: T.forest }}>No reviews yet</div>
                                    <p style={{ color: T.muted, fontSize: '0.72rem', marginTop: '0.25rem' }}>Be the first to collaborate and rate this mentor!</p>
                                </div>
                            ) : (
                                <>
                                    {/* Average Rating Banner */}
                                    <div 
                                        className="flex items-center justify-between mb-4 p-3.5"
                                        style={{
                                            backgroundColor: T.white,
                                            border: T.border,
                                            borderRadius: '10px',
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star 
                                                        key={star} 
                                                        size={16} 
                                                        className="transition-colors"
                                                        style={{
                                                            color: tutorFeedback.averageRating >= star ? T.terracotta : 'rgba(26,51,0,0.15)',
                                                        }}
                                                        fill={tutorFeedback.averageRating >= star ? T.terracotta : 'none'} 
                                                    />
                                                ))}
                                            </div>
                                            <span style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest }}>{tutorFeedback.averageRating}</span>
                                        </div>
                                        <span style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, color: T.muted }} className="uppercase">
                                            {tutorFeedback.totalReviews} review{tutorFeedback.totalReviews !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {/* Feedback List */}
                                    <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                        {tutorFeedback.feedback.map((fb, idx) => (
                                            <div 
                                                key={idx} 
                                                className="p-3.5"
                                                style={{
                                                    backgroundColor: T.white,
                                                    border: '1.5px solid rgba(26,51,0,0.12)',
                                                    borderRadius: '8px',
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                borderRadius: '50%',
                                                                backgroundColor: T.blush,
                                                                border: '1px solid #1a3300',
                                                                color: T.forest,
                                                                fontSize: '0.65rem',
                                                                fontWeight: 900,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            S
                                                        </div>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: T.forest }}>Anonymous Student</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star 
                                                                key={star} 
                                                                size={10} 
                                                                style={{
                                                                    color: fb.rating >= star ? T.terracotta : 'rgba(26,51,0,0.15)',
                                                                }} 
                                                                fill={fb.rating >= star ? T.terracotta : 'none'} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {fb.comment && <p style={{ color: T.forest, fontSize: '0.78rem', lineHeight: 1.4 }} className="mb-2 font-medium">{fb.comment}</p>}
                                                <div 
                                                    style={{ fontFamily: T.fontMono, fontSize: '0.58rem', color: T.muted }} 
                                                    className="flex justify-between font-bold uppercase tracking-wider"
                                                >
                                                    <span>Topic: {fb.topic}</span>
                                                    <span>{new Date(fb.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Request Button */}
                        <button
                            onClick={() => {
                                setShowTutorProfile(false);
                                setFormData({ ...formData, recipientId: selectedTutor._id });
                                setIsModalOpen(true);
                            }}
                            className="w-full py-4 transition-all cursor-pointer font-bold"
                            style={{
                                backgroundColor: T.yellow,
                                color: T.forest,
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: T.border,
                                borderRadius: '8px',
                                boxShadow: '4px 4px 0px #1a3300',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.color = T.cream; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.yellow; e.currentTarget.style.color = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                        >
                            Request Mentorship
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerTutoring;
