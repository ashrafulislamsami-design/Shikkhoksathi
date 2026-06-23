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
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-blue-900/20 p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <X size={20} className="text-white/60" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Settings size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">Configure Test</h2>
                        <p className="text-xs text-white/40 uppercase tracking-wider">Customize Your Assessment</p>
                    </div>
                </div>

                {/* Cross-Class Difficulty Warning */}
                {isDifficultyWarning && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">High Difficulty Mode Active</p>
                            <p className="text-xs text-amber-300/80 mt-1">You're attempting Class {config.targetClass} questions. Expect Expert/Olympiad level difficulty!</p>
                        </div>
                    </div>
                )}

                {isRemedial && (
                    <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                        <TrendingUp size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Remedial Mode Active</p>
                            <p className="text-xs text-blue-300/80 mt-1">Reviewing Class {config.targetClass} fundamentals. Great for strengthening basics!</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">
                    {/* Test Type */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Test Type
                        </label>
                        <select
                            value={config.testType}
                            onChange={(e) => setConfig({ ...config, testType: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="topic_specific" className="bg-slate-900">Topic Specific</option>
                            <option value="full_syllabus" className="bg-slate-900">Full Syllabus</option>
                        </select>
                    </div>

                    {/* Question Type - NEW */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Question Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfig({ ...config, questionType: 'mcq', questionCount: 10 })}
                                className={`px-4 py-3 rounded-xl font-bold transition-all ${config.questionType === 'mcq'
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-900/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                MCQ
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, questionType: 'cq', questionCount: 5 })}
                                className={`px-4 py-3 rounded-xl font-bold transition-all ${config.questionType === 'cq'
                                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-900/30'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                CQ (Creative)
                            </button>
                        </div>
                    </div>

                    {/* Chapter Selection - NEW */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Select Chapter
                        </label>
                        <select
                            value={config.chapter}
                            onChange={(e) => setConfig({ ...config, chapter: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1} className="bg-slate-900">
                                    Chapter {i + 1}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Class Level */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                            Target Class Level
                        </label>
                        <select
                            value={config.targetClass}
                            onChange={(e) => setConfig({ ...config, targetClass: e.target.value, stream: null })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1} className="bg-slate-900">
                                    Class {i + 1} {i + 1 === parseInt(config.userClass) ? '(Your Class)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Stream Selection (for Classes 9-12) */}
                    {requiresStream && streams.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">
                                Stream
                            </label>
                            <select
                                value={config.stream || ''}
                                onChange={(e) => setConfig({ ...config, stream: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            >
                                <option value="" className="bg-slate-900">Select Stream</option>
                                {streams.map((stream) => (
                                    <option key={stream} value={stream} className="bg-slate-900">
                                        {stream.charAt(0).toUpperCase() + stream.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Subject (Auto-fetched based on class) */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <BookOpen size={14} />
                            Subject {loading && <span className="text-blue-400 animate-pulse">(Loading...)</span>}
                        </label>
                        <select
                            value={config.subject}
                            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                            disabled={loading || subjects.length === 0}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                        >
                            {subjects.length === 0 ? (
                                <option className="bg-slate-900">No subjects available</option>
                            ) : (
                                subjects.map((subject) => (
                                    <option key={subject} value={subject} className="bg-slate-900">
                                        {subject}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Globe size={14} />
                            Language
                        </label>
                        <select
                            value={config.language}
                            onChange={(e) => setConfig({ ...config, language: e.target.value })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="english" className="bg-slate-900">English</option>
                            <option value="bangla" className="bg-slate-900">Bangla</option>
                        </select>
                    </div>

                    {/* Question Count */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Hash size={14} />
                            Question Count
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {config.questionType === 'cq' ? (
                                <button
                                    className="px-4 py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all col-span-3"
                                    disabled
                                >
                                    5 Questions (Max for CQ)
                                </button>
                            ) : (
                                [10, 20, 30].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => setConfig({ ...config, questionCount: count })}
                                        className={`px-4 py-3 rounded-xl font-bold transition-all ${config.questionCount === count
                                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-900/30'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                            }`}
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
                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDifficultyWarning ? '⚡ START CHALLENGE MODE' : isRemedial ? '📚 START REVIEW MODE' : 'START TEST'}
                </button>
            </div>
        </div>
    );
};

export default MockTestConfigModal;
