import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Loader2, Sparkles, ChevronRight, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ProfileAvatar from './ProfileAvatar';

const LessonCreator = ({ prefillData, user }) => {
    const [topic, setTopic] = useState('');
    const [struggles, setStruggles] = useState('');
    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (prefillData) {
            if (prefillData.topic) setTopic(prefillData.topic);
            if (prefillData.struggles) setStruggles(prefillData.struggles);
            if (prefillData.remedial) setStruggles(prefillData.remedial); // Handle both naming variants
        }
    }, [prefillData]);

    const generateLesson = async () => {
        if (!topic) return alert("Please enter a topic!");
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/lessons/generate', {
                teacherId: user?._id || user?.id || "unknown",
                classLevel: user?.classes?.[0] || "General Class",
                subject: user?.subjects?.[0] || user?.designation || "General Subject",
                topic: topic,
                duration: 40,
                struggles: struggles
            });
            setLessonData(response.data.data);
        } catch (error) {
            console.error("Error details:", error.response || error);
            alert(`Backend Error: ${error.message}`);
        }
        setLoading(false);
    };

    const downloadPDF = () => {
        if (!lessonData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Professional Header
        doc.setFillColor(26, 51, 0); // Forest Green (#1a3300)
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ShikkhokSathi AI', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Professional NCTB-Aligned Lesson Plan Suite', 14, 28);

        doc.setFontSize(12);
        doc.text(new Date().toLocaleDateString(), pageWidth - 40, 20);

        // 2. Metadata Section
        let yPos = 55;
        doc.setTextColor(26, 51, 0); // Forest Green (#1a3300)
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Topic: ${lessonData.topic}`, 14, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Subject: ${lessonData.subject}`, 14, yPos);
        doc.text(`Level: ${lessonData.classLevel}`, pageWidth / 2, yPos);
        doc.text(`Duration: ${lessonData.duration} Mins`, pageWidth - 45, yPos);

        doc.setLineWidth(0.5);
        doc.setDrawColor(26, 51, 0); // Forest green line divider
        doc.line(14, yPos + 5, pageWidth - 14, yPos + 5);

        // 3. Learning Objectives
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(203, 85, 33); // Terracotta (#cb5521)
        doc.text('LEARNING OBJECTIVES', 14, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 51, 0); // Forest green (#1a3300)
        const objectives = lessonData.objectives && lessonData.objectives.length > 0
             ? lessonData.objectives
             : ['Mastery of core conceptual principles.', 'Ability to apply knowledge in practical contexts.', 'Development of critical thinking skills.'];

        objectives.forEach(obj => {
            const splitObj = doc.splitTextToSize(`• ${obj}`, pageWidth - 28);
            doc.text(splitObj, 14, yPos);
            yPos += (splitObj.length * 5);
        });

        // 4. Materials Needed
        yPos += 5;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(203, 85, 33); // Terracotta (#cb5521)
        doc.text('MATERIALS NEEDED', 14, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(26, 51, 0); // Forest green (#1a3300)
        const materials = lessonData.materials && lessonData.materials.length > 0
             ? lessonData.materials
             : ['NCTB Textbook', 'Whiteboard/Markers', 'Visual Aids'];

        materials.forEach(mat => {
            doc.text(`• ${mat}`, 14, yPos);
            yPos += 5;
        });

        // 5. Teaching-Learning Activities
        yPos += 10;

        const planSections = lessonData.generatedPlan.split(/\n(?=\*\*?[A-Z\s/]{4,}\*\*?|(?:\d\.\s)?[A-Z\s/]{4,}:?)/);

        planSections.forEach((section) => {
            const lines = section.split('\n');
            const title = lines[0].replace(/[*#]/g, '').trim();
            const content = lines.slice(1).join('\n').trim();

            if (!title) return;

            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            // Render Header
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(203, 85, 33); // Terracotta (#cb5521) for headers
            doc.text(title.toUpperCase(), 14, yPos);
            yPos += 7;

            // Render Content
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(26, 51, 0); // Forest green (#1a3300) for body text
            const splitContent = doc.splitTextToSize(content, pageWidth - 28);

            splitContent.forEach(line => {
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 14, yPos);
                yPos += 5;
            });

            yPos += 5; 
        });

        // 6. Footer (Page numbers)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(26, 51, 0); // Forest green footer
            doc.text(`Page ${i} of ${pageCount} | Generated by ShikkhokSathi AI Intelligence`, pageWidth / 2, 290, { align: 'center' });
        }

        doc.save(`LessonPlan_${lessonData.topic.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="min-h-screen bg-transparent text-[#1a3300] font-sans selection:bg-[#ffe95c]/40 p-4 md:p-8">

            <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                {/* Header Section with Avatar aligned on the right */}
                <header className="bg-white border-2 border-[#1a3300] rounded-3xl p-8 shadow-[4px_4px_0px_#1a3300] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 bg-[#ffe95c] border-2 border-[#1a3300] rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_#1a3300] text-[#1a3300] shrink-0">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a3300]">AI Lesson Co-Creator</h1>
                            <p className="text-[#1a3300]/60 text-xs font-black uppercase tracking-widest leading-none mt-1.5 flex items-center gap-2">
                                Academic Engine
                                <span className="bg-[#d5f5c2] border border-[#1a3300] px-1.5 py-0.5 rounded text-[9px] font-black text-[#1a3300] shadow-[1px_1px_0px_#1a3300] normal-case tracking-normal">v2.0</span>
                            </p>
                        </div>
                    </div>
                    <div className="ml-0 md:ml-6 flex-shrink-0 relative z-10 self-end md:self-auto">
                        <ProfileAvatar user={user} size="md" showSettings={true} />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Input Section */}
                    <section className="lg:col-span-5 space-y-6">
                        <div className="bg-white border-2 border-[#1a3300] rounded-[2rem] p-8 shadow-[6px_6px_0px_#1a3300]">
                            <h2 className="text-xl font-extrabold text-[#1a3300] mb-6 flex items-center gap-2">
                                <Sparkles size={20} className="text-[#cb5521]" /> Lesson Parameters
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-[#1a3300]/60 mb-2 uppercase tracking-[0.2em]">Topic or Concept</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Photosynthesis, Newton's Laws..."
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="w-full bg-white border-2 border-[#1a3300] rounded-2xl px-5 py-4 text-[#1a3300] placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none transition-all font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-[#1a3300]/60 mb-2 uppercase tracking-[0.2em] flex justify-between">
                                        <span>Student Struggles / Focus Area</span>
                                        <span className="text-[8px] opacity-60 normal-case font-bold">Optional</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Describe specific learning gaps, struggles, or paste remedial alerts to customize..."
                                        value={struggles}
                                        onChange={(e) => setStruggles(e.target.value)}
                                        className="w-full bg-white border-2 border-[#1a3300] rounded-2xl px-5 py-4 text-[#1a3300] placeholder:text-[#1a3300]/30 focus:ring-2 focus:ring-[#cb5521] outline-none transition-all font-semibold text-sm resize-none"
                                    />
                                </div>

                                <button
                                    onClick={generateLesson}
                                    disabled={loading}
                                    className="w-full py-4 bg-[#1a3300] hover:bg-[#cb5521] disabled:bg-[#1a3300]/50 text-[#fcfaf5] border-2 border-[#1a3300] font-black rounded-2xl shadow-[3px_3px_0px_#1a3300] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a3300] active:translate-y-[0px] transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <><Loader2 className="animate-spin text-[#ffe95c]" size={20} /> Crafting Plan...</>
                                    ) : (
                                        <>Generate Professional Plan <ChevronRight size={18} /></>
                                    )}
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#1a3300]/10">
                                <p className="text-[10px] text-[#1a3300]/60 leading-relaxed font-bold italic">
                                    Our AI integrates NCTB curriculum standards with local Bangladeshi context for maximum student engagement.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Output Section */}
                    <section className="lg:col-span-7">
                        <div className="bg-white border-2 border-[#1a3300] rounded-[2rem] p-8 shadow-[6px_6px_0px_#1a3300] h-full min-h-[500px] flex flex-col relative overflow-hidden">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a3300]/10">
                                <h2 className="text-xl font-extrabold text-[#1a3300] flex items-center gap-2">
                                    <FileText size={20} className="text-[#cb5521]" /> Generated Plan
                                </h2>
                                {lessonData && (
                                    <button
                                        onClick={downloadPDF}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[#ffe95c] border-2 border-[#1a3300] text-[#1a3300] font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_#1a3300] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#1a3300] transition-all"
                                    >
                                        <Download size={14} /> Export PDF
                                    </button>
                                )}
                            </div>

                            {lessonData ? (
                                <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    {lessonData.generatedPlan.split(/\n(?=\*\*?[A-Z\s/]{4,}\*\*?|(?:\d\.\s)?[A-Z\s/]{4,}:?)/).map((section, idx) => {
                                        const lines = section.split('\n');
                                        const title = lines[0].replace(/[:*#]/g, '').trim();
                                        const content = lines.slice(1).join('\n').trim();

                                        if (!title) return null;
                                        if (!content) return <p key={idx} className="text-[#1a3300] font-medium mb-4">{section}</p>;

                                        return (
                                            <div key={idx} className="bg-[#fcfaf5] border-2 border-[#1a3300] rounded-2xl p-6 shadow-[3px_3px_0px_#1a3300] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#1a3300] transition-all flex flex-col gap-3">
                                                <h3 className="text-[#cb5521] font-black text-xs uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-[#1a3300]/10">
                                                    <div className="w-2.5 h-2.5 bg-[#1a3300] rounded-full"></div>
                                                    {title}
                                                </h3>
                                                <div className="text-[#1a3300] text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                    {content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                                    <div className="w-20 h-20 bg-[#d5f5c2] border-2 border-[#1a3300] rounded-3xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_#1a3300] text-[#1a3300]">
                                        <BookOpen size={40} />
                                    </div>
                                    <h3 className="font-extrabold text-[#1a3300] text-lg mb-2">No Plan Generated Yet</h3>
                                    <p className="max-w-xs text-sm font-semibold text-[#1a3300]/60">Your customized lesson plan will appear here after setting topic parameters.</p>
                                </div>
                            )}

                            {/* Decorative element */}
                            <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-[#1a3300]/5 rounded-full blur-[80px] pointer-events-none"></div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LessonCreator;
