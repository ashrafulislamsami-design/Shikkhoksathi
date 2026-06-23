import React, { useState } from "react";
import { Sparkles, Target, Zap, TrendingUp, Clock } from 'lucide-react';
import {
  calculateGap,
  getPriority,
  formatTaka,
  mockCareerData
} from "../data/careerDashboardData";

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

// Color Constants for Traffic Light System
const COLORS = {
  HIGH: "#ef4444",   // Red
  MEDIUM: "#f59e0b", // Amber
  LOW: "#10b981",    // Emerald
  PRIMARY: "#3b82f6", // Blue
  TARGET: "#10b981",  // Green
};

/* ─── REUSABLE CARD COMPONENT ─── */
const Card = ({ children, style, className = '', hoverable = false, color, ...props }) => {
    const [hovered, setHovered] = useState(false);
    const colorMap = {
        mint: { bg: T.mint, borderLeft: '4px solid #7bc96b' },
        blush: { bg: T.blush, borderLeft: '4px solid #c77dff' },
        teal: { bg: T.teal, borderLeft: '4px solid #5bb5b5' },
        terracotta: { bg: T.white, borderLeft: `4px solid ${T.terracotta}` },
        yellow: { bg: T.white, borderLeft: `4px solid ${T.yellow}` },
    };
    const colorStyle = color && colorMap[color] ? colorMap[color] : {};
    return (
        <div
            className={className}
            style={{
                backgroundColor: colorStyle.bg || T.white,
                border: T.border,
                borderLeft: colorStyle.borderLeft || T.border,
                borderRadius: T.radius,
                boxShadow: hovered && hoverable ? T.shadowHard : T.shadow,
                transform: hovered && hoverable ? 'translate(-2px, -2px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                ...style,
            }}
            onMouseEnter={() => hoverable && setHovered(true)}
            onMouseLeave={() => hoverable && setHovered(false)}
            {...props}
        >
            {children}
        </div>
    );
};

