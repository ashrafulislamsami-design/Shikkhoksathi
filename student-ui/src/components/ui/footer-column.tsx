import React, { useState } from 'react';
import {
  Github,
  Mail,
  MapPin,
  MessageCircle,
  Award,
  Sparkles,
  Globe,
  Zap,
  GraduationCap,
  X
} from 'lucide-react';

const data = {
  whatsappLink: 'https://wa.me/8801705570610',
  githubLink: 'https://github.com/ashrafulislamsami-design',
  emailLink: 'mailto:mdashrafulislamsami007@gmail.com',
  services: [
    { text: 'IEP Generator', modalId: 'iep-generator', icon: Zap },
    { text: 'Lesson Planner', modalId: 'lesson-planner', icon: Sparkles },
    { text: 'Adaptive Tests', modalId: 'adaptive-tests', icon: Globe },
    { text: 'Career Dashboard', modalId: 'career-dashboard', icon: GraduationCap }
  ],
  about: [
    { text: 'Teacher Command Center', modalId: 'teacher-hub' },
    { text: 'Student Hub', modalId: 'student-hub' },
    { text: 'Profile Settings', modalId: 'profile-settings' }
  ],
  help: [
    { text: 'Frequently Asked Questions', modalId: 'faq' },
    { text: 'User Manual', modalId: 'user-manual' },
    { text: 'Inclusive Guidelines', modalId: 'inclusive-guidelines' }
  ],
  contact: {
    email: 'mdashrafulislamsami007@gmail.com',
    whatsapp: '+880 1705-570610',
    address: 'Dhaka, Bangladesh',
  },
  company: {
    name: 'ShikkhokSathi AI',
    description:
      'Empowering educators and students globally with adaptive, AI-driven learning tools, inclusive lesson plans, and interactive career guidance.',
  },
};

const socialLinks = [
  { icon: MessageCircle, label: 'WhatsApp', href: data.whatsappLink, color: 'group-hover:text-[#25D366]' },
  { icon: Mail, label: 'Email', href: data.emailLink, color: 'group-hover:text-[#cb5521]' },
  { icon: Github, label: 'GitHub', href: data.githubLink, color: 'group-hover:text-[#ffe95c]' },
];

