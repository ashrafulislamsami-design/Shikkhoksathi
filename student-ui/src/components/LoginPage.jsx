import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    User, Lock, Mail, School, MapPin, Briefcase, ArrowRight, 
    Loader2, Users, ArrowLeft, Zap, BookOpen, Sparkles, 
    Shield, CheckCircle, 
    Brain, Target, GraduationCap, Star,
    Play, ArrowDown
} from 'lucide-react';
import Footer4Col from './ui/footer-column';

/* ─────────────────────────────────────────
   ANIMATED GRADIENT ORB BACKGROUND
   ───────────────────────────────────────── */
const FloatingOrbs = () => (
    <div className="landing-orbs-container">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
        <div className="landing-orb landing-orb-4" />
    </div>
);

/* ─────────────────────────────────────────
   PARTICLE FIELD (canvas-based)
   ───────────────────────────────────────── */
const ParticleField = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animFrameRef = useRef(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Initialize particles
        const count = Math.min(80, Math.floor(window.innerWidth / 20));
        particlesRef.current = Array.from({ length: count }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.4 + 0.1,
        }));

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouse);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const particles = particlesRef.current;
            const mouse = mouseRef.current;
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                // Mouse repulsion
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    p.vx += (dx / dist) * force * 0.15;
                    p.vy += (dy / dist) * force * 0.15;
                }

                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.99;
                p.vy *= 0.99;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(26, 51, 0, ${p.opacity})`;
                ctx.fill();

                // Connection lines
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (d < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(26, 51, 0, ${0.04 * (1 - d / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    return <canvas ref={canvasRef} className="landing-particle-canvas" />;
};

/* ─────────────────────────────────────────
   ANIMATED COUNTER WITH INTERSECTION OBS
   ───────────────────────────────────────── */
const AnimatedCounter = ({ target, suffix = '', prefix = '', label, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasAnimated) setHasAnimated(true);
        }, { threshold: 0.3 });
        obs.observe(el);
        return () => obs.unobserve(el);
    }, [hasAnimated]);

    useEffect(() => {
        if (!hasAnimated) return;
        let start = 0;
        const increment = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { start = target; clearInterval(timer); }
            setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [hasAnimated, target, duration]);

    const display = target >= 1000 ? `${Math.floor(count / 1000)}k` : `${count}`;

    return (
        <div ref={ref} className="landing-stat-item">
            <span className="landing-stat-number">{prefix}{display}{suffix}</span>
            <span className="landing-stat-label">{label}</span>
        </div>
    );
};

/* ─────────────────────────────────────────
   FEATURE CARD WITH HOVER INTERACTION
   ───────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, description, color, index, onHover }) => {
    const [isHovered, setIsHovered] = useState(false);
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.unobserve(el);
    }, []);

    return (
        <div 
            ref={ref}
            className={`landing-feature-card landing-feature-card-${color}`}
            style={{ 
                transitionDelay: `${index * 100}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
            }}
            onMouseEnter={() => { setIsHovered(true); onHover && onHover(description); }}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`landing-feature-icon landing-feature-icon-${color}`}>
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <div className="landing-feature-content">
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{description}</p>
            </div>
            <div className={`landing-feature-arrow ${isHovered ? 'landing-feature-arrow-visible' : ''}`}>
                <ArrowRight size={18} />
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────
   MARQUEE TICKER
   ───────────────────────────────────────── */
