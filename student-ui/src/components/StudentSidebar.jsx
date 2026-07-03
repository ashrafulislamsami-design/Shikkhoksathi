import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Briefcase,
    Trophy,
    Users,
    User as UserIcon,
    Menu,
    X
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';

const StudentSidebar = ({ user, activeTab, setActiveTab }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const isMockTestsActive = location.pathname.includes('/student/mock-tests');
    const isTutoringActive = location.pathname.includes('/tutoring');
    const isDashboard = location.pathname.includes('/student/dashboard');

    const handleTabClick = (tab) => {
        setIsOpen(false);
        if (setActiveTab) {
            setActiveTab(tab);
        } else {
            navigate('/student/dashboard', { state: { activeTab: tab } });
        }
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, isActive: isDashboard && activeTab === 'overview', onClick: () => handleTabClick('overview') },
        { id: 'mock-tests', label: 'Mock Tests', icon: BookOpen, isActive: isMockTestsActive, onClick: () => { setIsOpen(false); navigate('/student/mock-tests'); } },
        { id: 'career', label: 'Career Roadmaps', icon: Briefcase, isActive: isDashboard && activeTab === 'career', onClick: () => handleTabClick('career') },
        { id: 'tutoring', label: 'Peer Tutoring', icon: Users, isActive: isTutoringActive, onClick: () => { setIsOpen(false); navigate('/tutoring'); } },
        { id: 'game', label: 'Gamification', icon: Trophy, isActive: isDashboard && activeTab === 'game', onClick: () => handleTabClick('game') },
        { id: 'profile', label: 'Profile', icon: UserIcon, isActive: isDashboard && activeTab === 'profile', onClick: () => handleTabClick('profile') },
    ];

    return (
        <>
            {/* Mobile Hamburger Menu Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-40 md:hidden p-2.5 rounded-lg border-2 border-[#1a3300] bg-[#f5f1e6] active:scale-95 shadow-[2px_2px_0px_#1a3300]"
                style={{ cursor: 'pointer' }}
            >
                <Menu size={20} style={{ color: '#1a3300' }} />
            </button>

            {/* Backdrop overlay for mobile menu */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/35 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-72 h-full flex flex-col transition-transform duration-300 transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:flex'}`}
                style={{
                    backgroundColor: '#f5f1e6',
                    borderRight: '2px solid #1a3300',
                    padding: '2rem',
                    gap: '1.5rem',
                    backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.02) 1px, transparent 1px)',
                    backgroundSize: '12px auto',
                }}
            >
                {/* Mobile Close Button inside sidebar */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 md:hidden p-1.5 rounded-lg border-2 border-[#1a3300] bg-[#ffffff] active:scale-95 shadow-[2px_2px_0px_#1a3300]"
                    style={{ cursor: 'pointer' }}
                >
                    <X size={16} style={{ color: '#1a3300' }} />
                </button>

                {/* Brand */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <img
                        src="/logo.png"
                        alt="ShikkhokSathi Logo"
                        className="w-10 h-10 object-contain"
                        style={{ borderRadius: '8px', border: '1.5px solid #1a3300' }}
                    />
                    <div>
                        <h2
                            className="text-lg leading-none"
                            style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif", fontWeight: 800, color: '#1a3300', letterSpacing: '-0.01em' }}
                        >
                            ShikkhokSathi
                        </h2>
                        <p
                            className="mt-1 leading-none"
                            style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(26,51,0,0.45)', fontFamily: "'Roboto Mono', monospace" }}
                        >
                            Student Portal
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1.5 mt-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={item.onClick}
                                className="flex items-center gap-3 transition-all duration-200"
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    border: item.isActive ? '1.5px solid #1a3300' : '1.5px solid transparent',
                                    backgroundColor: item.isActive ? '#ffe95c' : 'transparent',
                                    color: '#1a3300',
                                    fontWeight: item.isActive ? 800 : 600,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: item.isActive ? '3px 3px 0px #1a3300' : 'none',
                                    transform: item.isActive ? 'translate(-2px, -2px)' : 'none',
                                }}
                                onMouseEnter={(e) => {
                                    if (!item.isActive) {
                                        e.currentTarget.style.backgroundColor = '#ffe95c';
                                        e.currentTarget.style.borderColor = '#1a3300';
                                        e.currentTarget.style.transform = 'translate(-1px, -1px)';
                                        e.currentTarget.style.boxShadow = '2px 2px 0px #1a3300';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!item.isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <Icon size={18} /> <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Card */}
                <div
                    className="mt-auto"
                    style={{
                        padding: '1.25rem',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #1a3300',
                        borderRadius: '12px',
                        boxShadow: '3px 3px 0px rgba(26,51,0,0.12)',
                    }}
                >
                    <div className="flex items-center justify-center mb-3">
                        <ProfileAvatar user={user} size="md" showSettings={true} />
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(26,51,0,0.45)' }}>
                            Student Active
                        </p>
                    </div>
                    <p style={{ fontWeight: 800, color: '#1a3300', fontSize: '0.88rem' }} className="truncate">
                        {user?.name || 'Student Access'}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(26,51,0,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '0.2rem' }}>
                        Class {user?.profile?.class || 'X'}
                    </p>
                </div>
            </div>
        </>
    );
};

export default StudentSidebar;
