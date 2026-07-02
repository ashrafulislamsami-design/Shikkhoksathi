import React, { useState, useEffect } from 'react';
import { X, Settings, BookOpen, Globe, Hash, AlertTriangle, TrendingUp } from 'lucide-react';
import axios from 'axios';

const MockTestConfigModal = ({ isOpen, onClose, onStart, preselectedSubject, user }) => {
    const userProfile = user?.profile;
    const [config, setConfig] = useState({
        testType: 'topic_specific',
        subject: preselectedSubject || '',
        userClass: user?.studentClass || userProfile?.class || userProfile?.classLevel || 10,
        targetClass: user?.studentClass || userProfile?.class || userProfile?.classLevel || 10,
        stream: user?.stream || userProfile?.stream || null,
        language: userProfile?.preferredLanguage || 'english',
        questionCount: 10,
        questionType: 'mcq',
        chapter: '1'
    });

    const [subjects, setSubjects] = useState([]);
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [requiresStream, setRequiresStream] = useState(false);

    // Fetch subjects when class or stream changes
    useEffect(() => {
        if (!isOpen) return;

        const fetchSubjects = async () => {
            setLoading(true);
            const classLevel = String(config.targetClass).replace(/[^0-9]/g, '');
            const stream = config.stream;

            console.log(`[DEBUG] Fetching subjects for Class: ${classLevel}, Stream: ${stream}`);

            try {
                const response = await axios.get(`http://localhost:5000/api/meta/subjects`, {
                    params: { classLevel, stream }
                });

                console.log('[DEBUG] Subjects response:', response.data);

                if (response.data.success) {
                    const fetchedSubjects = response.data.data.subjects || [];
                    setSubjects(fetchedSubjects);
                    setStreams(response.data.data.availableStreams || []);
                    setRequiresStream(response.data.data.requiresStream || false);

                    // Auto-select first subject if current/preselected one is missing
                    if (preselectedSubject && fetchedSubjects.includes(preselectedSubject)) {
                        setConfig(prev => ({ ...prev, subject: preselectedSubject }));
                    } else if (fetchedSubjects.length > 0) {
                        const currentInList = fetchedSubjects.includes(config.subject);
                        if (!currentInList) {
                            setConfig(prev => ({ ...prev, subject: fetchedSubjects[0] }));
                        }
                    }
                }
            } catch (error) {
                console.error('[DEBUG] Failed to fetch subjects:', error.message, error.response?.data);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [config.targetClass, config.stream, isOpen]);

    // Update config when user or preselectedSubject changes
    useEffect(() => {
        if (isOpen && user) {
            console.log('[DEBUG] Updating modal config from user object:', user);
            const userProfile = user.profile;
            setConfig(prev => {
                const rawClass = user.studentClass || userProfile?.class || userProfile?.classLevel || 10;
                let sanitizedClass = String(rawClass).trim().toUpperCase();

                // Map HSC strings to numbers for backend compatibility
                if (sanitizedClass.includes('HSC1')) sanitizedClass = "11";
                else if (sanitizedClass.includes('HSC2')) sanitizedClass = "12";
                else sanitizedClass = sanitizedClass.replace(/[^0-9]/g, '') || "10";

                return {
                    ...prev,
                    userClass: sanitizedClass,
                    // If targetClass was just the default 10, update it to student's class
                    targetClass: (prev.targetClass === 10 || prev.targetClass === "10") ? sanitizedClass : prev.targetClass,
                    stream: prev.stream || user.stream || userProfile?.stream || null,
                    language: prev.language || user.preferredLanguage || userProfile?.preferredLanguage || 'english',
                    subject: preselectedSubject || prev.subject || ''
                };
            });
        }
    }, [isOpen, user, preselectedSubject]);

    if (!isOpen) return null;

    const handleStart = () => {
        onStart({
            ...config,
            classLevel: config.targetClass // Use targetClass for test generation
        });
        onClose();
    };

    const isDifficultyWarning = parseInt(config.targetClass) > parseInt(config.userClass);
    const isRemedial = parseInt(config.targetClass) < parseInt(config.userClass);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div 
                className="relative w-full max-w-md p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto"
                style={{
                    backgroundColor: '#fcfaf5',
                    border: '2px solid #1a3300',
                    boxShadow: '8px 8px 0px #1a3300',
                    borderRadius: '16px',
                    color: '#1a3300',
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                    style={{
                        backgroundColor: '#fcfaf5',
                        border: '2px solid #1a3300',
                        boxShadow: '2px 2px 0px #1a3300',
                        borderRadius: '8px',
                        color: '#1a3300',
                        cursor: 'pointer'
                    }}
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#1a3300]/10">
                    <div 
                        className="w-12 h-12 flex items-center justify-center"
                        style={{
                            backgroundColor: '#ffe95c',
                            border: '2px solid #1a3300',
                            borderRadius: '12px',
                            boxShadow: '2px 2px 0px #1a3300'
                        }}
                    >
                        <Settings size={22} className="text-[#1a3300]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#1a3300]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Configure Test</h2>
                        <p className="text-[10px] text-[#cb5521] font-bold uppercase tracking-wider font-mono">Customize Your Assessment</p>
                    </div>
                </div>

                {/* Cross-Class Difficulty Warning */}
                {isDifficultyWarning && (
                    <div 
                        className="mb-4 p-4 rounded-xl flex items-start gap-3"
                        style={{
                            backgroundColor: '#fffbeb',
                            border: '2px solid #1a3300',
                            boxShadow: '3px 3px 0px #1a3300'
                        }}
                    >
                        <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-amber-800 uppercase tracking-wider font-mono">High Difficulty Mode Active</p>
                            <p className="text-xs text-amber-950 mt-1">You're attempting Class {config.targetClass} questions. Expect Expert/Olympiad level difficulty!</p>
                        </div>
                    </div>
                )}

                {isRemedial && (
                    <div 
                        className="mb-4 p-4 rounded-xl flex items-start gap-3"
                        style={{
                            backgroundColor: '#eff6ff',
                            border: '2px solid #1a3300',
                            boxShadow: '3px 3px 0px #1a3300'
                        }}
                    >
                        <TrendingUp size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-blue-800 uppercase tracking-wider font-mono">Remedial Mode Active</p>
                            <p className="text-xs text-blue-950 mt-1">Reviewing Class {config.targetClass} fundamentals. Great for strengthening basics!</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    {/* Test Type */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 font-mono">
                            Test Type
                        </label>
                        <select
                            value={config.testType}
                            onChange={(e) => setConfig({ ...config, testType: e.target.value })}
                            className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '10px',
                                boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                color: '#1a3300',
                                fontWeight: 700
                            }}
                        >
                            <option value="topic_specific">Topic Specific</option>
                            <option value="full_syllabus">Full Syllabus</option>
                        </select>
                    </div>

                    {/* Question Type */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 font-mono">
                            Question Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfig({ ...config, questionType: 'mcq', questionCount: 10 })}
                                className="px-4 py-3 rounded-xl font-bold transition-all text-xs"
                                style={{
                                    backgroundColor: config.questionType === 'mcq' ? '#ffe95c' : '#ffffff',
                                    border: '2px solid #1a3300',
                                    boxShadow: config.questionType === 'mcq' ? '3px 3px 0px #1a3300' : '2px 2px 0px rgba(26,51,0,0.15)',
                                    color: '#1a3300',
                                    transform: config.questionType === 'mcq' ? 'translate(-2px, -2px)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                MCQ
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, questionType: 'cq', questionCount: 5 })}
                                className="px-4 py-3 rounded-xl font-bold transition-all text-xs"
                                style={{
                                    backgroundColor: config.questionType === 'cq' ? '#ffe95c' : '#ffffff',
                                    border: '2px solid #1a3300',
                                    boxShadow: config.questionType === 'cq' ? '3px 3px 0px #1a3300' : '2px 2px 0px rgba(26,51,0,0.15)',
                                    color: '#1a3300',
                                    transform: config.questionType === 'cq' ? 'translate(-2px, -2px)' : 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                CQ (Creative)
                            </button>
                        </div>
                    </div>

                    {/* Chapter Selection */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 font-mono">
                            Select Chapter
                        </label>
                        <select
                            value={config.chapter}
                            onChange={(e) => setConfig({ ...config, chapter: e.target.value })}
                            className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '10px',
                                boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                color: '#1a3300',
                                fontWeight: 700
                            }}
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    Chapter {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Class Level */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 font-mono">
                            Target Class Level
                        </label>
                        <select
                            value={config.targetClass}
                            onChange={(e) => setConfig({ ...config, targetClass: e.target.value, stream: null })}
                            className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '10px',
                                boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                color: '#1a3300',
                                fontWeight: 700
                            }}
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    Class {i + 1} {i + 1 === parseInt(config.userClass) ? '(Your Class)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stream Selection (for Classes 9-12) */}
                    {requiresStream && streams.length > 0 && (
                        <div>
                            <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 font-mono">
                                Stream
                            </label>
                            <select
                                value={config.stream || ''}
                                onChange={(e) => setConfig({ ...config, stream: e.target.value })}
                                className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: '2px solid #1a3300',
                                    borderRadius: '10px',
                                    boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                    color: '#1a3300',
                                    fontWeight: 700
                                }}
                            >
                                <option value="">Select Stream</option>
                                {streams.map((stream) => (
                                    <option key={stream} value={stream}>
                                        {stream.charAt(0).toUpperCase() + stream.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Subject */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
                            <BookOpen size={14} />
                            Subject {loading && <span className="text-[#cb5521] animate-pulse">(Loading...)</span>}
                        </label>
                        <select
                            value={config.subject}
                            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                            disabled={loading || subjects.length === 0}
                            className="w-full px-4 py-3 text-sm focus:outline-none transition-all disabled:opacity-50"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '10px',
                                boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                color: '#1a3300',
                                fontWeight: 700
                            }}
                        >
                            {subjects.length === 0 ? (
                                <option>No subjects available</option>
                            ) : (
                                subjects.map((subject) => (
                                    <option key={subject} value={subject}>
                                        {subject}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
                            <Globe size={14} />
                            Language
                        </label>
                        <select
                            value={config.language}
                            onChange={(e) => setConfig({ ...config, language: e.target.value })}
                            className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
                            style={{
                                backgroundColor: '#ffffff',
                                border: '2px solid #1a3300',
                                borderRadius: '10px',
                                boxShadow: '2px 2px 0px rgba(26,51,0,0.15)',
                                color: '#1a3300',
                                fontWeight: 700
                            }}
                        >
                            <option value="english">English</option>
                            <option value="bangla">Bangla</option>
                        </select>
                    </div>

                    {/* Question Count */}
                    <div>
                        <label className="block text-[11px] font-extrabold text-[#1a3300] uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
                            <Hash size={14} />
                            Question Count
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {config.questionType === 'cq' ? (
                                <button
                                    className="px-4 py-3 rounded-xl font-bold transition-all text-xs col-span-3"
                                    style={{
                                        backgroundColor: '#f6d0ff',
                                        border: '2px solid #1a3300',
                                        boxShadow: '3px 3px 0px #1a3300',
                                        color: '#1a3300',
                                        transform: 'translate(-2px, -2px)',
                                        fontWeight: 800
                                    }}
                                    disabled
                                >
                                    5 Questions (Max for CQ)
                                </button>
                            ) : (
                                [10, 20, 30].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setConfig({ ...config, questionCount: count })}
                                        className="px-4 py-3 rounded-xl font-bold transition-all text-xs"
                                        style={{
                                            backgroundColor: config.questionCount === count ? '#ffe95c' : '#ffffff',
                                            border: '2px solid #1a3300',
                                            boxShadow: config.questionCount === count ? '3px 3px 0px #1a3300' : '2px 2px 0px rgba(26,51,0,0.15)',
                                            color: '#1a3300',
                                            transform: config.questionCount === count ? 'translate(-2px, -2px)' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {count}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStart}
                    disabled={loading || !config.subject || (requiresStream && !config.stream)}
                    className="w-full mt-6 px-6 py-4 font-black rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        backgroundColor: '#cb5521',
                        border: '2px solid #1a3300',
                        boxShadow: '4px 4px 0px #1a3300',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        letterSpacing: '0.05em'
                    }}
                >
                    {isDifficultyWarning ? '⚡ START CHALLENGE MODE' : isRemedial ? '📚 START REVIEW MODE' : 'START TEST'}
                </button>
            </div>
        </div>
    );
};

export default MockTestConfigModal;