const getModalData = (onScrollToLogin: () => void) => ({
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about ShikkhokSathi AI",
    category: "Resources",
    icon: Globe,
    content: (
      <div className="space-y-6">
        {[
          {
            q: "What is ShikkhokSathi AI?",
            a: "ShikkhokSathi AI is an intelligent companion designed for educators and students in Bangladesh. It generates NCTB-aligned lesson plans, drafts Individualized Education Programs (IEPs) compliant with the Persons with Disabilities Rights Act 2013, and provides adaptive mock testing and matchmaking for peer tutoring."
          },
          {
            q: "Is the platform aligned with the National Curriculum & Textbook Board (NCTB)?",
            a: "Yes! All lessons and mock tests are generated and curated to align with the active NCTB syllabus guidelines and local school contexts in Bangladesh."
          },
          {
            q: "How does the IEP Generator help special needs classrooms?",
            a: "By inputting specific learning diagnoses and strengths, teachers receive customized pedagogical strategies, physical accommodations, and assistive tool suggestions. This ensures compliance with Bangladesh's inclusive education directives."
          },
          {
            q: "How do the accessibility features work?",
            a: "ShikkhokSathi is built from the ground up for universal access. The accessibility widget in the bottom-left allows users to toggle High Contrast Mode, scale font sizes, and activate text-to-speech audio guidance for low-vision and blind users."
          },
          {
            q: "Is there any cost associated with ShikkhokSathi AI?",
            a: "No. ShikkhokSathi AI is completely free to use for teachers, educators, and students in Bangladesh as part of the Bangladesh EdTech Initiative."
          }
        ].map((item, idx) => (
          <div key={idx} className="border-2 border-[#1a3300] bg-white p-4 rounded-xl shadow-[3px_3px_0px_#1a3300]">
            <h4 className="font-extrabold text-[#1a3300] text-base mb-2 flex items-start gap-2 text-left">
              <span className="text-[#cb5521]">Q:</span> {item.q}
            </h4>
            <p className="text-sm font-semibold text-[#1a3300]/85 leading-relaxed pl-6 text-left">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    )
  },
  'user-manual': {
    title: "User Manual & Getting Started",
    subtitle: "Step-by-step guides for Teachers and Students",
    category: "Resources",
    icon: Zap,
    content: (
      <div className="space-y-6 text-left">
        <div className="border-2 border-[#1a3300] bg-[#ffe95c]/10 p-5 rounded-xl">
          <h4 className="font-extrabold text-[#1a3300] text-lg mb-3 flex items-center gap-2">
            <Zap size={18} className="text-[#cb5521]" /> For Teachers & Educators
          </h4>
          <ol className="list-decimal list-inside space-y-3 text-sm font-semibold text-[#1a3300]/85">
            <li><span className="font-bold text-[#1a3300]">Account Registration:</span> Select the 'Teacher' role, fill in your school credentials, upazila, district, and subject details to personalize your AI dashboard context.</li>
            <li><span className="font-bold text-[#1a3300]">Creating Lessons:</span> Navigate to 'Lesson Co-Creator', input class levels and topics, and let the AI draft structured classroom plans with activities and local references.</li>
            <li><span className="font-bold text-[#1a3300]">Drafting IEPs:</span> In the 'IEP Generator', input diagnoses and strengths to create academic goals and custom learning modifications.</li>
            <li><span className="font-bold text-[#1a3300]">Managing Classrooms:</span> Use the 'Teacher Command Center' to review classroom heatmaps, edit generated materials, and check overall progress.</li>
          </ol>
        </div>
        
        <div className="border-2 border-[#1a3300] bg-white p-5 rounded-xl shadow-[3px_3px_0px_#1a3300]">
          <h4 className="font-extrabold text-[#1a3300] text-lg mb-3 flex items-center gap-2">
            <GraduationCap size={18} className="text-[#cb5521]" /> For Students
          </h4>
          <ol className="list-decimal list-inside space-y-3 text-sm font-semibold text-[#1a3300]/85">
            <li><span className="font-bold text-[#1a3300]">Dashboard Hub:</span> Log in to check active mock tests, tutoring matches, and tracking charts.</li>
            <li><span className="font-bold text-[#1a3300]">Taking Mock Tests:</span> Access 'Adaptive Mock Tests' to practice. The engine calibrates question difficulty dynamically.</li>
            <li><span className="font-bold text-[#1a3300]">Peer Tutoring Matchmaking:</span> Go to 'Peer Tutoring', state your strengths and subjects you need support in, and connect with peer matches.</li>
          </ol>
        </div>
      </div>
    )
  },
  'inclusive-guidelines': {
    title: "Inclusive Classroom Guidelines",
    subtitle: "Supporting learners of all abilities in Bangladesh",
    category: "Resources",
    icon: Sparkles,
    content: (
      <div className="space-y-6 text-left">
        <p className="text-sm font-bold text-[#1a3300]/80 italic">
          ShikkhokSathi supports the national framework for inclusive education. Here are practical strategies to implement inside your classroom:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-[#1a3300] bg-white p-4 rounded-xl shadow-[3px_3px_0px_#1a3300]">
            <h5 className="font-extrabold text-[#cb5521] text-sm uppercase tracking-wider mb-2">Visual Impairments</h5>
            <p className="text-xs font-semibold text-[#1a3300]/85 leading-relaxed">
              Read whiteboard text aloud, provide digital worksheets compatible with screen readers, and position students close to the board.
            </p>
          </div>
          <div className="border-2 border-[#1a3300] bg-white p-4 rounded-xl shadow-[3px_3px_0px_#1a3300]">
            <h5 className="font-extrabold text-[#cb5521] text-sm uppercase tracking-wider mb-2">Neurodiversity</h5>
            <p className="text-xs font-semibold text-[#1a3300]/85 leading-relaxed">
              Provide clean visual structures, explain instructions step-by-step, allow micro-breaks, and offer quiet zones to avoid sensory overload.
            </p>
          </div>
          <div className="border-2 border-[#1a3300] bg-white p-4 rounded-xl shadow-[3px_3px_0px_#1a3300]">
            <h5 className="font-extrabold text-[#cb5521] text-sm uppercase tracking-wider mb-2">Hearing Impairments</h5>
            <p className="text-xs font-semibold text-[#1a3300]/85 leading-relaxed">
              Face the class directly when speaking to enable lip-reading, utilize visual aids, and pair auditory activities with text descriptions.
            </p>
          </div>
          <div className="border-2 border-[#1a3300] bg-white p-4 rounded-xl shadow-[3px_3px_0px_#1a3300]">
            <h5 className="font-extrabold text-[#cb5521] text-sm uppercase tracking-wider mb-2">Legal Compliance</h5>
            <p className="text-xs font-semibold text-[#1a3300]/85 leading-relaxed">
              In compliance with the PWD Rights Act 2013, ensure every student with special needs has a dedicated, regularly audited IEP.
            </p>
          </div>
        </div>
      </div>
    )
  },
  'iep-generator': {
    title: "IEP Generator Suite",
    subtitle: "Drafting personalized Individualized Education Programs",
    category: "AI Features",
    icon: Zap,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          The IEP Generator helps special education teachers draft tailored accommodation frameworks. By evaluating student challenges, strengths, and standard goals, it structures behavioral plans, environmental accommodations, and assessment alterations.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Capabilities:</p>
          <p>✓ Fast 10-second draft cycles using targeted diagnostic categories.</p>
          <p>✓ Compliance with national Persons with Disabilities Rights Act 2013 guidelines.</p>
          <p>✓ Integrated student goal trackers and printable report templates.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Login / Sign Up to Generate IEPs
        </button>
      </div>
    )
  },
  'lesson-planner': {
    title: "Lesson Plan Co-Creator",
    subtitle: "Construct high-fidelity lesson plans aligned with NCTB",
    category: "AI Features",
    icon: Sparkles,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          Designed to alleviate the administrative burden on educators. Co-create classroom planners that compile subject matter benchmarks, curriculum connections, learning milestones, detailed procedures, and interactive assignments.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Capabilities:</p>
          <p>✓ Auto-aligns generated lesson drafts to specific Class 1-12 NCTB subjects.</p>
          <p>✓ Infuses plans with local Bangladeshi contexts and historical examples.</p>
          <p>✓ Suggests homework assignments, assessment questions, and classroom games.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Login / Sign Up to Create Lesson Plans
        </button>
      </div>
    )
  },
  'adaptive-tests': {
    title: "Adaptive Test Engine",
    subtitle: "Self-correcting competency assessment platform",
    category: "AI Features",
    icon: Globe,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          An advanced mock exam interface that automatically adjusts difficulty level based on student answers in real-time, matching each student's specific competency zones.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Capabilities:</p>
          <p>✓ Minimizes assessment stress by serving appropriately-leveled questions.</p>
          <p>✓ Generates immediate strength-weakness profiles and feedback analytics.</p>
          <p>✓ Supports mathematics, physics, history, and language subjects.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Login / Sign Up to Start Practice Tests
        </button>
      </div>
    )
  },
  'career-dashboard': {
    title: "Career Dashboard",
    subtitle: "Intelligent career path planning and milestones",
    category: "AI Features",
    icon: GraduationCap,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          Designed for secondary and higher secondary students (Classes 9-12). Map professional pathways, local university programs, and key educational milestones matched to your stream selection.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Capabilities:</p>
          <p>✓ Recommends local universities and technical training pathways in Bangladesh.</p>
          <p>✓ Tracks academic benchmarks needed for specific careers.</p>
          <p>✓ Dynamic visual progress timeline showing exactly what to study next.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Login / Sign Up to Access Career Dashboard
        </button>
      </div>
    )
  },
  'teacher-hub': {
    title: "Teacher Command Center",
    subtitle: "The centralized dashboard cockpit for educators",
    category: "Portal Hub",
    icon: Award,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          The control center where teachers track student metrics, review generated IEP logs, assign peer tutors, and store custom lesson templates.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Features:</p>
          <p>✓ Class-wide analytics with performance heatmaps and risk scores.</p>
          <p>✓ Centralized library of previously created lesson blueprints and classroom materials.</p>
          <p>✓ Toggle controls to manage inclusive accommodations dynamically.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Go to Teacher Login
        </button>
      </div>
    )
  },
  'student-hub': {
    title: "Student Hub Portal",
    subtitle: "Your personal space for learning, testing, and matching",
    category: "Portal Hub",
    icon: GraduationCap,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          A comprehensive cockpit for students to complete practice assessments, monitor learning metrics, join peer tutoring circles, and progress through interactive timelines.
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Key Features:</p>
          <p>✓ Dynamic test launchers with real-time scoring feedback.</p>
          <p>✓ Peer Tutoring matchmaking panel to find or become a tutor.</p>
          <p>✓ Leaderboard and achievement systems to gamify academic improvement.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Go to Student Login
        </button>
      </div>
    )
  },
  'profile-settings': {
    title: "Profile & Settings Hub",
    subtitle: "Manage academic profiles and application preferences",
    category: "Portal Hub",
    icon: Mail,
    content: (
      <div className="space-y-4 text-left">
        <p className="text-sm font-semibold text-[#1a3300]/80 leading-relaxed">
          Customize your profile avatar, configure your taught classes/subjects (for teachers), or adjust academic stream and strength parameters (for students).
        </p>
        <div className="bg-[#ffe95c]/10 border-2 border-[#1a3300] p-4 rounded-xl text-xs font-semibold space-y-2">
          <p className="font-bold text-[#cb5521]">Configurable Settings:</p>
          <p>✓ Password updates and secure credential management.</p>
          <p>✓ Custom classroom sizes, subjects list, and location identifiers.</p>
          <p>✓ Gamified avatar customization options.</p>
        </div>
        <button 
          onClick={onScrollToLogin}
          className="w-full mt-2 py-3 bg-[#ffe95c] hover:bg-[#ffe95c]/85 text-[#1a3300] font-extrabold text-sm rounded-xl border-2 border-[#1a3300] shadow-[3px_3px_0px_#1a3300] active:translate-y-0.5 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all text-center"
        >
          Login to Adjust Settings
        </button>
      </div>
    )
  }
});

