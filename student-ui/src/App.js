import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';

// Components
import TeacherDashboard from './components/TeacherDashboard';
import LessonCreator from './components/LessonCreator';
import IepGenerator from './components/IepGenerator';
import StudentDashboard from './components/StudentDashboard';
import LoginPage from './components/LoginPage';
import TestInterface from './components/TestInterface';
import MockTestHub from './components/student/MockTestHub';
import PeerTutoring from './components/PeerTutoring';
import TeacherProfile from './components/TeacherProfile';

// --- Teacher Side Layout ---
const TeacherLayout = ({ onLogout, user, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [prefillData, setPrefillData] = useState(null);

  const navigateToWithData = (tab, data) => {
    setPrefillData(data);
    setActiveTab(tab);
  };

  // Listen for navigation state from ProfileAvatar
  React.useEffect(() => {
    const state = window.history.state?.usr;
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      // Clear state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#0f172a] font-sans text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-[#0f172a] border-r border-white/5 p-8 flex flex-col gap-10 z-20">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ShikkhokSathi Logo" className="w-10 h-10 object-contain rounded-xl border border-white/10" />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">ShikkhokSathi</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">AI Teacher Suite</p>
          </div>
        </div>

        <nav className="flex flex-col gap-3">
          <button
            onClick={() => { setActiveTab('dashboard'); setPrefillData(null); }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> <span className="font-semibold text-sm">Command Center</span>
          </button>

          <button
            onClick={() => { setActiveTab('lesson'); setPrefillData(null); }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'lesson' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <BookOpen size={20} /> <span className="font-semibold text-sm">Lesson Co-Creator</span>
          </button>

          <button
            onClick={() => { setActiveTab('iep'); setPrefillData(null); }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'iep' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Users size={20} /> <span className="font-semibold text-sm">IEP Generator</span>
          </button>

          <button
            onClick={() => { setActiveTab('tutoring'); setPrefillData(null); }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'tutoring' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Users size={20} /> <span className="font-semibold text-sm">Peer Tutoring</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setPrefillData(null); }}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <UserIcon size={20} /> <span className="font-semibold text-sm">Profile</span>
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="p-5 bg-white/5 rounded-3xl border border-white/5 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold italic text-base">
                    {user?.name?.charAt(0) || 'T'}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">Teacher Active</p>
                </div>
                <p className="font-bold text-slate-200 text-[13px] truncate">{user?.name || 'Teacher Access'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 p-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-sm"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0f172a] relative">
        {activeTab === 'dashboard' && <TeacherDashboard onNavigate={navigateToWithData} user={user} />}
        {activeTab === 'lesson' && <LessonCreator prefillData={prefillData} user={user} />}
        {activeTab === 'iep' && <IepGenerator prefillData={prefillData} user={user} />}
        {activeTab === 'tutoring' && <PeerTutoring user={user} hideSidebar={true} />}
        {activeTab === 'profile' && <TeacherProfile user={user} onUserUpdate={onUserUpdate} />}
      </div>
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: !!localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    user: JSON.parse(localStorage.getItem('user'))
  });

  const handleLoginSuccess = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('user', JSON.stringify(data.user));
    setAuth({
      isAuthenticated: true,
      role: data.role,
      user: data.user
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuth({
      isAuthenticated: false,
      role: null,
      user: null
    });
  };

  const handleUserUpdate = (updatedUser) => {
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Update auth state
    setAuth(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  return (
    <Router>
      <Routes>
        {/* Unified Login Route */}
        <Route
          path="/"
          element={!auth.isAuthenticated ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to={`/${auth.role}/dashboard`} />}
        />

        {/* Legacy Login Redirect */}
        <Route path="/login" element={<Navigate to="/" />} />

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            auth.isAuthenticated && auth.role === 'teacher'
              ? <TeacherLayout onLogout={handleLogout} user={auth.user} onUserUpdate={handleUserUpdate} />
              : <Navigate to="/" />
          }
        />

        {/* Protected Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            auth.isAuthenticated && auth.role === 'student'
              ? (
                <div style={{ backgroundColor: '#fcfaf5' }} className="flex flex-col h-screen">
                  <StudentDashboard user={auth.user} onUserUpdate={handleUserUpdate} />
                  <button
                    onClick={handleLogout}
                    className="fixed bottom-8 right-8 z-50"
                    style={{
                      padding: '0.8rem',
                      backgroundColor: '#1a3300',
                      color: '#fcfaf5',
                      borderRadius: '10px',
                      border: '2px solid #1a3300',
                      boxShadow: '3px 3px 0px rgba(26,51,0,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Logout"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#cb5521'; e.currentTarget.style.borderColor = '#cb5521'; e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px #1a3300'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1a3300'; e.currentTarget.style.borderColor = '#1a3300'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '3px 3px 0px rgba(26,51,0,0.2)'; }}
                  >
                    <LogOut size={22} />
                  </button>
                </div>
              )
              : <Navigate to="/" />
          }
        />

        <Route
          path="/test/:id"
          element={
            auth.isAuthenticated && auth.role === 'student'
              ? <TestInterface user={auth.user} />
              : <Navigate to="/" />
          }
        />

        {/* Mock Test Hub Route */}
        <Route
          path="/student/mock-tests"
          element={
            auth.isAuthenticated && auth.role === 'student'
              ? (
                <div className="flex flex-col h-screen">
                  <MockTestHub user={auth.user} />
                  <button
                    onClick={handleLogout}
                    className="fixed bottom-8 right-8 p-4 bg-rose-600/20 text-rose-400 rounded-full hover:bg-rose-600/30 transition-all shadow-xl backdrop-blur-md z-50 group"
                    title="Logout"
                  >
                    <LogOut size={24} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )
              : <Navigate to="/" />
          }
        />

        {/* Peer Tutoring Route */}
        <Route
          path="/tutoring"
          element={
            auth.isAuthenticated && auth.role === 'student'
              ? (
                <div className="flex flex-col h-screen">
                  <PeerTutoring user={auth.user} />
                  <button
                    onClick={handleLogout}
                    className="fixed bottom-8 right-8 p-4 bg-rose-600/20 text-rose-400 rounded-full hover:bg-rose-600/30 transition-all shadow-xl backdrop-blur-md z-50 group"
                    title="Logout"
                  >
                    <LogOut size={24} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              )
              : auth.isAuthenticated && auth.role === 'teacher'
                ? <Navigate to="/teacher/dashboard" state={{ activeTab: 'tutoring' }} />
                : <Navigate to="/" />
          }
        />



        {/* Catch-all Redirect */}
        <Route
          path="*"
          element={<Navigate to={auth.isAuthenticated ? `/${auth.role}/dashboard` : "/"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;