import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    User as UserIcon,
    Upload,
    Lock,
    Save,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Loader2,
    School,
    MapPin,
    BookOpen,
    GraduationCap,
    Star
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
const Card = ({ children, style, className = '', hoverable = false, ...props }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className={className}
            style={{
                backgroundColor: T.white,
                border: T.border,
                borderRadius: T.radius,
                boxShadow: hovered && hoverable ? T.shadowHard : T.shadow,
                transform: hovered && hoverable ? 'translate(-2px, -2px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                boxSizing: 'border-box',
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

const TeacherProfile = ({ user, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar: user?.avatar || null,
        school: user?.school || '',
        division: user?.division || '',
        district: user?.district || '',
        upazila: user?.upazila || '',
        designation: user?.designation || '',
        subjects: user?.subjects || [],
        classes: user?.classes || []
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    // Feedback State
    const [feedbackData, setFeedbackData] = useState({ averageRating: null, totalReviews: 0, feedback: [] });
    const [feedbackLoading, setFeedbackLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                avatar: user.avatar || null,
                school: user.school || '',
                division: user.division || '',
                district: user.district || '',
                upazila: user.upazila || '',
                designation: user.designation || '',
                subjects: user.subjects || [],
                classes: user.classes || []
            });
        }
    }, [user]);

    // Fetch feedback when switching to feedback tab
    useEffect(() => {
        if (activeTab === 'feedback' && user?._id) {
            const fetchFeedback = async () => {
                setFeedbackLoading(true);
                try {
                    const response = await axios.get(`http://localhost:5000/api/tutoring/feedback/${user._id}`);
                    if (response.data.success) {
                        setFeedbackData(response.data.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch feedback:', err);
                }
                setFeedbackLoading(false);
            };
            fetchFeedback();
        }
    }, [activeTab, user?._id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                setError('Image size must be less than 500KB. Please compress your image.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxSize = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round(height * (maxSize / width));
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round(width * (maxSize / height));
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedData = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData(prev => ({ ...prev, avatar: compressedData }));
                    setError(null);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const updateProfile = async () => {
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.put('http://localhost:5000/api/teachers/profile', formData, config);

            if (response.data.success) {
                setSuccess('Profile updated successfully!');
                onUserUpdate?.(response.data.data);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('Please fill in all password fields');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.post('http://localhost:5000/api/teachers/change-password', passwordData, config);

            if (response.data.success) {
                setSuccess('Password updated successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700" 
            style={{ 
                fontFamily: T.fontBody, 
                color: T.forest,
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontFamily: T.fontDisplay, fontSize: '2.5rem', fontWeight: 900, color: T.forest, margin: 0 }} className="italic tracking-tight leading-none">
                        Teacher Profile
                    </h1>
                    <p style={{ color: T.muted, fontWeight: 500, fontSize: '0.9rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                        Bangladesh Educational Suite • Command Center Settings
                    </p>
                </div>
                <div 
                    style={{
                        padding: '0.85rem 1.25rem',
                        backgroundColor: T.yellow,
                        border: T.border,
                        borderRadius: '10px',
                        boxShadow: T.shadow,
                    }}
                >
                    <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, margin: 0 }} className="leading-none">Account Status</p>
                    <p style={{ fontWeight: 800, color: T.forest, fontSize: '0.85rem', marginTop: '0.25rem', margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="uppercase">
                        <Check size={14} className="stroke-[3px]" style={{ color: T.terracotta }} /> Verified Educator
                    </p>
                </div>
            </div>

            {success && (
                <div 
                    style={{
                        backgroundColor: T.mint,
                        border: T.border,
                        borderRadius: T.radius,
                        boxShadow: T.shadow,
                        color: T.forest,
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}
                    className="animate-in slide-in-from-top duration-300"
                >
                    <Check className="shrink-0" size={20} style={{ color: '#1a3300' }} />
                    <p style={{ margin: 0 }}>{success}</p>
                </div>
            )}

            {error && (
                <div 
                    style={{
                        backgroundColor: T.blush,
                        border: T.border,
                        borderRadius: T.radius,
                        boxShadow: T.shadow,
                        color: T.forest,
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}
                    className="animate-in slide-in-from-top duration-300"
                >
                    <AlertCircle className="shrink-0" size={20} style={{ color: T.terracotta }} />
                    <p style={{ margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '2px solid rgba(26,51,0,0.08)' }}>
                {[
                    { id: 'personal', label: 'Personal Details', icon: UserIcon },
                    { id: 'professional', label: 'Professional Info', icon: School },
                    { id: 'security', label: 'Security', icon: Lock },
                    { id: 'feedback', label: 'Feedback', icon: Star }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setError(null);
                                setSuccess(null);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                backgroundColor: isActive ? T.yellow : T.white,
                                color: T.forest,
                                border: T.border,
                                borderRadius: '8px',
                                boxShadow: isActive ? '3px 3px 0px #1a3300' : '1.5px 1.5px 0px #1a3300',
                                transform: isActive ? 'translate(-1.5px, -1.5px)' : 'none',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = T.cream;
                                    e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                    e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #1a3300';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = T.white;
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #1a3300';
                                }
                            }}
                        >
                            <tab.icon size={14} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Personal Details */}
            {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    <Card className="md:col-span-4" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div 
                            style={{ 
                                width: '160px', 
                                height: '160px', 
                                backgroundColor: '#eef2f6', 
                                border: T.border, 
                                borderRadius: '12px',
                                boxShadow: '3px 3px 0px #1a3300',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                position: 'relative', 
                                overflow: 'hidden' 
                            }}
                            className="group"
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon size={64} style={{ color: 'rgba(26,51,0,0.25)' }} />
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(26,51,0,0.85)',
                                    border: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.25s ease',
                                }}
                                className="opacity-0 group-hover:opacity-100"
                            >
                                <Upload size={22} />
                                <span style={{ fontFamily: T.fontMono, fontSize: '0.55rem', fontWeight: 800 }} className="uppercase tracking-wider">Update Photo</span>
                            </button>
                        </div>
                        <p style={{ fontFamily: T.fontMono, fontSize: '0.55rem', color: T.muted, fontWeight: 700, textAlign: 'center', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0 0' }}>
                            Max 500KB • Square Recommended
                        </p>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />

                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(26,51,0,0.2)', width: '100%', textAlign: 'center' }}>
                            <h4 style={{ fontFamily: T.fontDisplay, fontWeight: 850, fontSize: '1.25rem', color: T.forest, margin: 0 }} className="italic">{formData.name || 'Set Name'}</h4>
                            <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', color: T.muted, fontWeight: 800, margin: '0.25rem 0 0 0' }} className="uppercase tracking-wider">{formData.designation || 'Educator'}</p>
                        </div>
                    </Card>

                    <Card className="md:col-span-8" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange} icon={UserIcon} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Email Address</label>
                                <div 
                                    style={{
                                        border: T.border,
                                        borderRadius: '8px',
                                        color: 'rgba(26,51,0,0.4)',
                                        paddingLeft: '1rem',
                                        paddingRight: '1rem',
                                        paddingTop: '0.85rem',
                                        paddingBottom: '0.85rem',
                                        backgroundColor: 'rgba(26,51,0,0.03)',
                                        fontFamily: T.fontBody,
                                        fontWeight: 'bold',
                                        fontSize: '0.88rem',
                                        fontStyle: 'italic',
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        minHeight: '44px',
                                        overflow: 'hidden',
                                    }}
                                    title={user?.email}
                                >
                                    <span style={{
                                        display: 'block',
                                        width: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {user?.email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputField label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} icon={GraduationCap} placeholder="e.g. Assistant Teacher" />
                            <InputField label="School/Institution" name="school" value={formData.school} onChange={handleInputChange} icon={School} />
                        </div>

                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: T.forest,
                                color: T.cream,
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: T.border,
                                borderRadius: '10px',
                                boxShadow: '4px 4px 0px #1a3300',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.25s ease',
                                marginTop: '0.5rem',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Personal Details
                        </button>
                    </Card>
                </div>
            )}

            {/* Professional Info */}
            {activeTab === 'professional' && (
                <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <InputField label="Division" name="division" value={formData.division} onChange={handleInputChange} icon={MapPin} />
                        <InputField label="District" name="district" value={formData.district} onChange={handleInputChange} icon={MapPin} />
                        <InputField label="Upazila" name="upazila" value={formData.upazila} onChange={handleInputChange} icon={MapPin} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed rgba(26,51,0,0.15)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.15rem', color: T.forest, margin: 0 }} className="flex items-center gap-2 italic uppercase">
                                <BookOpen size={18} style={{ color: T.terracotta }} /> Subjects Taught
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {formData.subjects.map((sub, i) => (
                                    <span 
                                        key={i} 
                                        style={{ 
                                            padding: '0.4rem 0.8rem',
                                            backgroundColor: T.teal,
                                            color: T.forest,
                                            border: T.border,
                                            borderRadius: '6px',
                                            boxShadow: '1.5px 1.5px 0px #1a3300',
                                            fontSize: '0.62rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}
                                    >
                                        {sub}
                                    </span>
                                ))}
                            </div>
                            <p style={{ fontFamily: T.fontMono, fontSize: '0.58rem', color: T.muted, fontWeight: 700, margin: 0 }} className="italic">* Contact administration to request changes in subjects list.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.15rem', color: T.forest, margin: 0 }} className="flex items-center gap-2 italic uppercase">
                                <GraduationCap size={18} style={{ color: T.terracotta }} /> Active Classes
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {formData.classes.map((cls, i) => (
                                    <span 
                                        key={i} 
                                        style={{ 
                                            padding: '0.4rem 0.8rem',
                                            backgroundColor: T.blush,
                                            color: T.forest,
                                            border: T.border,
                                            borderRadius: '6px',
                                            boxShadow: '1.5px 1.5px 0px #1a3300',
                                            fontSize: '0.62rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}
                                    >
                                        Class {cls}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={updateProfile}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: T.forest,
                            color: T.cream,
                            fontSize: '0.78rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: T.border,
                            borderRadius: '10px',
                            boxShadow: '4px 4px 0px #1a3300',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.25s ease',
                            marginTop: '0.5rem',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Sync Professional Profile
                    </button>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <Card className="max-w-2xl mx-auto" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Current Password</label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                style={{
                                    backgroundColor: T.white,
                                    border: T.border,
                                    borderRadius: '8px',
                                    color: T.forest,
                                    paddingLeft: '1rem',
                                    paddingRight: '3rem',
                                    paddingTop: '0.85rem',
                                    paddingBottom: '0.85rem',
                                    width: '100%',
                                    fontFamily: T.fontBody,
                                    fontWeight: 'bold',
                                    fontSize: '0.88rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))} 
                                style={{ 
                                    position: 'absolute', 
                                    right: '1rem', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'rgba(26,51,0,0.4)', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center' 
                                }}
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">New Password</label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                style={{
                                    backgroundColor: T.white,
                                    border: T.border,
                                    borderRadius: '8px',
                                    color: T.forest,
                                    paddingLeft: '1rem',
                                    paddingRight: '3rem',
                                    paddingTop: '0.85rem',
                                    paddingBottom: '0.85rem',
                                    width: '100%',
                                    fontFamily: T.fontBody,
                                    fontWeight: 'bold',
                                    fontSize: '0.88rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} 
                                style={{ 
                                    position: 'absolute', 
                                    right: '1rem', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'rgba(26,51,0,0.4)', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center' 
                                }}
                            >
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">Confirm Password</label>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                style={{
                                    backgroundColor: T.white,
                                    border: T.border,
                                    borderRadius: '8px',
                                    color: T.forest,
                                    paddingLeft: '1rem',
                                    paddingRight: '3rem',
                                    paddingTop: '0.85rem',
                                    paddingBottom: '0.85rem',
                                    width: '100%',
                                    fontFamily: T.fontBody,
                                    fontWeight: 'bold',
                                    fontSize: '0.88rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} 
                                style={{ 
                                    position: 'absolute', 
                                    right: '1rem', 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'rgba(26,51,0,0.4)', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center' 
                                }}
                            >
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={changePassword}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: T.forest,
                            color: T.cream,
                            fontSize: '0.78rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            border: T.border,
                            borderRadius: '10px',
                            boxShadow: '4px 4px 0px #1a3300',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.25s ease',
                            marginTop: '0.5rem',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.borderColor = T.terracotta; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.borderColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '4px 4px 0px #1a3300'; }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                        Update Security Credentials
                    </button>
                </Card>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.4rem', color: T.forest, margin: 0 }} className="italic uppercase">Feedback Received</h3>
                        <p style={{ fontSize: '0.78rem', color: T.muted, fontWeight: 500, margin: '0.25rem 0 0 0' }}>Anonymous performance ratings from your tutoring sessions.</p>
                    </div>

                    {feedbackLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
                            <Loader2 className="animate-spin" size={32} style={{ color: T.terracotta }} />
                        </div>
                    ) : feedbackData.totalReviews === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 0', backgroundColor: T.white, border: '2.5px dashed rgba(26,51,0,0.15)', borderRadius: T.radius }}>
                            <Star style={{ margin: '0 auto 0.75rem auto', color: 'rgba(26,51,0,0.2)', display: 'block' }} size={40} />
                            <p style={{ fontWeight: 800, color: T.forest, margin: 0 }}>No feedback received yet</p>
                            <p style={{ color: T.muted, fontSize: '0.75rem', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>Complete tutoring sessions to receive ratings and client reviews.</p>
                        </div>
                    ) : (
                        <>
                            {/* Average Rating Block */}
                            <div 
                                style={{
                                    backgroundColor: T.cream,
                                    border: T.border,
                                    borderRadius: T.radius,
                                    boxShadow: T.shadow,
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                }}
                            >
                                <div>
                                    <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, margin: 0 }}>Average Rating</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star key={star} size={20} className={feedbackData.averageRating >= star ? 'text-[#ffe95c]' : 'text-zinc-200'} fill={feedbackData.averageRating >= star ? '#ffe95c' : 'none'} style={{ stroke: '#1a3300', strokeWidth: 1.5 }} />
                                        ))}
                                        <span style={{ fontFamily: T.fontDisplay, fontSize: '1.75rem', fontWeight: 900, color: T.forest, lineHeight: 1 }} className="ml-2 italic">{feedbackData.averageRating}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, margin: 0 }}>Total Reviews</p>
                                    <p style={{ fontFamily: T.fontDisplay, fontSize: '1.75rem', fontWeight: 900, color: T.forest, lineHeight: 1, marginTop: '0.5rem', margin: '0.5rem 0 0 0' }} className="italic">{feedbackData.totalReviews}</p>
                                </div>
                            </div>
                            
                            {/* Feedback List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
                                {feedbackData.feedback.map((fb, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{
                                            padding: '1.5rem',
                                            backgroundColor: T.white,
                                            border: T.border,
                                            borderRadius: T.radius,
                                            boxShadow: T.shadow,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.15rem' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star key={star} size={14} className={fb.rating >= star ? 'text-[#ffe95c]' : 'text-zinc-200'} fill={fb.rating >= star ? '#ffe95c' : 'none'} style={{ stroke: '#1a3300', strokeWidth: 1.5 }} />
                                                ))}
                                            </div>
                                            <span style={{ fontFamily: T.fontMono, fontSize: '0.62rem', color: T.muted, fontWeight: 700 }}>{new Date(fb.date).toLocaleDateString()}</span>
                                        </div>
                                        {fb.comment && <p style={{ fontSize: '0.85rem', color: T.forest, fontWeight: 500, lineHeight: 1.5, margin: 0 }}>"{fb.comment}"</p>}
                                        <p style={{ fontFamily: T.fontMono, fontSize: '0.58rem', color: T.muted, fontWeight: 800, margin: 0 }} className="uppercase tracking-wider">Topic: {fb.topic}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            )}
        </div>
    );
};

const InputField = ({ label, name, value, onChange, icon: Icon, placeholder = "" }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, color: T.muted }} className="uppercase tracking-widest block ml-1">{label}</label>
        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <Icon 
                style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    color: 'rgba(26, 51, 0, 0.4)',
                    pointerEvents: 'none',
                    zIndex: 10
                }} 
                size={18} 
            />
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    backgroundColor: T.white,
                    border: T.border,
                    borderRadius: '8px',
                    color: T.forest,
                    paddingLeft: '2.75rem',
                    paddingRight: '1rem',
                    paddingTop: '0.85rem',
                    paddingBottom: '0.85rem',
                    width: '100%',
                    fontFamily: T.fontBody,
                    fontWeight: 'bold',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    </div>
);

export default TeacherProfile;
