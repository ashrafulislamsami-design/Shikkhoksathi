import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
    User as UserIcon,
    Upload,
    Lock,
    Save,
    X,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Star,
    Loader2
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

const StudentProfile = ({ user, onProfileUpdate }) => {
    const [activeTab, setActiveTab] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Personal Info State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar: user?.avatar || null,
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

    // Strong Zones State
    const [strongZones, setStrongZones] = useState(user?.profile?.strengths || []);
    const [newStrengthInput, setNewStrengthInput] = useState('');

    // Sync formData and strongZones when user prop changes
    useEffect(() => {
        setFormData({
            name: user?.name || '',
            avatar: user?.avatar || null,
        });
        setStrongZones(user?.profile?.strengths || []);
    }, [user?.name, user?.avatar, user?.profile?.strengths]);

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
            // Validate file size (max 500KB for compressed)
            if (file.size > 500000) {
                setError('Image size must be less than 500KB. Please compress your image.');
                return;
            }

            // Validate file type
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

                    let width = img.width;
                    let height = img.height;
                    const maxSize = 400;

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
                    setFormData(prev => ({
                        ...prev,
                        avatar: compressedData
                    }));
                    setError(null);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddStrength = () => {
        if (newStrengthInput.trim() && !strongZones.includes(newStrengthInput.trim())) {
            setStrongZones([...strongZones, newStrengthInput.trim()]);
            setNewStrengthInput('');
            setError(null);
        }
    };

    const handleRemoveStrength = (strength) => {
        setStrongZones(strongZones.filter(s => s !== strength));
    };

    const updatePersonalInfo = async () => {
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
            const response = await axios.put('http://localhost:5000/api/student/profile', {
                name: formData.name,
                avatar: formData.avatar
            }, config);

            if (response.data.success) {
                setSuccess('Profile updated successfully!');
                onProfileUpdate?.(response.data.data);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            console.error('Update profile error:', err);
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        if (!passwordData.currentPassword) {
            setError('Please enter your current password');
            return;
        }
        if (!passwordData.newPassword) {
            setError('Please enter a new password');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (passwordData.currentPassword === passwordData.newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.post('http://localhost:5000/api/student/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmPassword: passwordData.confirmPassword
            }, config);

            if (response.data.success) {
                setSuccess('Password updated successfully!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
            console.error('Change password error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStrongZones = async () => {
        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.put('http://localhost:5000/api/student/profile', {
                profile: {
                    strengths: strongZones
                }
            }, config);

            if (response.data.success) {
                setSuccess('Strong zones updated successfully!');
                onProfileUpdate?.(response.data.data);
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update strong zones');
            console.error('Update strong zones error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontBody, color: T.forest }}>
            
            {/* Success Alert */}
            {success && (
                <div 
                    className="p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                    style={{ backgroundColor: 'rgba(213, 245, 194, 0.4)', border: '1.5px solid #2e7d32', color: '#1b5e20' }}
                >
                    <Check size={20} />
                    <p className="font-bold text-sm">{success}</p>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div 
                    className="p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300"
                    style={{ backgroundColor: 'rgba(254, 226, 226, 0.4)', border: '1.5px solid #d32f2f', color: '#c62828' }}
                >
                    <AlertCircle size={20} />
                    <p className="font-bold text-sm">{error}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-3 pb-3 border-b border-solid" style={{ borderColor: 'rgba(26,51,0,0.08)' }}>
                <button
                    onClick={() => setActiveTab('personal')}
                    style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: activeTab === 'personal' ? T.yellow : T.white,
                        border: T.border,
                        borderRadius: '8px',
                        boxShadow: activeTab === 'personal' ? '2px 2px 0px #1a3300' : 'none',
                        color: T.forest,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <UserIcon className="inline mr-2" size={16} />
                    Personal Info
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: activeTab === 'password' ? T.yellow : T.white,
                        border: T.border,
                        borderRadius: '8px',
                        boxShadow: activeTab === 'password' ? '2px 2px 0px #1a3300' : 'none',
                        color: T.forest,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <Lock className="inline mr-2" size={16} />
                    Password
                </button>
                <button
                    onClick={() => setActiveTab('strengths')}
                    style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: activeTab === 'strengths' ? T.yellow : T.white,
                        border: T.border,
                        borderRadius: '8px',
                        boxShadow: activeTab === 'strengths' ? '2px 2px 0px #1a3300' : 'none',
                        color: T.forest,
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <Star className="inline mr-2" size={16} />
                    Strong Zones
                </button>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
                <div 
                    className="p-8 shadow-xl"
                    style={{ backgroundColor: T.white, border: T.border, borderRadius: T.radius, boxShadow: T.shadow }}
                >
                    <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest, marginBottom: '1.5rem' }}>Personal Information</h3>

                    {/* Avatar Section */}
                    <div className="mb-6 flex flex-col sm:flex-row items-center gap-6">
                        <div 
                            className="w-28 h-28 bg-[#fdfaf5] flex items-center justify-center text-[#1a3300] overflow-hidden"
                            style={{ border: T.border, borderRadius: T.radius, boxShadow: '2px 2px 0px #1a3300' }}
                        >
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={48} />
                            )}
                        </div>
                        <div className="flex flex-col items-center sm:items-start">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-5 py-2.5 text-[#fcfaf5] font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                                style={{
                                    backgroundColor: T.terracotta,
                                    border: T.border,
                                    boxShadow: '2px 2px 0px #1a3300',
                                    fontSize: '0.78rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                            >
                                <Upload size={16} />
                                Upload Photo
                            </button>
                            <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', color: T.muted, fontWeight: 700, marginTop: '0.5rem' }}>
                                JPG, PNG (Max 500KB)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Name Field */}
                    <div className="mb-6">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#fcfaf5] rounded-xl text-[#1a3300] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1a3300] transition-all"
                            style={{ border: T.border, fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600 }}
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Student ID (Read-only) */}
                    <div className="mb-6">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Student ID
                        </label>
                        <input
                            type="text"
                            value={user?.studentId || 'Not Assigned'}
                            disabled
                            className="w-full px-4 py-3 rounded-xl font-mono cursor-not-allowed"
                            style={{ border: T.border, backgroundColor: '#f3efdf', color: T.muted, fontStyle: 'italic', fontSize: '0.9rem' }}
                        />
                        <p style={{ fontFamily: T.fontMono, fontSize: '0.6rem', color: 'rgba(26,51,0,0.4)', marginTop: '0.35rem' }}>Your unique identification ID</p>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="mb-6">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-3 rounded-xl cursor-not-allowed"
                            style={{ border: T.border, backgroundColor: '#f3efdf', color: T.muted, fontStyle: 'italic', fontSize: '0.9rem' }}
                        />
                        <p style={{ fontFamily: T.fontMono, fontSize: '0.6rem', color: 'rgba(26,51,0,0.4)', marginTop: '0.35rem' }}>Email cannot be changed</p>
                    </div>

                    {/* Class (Read-only) */}
                    <div className="mb-8">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Class Level
                        </label>
                        <input
                            type="text"
                            value={`Class ${user?.profile?.class || user?.studentClass || '10'}`}
                            disabled
                            className="w-full px-4 py-3 rounded-xl cursor-not-allowed font-bold"
                            style={{ border: T.border, backgroundColor: '#f3efdf', color: T.muted, fontStyle: 'italic', fontSize: '0.9rem' }}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={updatePersonalInfo}
                        disabled={loading}
                        className="w-full py-3.5 text-[#fcfaf5] font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        style={{
                            backgroundColor: T.terracotta,
                            border: T.border,
                            boxShadow: '3px 3px 0px #1a3300',
                            fontSize: '0.82rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Saving Profile...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Profile Changes
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
                <div 
                    className="p-8 shadow-xl"
                    style={{ backgroundColor: T.white, border: T.border, borderRadius: T.radius, boxShadow: T.shadow }}
                >
                    <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest, marginBottom: '0.5rem' }}>Change Password</h3>
                    <p style={{ color: T.muted, fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Enter your current password and set a new one. The password must be at least 6 characters long.
                    </p>

                    {/* Current Password */}
                    <div className="mb-5">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 bg-[#fcfaf5] rounded-xl text-[#1a3300] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1a3300] transition-all pr-12"
                                style={{ border: T.border, fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600 }}
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({
                                    ...prev,
                                    current: !prev.current
                                }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#1a3300]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="mb-5">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 bg-[#fcfaf5] rounded-xl text-[#1a3300] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1a3300] transition-all pr-12"
                                style={{ border: T.border, fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600 }}
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({
                                    ...prev,
                                    new: !prev.new
                                }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#1a3300]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-8">
                        <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 bg-[#fcfaf5] rounded-xl text-[#1a3300] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1a3300] transition-all pr-12"
                                style={{ border: T.border, fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600 }}
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({
                                    ...prev,
                                    confirm: !prev.confirm
                                }))}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#1a3300]"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Change Button */}
                    <button
                        onClick={changePassword}
                        disabled={loading}
                        className="w-full py-3.5 text-[#fcfaf5] font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        style={{
                            backgroundColor: T.terracotta,
                            border: T.border,
                            boxShadow: '3px 3px 0px #1a3300',
                            fontSize: '0.82rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Updating Password...
                            </>
                        ) : (
                            <>
                                <Lock size={18} />
                                Update Password
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Strong Zones Tab */}
            {activeTab === 'strengths' && (
                <div 
                    className="p-8 shadow-xl"
                    style={{ backgroundColor: T.white, border: T.border, borderRadius: T.radius, boxShadow: T.shadow }}
                >
                    <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest, marginBottom: '0.25rem' }}>Strong Zones</h3>
                    <p style={{ color: T.muted, fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                        Add and manage your areas of expertise and strength topics.
                    </p>

                    {/* Input Field */}
                    <div className="mb-6 flex gap-3">
                        <input
                            type="text"
                            value={newStrengthInput}
                            onChange={(e) => setNewStrengthInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddStrength()}
                            className="flex-1 px-4 py-3 bg-[#fcfaf5] rounded-xl text-[#1a3300] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1a3300] transition-all"
                            style={{ border: T.border, fontFamily: T.fontBody, fontSize: '0.9rem', fontWeight: 600 }}
                            placeholder="Add a strong zone (e.g., Mathematics, Physics)"
                        />
                        <button
                            onClick={handleAddStrength}
                            className="px-5 py-2.5 text-[#fcfaf5] font-bold rounded-lg transition-all cursor-pointer"
                            style={{
                                backgroundColor: T.forest,
                                border: T.border,
                                boxShadow: '2px 2px 0px #1a3300',
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300'; }}
                        >
                            Add
                        </button>
                    </div>

                    {/* Strong Zones List */}
                    {strongZones.length > 0 ? (
                        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {strongZones.map((strength, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3.5 bg-[#fcfaf5] border-2 border-[#1a3300] rounded-xl group hover:shadow-[2px_2px_0px_#1a3300] transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <Star className="text-amber-500" size={18} />
                                        <span className="text-[#1a3300] font-bold" style={{ fontSize: '0.88rem' }}>{strength}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStrength(strength)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                        style={{ background: 'none', border: 'none' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div 
                            className="mb-8 p-8 text-center rounded-xl"
                            style={{ backgroundColor: T.cream, border: '1.5px dashed rgba(26,51,0,0.15)' }}
                        >
                            <Star className="mx-auto text-slate-400 mb-3" size={32} />
                            <p style={{ color: T.muted, fontSize: '0.82rem', fontWeight: 600 }}>No strong zones added yet</p>
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={updateStrongZones}
                        disabled={loading}
                        className="w-full py-3.5 text-[#fcfaf5] font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        style={{
                            backgroundColor: T.terracotta,
                            border: T.border,
                            boxShadow: '3px 3px 0px #1a3300',
                            fontSize: '0.82rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.forest; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.terracotta; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300'; }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Saving Zones...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Strong Zones
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
