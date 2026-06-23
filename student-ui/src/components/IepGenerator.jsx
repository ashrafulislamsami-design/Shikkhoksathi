import React, { useState } from 'react';
import axios from 'axios';
import { Users, Loader2, UserCheck, ChevronRight, ClipboardList, Info, Printer, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import ProfileAvatar from './ProfileAvatar';

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

const IepGenerator = ({ user }) => {
    const [formData, setFormData] = useState({
        studentId: 'BD-2024-05',
        diagnosis: 'Visual Impairment',
        strengths: 'Strong auditory learner, social',
        weaknesses: 'Difficulties with board writing access'
    });
    const [iepData, setIepData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        const lowerVal = value.toLowerCase();

        const foundWord = SENSITIVE_WORDS.find(word => lowerVal.includes(word));
        if (foundWord) {
            setErrors(prev => ({ ...prev, [name]: 'Sensitive word detected' }));
            return false;
        }

        setErrors(prev => {
            const newErrors = { ...prev };
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let finalValue = value;
        if (name === 'diagnosis' || name === 'strengths' || name === 'weaknesses') {
            finalValue = value.replace(/[^a-zA-Z\s.,-]/g, '');
            validateField(name, finalValue);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleGenerateIep = async (e) => {
        e.preventDefault();

        const hasErrors = Object.keys(errors).length > 0;
        const currentData = { ...formData };
        let isValid = true;

        ['diagnosis', 'strengths', 'weaknesses'].forEach(field => {
            if (!validateField(field, currentData[field])) isValid = false;
        });

        if (!currentData.studentId || currentData.studentId === 'TUS') {
            setErrors(prev => ({ ...prev, studentId: 'Student ID is required' }));
            isValid = false;
        }

        if (hasErrors || !isValid) {
            alert("Please address all errors before proceeding.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/lessons/generate-iep', {
                ...formData,
                teacherId: user?.id || user?._id || '6946ce04f6dc0ea51448ed7c'
            });
            setIepData({
                ...response.data.data,
                plan: response.data.fullDraft || (response.data.data && response.data.data.plan)
            });
        } catch (error) {
            console.error("IEP API Error", error);
            alert("Failed to generate IEP. Check console for details.");
        }
        setLoading(false);
    };

    const downloadIepPDF = () => {
        if (!iepData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Professional Neo-Brutalist Header
        doc.setFillColor(26, 51, 0); // T.forest (#1a3300)
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(252, 250, 245); // T.cream (#fcfaf5)
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ShikkhokSathi IEP Suite', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Individualized Education Plan - Bangladesh 2013 Act Compliant', 14, 28);

        doc.setFontSize(12);
        doc.text(new Date().toLocaleDateString(), pageWidth - 40, 20);

        // Student Profile Section
        let yPos = 55;
        doc.setTextColor(26, 51, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Student: ${iepData.studentId}`, 14, yPos);

        yPos += 15;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Primary Diagnosis:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(iepData.diagnosis || 'N/A', 55, yPos);

        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Strengths:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const splitStrengths = doc.splitTextToSize(iepData.strengths || 'N/A', pageWidth - 70);
        doc.text(splitStrengths, 55, yPos);
        yPos += (splitStrengths.length * 6);

        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Weaknesses:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const splitWeaknesses = doc.splitTextToSize(iepData.weaknesses || 'N/A', pageWidth - 70);
        doc.text(splitWeaknesses, 55, yPos);
        yPos += (splitWeaknesses.length * 6);

        doc.setLineWidth(0.5);
        doc.setDrawColor(26, 51, 0);
        doc.line(14, yPos + 5, pageWidth - 14, yPos + 5);

        // SMART Goals & Accommodations
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Strategy & Accommodations', 14, yPos);

        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const content = iepData.generatedContent || iepData.plan || "No detailed content provided.";
        const splitContent = doc.splitTextToSize(content, pageWidth - 28);

        if (yPos + splitContent.length * 5 > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(splitContent, 14, yPos);

        // Legal Alignment Footer
        yPos += (splitContent.length * 5) + 15;
        doc.setFillColor(245, 241, 230); // Cream Base (#f5f1e6)
        doc.rect(14, yPos, pageWidth - 28, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(26, 51, 0);
        doc.setFont('helvetica', 'italic');
        doc.text('Verification Note: This plan is drafted in accordance with Section 31 of the Persons with Disabilities Rights and Protection Act, 2013 (Bangladesh).', 18, yPos + 12);

        // Page Numbering
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount} | ShikkhokSathi Inclusive Education`, pageWidth / 2, 290, { align: 'center' });
        }

        doc.save(`IEP_${iepData.studentId.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div 
            className="min-h-screen p-4 md:p-8 selection:bg-yellow-500/30"
            style={{
                backgroundColor: T.cream,
                backgroundImage: 'linear-gradient(to right, rgba(26,51,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,51,0,0.03) 1px, transparent 1px), radial-gradient(circle at 70% 20%, rgba(255,233,92,0.15) 0%, transparent 50%)',
                backgroundSize: '48px 48px, 48px 48px, 100% 100%',
                fontFamily: T.fontBody,
                color: T.forest
            }}
        >
            <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                
                {/* Header Section */}
                <header 
                    className="p-7 shadow-xl"
                    style={{ backgroundColor: T.white, border: T.border, borderRadius: '24px', boxShadow: T.shadow }}
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div 
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: T.yellow,
                                    border: T.border,
                                    color: T.forest,
                                    boxShadow: '2px 2px 0px #1a3300',
                                }}
                            >
                                <Users size={24} />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.8rem', color: T.forest }}>IEP Generator</h1>
                                <p style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.terracotta, marginTop: '0.2rem' }}>
                                    Inclusive Education • Bangladesh 2013-Act Compliant
                                </p>
                            </div>
                        </div>
                        <div className="ml-6 flex-shrink-0" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 44,
                            height: 44,
                            borderRadius: T.radius,
                            backgroundColor: T.white,
                            border: T.border,
                            boxShadow: T.shadow,
                        }}>
                            <ProfileAvatar user={user} size="md" showSettings={true} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Form Section */}
                    <section className="lg:col-span-5">
                        <form 
                            onSubmit={handleGenerateIep} 
                            className="p-8 shadow-xl space-y-6"
                            style={{ backgroundColor: T.white, border: T.border, borderRadius: '24px', boxShadow: T.shadow }}
                        >
                            <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.2rem', color: T.forest }} className="mb-2 flex items-center gap-2">
                                <UserCheck size={20} className="text-[#cb5521]" /> Student Profile
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                                        Student ID
                                    </label>
                                    <div className="flex">
                                        <span 
                                            style={{
                                                backgroundColor: T.yellow,
                                                border: T.border,
                                                borderRight: 'none',
                                                borderRadius: '12px 0 0 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0 1rem',
                                                fontFamily: T.fontMono,
                                                fontWeight: 800,
                                                color: T.forest,
                                                fontSize: '0.88rem',
                                            }}
                                        >
                                            TUS
                                        </span>
                                        <input
                                            type="text"
                                            name="studentId"
                                            value={formData.studentId.startsWith('TUS') ? formData.studentId.slice(3) : formData.studentId}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                const fullId = `TUS${val}`;
                                                setFormData(prev => ({ ...prev, studentId: fullId }));
                                                if (val) setErrors(prev => { const n = { ...prev }; delete n.studentId; return n; });
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                if (!val) setErrors(prev => ({ ...prev, studentId: 'Student ID is required' }));
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem 1rem',
                                                backgroundColor: T.cream,
                                                border: T.border,
                                                borderRadius: '0 12px 12px 0',
                                                fontFamily: T.fontMono,
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                color: T.forest,
                                                outline: 'none',
                                            }}
                                            placeholder="12345"
                                            required
                                        />
                                    </div>
                                    {errors.studentId && (
                                        <p className="text-xs text-[#cb5521] mt-2 flex items-center gap-1 animate-pulse font-bold">
                                            <AlertTriangle size={12} /> {errors.studentId}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                                        Primary Diagnosis
                                    </label>
                                    <input
                                        type="text"
                                        name="diagnosis"
                                        value={formData.diagnosis}
                                        onChange={handleInputChange}
                                        onBlur={() => handleBlur('diagnosis', formData.diagnosis)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: T.cream,
                                            border: T.border,
                                            borderRadius: '12px',
                                            fontFamily: T.fontBody,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: T.forest,
                                            outline: 'none',
                                        }}
                                        required
                                    />
                                    {errors.diagnosis && (
                                        <p className="text-xs text-[#cb5521] mt-2 flex items-center gap-1 animate-pulse font-bold">
                                            <AlertTriangle size={12} /> {errors.diagnosis}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                                        Key Strengths
                                    </label>
                                    <textarea
                                        name="strengths"
                                        value={formData.strengths}
                                        onChange={handleInputChange}
                                        onBlur={() => handleBlur('strengths', formData.strengths)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: T.cream,
                                            border: T.border,
                                            borderRadius: '12px',
                                            fontFamily: T.fontBody,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: T.forest,
                                            outline: 'none',
                                            height: '90px',
                                            resize: 'none',
                                        }}
                                        required
                                    />
                                    {errors.strengths && (
                                        <p className="text-xs text-[#cb5521] mt-2 flex items-center gap-1 animate-pulse font-bold">
                                            <AlertTriangle size={12} /> {errors.strengths}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }} className="block mb-2">
                                        Key Weaknesses
                                    </label>
                                    <textarea
                                        name="weaknesses"
                                        value={formData.weaknesses}
                                        onChange={handleInputChange}
                                        onBlur={() => handleBlur('weaknesses', formData.weaknesses)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: T.cream,
                                            border: T.border,
                                            borderRadius: '12px',
                                            fontFamily: T.fontBody,
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            color: T.forest,
                                            outline: 'none',
                                            height: '90px',
                                            resize: 'none',
                                        }}
                                        required
                                    />
                                    {errors.weaknesses && (
                                        <p className="text-xs text-[#cb5521] mt-2 flex items-center gap-1 animate-pulse font-bold">
                                            <AlertTriangle size={12} /> {errors.weaknesses}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || Object.keys(errors).length > 0}
                                className="w-full py-4 text-[#fcfaf5] font-black rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
                                    <><Loader2 className="animate-spin" size={18} /> Generating Plan...</>
                                ) : (
                                    <>Draft New IEP <ChevronRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </section>

                    {/* Display Section */}
                    <section className="lg:col-span-7 flex flex-col gap-6">
                        <div 
                            className="p-8 shadow-xl flex-1 overflow-hidden relative min-h-[450px] flex flex-col justify-between"
                            style={{ backgroundColor: T.white, border: T.border, borderRadius: '24px', boxShadow: T.shadow }}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-solid" style={{ borderColor: 'rgba(26,51,0,0.08)' }}>
                                    <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.2rem', color: T.forest }} className="flex items-center gap-2">
                                        <ClipboardList size={20} className="text-[#cb5521]" /> Individualized Education Plan
                                    </h2>
                                    {iepData && (
                                        <div className="flex gap-4">
                                            <button
                                                onClick={downloadIepPDF}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-[#cb5521] uppercase tracking-widest hover:text-[#1a3300] transition-colors cursor-pointer bg-transparent border-none"
                                            >
                                                <Printer size={14} /> Print PDF
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {iepData ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div 
                                                className="p-4"
                                                style={{ backgroundColor: T.cream, border: T.border, borderRadius: T.radius }}
                                            >
                                                <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }} className="mb-1">Student ID</p>
                                                <p style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.1rem', color: T.forest }}>{iepData.studentId}</p>
                                            </div>
                                            <div 
                                                className="p-4"
                                                style={{ backgroundColor: T.cream, border: T.border, borderRadius: T.radius }}
                                            >
                                                <p style={{ fontFamily: T.fontMono, fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }} className="mb-1">Primary Diagnosis</p>
                                                <p style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.1rem', color: T.forest }}>{iepData.diagnosis}</p>
                                            </div>
                                        </div>

                                        <div 
                                            className="p-6"
                                            style={{ backgroundColor: T.cream, border: T.border, borderRadius: '16px' }}
                                        >
                                            <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1rem', color: T.forest }} className="mb-4 flex items-center gap-2">
                                                <Info size={16} className="text-[#cb5521]" /> Strategy & Accommodations
                                            </h3>
                                            <div 
                                                className="p-4 text-sm leading-relaxed whitespace-pre-wrap text-[#1a3300]"
                                                style={{ backgroundColor: T.white, border: '1.5px dashed rgba(26,51,0,0.15)', borderRadius: '12px', fontFamily: T.fontBody, fontWeight: 500 }}
                                            >
                                                {iepData.generatedContent || iepData.plan || "Plan draft generated successfully."}
                                            </div>
                                        </div>

                                        {iepData.smartGoals && iepData.smartGoals.length > 0 && (
                                            <div 
                                                className="p-6"
                                                style={{ backgroundColor: T.cream, border: T.border, borderRadius: '16px' }}
                                            >
                                                <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1rem', color: T.forest }} className="mb-4 flex items-center gap-2">
                                                    <ClipboardList size={16} className="text-[#cb5521]" /> SMART Goals
                                                </h3>
                                                <ul className="list-disc pl-5 space-y-2 text-[#1a3300] text-sm font-semibold">
                                                    {iepData.smartGoals.map((goal, idx) => (
                                                        <li key={idx}>{goal}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-20">
                                        <div 
                                            style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: T.yellow,
                                                border: T.border,
                                                color: T.forest,
                                                boxShadow: '3px 3px 0px #1a3300',
                                                marginBottom: '1.5rem'
                                            }}
                                        >
                                            <Users size={28} />
                                        </div>
                                        <p style={{ fontFamily: T.fontDisplay, fontWeight: 800, color: T.forest, fontSize: '1.1rem' }}>No IEP Generated Yet</p>
                                        <p style={{ color: T.muted, fontSize: '0.82rem', maxWidth: '320px', marginTop: '0.5rem', lineHeight: 1.5 }}>
                                            Input student details in the profile panel and click generate to draft a specialized individualized education plan.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Legal Footnote */}
                            <div 
                                className="mt-8 p-4 text-[10px] text-[#cb5521] font-bold text-center leading-relaxed"
                                style={{ backgroundColor: T.cream, border: '1.5px dashed rgba(26,51,0,0.15)', borderRadius: '12px', fontFamily: T.fontMono }}
                            >
                                Verification Note: This plan is drafted in compliance with Section 31 of the Persons with Disabilities Rights and Protection Act, 2013 (Bangladesh).
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default IepGenerator;
