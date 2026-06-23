import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    AlertCircle,
    UserCheck,
    ClipboardList,
    TrendingUp,
    RefreshCw,
    ChevronRight,
    Layout,
    Bell,
    MoreVertical,
    Trash2,
    Edit2,
    AlertTriangle,
    TrendingDown,
    Search
} from 'lucide-react';

const mockPerformance = [
    { studentId: '1', result: 'incorrect' },
    { studentId: '2', result: 'incorrect' },
    { studentId: '3', result: 'incorrect' },
    { studentId: '4', result: 'correct' },
    { studentId: '5', result: 'incorrect' },
    { studentId: '6', result: 'incorrect' },
];

const curriculumTopics = [
    { name: 'Bangla Grammar', mastery: [85, 30, 92, 45, 88, 95], trend: 'up' },
    { name: 'Mathematics (Fractions)', mastery: [40, 20, 35, 10, 45, 30], trend: 'down' },
    { name: 'English Composition', mastery: [65, 70, 55, 75, 60, 80], trend: 'stable' },
    { name: 'General Science', mastery: [90, 88, 95, 82, 90, 85], trend: 'up' },
    { name: 'Social Studies', mastery: [55, 45, 60, 50, 55, 48], trend: 'down' },
];

const students = [
    { name: 'Karim', id: 'TUS10001' },
    { name: 'Rahim', id: 'TUS10002' },
    { name: 'Jamila', id: 'TUS10003' },
    { name: 'Abul', id: 'TUS10004' },
    { name: 'Fatima', id: 'TUS10005' },
    { name: 'Sumon', id: 'TUS10006' }
];

const SENSITIVE_WORDS = [
    'hate', 'stupid', 'idiot', 'kill', 'dumb', 'ugly', 'fat', 'lazy',
    'abuse', 'angry', 'arrogant', 'ass', 'asshole', 'awful', 'bad', 'bastard', 'bitch', 'blockhead', 'bloody', 'bullshit', 'bum', 'butt',
    'cheat', 'crap', 'crazy', 'creep', 'cripple', 'cunt', 'damn', 'darn', 'dick', 'dirt', 'dirty', 'dog', 'douche', 'dummy',
    'evil', 'failure', 'fool', 'fuck', 'garbage', 'hell', 'horrible', 'ignorant', 'incompetent', 'insane', 'jerk',
    'lame', 'liar', 'loser', 'lunatic', 'mad', 'moron', 'nasty', 'nobody', 'nonsense', 'nuts', 'obscene', 'odd', 'offensive',
    'pig', 'piss', 'poor', 'prick', 'psycho', 'racist', 'retard', 'rubbish', 'rude', 'sad', 'savage', 'scum', 'sex', 'shame', 'shit',
    'sick', 'silly', 'slob', 'slut', 'smell', 'snob', 'stink', 'strange', 'suck', 'terrible', 'thief', 'trash', 'useless', 'violent',
    'weak', 'weirdo', 'whore', 'wicked', 'witch', 'worst'
];