export default function Footer4Col() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleScrollToLogin = () => {
    setActiveModal(null);
    setTimeout(() => {
      const element = document.querySelector('.landing-auth-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const modalData = activeModal ? getModalData(handleScrollToLogin)[activeModal as keyof ReturnType<typeof getModalData>] : null;
  const ModalIcon = modalData?.icon || Globe;

  return (
    <footer 
      className="relative mt-24 w-full overflow-hidden border-t-3 border-[#1a3300] bg-[#fcfaf5] text-[#1a3300]"
      style={{
        borderTopWidth: '3px',
        borderColor: '#1a3300',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Background grid pattern matching landing page hero */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1a3300 1px, transparent 1px),
            linear-gradient(to bottom, #1a3300 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      ></div>

      <div className="mx-auto max-w-screen-xl px-6 py-16 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          
          {/* Brand & Mission Column */}
          <div className="space-y-6 lg:col-span-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    width: '44px',
                    height: '44px',
                    background: '#ffe95c',
                    border: '2px solid #1a3300',
                    borderRadius: '10px',
                    boxShadow: '3px 3px 0px #1a3300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={22} className="text-[#1a3300]" />
                </div>
                <span 
                  style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} 
                  className="text-2xl font-extrabold tracking-tight text-[#1a3300]"
                >
                  {data.company.name}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#1a3300]/70 max-w-md font-semibold text-left">
                {data.company.description}
              </p>
            </div>

            <div className="pt-2">
              <p 
                style={{ fontFamily: "'Roboto Mono', monospace" }} 
                className="mb-3 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#1a3300]/60 text-left"
              >
                Connect with Developer
              </p>
              <ul className="flex gap-4">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border-2 border-[#1a3300] shadow-[2.5px_2.5px_0px_#1a3300] transition-all duration-200 hover:bg-[#ffe95c] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a3300]"
                      title={label}
                    >
                      <span className="sr-only">{label}</span>
                      <Icon size={18} className="text-[#1a3300]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            
            {/* Features/Services */}
            <div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} className="text-xs font-black uppercase tracking-wider text-[#1a3300] mb-5 flex items-center gap-1.5 justify-start">
                <Sparkles size={14} className="text-[#cb5521]" />
                AI Features
              </h3>
              <ul className="space-y-3 text-left">
                {data.services.map(({ text, modalId }) => (
                  <li key={text}>
                    <button
                      onClick={() => setActiveModal(modalId)}
                      className="text-sm font-semibold text-[#1a3300]/70 transition-colors duration-150 hover:text-[#cb5521] text-left focus:outline-none"
                    >
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Portal Hub */}
            <div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} className="text-xs font-black uppercase tracking-wider text-[#1a3300] mb-5 text-left">
                Portal Hub
              </h3>
              <ul className="space-y-3 text-left">
                {data.about.map(({ text, modalId }) => (
                  <li key={text}>
                    <button
                      onClick={() => setActiveModal(modalId)}
                      className="text-sm font-semibold text-[#1a3300]/70 transition-colors duration-150 hover:text-[#cb5521] text-left focus:outline-none"
                    >
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} className="text-xs font-black uppercase tracking-wider text-[#1a3300] mb-5 text-left">
                Resources
              </h3>
              <ul className="space-y-3 text-left">
                {data.help.map(({ text, modalId }) => (
                  <li key={text}>
                    <button
                      onClick={() => setActiveModal(modalId)}
                      className="text-sm font-semibold text-[#1a3300]/70 transition-colors duration-150 hover:text-[#cb5521] text-left focus:outline-none"
                    >
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} className="text-xs font-black uppercase tracking-wider text-[#1a3300] mb-5 text-left">
                Get in Touch
              </h3>
              <ul className="space-y-4 text-left">
                <li>
                  <a
                    href={data.emailLink}
                    className="group flex items-start gap-2.5 text-sm font-semibold text-[#1a3300]/70 transition-colors hover:text-[#cb5521]"
                  >
                    <Mail size={15} className="text-[#cb5521] mt-0.5 shrink-0" />
                    <span>Email Developer</span>
                  </a>
                </li>
                <li>
                  <a
                    href={data.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 text-sm font-semibold text-[#1a3300]/70 transition-colors hover:text-[#cb5521]"
                  >
                    <MessageCircle size={15} className="text-[#25D366] shrink-0" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </li>
                <li className="flex items-center gap-2.5 text-sm font-semibold text-[#1a3300]/60">
                  <MapPin size={15} className="text-[#cb5521] shrink-0" />
                  <span>{data.contact.address}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '2px dashed rgba(26,51,0,0.12)' }} className="mt-16 pt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 text-center sm:text-left">
            <p style={{ fontFamily: "'Roboto Mono', monospace" }} className="text-[10px] font-bold text-[#1a3300]/60 uppercase tracking-wider">
              Built with Precision &bull; Bangladesh EdTech Initiative
            </p>
            <p className="text-xs font-extrabold text-[#1a3300] leading-normal">
              &copy; {new Date().getFullYear()} ShikkhokSathi AI Dashboard &bull; Optimized for Global Classrooms
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Neo-brutalist Modal Overlay */}
      {activeModal && modalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-modal-fade"
          onClick={() => setActiveModal(null)}
        >
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes modalFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalScaleIn {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-modal-fade {
              animation: modalFadeIn 0.2s ease-out forwards;
            }
            .animate-modal-scale {
              animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#fcfaf5] border-3 border-[#1a3300] rounded-2xl shadow-[8px_8px_0px_#1a3300] flex flex-col p-6 sm:p-8 animate-modal-scale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div 
                  style={{
                    width: '40px',
                    height: '40px',
                    background: '#ffe95c',
                    border: '2px solid #1a3300',
                    borderRadius: '8px',
                    boxShadow: '2.5px 2.5px 0px #1a3300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ModalIcon size={20} className="text-[#1a3300]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#cb5521]">
                    {modalData.category}
                  </span>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque', 'Outfit', sans-serif" }} className="text-xl sm:text-2xl font-black text-[#1a3300] mt-0.5">
                    {modalData.title}
                  </h3>
                </div>
              </div>
              
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg border-2 border-[#1a3300] bg-white shadow-[2px_2px_0px_#1a3300] hover:bg-[#ffe95c] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#1a3300] active:translate-y-0 active:shadow-[1px_1px_0px_#1a3300] transition-all"
              >
                <X size={18} className="text-[#1a3300]" />
              </button>
            </div>

            <p className="text-sm font-semibold text-[#1a3300]/70 mb-5 leading-relaxed text-left">
              {modalData.subtitle}
            </p>

            <div style={{ borderTop: '2px dashed rgba(26,51,0,0.12)' }} className="mb-6 pt-5 text-[#1a3300]">
              {modalData.content}
            </div>

            {/* Footer close button */}
            <div className="flex justify-end mt-4 pt-4 border-t border-[#1a3300]/10">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 border-2 border-[#1a3300] bg-white text-[#1a3300] font-black text-sm rounded-xl shadow-[3px_3px_0px_#1a3300] hover:bg-[#ffe95c] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a3300] active:translate-y-0 active:shadow-[1.5px_1.5px_0px_#1a3300] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
