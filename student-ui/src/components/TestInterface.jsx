import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Clock,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Trophy,
    Zap,
    Camera,
    Upload,
    ImageIcon,
    FileText,
    X
} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';

const TestInterface = ({ user }) => {
    const { id: testId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false); // Keep original submitting state for general use if needed, but use isAnalyzing for CQ submission
    const [timerStarted, setTimerStarted] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // New state

    const fetchTestData = useCallback(async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.get(`http://localhost:5000/api/tests/${testId}`, config);

            if (response.data.success) {
                const test = response.data.data;
                setTestData(test);

                if (test.status === 'completed') {
                    setIsCompleted(true);
                    setResults({
                        score: test.score,
                        feedback: test.feedback,
                        coinsEarned: 0 // We don't have this in history easily without extra fields
                    });
                } else {
                    // Initialize centralized timer with test's timeLimit
                    if (test.timing && test.timing.timeLimit) {
                        setTimeLeft(test.timing.timeLimit);
                        setTimerStarted(true);
                    }

                    // Find first unanswered question
                    const unansweredIdx = test.questions.findIndex(q => !q.userAnswer);
                    const qIdx = unansweredIdx === -1 ? 0 : unansweredIdx;

                    // The backend might return the first question in the generate call, 
                    // but for subsequent loads, we might need a specific "get current question" endpoint 
                    // or just use the populated data if available.
                    // For now, let's assume we need to fetch the first question details.
                    fetchNextQuestion(qIdx + 1);
                }
            }
        } catch (err) {
            console.error('Fetch test error:', err);
            setError('Failed to load test. Please return to dashboard.');
        } finally {
            setLoading(false);
        }
    }, [testId]);

    const fetchNextQuestion = async (qNumber) => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.post(`http://localhost:5000/api/tests/${testId}/next-question`, {}, config);

            if (response.data.success) {
                if (response.data.data?.completed || response.data.completed) {
                    completeTest();
                } else if (!response.data.data?.question && !response.data.question) {
                    setError('No questions available for this subject/topic. Please try another one.');
                    setLoading(false);
                } else {
                    setCurrentQuestion(response.data.data || response.data);
                    // Reset selection and feedback
                    setSelectedOption(null);
                    setSelectedImage(null);
                    setPreviewUrl(null);
                    setFeedback(null);
                    // Central timer continues from test initialization - do NOT reset per question
                }
            }
        } catch (err) {
            console.error('Fetch question error:', err);
            setError('Failed to load next question.');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionId) => {
        if (feedback) return; // Prevent changing after submission
        setSelectedOption(optionId);
    };

    const handleSubmitAnswer = async () => {
        if (currentQuestion.question.type === 'cq' && !previewUrl) {
            alert("Mandatory: Please upload an image of your handwritten answer before submitting.");
            return;
        }

        if ((currentQuestion.question.type === 'mcq' && !selectedOption) || isAnalyzing) return;

        setIsAnalyzing(true); // Use isAnalyzing for the loading state
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            // Calculate time spent: total limit minus remaining time
            // The diff provided a simulated value, but the original calculation is more accurate.
            // Sticking to the diff's instruction for this specific line.
            const timeSpent = 60; // Simulated as per diff instruction

            const payload = {
                questionId: currentQuestion.question.id,
                answer: currentQuestion.question.type === 'cq' ? previewUrl : selectedOption,
                timeSpent: timeSpent
            };

            const response = await axios.post(`http://localhost:5000/api/tests/${testId}/submit-answer`, payload, config);

            if (response.data.success) {
                setFeedback(response.data.data);
            }
        } catch (err) {
            console.error('Submit answer error:', err);
            setError('Failed to submit answer.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const completeTest = async () => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };
            const response = await axios.post(`http://localhost:5000/api/tests/${testId}/complete`, {}, config);

            if (response.data.success) {
                setResults(response.data.data);
                setIsCompleted(true);
            }
        } catch (err) {
            console.error('Complete test error:', err);
            setError('Failed to finalize test.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestData();
    }, [fetchTestData]);

    useEffect(() => {
        if (timerStarted && timeLeft > 0 && !feedback && !isCompleted) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && timerStarted && !isCompleted && currentQuestion) {
            // Time's up - auto complete test
            console.log('Time limit reached - auto completing test');
            completeTest();
        }
    }, [timeLeft, feedback, isCompleted, currentQuestion, timerStarted]);

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
        border: '2px solid #1a3300',
        shadow: '4px 4px 0px rgba(26,51,0,0.12)',
        shadowHard: '4px 4px 0px #1a3300',
        radius: '16px',
        fontDisplay: "'Bricolage Grotesque', 'Outfit', sans-serif",
        fontBody: "'Inter', sans-serif",
        fontMono: "'Roboto Mono', monospace",
    };

    if (loading && !currentQuestion && !isCompleted) {
        return (
            <div 
                className="flex flex-col items-center justify-center min-h-screen"
                style={{ backgroundColor: T.cream }}
            >
                <div className="animate-pulse text-[#1a3300] font-mono text-[10px] uppercase tracking-widest">
                    Initializing Neural Link...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div 
                className="flex flex-col items-center justify-center min-h-screen p-8 text-center"
                style={{ backgroundColor: T.cream, color: T.forest }}
            >
                <AlertCircle style={{ color: T.terracotta }} className="mb-4" size={64} />
                <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: T.fontDisplay }}>Sync Error</h2>
                <p className="mb-8" style={{ color: T.muted, fontFamily: T.fontBody }}>{error}</p>
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="px-8 py-3 font-black text-sm uppercase transition-all active:scale-[0.95]"
                    style={{
                        backgroundColor: T.terracotta,
                        color: T.white,
                        border: T.border,
                        boxShadow: T.shadowHard,
                        borderRadius: T.radius,
                        cursor: 'pointer'
                    }}
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div 
                className="min-h-screen p-8 flex flex-col items-center justify-center"
                style={{ 
                    backgroundColor: T.cream,
                    backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '48px 48px'
                }}
            >
                <div 
                    className="max-w-2xl w-full p-12 text-center animate-in zoom-in duration-500 mb-6"
                    style={{
                        backgroundColor: T.white,
                        border: T.border,
                        boxShadow: T.shadowHard,
                        borderRadius: '24px',
                        color: T.forest
                    }}
                >
                    <div 
                        className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6"
                        style={{
                            backgroundColor: T.yellow,
                            border: T.border,
                            boxShadow: '3px 3px 0px #1a3300'
                        }}
                    >
                        <Trophy size={40} style={{ color: T.forest }} />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2" style={{ fontFamily: T.fontDisplay }}>Test Completed!</h1>
                    <p className="font-medium mb-8" style={{ color: T.muted }}>Analysis synchronized with your profile.</p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div 
                            className="p-6 text-center"
                            style={{
                                backgroundColor: T.mint,
                                border: T.border,
                                borderRadius: T.radius,
                                boxShadow: T.shadow
                            }}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.muted, fontFamily: T.fontMono }}>Score Accuracy</p>
                            <p className="text-3xl font-extrabold" style={{ fontFamily: T.fontDisplay }}>{Math.round(results?.score?.percentage || 0)}%</p>
                        </div>
                        <div 
                            className="p-6 text-center"
                            style={{
                                backgroundColor: T.blush,
                                border: T.border,
                                borderRadius: T.radius,
                                boxShadow: T.shadow
                            }}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: T.muted, fontFamily: T.fontMono }}>Coins Earned</p>
                            <div className="flex items-center justify-center gap-1.5">
                                <Zap className="fill-current" size={20} style={{ color: T.terracotta }} />
                                <p className="text-3xl font-extrabold" style={{ fontFamily: T.fontDisplay }}>+{results?.coinsEarned || 0}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.muted, fontFamily: T.fontMono }}>AI Feedback</h3>
                    <div className="space-y-4">
                        {results?.detailedResults?.map((res, idx) => (
                            res.marks !== undefined && (
                                <div 
                                    key={idx} 
                                    className="p-4 text-left"
                                    style={{
                                        backgroundColor: T.cream,
                                        border: T.border,
                                        borderRadius: '12px'
                                    }}
                                >
                                    <p className="text-xs font-black mb-1" style={{ color: T.terracotta }}>Question {idx + 1} (CQ)</p>
                                    <p className="text-xs font-bold mb-2">Marks: <span className="font-extrabold" style={{ color: T.forest }}>{res.marks}/5</span></p>
                                    <p className="text-xs italic" style={{ color: T.muted }}>"{res.remarks}"</p>
                                </div>
                            )
                        ))}
                        <p className="text-sm leading-relaxed font-semibold">{results?.feedback?.focusRecommendation || "Great effort! Review your weak areas in the dashboard analysis."}</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="max-w-2xl w-full py-4 font-black rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                    style={{
                        backgroundColor: T.forest,
                        color: T.cream,
                        border: T.border,
                        boxShadow: '4px 4px 0px #cb5521',
                        cursor: 'pointer'
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!currentQuestion || !currentQuestion.question) {
        return (
            <div 
                className="flex flex-col items-center justify-center min-h-screen"
                style={{ backgroundColor: T.cream }}
            >
                <div className="animate-pulse text-[#1a3300] font-mono text-[10px] uppercase tracking-widest">
                    Syncing Questions...
                </div>
            </div>
        );
    }

    const { question } = currentQuestion;

    return (
        <div 
            className="min-h-screen p-8 flex flex-col relative overflow-hidden"
            style={{ 
                backgroundColor: T.cream,
                color: T.forest,
                fontFamily: T.fontBody,
                backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px)',
                backgroundSize: '48px 48px'
            }}
        >
            <style>{`
                .submit-brutalist-btn {
                    transition: all 0.2s ease-in-out !important;
                }
                .submit-brutalist-btn:not(:disabled):hover {
                    background-color: ${T.yellow} !important;
                    color: #000000 !important;
                    border: 2px solid #000000 !important;
                    box-shadow: 3px 3px 0px #000000 !important;
                    transform: translate(-2px, -2px) !important;
                }
            `}</style>
            {/* Header */}
            <header 
                className="fixed top-0 left-0 right-0 z-50 p-4 border-b-2"
                style={{
                    backgroundColor: 'rgba(252, 250, 245, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(26, 51, 0, 0.1)'
                }}
            >
                <div className="max-w-5xl mx-auto flex justify-between items-center relative">
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex items-center gap-2 transition-colors group"
                        style={{ color: T.muted }}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" style={{ color: T.forest }} />
                        <span className="font-extrabold text-[10px] uppercase tracking-wider font-mono" style={{ color: T.forest }}>Quit Session</span>
                    </button>

                    <div className="flex items-center gap-6">
                        <div 
                            className="flex items-center gap-2.5 px-4 py-2"
                            style={{
                                backgroundColor: T.white,
                                border: T.border,
                                borderRadius: '30px',
                                boxShadow: T.shadow
                            }}
                        >
                            <Clock size={15} className={timeLeft < 30 ? 'text-rose-600 animate-pulse' : ''} style={{ color: timeLeft < 30 ? undefined : T.terracotta }} />
                            <span className="font-mono font-extrabold text-xs" style={{ color: T.forest }}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="h-6 w-[1.5px] bg-[#1a3300]/10"></div>
                        <div className="flex flex-col items-end">
                            <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1" style={{ color: T.muted, fontFamily: T.fontMono }}>Progress</p>
                            <p className="text-xs font-black italic leading-none" style={{ fontFamily: T.fontDisplay }}>
                                {currentQuestion.currentQuestion} <span className="text-[10px] NOT-italic" style={{ color: T.muted }}>/ {currentQuestion.totalQuestions}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center ml-4">
                        <ProfileAvatar user={user} size="sm" showSettings={true} />
                    </div>
                </div>
            </header>

            {/* Main Question Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto mt-24 mb-12 animate-in slide-in-from-bottom duration-500">
                <div className="relative w-full" style={{ padding: '6px' }}>
                    {/* The absolute timer background block behind the card */}
                    <div 
                        className="absolute transition-all duration-1000"
                        style={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: `${testData?.timing?.timeLimit ? (timeLeft / testData.timing.timeLimit) * 100 : 100}%`,
                            backgroundColor: T.mint, // mint green accent from theme
                            border: T.border,
                            borderRadius: '28px',
                            zIndex: 0
                        }}
                    />

                    <div 
                        className="p-10 relative overflow-hidden group"
                        style={{
                            backgroundColor: T.white,
                            border: T.border,
                            boxShadow: T.shadowHard,
                            borderRadius: '24px',
                            zIndex: 1
                        }}
                    >
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: 'rgba(26,51,0,0.06)' }}>
                        <div
                            className="h-full transition-all duration-700"
                            style={{ 
                                width: `${(currentQuestion.currentQuestion / currentQuestion.totalQuestions) * 100}%`,
                                backgroundColor: T.terracotta
                            }}
                        ></div>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div 
                                className="w-10 h-10 flex items-center justify-center font-extrabold text-sm"
                                style={{
                                    backgroundColor: T.yellow,
                                    border: T.border,
                                    borderRadius: '10px',
                                    boxShadow: '2px 2px 0px #1a3300'
                                }}
                            >
                                {currentQuestion.currentQuestion}
                            </div>
                            {question.type === 'cq' && (
                                <div 
                                    className="px-3 py-1.5"
                                    style={{
                                        backgroundColor: T.blush,
                                        border: T.border,
                                        borderRadius: '30px'
                                    }}
                                >
                                    <p className="text-[9px] font-black uppercase tracking-wider font-mono" style={{ color: T.forest }}>Broad Question (CQ)</p>
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold leading-tight" style={{ fontFamily: T.fontDisplay }}>
                            {question.text}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                        {question.type === 'mcq' ? (
                            question.options.map((opt) => {
                                const isSelected = selectedOption === opt.id;
                                const isCorrect = feedback && opt.id === feedback.correctAnswerId;
                                const isWrong = feedback && selectedOption === opt.id && !feedback.isCorrect;

                                let btnBg = T.white;
                                let btnShadow = T.shadow;
                                let btnTransform = 'none';

                                if (isSelected) {
                                    btnBg = T.yellow;
                                    btnShadow = '4px 4px 0px #1a3300';
                                    btnTransform = 'translate(-2px, -2px)';
                                }
                                if (isCorrect) {
                                    btnBg = T.mint;
                                    btnShadow = '4px 4px 0px #1a3300';
                                    btnTransform = 'translate(-2px, -2px)';
                                }
                                if (isWrong) {
                                    btnBg = T.blush;
                                    btnShadow = '4px 4px 0px #1a3300';
                                    btnTransform = 'translate(-2px, -2px)';
                                }

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleOptionSelect(opt.id)}
                                        disabled={!!feedback}
                                        className="w-full p-5 flex items-center justify-between transition-all"
                                        style={{
                                            backgroundColor: btnBg,
                                            border: T.border,
                                            borderRadius: T.radius,
                                            boxShadow: btnShadow,
                                            transform: btnTransform,
                                            cursor: feedback ? 'default' : 'pointer'
                                        }}
                                    >
                                        <span className="font-extrabold text-sm text-left">{opt.text}</span>
                                        {feedback ? (
                                            isCorrect ? <CheckCircle2 size={18} className="text-emerald-700" /> :
                                                (selectedOption === opt.id && !feedback.isCorrect) ? <AlertCircle size={18} className="text-rose-700" /> : null
                                        ) : (
                                            <div 
                                                className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                                                style={{
                                                    border: '2px solid #1a3300',
                                                    backgroundColor: isSelected ? T.forest : T.white
                                                }}
                                            >
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="space-y-4">
                                <div 
                                    className="p-8 border-2 border-dashed rounded-3xl text-center transition-all hover:bg-rgba(26,51,0,0.02)"
                                    style={{
                                        borderColor: '#1a3300',
                                        backgroundColor: '#ffffff'
                                    }}
                                >
                                    {!previewUrl ? (
                                        <label className="flex flex-col items-center gap-4 cursor-pointer">
                                            <div 
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                                style={{
                                                    backgroundColor: T.teal,
                                                    border: T.border,
                                                    boxShadow: '2px 2px 0px #1a3300'
                                                }}
                                            >
                                                <Camera size={26} style={{ color: T.forest }} />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-sm">Upload Elaborative Answer</p>
                                                <p className="text-[10px] mt-1" style={{ color: T.muted }}>Submit your handwritten solution for board-standard AI grading</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={!!feedback || isAnalyzing} />
                                            <div 
                                                className="mt-2 px-5 py-2 text-xs font-bold transition-all"
                                                style={{
                                                    backgroundColor: T.white,
                                                    border: T.border,
                                                    borderRadius: '30px',
                                                    boxShadow: '2px 2px 0px #1a3300'
                                                }}
                                            >
                                                Browse Files
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="relative group">
                                            <img 
                                                src={previewUrl} 
                                                alt="Answer Preview" 
                                                className="w-full max-h-[350px] object-contain rounded-2xl border-2" 
                                                style={{ borderColor: T.forest }}
                                            />
                                            {!feedback && !isAnalyzing && (
                                                <button
                                                    onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                                                    className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-full shadow-lg transition-opacity border-2 border-[#1a3300]"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            {isAnalyzing && (
                                                <div 
                                                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                                                    style={{ backgroundColor: 'rgba(252, 250, 245, 0.95)' }}
                                                >
                                                    <Loader2 className="animate-spin mb-3" size={32} style={{ color: T.terracotta }} />
                                                    <p className="font-extrabold text-base">Analyzing Proof...</p>
                                                    <p style={{ color: T.muted }} className="text-xs">AI is evaluating your solution.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div 
                                    className="flex items-center gap-3 p-4 rounded-2xl"
                                    style={{
                                        backgroundColor: T.mint,
                                        border: T.border
                                    }}
                                >
                                    <AlertCircle size={16} style={{ color: T.forest }} className="flex-shrink-0" />
                                    <p className="text-[11px] font-semibold">Goal: Provide a detailed, step-by-step elaborative answer. AI will evaluate logic and presentation.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div 
                            className="mt-6 p-6 animate-in slide-in-from-top duration-300"
                            style={{
                                backgroundColor: T.cream,
                                border: T.border,
                                borderRadius: T.radius
                            }}
                        >
                            {feedback.marks !== undefined && (
                                <div 
                                    className="mb-5 flex items-center gap-3.5 p-4 rounded-xl"
                                    style={{
                                        backgroundColor: T.white,
                                        border: T.border
                                    }}
                                >
                                    <div 
                                        className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg italic shadow-md"
                                        style={{
                                            backgroundColor: T.yellow,
                                            border: T.border
                                        }}
                                    >
                                        {feedback.marks}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-wider leading-none mb-1" style={{ color: T.muted, fontFamily: T.fontMono }}>Marks Awarded (out of 5)</p>
                                        <p className="text-xs font-semibold leading-snug">{feedback.remarks}</p>
                                    </div>
                                </div>
                            )}
                            <h4 className="text-xs font-black uppercase tracking-wider mb-2.5" style={{ color: T.muted, fontFamily: T.fontMono }}>Solution Key</h4>
                            <p className="text-xs leading-relaxed mb-5 font-medium">{feedback.explanation}</p>
                            <button
                                onClick={() => fetchNextQuestion(currentQuestion.currentQuestion + 1)}
                                className="w-full py-3.5 font-black rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                style={{
                                    backgroundColor: T.forest,
                                    color: T.cream,
                                    border: T.border,
                                    boxShadow: '3px 3px 0px #cb5521',
                                    cursor: 'pointer'
                                }}
                            >
                                Next Node <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Navigation / Action */}
                    {!feedback && (
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)}
                                className="submit-brutalist-btn px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: (isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)) ? T.cream : T.terracotta,
                                    color: (isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)) ? T.muted : T.white,
                                    border: (isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)) ? '2px solid rgba(26,51,0,0.15)' : T.border,
                                    boxShadow: (isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)) ? 'none' : '3px 3px 0px #1a3300',
                                    cursor: 'pointer'
                                }}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} />
                                        Analyzing Proof...
                                    </>
                                ) : (
                                    <>
                                        Submit Answer
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
        </div>
    );
};

export default TestInterface;