const TeacherDashboard = ({ user, onNavigate = (path, data) => console.log(path, data) }) => {
    const [alerts, setAlerts] = useState([]);
    const [ieps, setIeps] = useState([]);
    const [loadingPulse, setLoadingPulse] = useState(false);
    const [loadingIep, setLoadingIep] = useState(false);
    const [showIepModal, setShowIepModal] = useState(false);
    const [iepForm, setIepForm] = useState({
        studentId: '',
        diagnosis: '',
        strengths: '',
        weaknesses: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingIepId, setEditingIepId] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Validation State
    const [errors, setErrors] = useState({});

    // Micro-Intervention State
    const [showInterventionModal, setShowInterventionModal] = useState(false);
    const [loadingIntervention, setLoadingIntervention] = useState(false);
    const [interventionData, setInterventionData] = useState(null);
    const [interventionContent, setInterventionContent] = useState('');

    // View IEP State
    const [selectedIep, setSelectedIep] = useState(null);
    const [showViewIepModal, setShowViewIepModal] = useState(false);

    // Notification State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);


    const validateField = (name, value) => {
        const lowerVal = value.toLowerCase();

        // 1. Check for Sensitive Words
        const foundWord = SENSITIVE_WORDS.find(word => lowerVal.includes(word));
        if (foundWord) {
            setErrors(prev => ({ ...prev, [name]: 'Sensitive word detected' }));
            return false;
        }

        // 2. Clear errors if valid (both sensitive and required)
        setErrors(prev => {
            const newErrors = { ...prev };
            // We only clear if the error was strictly related to validation logic we just passed
            // But simplify: if checking sensitivity and it passes, clear that specific error.
            // Actually, best to clear 'Sensitive word detected' specifically or just clear the field error
            // if we assume only one error type at a time per field.
            delete newErrors[name];
            return newErrors;
        });
        return true;
    };

    const handleBlur = (name, value) => {
        if (!value.trim()) {
            setErrors(prev => ({ ...prev, [name]: 'This field is required' }));
        }
    };

    const submitIep = async (e) => {
        e.preventDefault();

        // Final Validation Check
        const hasErrors = Object.keys(errors).length > 0;
        const currentData = { ...iepForm };
        let isValid = true;

        ['diagnosis', 'strengths', 'weaknesses'].forEach(field => {
            if (!validateField(field, currentData[field])) isValid = false;
        });

        if (hasErrors || !isValid) {
            alert("Please remove sensitive words before proceeding.");
            return;
        }

        setLoadingIep(true);
        try {
            let response;
            if (isEditing && editingIepId) {
                // Update existing IEP
                response = await axios.put(`http://localhost:5000/api/iep/${editingIepId}`, {
                    ...iepForm,
                    teacherId: user?.id || '6946ce04f6dc0ea51448ed7c'
                });
                setIeps(prev => prev.map(iep => iep._id === editingIepId ? response.data.data : iep));
            } else {
                // Create new IEP
                response = await axios.post('http://localhost:5000/api/lessons/generate-iep', {
                    ...iepForm,
                    teacherId: user?.id || '6946ce04f6dc0ea51448ed7c'
                });
                setIeps(prev => [response.data.data, ...prev]);
            }

            setShowIepModal(false);
            setIepForm({ studentId: '', diagnosis: '', strengths: '', weaknesses: '' });
            setIsEditing(false);
            setEditingIepId(null);
        } catch (error) {
            console.error('IEP API Error', error);
        }
        setLoadingIep(false);
    };

    const handleGenerateIep = () => {
        setIsEditing(false);
        setEditingIepId(null);
        setIepForm({ studentId: '', diagnosis: '', strengths: '', weaknesses: '' });
        setShowIepModal(true);
    };

    const handleEditIep = (e, iep) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditingIepId(iep._id);
        setIepForm({
            studentId: iep.studentId,
            diagnosis: iep.diagnosis,
            strengths: iep.strengths,
            weaknesses: iep.weaknesses
        });
        setShowIepModal(true);
    };

    const confirmDeleteIep = (e, iepId) => {
        e.stopPropagation();
        setDeleteTargetId(iepId);
        setShowDeleteModal(true);
    };

    const handleDeleteIep = async () => {
        if (!deleteTargetId) return;

        try {
            const response = await axios.delete(`http://localhost:5000/api/iep/${deleteTargetId}`);
            if (response.data.success) {
                setIeps(prev => prev.filter(iep => iep._id !== deleteTargetId));
                setShowDeleteModal(false);
                setDeleteTargetId(null);
            }
        } catch (error) {
            console.error("Delete IEP Error", error);
        }
    };

    // Calculate Student Risk Ranking
    const studentRiskData = useMemo(() => {
        const studentScores = students.map((s, idx) => {
            const total = curriculumTopics.reduce((acc, topic) => acc + topic.mastery[idx], 0);
            const avg = Math.round(total / curriculumTopics.length);
            return { name: s.name, id: s.id, avg };
        });
        // Sort by lowest average (High Risk first)
        return studentScores.sort((a, b) => a.avg - b.avg);
    }, []);

    const fetchDashboardData = useCallback(async () => {
        setLoadingPulse(true);
        try {
            const userId = user?.id || '6946ce04f6dc0ea51448ed7c';
            const response = await axios.get(`http://localhost:5000/api/iep/teacher/${userId}`);
            if (response.data.success) {
                setIeps(response.data.data);
            }
        } catch (error) {
            console.error("Dashboard Data Fetch Error", error);
        }
        setLoadingPulse(false);
    }, [user?.id]);

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

    useEffect(() => {
        fetchDashboardData();
        fetchNotifications();
        const notificationInterval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(notificationInterval);
    }, [fetchDashboardData, fetchNotifications]);

    const markNotificationRead = async (id) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, config);
            setNotifications(notifications.filter(n => n._id !== id));
            onNavigate('tutoring'); // Take to tutoring page as requested
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    const fetchClassroomPulse = useCallback(async () => {
        setLoadingPulse(true);
        try {
            const response = await axios.post('http://localhost:5000/api/lessons/pulse', {
                topic: 'Mathematics (Fractions)',
                performanceData: mockPerformance
            });

            if (response.data.type === 'Pivot Alert') {
                const newAlert = {
                    id: Date.now(),
                    topic: response.data.topic,
                    failureRate: response.data.failureRate,
                    message: response.data.message,
                    remedial: response.data.suggestedRemedialActivity,
                    timestamp: new Date()
                };
                setAlerts(prev => {
                    const filtered = prev.filter(a => a.topic !== newAlert.topic);
                    return [newAlert, ...filtered].slice(0, 5);
                });
            }
        } catch (error) {
            console.error("Pulse API Error", error);
        }
        setLoadingPulse(false);
    }, []);

    const simulateFailureSession = async () => {
        setLoadingPulse(true);
        const failPerformance = [
            { studentId: '1', result: 'incorrect' },
            { studentId: '2', result: 'incorrect' },
            { studentId: '3', result: 'incorrect' },
            { studentId: '4', result: 'correct' },
            { studentId: '5', result: 'incorrect' },
            { studentId: '6', result: 'incorrect' },
            { studentId: '7', result: 'incorrect' },
            { studentId: '8', result: 'correct' },
        ]; // 6/8 = 75% failure

        try {
            const response = await axios.post('http://localhost:5000/api/lessons/pulse', {
                topic: 'Fraction Addition',
                performanceData: failPerformance
            });

            if (response.data.type === 'Pivot Alert') {
                const newAlert = {
                    id: Date.now(),
                    topic: response.data.topic,
                    failureRate: response.data.failureRate,
                    message: response.data.message,
                    remedial: response.data.suggestedRemedialActivity,
                    timestamp: new Date()
                };
                setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
            }
        } catch (error) {
            console.error("Pulse API Error", error);
        }
        setLoadingPulse(false);
    };

    // Removed original handleGenerateIep definition to avoid duplication since I redefined it above to reset state.
    // Ensure you delete the old one or this will cause an error (Duplicate declaration). 
    // Checking file content... line 155 was:
    // const handleGenerateIep = () => {
    //    // Open the modal for IEP drafting
    //    setShowIepModal(true);
    // };
    // I will replace it with an empty string or comment out since I moved it up.
    // (No-op replacement for this block as I've already consolidated it in the previous chunk logic if I could, but 'multi_replace' chunks must be distinct)
    // Actually, let me just replace this block with nothing or comment it out so the new one takes precedence.
    // Wait, I can't have duplicate const declarations in the same scope. 
    // I need to be careful.
    // Strategy: Redefine `handleGenerateIep` in the chunk above, and DELETE the old one here.

    useEffect(() => {
        fetchClassroomPulse();
        const interval = setInterval(fetchClassroomPulse, 60000 * 5); // Check every 5 mins
        return () => clearInterval(interval);
    }, [fetchClassroomPulse]);

    const getMasteryColor = (score) => {
        if (score >= 80) return 'bg-[#d5f5c2] text-[#1a3300] border-[#1a3300]';
        if (score >= 50) return 'bg-[#ffe95c] text-[#1a3300] border-[#1a3300]';
        return 'bg-[#ffccd5] text-[#cb5521] border-[#1a3300]';
    };

    const handleCellClick = async (studentName, subject, score) => {
        if (score >= 50) return; // Only for low scores

        setShowInterventionModal(true);
        setLoadingIntervention(true);
        setInterventionData({ studentName, subject, score });
        setInterventionContent(''); // Clear previous

        try {
            const response = await axios.post('http://localhost:5000/api/lessons/micro-intervention', {
                studentName: studentName.name || studentName,
                subject,
                score
            });
            if (response.data.success) {
                setInterventionContent(response.data.data);
            }
        } catch (error) {
            console.error("Intervention API Error", error);
            setInterventionContent("Failed to generate intervention. Please try again.");
        }
        setLoadingIntervention(false);
    };


    return (
        <div className="min-h-screen bg-[#090d16] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Premium Background Blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                {/* Navigation / Header */}
                <header 
                    style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #1a3300',
                        borderRadius: '16px',
                        boxShadow: '6px 6px 0px #1a3300',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1.5rem',
                        position: 'relative',
                        zIndex: 100
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div 
                            style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #ffe95c 0%, #cb5521 100%)',
                                border: '2px solid #1a3300',
                                borderRadius: '12px',
                                boxShadow: '3px 3px 0px #1a3300',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Layout className="text-[#1a3300]" size={28} />
                            )}
                        </div>
                        <div>
                            <h1 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: '#1a3300', margin: 0 }} className="italic leading-none">
                                {user?.name || 'Teacher'} Command Center
                            </h1>
                            <p style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.68rem', fontWeight: 800, color: 'rgba(26,51,0,0.6)', margin: '0.35rem 0 0 0' }} className="uppercase tracking-wider">
                                {user?.designation || 'Educator'} • {user?.district || 'Dhaka North'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #1a3300',
                                    borderRadius: '10px',
                                    color: '#1a3300',
                                    boxShadow: '3px 3px 0px #1a3300',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fcfaf5'; e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                            >
                                <Bell size={18} />
                                {notifications.length > 0 && (
                                    <span 
                                        style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            minWidth: '16px',
                                            height: '16px',
                                            backgroundColor: '#cb5521',
                                            border: '1.5px solid #1a3300',
                                            borderRadius: '9999px',
                                            color: '#ffffff',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 2px'
                                        }}
                                    >
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4.5rem',
                                    right: 0,
                                    width: '20rem',
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #1a3300',
                                    borderRadius: '12px',
                                    boxShadow: '6px 6px 0px #1a3300',
                                    zIndex: 150,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1.5px solid #1a3300', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fcfaf5' }}>
                                        <h3 style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,51,0,0.6)', margin: 0 }}>Notifications</h3>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#cb5521', backgroundColor: '#f6d0ff', padding: '0.2rem 0.5rem', border: '1.5px solid #1a3300', borderRadius: '4px', boxShadow: '1px 1px 0px #1a3300' }}>{notifications.length} New</span>
                                    </div>
                                    <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                                        {notifications.length > 0 ? notifications.map(n => (
                                            <div
                                                key={n._id}
                                                onClick={() => markNotificationRead(n._id)}
                                                style={{
                                                    padding: '1rem',
                                                    borderBottom: '1px solid rgba(26,51,0,0.08)',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                className="hover:bg-[#fcfaf5]"
                                            >
                                                <p style={{ fontSize: '0.78rem', color: '#1a3300', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                                                <p style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '0.58rem', color: 'rgba(26,51,0,0.5)', marginTop: '0.25rem', margin: '0.25rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{new Date(n.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                                <p style={{ fontSize: '0.75rem', color: 'rgba(26,51,0,0.4)', fontStyle: 'italic', margin: 0 }}>No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Interactive Simulation Block with explanation */}
                        <div 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.5rem 0.85rem',
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '12px',
                                boxShadow: '3px 3px 0px #1a3300',
                                maxWidth: '340px'
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <p style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontSize: '0.75rem', fontWeight: 900, color: '#1a3300', margin: 0 }}>Simulate Fraction Fail</p>
                                <p style={{ fontSize: '0.62rem', color: 'rgba(26,51,0,0.65)', margin: '0.15rem 0 0 0', fontWeight: 600, lineHeight: 1.2 }}>Triggers an AI alert for students scoring below 50%</p>
                            </div>
                            <button
                                onClick={simulateFailureSession}
                                disabled={loadingPulse}
                                style={{
                                    padding: '0.45rem 0.75rem',
                                    backgroundColor: '#ffccd5',
                                    color: '#cb5521',
                                    border: '1.5px solid #1a3300',
                                    borderRadius: '8px',
                                    boxShadow: '1.5px 1.5px 0px #1a3300',
                                    cursor: 'pointer',
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.15s ease',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffb3c1'; e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffccd5'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #1a3300'; }}
                            >
                                {loadingPulse ? <RefreshCw className="animate-spin" size={10} /> : <AlertCircle size={10} />}
                                Trigger
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                    {/* Left/Middle Column (8 units) */}
                    <div className="xl:col-span-8 space-y-8">

                        {/* 1. Intervention Heatmap */}
                        <section className="bg-white border-2 border-[#1a3300] rounded-[2rem] p-6 shadow-[6px_6px_0px_#1a3300] relative overflow-hidden group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#d5f5c2] border-2 border-[#1a3300] rounded-xl shadow-[2px_2px_0px_#1a3300] text-[#1a3300]">
                                        <TrendingUp size={24} />
                                    </div>
                                    <h2 className="text-xl font-extrabold text-[#1a3300]">Curriculum Pulse Heatmap</h2>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-[#1a3300] bg-[#ffe95c] border-2 border-[#1a3300] px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_#1a3300] w-fit">
                                    <RefreshCw className={loadingPulse ? "animate-spin" : ""} size={14} /> Real-time
                                </div>
                            </div>

                            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#1a3300]/20">
                                <table className="w-full border-separate border-spacing-y-2">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-3 px-4 text-[#1a3300] text-[10px] font-black uppercase tracking-[0.2em] border-b-2 border-[#1a3300] bg-[#f5f1e6]/30 rounded-l-xl">Subject Focus</th>
                                            {students.map((s, idx) => (
                                                <th key={s.id} className={`text-center py-3 px-2 text-[#1a3300] text-[10px] font-black uppercase tracking-wider border-b-2 border-[#1a3300] bg-[#f5f1e6]/30 ${idx === students.length - 1 ? 'rounded-r-xl' : ''}`}>
                                                    <div className="flex flex-col items-center">
                                                        <span>{s.name}</span>
                                                        <span className="text-[9px] text-[#cb5521] font-bold mt-0.5">{s.id}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {curriculumTopics.map((topic, tIdx) => (
                                            <tr key={topic.name} className="hover:bg-[#fcfaf5]/50 transition-colors">
                                                <td className="py-4 px-4 border-b border-[#1a3300]/10">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-extrabold text-[#1a3300]">{topic.name}</span>
                                                        <span className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${topic.trend === 'up' ? 'text-[#1a3300]' : 'text-[#cb5521]'}`}>
                                                            {topic.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {topic.trend === 'up' ? 'Progressing' : 'Intervention Needed'}
                                                        </span>
                                                    </div>
                                                </td>
                                                {topic.mastery.map((score, sIdx) => {
                                                    const masteryColorClass = getMasteryColor(score);
                                                    const student = students[sIdx];
                                                    const isLow = score < 50;
                                                    return (
                                                        <td key={sIdx} className="py-4 px-2 border-b border-[#1a3300]/10 text-center align-middle">
                                                            <div
                                                                onClick={() => handleCellClick(student, topic.name, score)}
                                                                className={`h-10 w-10 mx-auto rounded-xl flex items-center justify-center font-black text-xs border-2 cursor-pointer shadow-[2px_2px_0px_#1a3300] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#1a3300] transition-all relative group/cell ${masteryColorClass}`}
                                                            >
                                                                <span>{score}%</span>
                                                                
                                                                {/* Neo-Brutalist Hover Tooltip */}
                                                                <div className="absolute bottom-full mb-2.5 hidden group-hover/cell:flex flex-col items-center z-[90] w-48 pointer-events-none">
                                                                    <div className="bg-[#1a3300] text-[#fcfaf5] text-[10px] font-bold py-2 px-3 rounded-xl shadow-[4px_4px_0px_#cb5521] border-2 border-[#1a3300] text-center w-full">
                                                                        <p className="font-extrabold text-white">{student.name} ({student.id})</p>
                                                                        <p className="opacity-80 mt-0.5">{topic.name}</p>
                                                                        <p className="text-[#ffe95c] font-black mt-1">Score: {score}% {isLow ? '• Click to generate tip' : ''}</p>
                                                                    </div>
                                                                    <div className="w-2 h-2 bg-[#1a3300] rotate-45 -mt-1 border-r-2 border-b-2 border-[#1a3300]"></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Color Legend */}
                            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-[#1a3300]/10 pt-4 text-xs font-bold text-[#1a3300]">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <span className="text-[10px] uppercase tracking-wider opacity-60">Mastery Levels:</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-[#d5f5c2] border border-[#1a3300] rounded-md shadow-[1px_1px_0px_#1a3300]"></div>
                                        <span>High Mastery (≥80%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-[#ffe95c] border border-[#1a3300] rounded-md shadow-[1px_1px_0px_#1a3300]"></div>
                                        <span>Approaching (50-79%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-[#ffccd5] border border-[#1a3300] rounded-md shadow-[1px_1px_0px_#1a3300] animate-pulse"></div>
                                        <span className="text-[#cb5521]">Intervention Needed (&lt;50%)</span>
                                    </div>
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-[#cb5521] font-black animate-pulse md:text-right">
                                    * Click any red cell to deploy quick AI lesson intervention
                                </div>
                            </div>
                        </section>

                        {/* IEP Management */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="backdrop-blur-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                                            <UserCheck className="text-indigo-400" size={28} />
                                        </div>
                                        <button className="text-slate-400 hover:text-white transition-colors"><MoreVertical size={20} /></button>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">IEP Builder</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Specialized AI-drafting for students with diverse needs. Verified Bangladesh 2013-Act compliant.</p>
                                </div>
                                <button
                                    onClick={handleGenerateIep}
                                    disabled={loadingIep}
                                    className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {loadingIep ? <RefreshCw className="animate-spin" size={20} /> : <ClipboardList size={20} />}
                                    Draft New IEP
                                </button>
                                {/* IEP Modal */}
                                {showIepModal && (
                                    <div className="fixed inset-0 flex items-center justify-center bg-[#1a3300]/40 z-50 backdrop-blur-sm p-4">
                                        <div className="bg-[#fcfaf5] text-[#1a3300] border-2 border-[#1a3300] rounded-2xl p-6 w-full max-w-md shadow-[6px_6px_0px_#1a3300] animate-in zoom-in-95 duration-200">
                                            <h2 className="text-xl font-black mb-4 text-[#1a3300]">{isEditing ? 'Edit IEP Draft' : 'Draft New IEP'}</h2>
                                            <form onSubmit={submitIep} className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a3300] mb-1">Student ID</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-[#1a3300]/50 font-bold text-xs">TUS</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            required
                                                            maxLength={5}
                                                            value={iepForm.studentId.startsWith('TUS') ? iepForm.studentId.slice(3) : iepForm.studentId}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                const fullId = `TUS${val}`;
                                                                setIepForm({ ...iepForm, studentId: fullId });
                                                                // Clear required error on type
                                                                if (val) setErrors(prev => { const n = { ...prev }; delete n.studentId; return n; });
                                                            }}
                                                            onBlur={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, ''); // Current typed val
                                                                // If empty (just TUS), trigger error
                                                                if (!val) setErrors(prev => ({ ...prev, studentId: 'Student ID is required' }));
                                                            }}
                                                            placeholder="12345"
                                                            className={`w-full bg-white border-2 ${errors.studentId ? 'border-[#cb5521]' : 'border-[#1a3300]'} rounded-xl px-3 py-2 pl-12 text-[#1a3300] placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none font-mono transition-colors`}
                                                        />
                                                    </div>
                                                    {errors.studentId && (
                                                        <p className="text-xs text-[#cb5521] mt-1 flex items-center gap-1 animate-pulse font-bold">
                                                            <AlertTriangle size={12} /> {errors.studentId}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a3300] mb-1">Diagnosis</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={iepForm.diagnosis}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^a-zA-Z\s.,-]/g, '');
                                                            setIepForm({ ...iepForm, diagnosis: val });
                                                            validateField('diagnosis', val);
                                                        }}
                                                        onBlur={() => handleBlur('diagnosis', iepForm.diagnosis)}
                                                        className={`w-full bg-white border-2 ${errors.diagnosis ? 'border-[#cb5521] text-[#cb5521]' : 'border-[#1a3300] text-[#1a3300]'} rounded-xl px-3 py-2 placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none transition-colors font-semibold`}
                                                    />
                                                    {errors.diagnosis && (
                                                        <p className="text-xs text-[#cb5521] mt-1 flex items-center gap-1 animate-pulse font-bold">
                                                            <AlertTriangle size={12} /> {errors.diagnosis}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a3300] mb-1">Strengths</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={iepForm.strengths}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^a-zA-Z\s.,-]/g, '');
                                                            setIepForm({ ...iepForm, strengths: val });
                                                            validateField('strengths', val);
                                                        }}
                                                        onBlur={() => handleBlur('strengths', iepForm.strengths)}
                                                        className={`w-full bg-white border-2 ${errors.strengths ? 'border-[#cb5521] text-[#cb5521]' : 'border-[#1a3300] text-[#1a3300]'} rounded-xl px-3 py-2 placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none transition-colors font-semibold`}
                                                    />
                                                    {errors.strengths && (
                                                        <p className="text-xs text-[#cb5521] mt-1 flex items-center gap-1 animate-pulse font-bold">
                                                            <AlertTriangle size={12} /> {errors.strengths}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a3300] mb-1">Weaknesses</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={iepForm.weaknesses}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/[^a-zA-Z\s.,-]/g, '');
                                                            setIepForm({ ...iepForm, weaknesses: val });
                                                            validateField('weaknesses', val);
                                                        }}
                                                        onBlur={() => handleBlur('weaknesses', iepForm.weaknesses)}
                                                        className={`w-full bg-white border-2 ${errors.weaknesses ? 'border-[#cb5521] text-[#cb5521]' : 'border-[#1a3300] text-[#1a3300]'} rounded-xl px-3 py-2 placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none transition-colors font-semibold`}
                                                    />
                                                    {errors.weaknesses && (
                                                        <p className="text-xs text-[#cb5521] mt-1 flex items-center gap-1 animate-pulse font-bold">
                                                            <AlertTriangle size={12} /> {errors.weaknesses}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex justify-end space-x-2 mt-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowIepModal(false);
                                                            setErrors({});
                                                        }}
                                                        className="px-4 py-2 bg-transparent hover:bg-[#ffe95c] border-2 border-[#1a3300] text-[#1a3300] font-bold rounded-xl shadow-[2px_2px_0px_#1a3300] transition-colors"
                                                    >Cancel</button>
                                                    <button
                                                        type="submit"
                                                        disabled={loadingIep || Object.keys(errors).length > 0}
                                                        className="px-4 py-2 bg-[#1a3300] hover:bg-[#cb5521] disabled:bg-[#1a3300]/50 text-[#fcfaf5] font-bold rounded-xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300] transition-colors"
                                                    >
                                                        {loadingIep ? <RefreshCw className="animate-spin" size={14} /> : (isEditing ? 'Update IEP' : 'Generate IEP')}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                                <h3 className="text-lg font-bold text-white mb-6">Recent IEP Drafts</h3>
                                <div className="space-y-4">
                                    {ieps.length > 0 ? ieps.slice(0, 3).map((iep, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => { setSelectedIep(iep); setShowViewIepModal(true); }}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                    {iep.studentId.replace(/[^0-9]/g, '').slice(-2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white">
                                                        ID: {iep.studentId.replace('TUS', 'TUS-')}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{iep.diagnosis}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleEditIep(e, iep)}
                                                    className="p-1.5 hover:bg-indigo-500/20 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => confirmDeleteIep(e, iep._id)}
                                                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-6 bg-[#fcfaf5] border-2 border-[#1a3300] rounded-2xl shadow-[4px_4px_0px_#1a3300] text-center flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-[#ffe95c] border border-[#1a3300] rounded-xl flex items-center justify-center text-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                                <ClipboardList size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#1a3300] text-sm">No IEP Drafts Yet</h4>
                                                <p className="text-xs text-[#1a3300]/70 mt-1 max-w-[240px] mx-auto leading-relaxed">
                                                    Draft personalized IEPs complying with national educational guidelines.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleGenerateIep}
                                                className="mt-1 px-4 py-2 bg-[#1a3300] hover:bg-[#cb5521] text-[#fcfaf5] font-bold text-xs rounded-lg transition-colors border border-[#1a3300]"
                                            >
                                                Draft First IEP
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Real-Time Alerts (4 units) */}
                    <aside id="notifications-section" className="xl:col-span-4 space-y-6">
                        <div className="bg-white border-2 border-[#1a3300] rounded-[2.5rem] p-8 shadow-[4px_4px_0px_#1a3300] h-full flex flex-col relative overflow-hidden">
                            {/* Animated Ring Decor */}
                            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 border border-[#1a3300]/10 rounded-full animate-ping-slow"></div>

                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1a3300]/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-[#f6d0ff] border-2 border-[#1a3300] rounded-xl relative shadow-[2px_2px_0px_#1a3300] text-[#1a3300]">
                                        <AlertCircle size={24} />
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#cb5521] rounded-full border-2 border-[#1a3300] animate-pulse"></span>
                                    </div>
                                    <h2 className="text-xl font-extrabold text-[#1a3300]">Control Center</h2>
                                </div>
                            </div>

                            {/* Student Performance Ranking Graph */}
                            <div className="mb-8">
                                <h3 className="text-xs font-black text-[#1a3300]/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} /> Student Care Priority
                                </h3>
                                <div className="space-y-3">
                                    {studentRiskData.map((s, idx) => {
                                        const isHighRisk = (studentRiskData[2] && s.avg <= studentRiskData[2].avg) || idx < 3;
                                        return (
                                            <div key={s.name} className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-xl p-3 shadow-[2px_2px_0px_#1a3300] flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={`font-black flex items-center gap-1 ${isHighRisk ? 'text-[#cb5521]' : 'text-[#1a3300]'}`}>
                                                        {isHighRisk && <AlertTriangle size={12} className="text-[#cb5521] shrink-0" />}
                                                        {idx + 1}. {s.name} <span className="text-[9px] text-[#1a3300]/55 font-bold ml-0.5">({s.id})</span>
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border border-[#1a3300] shadow-[1px_1px_0px_#1a3300] ${isHighRisk ? 'bg-[#ffccd5] text-[#cb5521]' : 'bg-[#d5f5c2] text-[#1a3300]'}`}>
                                                        {s.avg}% Avg
                                                    </span>
                                                </div>
                                                <div className="h-3.5 w-full bg-white border border-[#1a3300] rounded-full overflow-hidden p-[1px] shadow-[1px_1px_0px_#1a3300]">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-[#cb5521]' : 'bg-[#d5f5c2]'}`}
                                                        style={{ width: `${s.avg}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-xs font-black text-[#1a3300]/60 uppercase tracking-widest flex items-center gap-2">
                                    <AlertCircle size={14} /> Active Alerts
                                </h3>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#1a3300]/10">
                                {alerts.length > 0 ? alerts.map(alert => (
                                    <div
                                        key={alert.id}
                                        className="group relative bg-[#ffccd5] border-2 border-[#1a3300] p-5 rounded-2xl shadow-[4px_4px_0px_#1a3300] animate-in slide-in-from-right duration-500 flex flex-col gap-3"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#cb5521] px-2 py-0.5 rounded border border-[#1a3300] shadow-[1px_1px_0px_#1a3300]">Critical</span>
                                            <span className="text-[10px] font-bold text-[#1a3300]/60">{alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h4 className="text-base font-extrabold text-[#1a3300] leading-snug">{alert.topic}</h4>
                                        <p className="text-xs text-[#1a3300] leading-relaxed font-semibold">
                                            {alert.message} Failure rate reached <span className="bg-[#ffe95c] border border-[#1a3300] px-1 rounded font-black text-[#1a3300] shadow-[1px_1px_0px_#1a3300] mx-0.5">{alert.failureRate}</span>.
                                        </p>

                                        <div className="p-3 bg-white border border-[#1a3300]/40 rounded-xl shadow-[2px_2px_0px_#1a3300] flex flex-col gap-1">
                                            <p className="text-[9px] font-black text-[#1a3300]/50 uppercase tracking-widest">Recommended Strategy</p>
                                            <p className="text-[11px] text-[#1a3300] leading-relaxed font-bold italic">{alert.remedial.substring(0, 120)}...</p>
                                        </div>

                                        <button
                                            onClick={() => onNavigate('lesson', { topic: alert.topic, remedial: alert.remedial })}
                                            className="w-full py-2.5 bg-[#1a3300] hover:bg-[#cb5521] text-[#fcfaf5] border border-[#1a3300] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_#1a3300] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a3300] active:translate-y-0 active:shadow-[2px_2px_0px_#1a3300]"
                                        >
                                            Deploy Intervention <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="p-6 bg-[#d5f5c2] border-2 border-[#1a3300] rounded-2xl shadow-[4px_4px_0px_#1a3300] text-center flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-white border border-[#1a3300] rounded-xl flex items-center justify-center text-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                            <UserCheck size={24} className="text-[#1a3300]" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#1a3300] text-sm">All Metrics Stable</h4>
                                            <p className="text-xs text-[#1a3300]/80 mt-1 max-w-[200px] mx-auto leading-relaxed">
                                                All monitored students are progressing within expected parameters.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#1a3300]/10">
                                <button className="text-[10px] font-black text-[#1a3300]/60 uppercase tracking-[0.15em] hover:text-[#cb5521] transition-colors w-full text-center py-2 border border-dashed border-[#1a3300]/20 rounded-xl hover:border-[#1a3300]/50 hover:bg-[#fcfaf5]">Clear Notification History</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* 720p Mobile / Android Footer Note */}
            <footer 
                style={{
                    borderTop: '2px solid #1a3300',
                    paddingTop: '2rem',
                    marginTop: '3rem',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.5rem',
                    fontFamily: "'Inter', sans-serif"
                }}
                className="max-w-[1400px] mx-auto px-8 pb-12"
            >
                <div style={{ color: 'rgba(26,51,0,0.65)', fontSize: '0.78rem', fontWeight: 500 }}>
                    <p style={{ margin: 0 }}>© {new Date().getFullYear()} ShikkhokSathi AI Dashboard • Optimized for Global Classrooms</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontWeight: 700, color: '#1a3300' }}>Built with Precision • Bangladesh EdTech Initiative</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div 
                        style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#d5f5c2',
                            border: '1.5px solid #1a3300',
                            borderRadius: '6px',
                            boxShadow: '1.5px 1.5px 0px #1a3300',
                            fontSize: '0.62rem',
                            fontWeight: 'bold',
                            color: '#1a3300',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Server Connected
                    </div>
                    <div 
                        style={{
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#a8e5e5',
                            border: '1.5px solid #1a3300',
                            borderRadius: '6px',
                            boxShadow: '1.5px 1.5px 0px #1a3300',
                            fontSize: '0.62rem',
                            fontWeight: 'bold',
                            color: '#1a3300',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Team Under_Score AI Active
                    </div>
                </div>
            </footer>

            {/* Micro-Intervention Modal */}
            {showInterventionModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#1a3300]/40 z-[100] backdrop-blur-sm p-4">
                    <div className="bg-[#fcfaf5] text-[#1a3300] border-2 border-[#1a3300] rounded-3xl w-full max-w-lg shadow-[6px_6px_0px_#1a3300] relative overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffccd5]/20 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative z-10 p-6 pb-2 shrink-0 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-extrabold text-[#1a3300] flex items-center gap-2">
                                    <TrendingUp className="text-[#cb5521]" size={20} />
                                    Quick Teaching Tip
                                </h3>
                                {interventionData && (
                                    <p className="text-sm text-[#1a3300]/70 mt-1 font-semibold">
                                        For <span className="text-[#cb5521] font-extrabold">{interventionData.studentName.name || interventionData.studentName}</span> • {interventionData.subject} ({interventionData.score}%)
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowInterventionModal(false); }}
                                className="p-2 hover:bg-[#ffe95c] border border-[#1a3300]/20 rounded-full transition-colors text-[#1a3300]"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-6 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1a3300]/20 flex-1 min-h-0">
                            {loadingIntervention ? (
                                <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
                                    <RefreshCw className="animate-spin text-[#1a3300]" size={32} />
                                    <p className="text-sm text-[#1a3300]/80 font-bold animate-pulse">Generating custom tip...</p>
                                </div>
                            ) : (
                                <div className="space-y-4 my-2">
                                    {interventionContent.split('\n').map((line, idx) => {
                                        if (line.trim().startsWith('Step') || line.trim().match(/^\d+\./)) {
                                            const parts = line.split(':');
                                            const stepTitle = parts[0];
                                            const stepText = parts.slice(1).join(':').trim();
                                            return (
                                                <div key={idx} className="flex gap-3 items-start p-3 bg-[#d5f5c2] rounded-xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                                    <div className="w-6 h-6 rounded-full bg-[#1a3300] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-[#fcfaf5] mt-0.5">
                                                        {stepTitle.replace(/[^0-9]/g, '') || idx + 1}
                                                    </div>
                                                    <p className="text-sm text-[#1a3300] font-bold leading-relaxed">{stepText || line}</p>
                                                </div>
                                            );
                                        }
                                        return <p key={idx} className="text-sm text-[#1a3300]/85 font-medium leading-relaxed">{line}</p>;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="relative z-10 p-6 pt-2 shrink-0 flex justify-end">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowInterventionModal(false); }}
                                className="px-6 py-2.5 bg-[#1a3300] hover:bg-[#cb5521] text-[#fcfaf5] font-bold rounded-xl transition-all border border-[#1a3300] shadow-[2px_2px_0px_#1a3300] w-full sm:w-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* View IEP Modal */}
            {showViewIepModal && selectedIep && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#1a3300]/40 z-[100] backdrop-blur-sm p-4">
                    <div className="bg-[#fcfaf5] text-[#1a3300] border-2 border-[#1a3300] rounded-3xl w-full max-w-2xl shadow-[6px_6px_0px_#1a3300] relative overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffe95c]/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 p-6 pb-4 shrink-0 flex justify-between items-start border-b border-[#1a3300]/10">
                            <div>
                                <h3 className="text-xl font-extrabold text-[#1a3300] flex items-center gap-2">
                                    <ClipboardList className="text-[#cb5521]" size={20} />
                                    IEP Details
                                </h3>
                                <p className="text-sm text-[#1a3300]/70 mt-1 font-semibold">
                                    Student ID: <span className="text-[#cb5521] font-extrabold">{selectedIep.studentId}</span>
                                </p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowViewIepModal(false); }}
                                className="p-2 hover:bg-[#ffe95c] border border-[#1a3300]/20 rounded-full transition-colors text-[#1a3300]"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="relative z-10 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1a3300]/20 flex-1 min-h-0 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white rounded-2xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                    <p className="text-[10px] font-black text-[#1a3300]/50 uppercase tracking-widest mb-1">Diagnosis</p>
                                    <p className="text-sm font-bold text-[#1a3300]">{selectedIep.diagnosis}</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                    <p className="text-[10px] font-black text-[#1a3300]/50 uppercase tracking-widest mb-1">Strengths</p>
                                    <p className="text-sm font-bold text-[#1a3300]">{selectedIep.strengths}</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                    <p className="text-[10px] font-black text-[#1a3300]/50 uppercase tracking-widest mb-1">Weaknesses</p>
                                    <p className="text-sm font-bold text-[#1a3300]">{selectedIep.weaknesses}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-black text-[#1a3300] mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[#cb5521]" /> SMART Goals
                                </h4>
                                <div className="space-y-3">
                                    {selectedIep.smartGoals && selectedIep.smartGoals.map((goal, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-[#ffe95c]/10 rounded-2xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                            <div className="w-6 h-6 rounded-full bg-[#1a3300] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-[#fcfaf5] mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <p className="text-sm text-[#1a3300] font-bold leading-relaxed">{goal}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedIep.complianceFlag && (
                                <div className="flex items-center gap-3 p-4 bg-[#d5f5c2] rounded-2xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]">
                                    <div className="p-2 bg-[#1a3300]/10 rounded-full text-[#1a3300]">
                                        <TrendingUp size={16} />
                                    </div>
                                    <p className="text-xs font-black text-[#1a3300]">
                                        Compliance Verified: Aligned with Bangladesh Rights of Persons with Disabilities Act 2013.
                                    </p>
                                </div>
                            )}

                        </div>

                        <div className="relative z-10 p-6 pt-4 shrink-0 flex justify-end gap-3 border-t border-[#1a3300]/10">
                            <button
                                onClick={() => { /* function to download PDF could go here later */ }}
                                className="px-6 py-2.5 bg-white hover:bg-[#ffe95c] text-[#1a3300] font-bold rounded-xl transition-all border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300]"
                            >
                                Download PDF
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowViewIepModal(false); }}
                                className="px-6 py-2.5 bg-[#1a3300] hover:bg-[#cb5521] text-[#fcfaf5] font-bold rounded-xl transition-all border border-[#1a3300] shadow-[2px_2px_0px_#1a3300]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#1a3300]/40 z-[110] backdrop-blur-sm p-4">
                    <div className="bg-[#fcfaf5] text-[#1a3300] border-2 border-[#1a3300] rounded-2xl p-6 w-full max-w-sm shadow-[6px_6px_0px_#1a3300] relative overflow-hidden text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-[#ffccd5] border-2 border-[#1a3300] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_#1a3300] text-[#cb5521]">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-[#1a3300] mb-2">Delete Draft?</h3>
                        <p className="text-[#1a3300]/70 text-sm mb-6 font-semibold">
                            Are you sure you want to delete this IEP draft? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-5 py-2.5 bg-white hover:bg-[#ffe95c] text-[#1a3300] font-bold rounded-xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteIep}
                                className="px-5 py-2.5 bg-[#cb5521] hover:bg-[#b0451a] text-white font-bold rounded-xl border-2 border-[#1a3300] shadow-[2px_2px_0px_#1a3300] transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tailwind Animations */}
            <style jsx="true">{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pulse-vibrant {
          0% { opacity: 0.8; }
          50% { opacity: 1; filter: brightness(1.2); }
          100% { opacity: 0.8; }
        }
        .animate-pulse-vibrant {
          animation: pulse-vibrant 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );
};

export default TeacherDashboard;