const MarqueeTicker = () => {
    const items = [
        "NCTB Curriculum Aligned", "AI-Powered Lesson Plans", "Adaptive Testing Engine",
        "Inclusive Education Framework", "Real-Time Analytics", "Peer Tutoring Network",
        "IEP Generator Suite", "Accessibility First", "Bangladesh Education AI"
    ];
    return (
        <div className="landing-marquee-wrap">
            <div className="landing-marquee-track">
                {[...items, ...items].map((item, i) => (
                    <span key={i} className="landing-marquee-item">
                        <Star size={10} className="landing-marquee-star" />
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};


/* ═══════════════════════════════════════════
   MAIN LOGIN PAGE COMPONENT
   ═══════════════════════════════════════════ */
const LoginPage = ({ onLoginSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [heroLoaded, setHeroLoaded] = useState(false);

    // Email OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

    // Accessibility States
    const [highContrast, setHighContrast] = useState(false);
    const [largeText, setLargeText] = useState(false);
    const [audioGuidance, setAudioGuidance] = useState(false);
    const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);

    const loginSectionRef = useRef(null);

    // Trigger hero animation on mount
    useEffect(() => {
        const t = setTimeout(() => setHeroLoaded(true), 150);
        return () => clearTimeout(t);
    }, []);

    const toggleHighContrast = () => {
        const next = !highContrast;
        setHighContrast(next);
        if (next) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        speakText(next ? "High contrast mode enabled" : "High contrast mode disabled");
    };

    const toggleLargeText = () => {
        const next = !largeText;
        setLargeText(next);
        if (next) {
            document.body.classList.add('large-text');
        } else {
            document.body.classList.remove('large-text');
        }
        speakText(next ? "Large text mode enabled" : "Large text mode disabled");
    };

    const toggleAudioGuidance = () => {
        const next = !audioGuidance;
        setAudioGuidance(next);
        if (next) {
            speakText("Audio guidance mode enabled. Hover over elements to hear descriptions.");
        } else {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        }
    };

    const speakText = (text) => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleHover = (text) => {
        if (audioGuidance) {
            speakText(text);
        }
    };

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        otp: '',
        studentClass: '',
        stream: '',
        school: '',
        district: '',
        upazila: '',
        division: '',
        designation: '',
        subjects: '',
        classes: '',
        strengths: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOtp = async () => {
        if (!formData.email) {
            setError('Please enter your email address first.');
            return;
        }
        setOtpLoading(true);
        setError('');
        setOtpSuccessMsg('');
        try {
            const response = await axios.post('http://localhost:5000/api/student/send-otp', {
                email: formData.email
            });
            if (response.data.success) {
                setOtpSent(true);
                setOtpSuccessMsg('Verification code sent successfully!');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to send verification code.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let endpoint = '';
        if (isSignUp) {
            endpoint = role === 'teacher'
                ? 'http://localhost:5000/api/teachers/register'
                : 'http://localhost:5000/api/student/register';
        } else {
            endpoint = role === 'teacher'
                ? 'http://localhost:5000/api/teachers/login'
                : 'http://localhost:5000/api/student/login';
        }

        try {
            const finalData = { ...formData };
            if (role === 'teacher') {
                finalData.subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s !== '');
                finalData.classes = formData.classes.split(',').map(s => s.trim()).filter(s => s !== '');
            } else if (role === 'student') {
                finalData.profile = {
                    strengths: formData.strengths.split(',').map(s => s.trim()).filter(s => s !== ''),
                    class: formData.studentClass
                };
            }

            const payload = isSignUp ? finalData : {
                email: formData.email,
                password: formData.password
            };

            const response = await axios.post(endpoint, payload);

            if (response.data.success) {
                const token = response.data.token || response.data.data?.token;
                const actualUser = response.data.teacher || response.data.data?.user || response.data.user;

                if (!token) throw new Error('Authentication failed: No token received');

                onLoginSuccess({
                    token,
                    role,
                    user: actualUser
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Action failed. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const scrollToLogin = () => {
        loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const features = [
        {
            icon: BookOpen, title: "Lesson Plan Co-Creator", color: "mint",
            description: "Generate lesson blueprints customized with local Bangladeshi context in under 10 seconds."
        },
        {
            icon: Users, title: "IEP Generator Suite", color: "blush",
            description: "Specialized education drafting designed to fit the Persons with Disabilities Rights Act 2013."
        },
        {
            icon: Zap, title: "Adaptive Practice Engine", color: "teal",
            description: "Custom mock tests that automatically calibrate questions to student competency zones."
        },
        {
            icon: Shield, title: "Universal Accessibility", color: "terracotta",
            description: "Empowering low-vision and partially blind users with high contrast overrides, scalable text, and live TTS audio guidance."
        },
        {
            icon: Brain, title: "AI Classroom Intelligence", color: "yellow",
            description: "Real-time heatmaps, risk-scoring, and micro-intervention alerts powered by machine learning."
        },
        {
            icon: Target, title: "Peer Tutoring Network", color: "mint",
            description: "Connect high-performing students with those who need support through intelligent matchmaking."
        },
    ];

    return (
        <div className="landing-root">
            {/* ===== SECTION 1: CINEMATIC HERO ===== */}
            <section className="landing-hero-section pt-28 pb-32 md:pt-36 md:pb-8">
                <ParticleField />
                <FloatingOrbs />
                
                {/* Noise texture overlay */}
                <div className="landing-noise-overlay" />

                {/* Navigation Bar */}
                <nav className={`landing-nav ${heroLoaded ? 'landing-nav-visible' : ''}`}>
                    <div className="landing-nav-brand">
                        <img src="/logo.png" alt="ShikkhokSathi" className="landing-nav-logo" />
                        <div>
                            <span className="landing-nav-name">ShikkhokSathi</span>
                            <span className="landing-nav-tag">AI Education Suite</span>
                        </div>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features" className="landing-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            Features
                        </a>
                        <a href="#stats" className="landing-nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' }); }}>
                            Impact
                        </a>
                        <button onClick={scrollToLogin} className="landing-nav-cta">
                            Get Started <ArrowRight size={14} />
                        </button>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="landing-hero-content">
                    <div className={`landing-hero-badge ${heroLoaded ? 'landing-hero-badge-visible' : ''}`}>
                        <Sparkles size={13} />
                        <span>Project Million X — Next-Gen Educational AI for Bangladesh</span>
                    </div>

                    <h1 className={`landing-hero-h1 ${heroLoaded ? 'landing-hero-h1-visible' : ''}`}>
                        <span className="landing-hero-line landing-hero-line-1">Empower Teachers.</span>
                        <span className="landing-hero-line landing-hero-line-2">
                            Elevate <span className="landing-hero-highlight">Students.</span>
                        </span>
                        <span className="landing-hero-line landing-hero-line-3">
                            Unlock <span className="landing-hero-highlight-alt">Classroom Potential.</span>
                        </span>
                    </h1>

                    <p className={`landing-hero-sub ${heroLoaded ? 'landing-hero-sub-visible' : ''}`}>
                        ShikkhokSathi bridges the gap between learning and classroom management by 
                        delivering adaptive, NCTB-aligned student assessments and inclusive education 
                        support — built for Bangladesh, powered by AI.
                    </p>

                    <div className={`landing-hero-actions flex flex-col md:flex-row gap-4 w-full justify-center items-center ${heroLoaded ? 'landing-hero-actions-visible' : ''}`}>
                        <button onClick={scrollToLogin} className="landing-hero-btn-primary w-full md:w-auto justify-center">
                            <Play size={16} /> Start Teaching
                        </button>
                        <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="landing-hero-btn-secondary w-full md:w-auto justify-center">
                            Explore Features <ArrowDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className={`landing-scroll-indicator ${heroLoaded ? 'landing-scroll-indicator-visible' : ''}`}>
                    <div className="landing-scroll-line" />
                    <span>Scroll to explore</span>
                </div>
            </section>

            {/* ===== MARQUEE TICKER ===== */}
            <MarqueeTicker />

            {/* ===== SECTION 2: FEATURES ===== */}
            <section id="features" className="landing-features-section">
                <div className="landing-section-header">
                    <span className="landing-section-tag">
                        <GraduationCap size={14} /> Platform Capabilities
                    </span>
                    <h2 className="landing-section-title">
                        Everything teachers and students need,<br />
                        <span className="landing-section-title-em">in one intelligent platform.</span>
                    </h2>
                    <p className="landing-section-desc">
                        From AI-generated lesson plans to adaptive assessments, ShikkhokSathi provides 
                        comprehensive tools designed for the Bangladesh education system.
                    </p>
                </div>

                <div className="landing-features-grid">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            color={feature.color}
                            index={index}
                            onHover={handleHover}
                        />
                    ))}
                </div>
            </section>

            {/* ===== SECTION 3: STATS BAR ===== */}
            <section id="stats" className="landing-stats-section">
                <div className="landing-stats-inner">
                    <AnimatedCounter target={20} suffix="s" label="Avg. Plan Draft Time" />
                    <div className="landing-stats-divider" />
                    <AnimatedCounter target={98} suffix="%" label="Accuracy Rating" />
                    <div className="landing-stats-divider" />
                    <div className="landing-stat-item">
                        <span className="landing-stat-number landing-stat-number-alt">Act-13</span>
                        <span className="landing-stat-label">Legal Alignment</span>
                    </div>
                    <div className="landing-stats-divider" />
                    <AnimatedCounter target={15} suffix="k+" label="System Views" />
                </div>
            </section>

            {/* ===== SECTION 4: LOGIN / SIGNUP ===== */}
            <section ref={loginSectionRef} className="landing-auth-section">
                <div className="landing-auth-bg" />
                <div className="landing-auth-container">
                    {/* Left side — Marketing blurb */}
                    <div className="landing-auth-info">
                        <h2 className="landing-auth-info-title">
                            Begin your journey<br />
                            <span className="landing-auth-info-em">with ShikkhokSathi.</span>
                        </h2>
                        <p className="landing-auth-info-desc">
                            Whether you're a teacher seeking intelligent classroom management or a student 
                            looking for adaptive learning — we've built this platform for you.
                        </p>

                        <div className="landing-auth-trust-signals">
                            <div className="landing-trust-item">
                                <CheckCircle size={16} className="landing-trust-icon" />
                                <span>Free for all Bangladesh educators</span>
                            </div>
                            <div className="landing-trust-item">
                                <CheckCircle size={16} className="landing-trust-icon" />
                                <span>NCTB syllabus aligned content</span>
                            </div>
                            <div className="landing-trust-item">
                                <CheckCircle size={16} className="landing-trust-icon" />
                                <span>Inclusive education compliance</span>
                            </div>
                            <div className="landing-trust-item">
                                <CheckCircle size={16} className="landing-trust-icon" />
                                <span>Fully accessible platform</span>
                            </div>
                            <div className="landing-trust-item">
                                <CheckCircle size={16} className="landing-trust-icon" />
                                <span>Designed for low-vision & partially blind users</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side — Auth Form */}
                    <div className="landing-auth-card">
                        <div className="landing-auth-card-accent" />
                        
                        <div className="landing-auth-header flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <h2 className="landing-auth-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                            <div className="landing-auth-toggle">
                                <button
                                    onClick={() => { setIsSignUp(false); setError(''); }}
                                    className={`landing-auth-toggle-btn ${!isSignUp ? 'landing-auth-toggle-active' : ''}`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsSignUp(true); setError(''); }}
                                    className={`landing-auth-toggle-btn ${isSignUp ? 'landing-auth-toggle-active' : ''}`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="landing-auth-form">
                            {/* Role Selector */}
                            <div className="landing-role-selector">
                                <button
                                    type="button"
                                    onClick={() => setRole('student')}
                                    className={`landing-role-btn ${role === 'student' ? 'landing-role-btn-active' : ''}`}
                                >
                                    <Users size={16} /> Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('teacher')}
                                    className={`landing-role-btn ${role === 'teacher' ? 'landing-role-btn-active' : ''}`}
                                >
                                    <School size={16} /> Teacher
                                </button>
                            </div>

                            {error && (
                                <div className="landing-auth-error">
                                    {error}
                                </div>
                            )}

                            <div className={`landing-auth-fields ${isSignUp && role === 'teacher' ? 'landing-auth-fields-2col' : ''}`}>
                                {isSignUp && (
                                    <div className="landing-input-group landing-input-full">
                                        <User className="landing-input-icon" size={18} />
                                        <input
                                            type="text" name="name" placeholder="Full Name"
                                            value={formData.name} onChange={handleInputChange} required
                                            className="landing-input"
                                        />
                                    </div>
                                )}

                                <div className={`landing-input-group ${isSignUp && role === 'teacher' ? '' : ''}`} style={{ position: 'relative' }}>
                                    <Mail className="landing-input-icon" size={18} />
                                    <input
                                        type="email" name="email" placeholder="Email Address"
                                        value={formData.email} onChange={handleInputChange} required
                                        className="landing-input pr-32"
                                    />
                                    {isSignUp && (
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            disabled={otpLoading}
                                            style={{
                                                position: 'absolute',
                                                right: '0.4rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                padding: '0.4rem 0.65rem',
                                                backgroundColor: '#ffe95c',
                                                color: '#1a3300',
                                                border: '1.5px solid #1a3300',
                                                borderRadius: '6px',
                                                fontSize: '0.68rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                zIndex: 3,
                                                boxShadow: '1.5px 1.5px 0px #1a3300'
                                            }}
                                        >
                                            {otpLoading ? 'Sending...' : otpSent ? 'Resend' : 'Send Code'}
                                        </button>
                                    )}
                                </div>

                                {isSignUp && otpSuccessMsg && (
                                    <div style={{ color: '#1a3300', fontSize: '0.72rem', fontWeight: 800, margin: '0.15rem 0 0.15rem 0.25rem', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <span style={{ color: '#25D366' }}>●</span> {otpSuccessMsg}
                                    </div>
                                )}

                                {isSignUp && otpSent && (
                                    <div className="landing-input-group landing-input-full">
                                        <CheckCircle className="landing-input-icon" size={18} style={{ color: '#cb5521' }} />
                                        <input
                                            type="text" name="otp" placeholder="Enter 6-Digit Verification Code"
                                            value={formData.otp} onChange={handleInputChange} required
                                            className="landing-input"
                                            maxLength={6}
                                        />
                                    </div>
                                )}

                                <div className={`landing-input-group ${isSignUp && role === 'teacher' ? '' : ''}`}>
                                    <Lock className="landing-input-icon" size={18} />
                                    <input
                                        type="password" name="password" placeholder="Password"
                                        value={formData.password} onChange={handleInputChange} required
                                        className="landing-input"
                                    />
                                </div>

                                {/* Student Class Dropdown */}
                                {isSignUp && role === 'student' && (
                                    <div className="landing-input-group landing-input-full">
                                        <School className="landing-input-icon" size={18} />
                                        <select
                                            name="studentClass" value={formData.studentClass}
                                            onChange={handleInputChange} required
                                            className="landing-input landing-select"
                                        >
                                            <option value="" disabled>Select Your Class (1-12)</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                                                <option key={cls} value={cls}>Class {cls}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Stream Selection */}
                                {isSignUp && role === 'student' && (formData.studentClass === '11' || formData.studentClass === '12') && (
                                    <div className="landing-input-group landing-input-full">
                                        <Briefcase className="landing-input-icon" size={18} />
                                        <select
                                            name="stream" value={formData.stream}
                                            onChange={handleInputChange} required
                                            className="landing-input landing-select"
                                        >
                                            <option value="" disabled>Select Your Stream</option>
                                            <option value="Science">Science</option>
                                            <option value="Arts">Arts</option>
                                            <option value="Commerce">Commerce</option>
                                            <option value="General">General</option>
                                        </select>
                                    </div>
                                )}

                                {/* Student Strengths */}
                                {isSignUp && role === 'student' && (
                                    <div className="landing-input-group landing-input-full">
                                        <Zap className="landing-input-icon" size={18} />
                                        <input
                                            type="text" name="strengths"
                                            placeholder="Your Strengths (e.g. Math, Physics, Bangla - comma separated)"
                                            value={formData.strengths} onChange={handleInputChange}
                                            className="landing-input"
                                        />
                                    </div>
                                )}

                                {/* Teacher signup fields */}
                                {isSignUp && role === 'teacher' && (
                                    <>
                                        <div className="landing-input-group">
                                            <School className="landing-input-icon" size={18} />
                                            <input type="text" name="school" placeholder="School/College Name"
                                                value={formData.school} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group">
                                            <Briefcase className="landing-input-icon" size={18} />
                                            <input type="text" name="designation" placeholder="Designation (e.g. Senior Teacher)"
                                                value={formData.designation} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group">
                                            <MapPin className="landing-input-icon" size={18} />
                                            <input type="text" name="division" placeholder="Division"
                                                value={formData.division} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group">
                                            <MapPin className="landing-input-icon" size={18} />
                                            <input type="text" name="district" placeholder="District"
                                                value={formData.district} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group landing-input-full">
                                            <MapPin className="landing-input-icon" size={18} />
                                            <input type="text" name="upazila" placeholder="Upazila"
                                                value={formData.upazila} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group landing-input-full">
                                            <BookOpen className="landing-input-icon" size={18} />
                                            <input type="text" name="subjects" placeholder="Subjects you teach (comma separated)"
                                                value={formData.subjects} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                        <div className="landing-input-group landing-input-full">
                                            <Users className="landing-input-icon" size={18} />
                                            <input type="text" name="classes" placeholder="Classes you teach (e.g. 9, 10, 11)"
                                                value={formData.classes} onChange={handleInputChange} required className="landing-input" />
                                        </div>
                                    </>
                                )}
                            </div>

                            <button type="submit" disabled={loading} className="landing-submit-btn">
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="landing-auth-footer">
                            <button onClick={() => setIsSignUp(!isSignUp)} className="landing-auth-switch">
                                {isSignUp ? (
                                    <><ArrowLeft size={12} /> Already have an account? Login</>
                                ) : (
                                    <>Don't have an account? Sign Up</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <Footer4Col />

            {/* ===== FLOATING ACCESSIBILITY WIDGET ===== */}
            <div className="fixed bottom-6 left-6 z-50">
                <button
                    type="button"
                    onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
                    onMouseEnter={() => handleHover("Accessibility Settings Menu")}
                    className="landing-a11y-btn"
                    title="Accessibility Menu"
                >
                    <Shield size={22} className={showAccessibilityMenu ? "rotate-45 transition-transform" : "transition-transform"} />
                </button>

                {showAccessibilityMenu && (
                    <div className="landing-a11y-menu">
                        <h4 className="landing-a11y-menu-title">
                            <Sparkles size={16} /> Accessibility Tools
                        </h4>
                        
                        <div className="landing-a11y-options">
                            <button
                                type="button" onClick={toggleHighContrast}
                                className={`landing-a11y-option ${highContrast ? 'landing-a11y-option-active' : ''}`}
                            >
                                <span>High Contrast Mode</span>
                                <span className={`landing-a11y-indicator ${highContrast ? 'landing-a11y-indicator-on' : ''}`}>
                                    {highContrast && <CheckCircle size={10} />}
                                </span>
                            </button>

                            <button
                                type="button" onClick={toggleLargeText}
                                className={`landing-a11y-option ${largeText ? 'landing-a11y-option-active' : ''}`}
                            >
                                <span>Large Text Mode</span>
                                <span className={`landing-a11y-indicator ${largeText ? 'landing-a11y-indicator-on' : ''}`}>
                                    {largeText && <CheckCircle size={10} />}
                                </span>
                            </button>

                            <button
                                type="button" onClick={toggleAudioGuidance}
                                className={`landing-a11y-option ${audioGuidance ? 'landing-a11y-option-active' : ''}`}
                            >
                                <span>Audio Voice Guidance</span>
                                <span className={`landing-a11y-indicator ${audioGuidance ? 'landing-a11y-indicator-on' : ''}`}>
                                    {audioGuidance && <CheckCircle size={10} />}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