// Skill Gaps Section (Redesigned in Neo-Brutalist theme)
export const SkillGapsTab = ({ skills: propSkills }) => {
  const skills = propSkills || mockCareerData.skills;

  const groupedSkills = skills.reduce(
    (acc, skill) => {
      // Use AI priority if available, otherwise calculate from gap
      let priority = (skill.priority || '').toUpperCase();
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        const current = skill.currentLevel || 0;
        const target = skill.targetLevel || 100;
        const gap = calculateGap(current, target);
        priority = getPriority(gap);
      }

      if (acc[priority]) {
        acc[priority].push(skill);
      }
      return acc;
    },
    { HIGH: [], MEDIUM: [], LOW: [] }
  );

  return (
    <div className="space-y-10 mt-14">
      <div className="flex items-center gap-3">
        <Target className="text-[#cb5521]" size={24} />
        <h2 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.5rem', color: T.forest }} className="italic">
          Skill Gap Analysis
        </h2>
      </div>

      {/* Grouped Skill Sections */}
      {['HIGH', 'MEDIUM', 'LOW'].map((priority) => (
        groupedSkills[priority].length > 0 && (
          <div key={priority} className="space-y-5">
            <div 
                className="flex items-center gap-3 px-5 py-3"
                style={{
                    backgroundColor: T.white,
                    border: T.border,
                    borderRadius: T.radius,
                    boxShadow: T.shadow,
                }}
            >
              <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: COLORS[priority], border: '1px solid #1a3300' }}></div>
              <h3 style={{ fontFamily: T.fontMono, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.forest }}>
                {priority === 'HIGH' ? 'Current Priority' : `${priority} Priority`}
              </h3>
              <span className="ml-auto text-[10px] font-bold text-slate-500" style={{ fontFamily: T.fontMono }}>
                {groupedSkills[priority].length} Skills Found
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedSkills[priority].map((skill) => {
                const priorityColor = COLORS[priority];
                const strategyBg = priority === 'HIGH' ? T.blush : priority === 'MEDIUM' ? T.yellow : T.mint;

                return (
                  <Card 
                      key={skill.skill || skill.name} 
                      hoverable
                      style={{
                          backgroundColor: T.white,
                          padding: '1.5rem',
                          boxShadow: T.shadow,
                      }}
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.1rem', color: T.forest }}>
                          {skill.skill || skill.name}
                        </h3>
                        <p style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, fontFamily: T.fontMono }} className="mt-0.5">
                          {skill.category}
                        </p>
                      </div>
                      <div
                        style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            fontFamily: T.fontMono,
                            backgroundColor: `${priorityColor}15`,
                            color: priorityColor,
                            border: `1.5px solid ${priorityColor}44`,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                        }}
                      >
                        {priority} GAP
                      </div>
                    </div>

                    {/* Dual Progress Logic */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest" style={{ fontFamily: T.fontMono }}>
                        <span>Current Readiness</span>
                        <span style={{ color: T.terracotta, fontWeight: 800 }}>{skill.currentLevel}%</span>
                      </div>
                      <div 
                          className="relative h-3.5 w-full rounded-full overflow-hidden"
                          style={{
                              backgroundColor: T.cream,
                              border: '1.5px solid #1a3300'
                          }}
                      >
                        <div
                          className="absolute top-0 left-0 h-full"
                          style={{ 
                              width: `${skill.targetLevel}%`, 
                              backgroundColor: T.mint,
                              opacity: 0.7,
                              borderRight: '1.5px dashed #1a3300'
                          }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full"
                          style={{ 
                              width: `${skill.currentLevel}%`, 
                              backgroundColor: T.yellow,
                              borderRight: '1.5px solid #1a3300'
                          }}
                        />
                      </div>
                      <div className="flex justify-end" style={{ fontFamily: T.fontMono }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: COLORS.TARGET, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Target: {skill.targetLevel}%
                        </span>
                      </div>
                    </div>

                    {/* AI Growth Strategy */}
                    <div 
                        className="mt-5 p-4 rounded-xl"
                        style={{
                            backgroundColor: strategyBg,
                            border: '1.5px solid #1a3300',
                            boxShadow: '2px 2px 0px #1a3300',
                        }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={13} fill="currentColor" className="text-[#1a3300]" />
                        <h4 style={{ fontFamily: T.fontMono, fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.forest }}>
                          AI Growth Strategy
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {skill.recommendations.map((rec, idx) => (
                          <li key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, color: T.forest, lineHeight: 1.4 }} className="flex items-start">
                            <TrendingUp size={13} className="mr-2 mt-0.5 text-[#1a3300]/40 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

// Career Pathways Tab (Redesigned in Neo-Brutalist theme)
export const CareerPathwaysTab = ({ data }) => {
  const [selectedPathwayIndex, setSelectedPathwayIndex] = React.useState(0);

  if (!data) return null;

  // Handle both singular roadmap and plural pathways
  const pathways = data.pathways || (data.careerTitle ? [data] : [mockCareerData.roadmap]);
  const activePathway = pathways[selectedPathwayIndex] || pathways[0];

  const title = activePathway.careerTitle || activePathway.title;
  const matchScore = activePathway.metrics?.matchScore || (activePathway.matchScore ? `${activePathway.matchScore}%` : "0%");
  const salary = activePathway.metrics?.salary || (activePathway.potentialSalary) || (activePathway.salaryRange ? `${formatTaka(activePathway.salaryRange.min)} - ${formatTaka(activePathway.salaryRange.max)}` : "TBD");
  const demand = activePathway.metrics?.demand || activePathway.demandLevel;
  const duration = activePathway.metrics?.estimatedDuration || activePathway.estimatedDuration || "4 Years (Undergrad)";
  const steps = activePathway.roadmap || activePathway.steps || [];

  return (
    <div className="space-y-10">
      {/* Local Style Injection for forcing white text overrides inside dark recommendation block */}
      <style>{`
          .force-white {
              color: #ffffff !important;
          }
          .force-cream {
              color: #fcfaf5 !important;
          }
      `}</style>

      {/* Pathway Selection (if multiple) */}
      {pathways.length > 1 && (
        <div className="flex flex-wrap gap-3.5 mb-8">
          {pathways.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPathwayIndex(idx)}
              className="px-5 py-3 transition-all duration-200"
              style={{
                  borderRadius: T.radius,
                  border: T.border,
                  backgroundColor: selectedPathwayIndex === idx ? T.yellow : T.white,
                  color: T.forest,
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  boxShadow: selectedPathwayIndex === idx ? T.shadowHard : T.shadow,
                  transform: selectedPathwayIndex === idx ? 'translate(-2px, -2px)' : 'none',
                  cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                  if (selectedPathwayIndex !== idx) {
                      e.currentTarget.style.backgroundColor = T.mint;
                      e.currentTarget.style.transform = 'translate(-1px, -1px)';
                      e.currentTarget.style.boxShadow = '3px 3px 0px #1a3300';
                  }
              }}
              onMouseLeave={(e) => {
                  if (selectedPathwayIndex !== idx) {
                      e.currentTarget.style.backgroundColor = T.white;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = T.shadow;
                  }
              }}
            >
              {p.careerTitle || p.title}
            </button>
          ))}
        </div>
      )}

      {/* Header Metrics */}
      <div 
        className="p-8 md:p-10 shadow-2xl relative overflow-hidden group"
        style={{
            backgroundColor: T.forest,
            border: T.border,
            borderRadius: '24px',
            boxShadow: T.shadowHard,
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#cb5521]/15 rounded-full -mr-20 -mt-20 blur-3xl transition-transform duration-700"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-[#ffe95c]" />
              <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: T.yellow }}>
                {selectedPathwayIndex === 0 ? "Top Recommendation" : "Alternative Pathway"}
              </span>
            </div>
            <div 
                className="force-white text-white font-black italic"
                style={{ 
                    fontFamily: T.fontDisplay, 
                    fontSize: '2.25rem', 
                    letterSpacing: '-0.02em', 
                    lineHeight: 1.1,
                    color: '#ffffff'
                }}
            >
              {title}
            </div>
          </div>

          <div 
              className="px-6 py-4 text-center min-w-[150px]"
              style={{
                  backgroundColor: T.yellow,
                  border: T.border,
                  borderRadius: T.radius,
                  boxShadow: '3px 3px 0px #1a3300',
              }}
          >
            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.forest, display: 'block', marginBottom: '0.25rem' }}>
              Aptitude Match
            </span>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '2rem', color: T.forest }} className="italic">
              {matchScore}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div 
              className="p-5"
              style={{
                  backgroundColor: T.white,
                  border: T.border,
                  borderRadius: T.radius,
                  boxShadow: '3px 3px 0px #1a3300',
              }}
          >
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, marginBottom: '0.35rem' }}>Starting Income</div>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.25rem', color: T.forest }} className="italic">{salary}</div>
          </div>
          
          <div 
              className="p-5"
              style={{
                  backgroundColor: T.white,
                  border: T.border,
                  borderRadius: T.radius,
                  boxShadow: '3px 3px 0px #1a3300',
              }}
          >
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, marginBottom: '0.35rem' }} className="flex items-center gap-1.5">
              <Clock size={12} className="text-[#cb5521]" /> Academic Duration
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.25rem', color: T.forest }} className="italic">{duration}</div>
          </div>

          <div 
              className="p-5"
              style={{
                  backgroundColor: T.white,
                  border: T.border,
                  borderRadius: T.radius,
                  boxShadow: '3px 3px 0px #1a3300',
              }}
          >
            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, marginBottom: '0.35rem' }}>Industry Demand</div>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: '1.25rem', color: T.forest }} className="italic">{demand}</div>
          </div>
        </div>
      </div>

      {/* Timeline Roadmap */}
      <div className="relative pl-12 space-y-12 before:content-[''] before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[3px] before:border-l-2 before:border-dashed before:border-[#1a3300]">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* TIMELINE DOT */}
            <div 
                className="absolute -left-[46px] top-1.5 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black italic transition-all duration-300 group-hover:rotate-0"
                style={{
                    backgroundColor: T.yellow,
                    border: T.border,
                    boxShadow: '2px 2px 0px #1a3300',
                    transform: 'rotate(12deg)',
                    color: T.forest,
                }}
            >
              {step.step || step.stepNumber || idx + 1}
            </div>

            <Card 
                hoverable 
                style={{
                    backgroundColor: T.white,
                    padding: '1.75rem',
                    boxShadow: T.shadow,
                }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 800, fontSize: '1.25rem', color: T.forest }}>{step.title}</h3>
                <span 
                    style={{
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        backgroundColor: T.mint,
                        color: T.forest,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(26,51,0,0.15)',
                        fontFamily: T.fontMono,
                    }}
                >
                  {step.tag || step.phase}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div 
                    className="p-4"
                    style={{
                        backgroundColor: T.cream,
                        border: '1px solid rgba(26,51,0,0.1)',
                        borderRadius: '8px',
                    }}
                >
                  <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Time Horizon</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: T.forest }} className="flex items-center gap-2">
                    <div style={{ width: 4, height: 12, backgroundColor: T.terracotta, borderRadius: 2 }} />
                    {step.duration}
                  </div>
                </div>
                
                <div 
                    className="p-4"
                    style={{
                        backgroundColor: T.cream,
                        border: '1px solid rgba(26,51,0,0.1)',
                        borderRadius: '8px',
                    }}
                >
                  <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, fontFamily: T.fontMono, marginBottom: '0.35rem' }}>Prerequisites</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: T.forest, lineHeight: 1.4 }}>
                    {Array.isArray(step.requirements) ? step.requirements.join(", ") : step.requirements || "N/A"}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.terracotta, fontFamily: T.fontMono, marginBottom: '0.5rem' }} className="flex items-center gap-1.5">
                  <Zap size={10} fill="currentColor" /> Smart Learning Resources
                </div>
                <div className="flex flex-wrap gap-2">
                  {step.resources?.map((res, i) => (
                    <div 
                        key={i} 
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                        style={{
                            backgroundColor: T.white,
                            border: '1.5px solid #1a3300',
                            color: T.forest,
                            boxShadow: '1.5px 1.5px 0px #1a3300',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.teal; e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '2.5px 2.5px 0px #1a3300'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = T.white; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #1a3300'; }}
                    >
                      {res}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
