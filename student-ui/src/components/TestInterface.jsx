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
    FileText
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

    if (loading && !currentQuestion && !isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] gap-4">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-blue-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Initializing Neural Link...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-8 text-center">
                <AlertCircle className="text-rose-500 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-white mb-2">Sync Error</h2>
                <p className="text-slate-400 mb-8">{error}</p>
                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#0f172a] p-8 flex items-center justify-center">
                <div className="max-w-2xl w-full backdrop-blur-3xl bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center animate-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-blue-600/20 rounded-full mx-auto flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                        <Trophy size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-white italic mb-2">Test Completed!</h1>
                    <p className="text-slate-400 font-medium mb-12">Analysis synchronized with your profile.</p>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Score Accuracy</p>
                            <p className="text-4xl font-black text-white italic">{Math.round(results?.score?.percentage || 0)}%</p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Coins Earned</p>
                            <div className="flex items-center justify-center gap-2">
                                <Zap className="text-amber-400" size={24} />
                                <p className="text-4xl font-black text-amber-400 italic">+{results?.coinsEarned || 0}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">AI Feedback</h3>
                    <div className="space-y-4">
                        {results?.detailedResults?.map((res, idx) => (
                            res.marks !== undefined && (
                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-xs font-bold text-blue-400 mb-1">Question {idx + 1} (CQ)</p>
                                    <p className="text-sm text-white mb-2">Marks: <span className="text-emerald-400 font-bold">{res.marks}/5</span></p>
                                    <p className="text-xs text-slate-400 italic">"{res.remarks}"</p>
                                </div>
                            )
                        ))}
                        <p className="text-slate-300 text-sm leading-relaxed">{results?.feedback?.focusRecommendation || "Great effort! Review your weak areas in the dashboard analysis."}</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/student/dashboard')}
                    className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-blue-50 shadow-xl transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!currentQuestion || !currentQuestion.question) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] gap-4">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <p className="text-blue-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Syncing Questions...</p>
            </div>
        );
    }

    const { question } = currentQuestion;

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 flex flex-col font-sans relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] -z-10"></div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 p-6 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/5">
                <div className="max-w-5xl mx-auto flex justify-between items-center relative">
                    <button
                        onClick={() => navigate('/student/dashboard')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-xs uppercase tracking-widest">Quit Session</span>
                    </button>

                    <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10">
                            <Clock size={16} className={timeLeft < 30 ? 'text-rose-400 animate-pulse' : 'text-blue-400'} />
                            <span className={`font-mono font-bold text-sm ${timeLeft < 30 ? 'text-rose-400' : 'text-white'}`}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-end flex-1">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Progress</p>
                            <p className="text-sm font-black text-white italic leading-none">
                                {currentQuestion.currentQuestion} <span className="text-slate-500 text-[10px] NOT-italic">/ {currentQuestion.totalQuestions}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center ml-4">
                        <ProfileAvatar user={user} size="sm" showSettings={true} />
                    </div>
                </div>
            </header>

            {/* Main Question Area */}
            <main className="flex-1 max-w-4xl w-full mx-auto mt-24 mb-12 animate-in slide-in-from-bottom duration-700">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                            style={{ width: `${(currentQuestion.currentQuestion / currentQuestion.totalQuestions) * 100}%` }}
                        ></div>
                    </div>

                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                                {currentQuestion.currentQuestion}
                            </div>
                            {question.type === 'cq' && (
                                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Broad Question (CQ)</p>
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            {question.text}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {question.type === 'mcq' ? (
                            question.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(opt.id)}
                                    disabled={!!feedback}
                                    className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between group
                                        ${selectedOption === opt.id
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20'
                                        }
                                        ${feedback && opt.id === feedback.correctAnswerId ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : ''}
                                        ${feedback && selectedOption === opt.id && !feedback.isCorrect ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : ''}
                                    `}
                                >
                                    <span className="font-bold text-left">{opt.text}</span>
                                    {feedback ? (
                                        opt.id === feedback.correctAnswerId ? <CheckCircle2 size={20} className="text-emerald-500" /> :
                                            selectedOption === opt.id && !feedback.isCorrect ? <AlertCircle size={20} className="text-rose-500" /> : null
                                    ) : (
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                            ${selectedOption === opt.id ? 'border-blue-500 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'border-white/10'}
                                        `}>
                                            {selectedOption === opt.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="space-y-6">
                                <div className="p-8 border-2 border-dashed border-white/10 rounded-[2rem] bg-white/5 text-center transition-all hover:border-blue-500/30">
                                    {!previewUrl ? (
                                        <label className="flex flex-col items-center gap-4 cursor-pointer">
                                            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
                                                <Camera size={32} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">Upload Elaborative Answer</p>
                                                <p className="text-xs text-slate-500 mt-1">Submit your handwritten solution for board-standard AI grading</p>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={!!feedback || isAnalyzing} />
                                            <div className="mt-2 px-6 py-2 bg-white/5 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors">
                                                Browse Files
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="relative group">
                                            <img src={previewUrl} alt="Answer Preview" className="w-full max-h-[400px] object-contain rounded-2xl border border-white/10" />
                                            {!feedback && !isAnalyzing && (
                                                <button
                                                    onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                                                    className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <AlertCircle size={20} />
                                                </button>
                                            )}
                                            {isAnalyzing && (
                                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-2xl">
                                                    <Loader2 className="animate-spin text-blue-400 mb-3" size={32} />
                                                    <p className="text-white font-bold text-lg">Analyzing Proof...</p>
                                                    <p className="text-slate-400 text-sm">AI is evaluating your solution.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                    <AlertCircle size={18} className="text-blue-400" />
                                    <p className="text-xs text-blue-300/80">Goal: Provide a detailed, step-by-step elaborative answer. AI will evaluate logic and presentation.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div className="mt-8 p-8 bg-black/20 rounded-3xl border border-white/5 animate-in slide-in-from-top duration-500">
                            {feedback.marks !== undefined && (
                                <div className="mb-6 flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-emerald-500/20">
                                        {feedback.marks}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Marks Awarded (out of 5)</p>
                                        <p className="text-xs text-emerald-200/80 leading-snug">{feedback.remarks}</p>
                                    </div>
                                </div>
                            )}
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Solution Key</h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">{feedback.explanation}</p>
                            <button
                                onClick={() => fetchNextQuestion(currentQuestion.currentQuestion + 1)}
                                className="w-full py-4 bg-white text-blue-600 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                Next Node <ChevronRight size={16} />
                            </button>
                        </div>
                    )}

                    {/* Navigation / Action */}
                    {!feedback && (
                        <div className="mt-12 flex justify-end">
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl)}
                                className={`px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3
                                    ${(isAnalyzing || (question.type === 'mcq' ? !selectedOption : !previewUrl))
                                        ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                    }
                                `}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Analyzing Proof...
                                    </>
                                ) : (
                                    <>
                                        Submit Answer
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TestInterface;
