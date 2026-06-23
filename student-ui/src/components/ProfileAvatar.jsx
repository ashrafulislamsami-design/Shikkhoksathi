import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings } from 'lucide-react';

const ProfileAvatar = ({ user, size = 'md', showSettings = true }) => {
  const navigate = useNavigate();

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 32
  };

  const handleClick = () => {
    if (showSettings) {
      const path = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
      navigate(path, { state: { activeTab: 'profile' } });
    }
  };

  return (
    <div className="relative group">
      {/* Avatar Circle */}
      <button
        onClick={handleClick}
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-white/10 hover:border-blue-500/50 transition-all hover:scale-110 flex-shrink-0`}
        title={user?.name || 'Profile'}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <UserIcon size={iconSizes[size]} />
        )}
      </button>

      {/* Tooltip & Settings Menu */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap">
          <div className="bg-[#fcfaf5] border border-[#1a3300] rounded-xl shadow-lg p-4 min-w-max animate-in fade-in slide-in-from-top-2 relative z-50">
            {/* Student Name */}
            <p className="text-sm font-bold text-[#1a3300] truncate max-w-xs">
              {user?.name || 'Student'}
            </p>
            <p className="text-[10px] text-[#1a3300]/60 font-bold uppercase tracking-wider mt-0.5 mb-3">
              Class {user?.profile?.class || user?.studentClass || 'X'}
            </p>

            {/* Divider */}
            <div className="h-px bg-[#1a3300]/10 mb-3"></div>

            {/* Settings Button */}
            <button
              onClick={handleClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1a3300] hover:bg-[#1a3300]/5 rounded-lg transition-all border-none shadow-none"
            >
              <Settings size={14} className="text-[#1a3300]" />
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
