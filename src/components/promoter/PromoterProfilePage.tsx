import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Globe,
  Layers,
  Library,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Phone,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { InteractiveCalendar } from './InteractiveCalendar';
import { FacilitatorBookingModal } from './FacilitatorBookingModal';
import { AppointmentsTable } from './AppointmentsTable';

export function PromoterProfilePage() {
  const { calendarEngagements, currentUser } = useStore();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsBookingModalOpen(true);
  };

  const handleOpenBookingModal = () => {
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* 1. HERO SECTION (Refined Compact Typography) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle decorative background glows */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center lg:text-left space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3 h-3" />
                  Executive Promoter Profile
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Fellow, Chartered Institute of Administration (FCIA)
                </span>
              </div>

              {/* Title & Name */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  S. B. OMOTOSO
                </h1>
                <div className="mt-1 text-xs sm:text-sm font-bold text-emerald-400 tracking-wide font-mono">
                  FCIA, MILR, MSc, MNIM
                </div>
              </div>

              {/* Roles & Executive Summary */}
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-normal">
                Chief Executive, Institution Builder, Pioneer AI Literacy Educator & Corporate Governance Specialist. Visionary Leader of{' '}
                <strong className="text-white font-semibold">DIGITAL WEALTH CREATORS (DWC)</strong>.
              </p>

              {/* Location */}
              <div className="flex items-center justify-center lg:justify-start gap-1.5 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Abeokuta, Ogun State, Nigeria</span>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Invite as Resource Person / Facilitator</span>
                </button>

                <a
                  href="https://wa.me/2348034710699"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-medium text-xs transition-all hover:scale-[1.01]"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>

            {/* Executive Highlights Card */}
            <div className="w-full lg:w-80 shrink-0 bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/80 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-base shadow-md">
                  SO
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">Key Credentials</h3>
                  <p className="text-[10px] text-slate-400">Institutional & Industry Standing</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>FCIA:</strong> Fellow, Chartered Institute of Administration
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MNIM:</strong> Member, Nigerian Institute of Management (Chartered)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MILR:</strong> Master of Industrial & Labour Relations (UI)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MSc:</strong> Master of Science (LAUTECH)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Executive:</strong> CEO for Hire, Administrator for Hire
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="w-full py-2.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white font-semibold text-[11px] uppercase tracking-wider transition-colors text-center block cursor-pointer"
                >
                  Check Availability & Book
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* 2. SPECIAL HEADING: CEO FOR HIRE, ADMINISTRATOR FOR HIRE */}
        <section className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-900/20 via-slate-900 to-slate-950 border border-emerald-500/30 text-white space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Executive Mandate
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-white">
                  CEO for Hire, Administrator for Hire
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="px-3.5 py-1.5 text-xs font-bold text-[#0a192f] bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
            >
              Initiate Executive Inquiry
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Available for interim, fractional, or advisory chief executive and institutional registrar/administrative leadership mandates across higher institutions, corporate enterprises, educational foundations, and digital ventures seeking proven operational governance, institution building, and technology-forward stewardship.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 text-xs font-bold">Strategic Leadership</span>
              <p className="text-[11px] text-slate-300">End-to-end organizational direction, board relations & compliance.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 text-xs font-bold">Institution Building</span>
              <p className="text-[11px] text-slate-300">Administrative take-off, registry setup & statutory structuring.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 text-xs font-bold">Turnaround Governance</span>
              <p className="text-[11px] text-slate-300">Crisis leadership, continuity frameworks & process overhaul.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 text-xs font-bold">Cost Leadership</span>
              <p className="text-[11px] text-slate-300">Direct labor deployment & digital modernization at fraction cost.</p>
            </div>
          </div>
        </section>

        {/* 3. PLATFORM CAPABILITIES SHOWCASE */}
        <section className="space-y-5">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Ecosystem Showcase
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              DIGITAL WEALTH CREATORS (DWC) Ecosystem
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              Pioneering high-impact digital education, artificial intelligence literacy, and production software capabilities across Nigeria and West Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                AI Literacy & Vibe Coding Curricula
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Practical training empowering non-technical leaders and students to build production web applications using agentic AI, natural language workflows, and rapid iteration.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Digital Toolkits & Downloadable Guides
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Curated operational blueprints, governance frameworks, prompt engineering repositories, and downloadable guides engineered for immediate workplace execution.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Video LMS & Verified Certificates
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern LMS with in-player timestamped notes with 1-click document export, interactive quizzes, and automated completion certificates with public QR verification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Prompt Engineering Vault
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise prompt libraries for executives, administrators, and software architects designed to maximize LLM reasoning, code generation, and automated workflows.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                Software Products & Web Applications
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Full-stack digital marketplace, LMS platforms, affiliate monetization systems, and cloud-native solutions engineered for African internet infrastructure and Naira commerce.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                University Incubators & Tech Hubs
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Collaborative programs bringing university students and faculty into modern startup development, entrepreneurship mentoring, and real-world software product creation.
              </p>
            </div>
          </div>
        </section>

        {/* 4. TEACHING & AUTHORSHIP TRACK RECORD */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              Educational Impact
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Teaching & Authorship Track Record
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              A demonstrated history of pioneering technical education and youth digital transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Chrisland University
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                University Lecturer in Vibe Coding, Web App Development & AI Literacy at Chrisland University, training the next generation of software innovators.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Abeokuta Polo Club Training
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Facilitator of the intensive training for 120 Ogun State Youths in Vibe Coding, equipping emerging talent with marketable software creation skills.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Published Author
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Author of <em>"Vibe Coding: The Complete Pipeline"</em> — a practical manual on taking software concepts from natural language prompts to production deployment.
              </p>
            </div>
          </div>
        </section>

        {/* 5. CONSULTANCY SERVICES (7 SPECIFIC DOMAINS) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Strategic Advisory
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Consultancy Portfolio & Specialized Advisory
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              Specialized consultancy across institutional administration, enterprise technology, and human capital systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Management Consultancy */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  01
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Management Consultancy
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Corporate strategy formulation, organizational diagnosis, administrative restructuring, operational efficiency review, and policy documentation for institutions and commercial enterprises.
              </p>
            </div>

            {/* 2. Virtual Library Management Systems */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  02
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Virtual Library Management Systems
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Architecting and deploying multi-tenant academic virtual library platforms (AVL), OPAC catalogues, digital repositories, institutional book donation coordination, and digital content delivery.
              </p>
            </div>

            {/* 3. ICT Consultancy for Higher Institutions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  03
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  ICT Consultancy for Higher Institutions
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Campus-wide gigabit networking, fibre-optic & wireless infrastructure, computer-based test (CBT) examination centres, and learning management systems (LMS) deployed via cost-effective direct labor.
              </p>
            </div>

            {/* 4. School Portal and Web Development */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  04
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  School Portal and Web Development
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Custom institutional web platforms, automated admissions workflows, student records administration engines, online result checkers, fee payment gateways, and cloud deployment.
              </p>
            </div>

            {/* 5. Scheduled Training and Development */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                  05
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Scheduled Training and Development
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Custom structured corporate masterclasses, workforce upskilling retreats, administrative registry training, AI literacy workshops, and executive development seminars across public and private sectors.
              </p>
            </div>

            {/* 6. Business Setup and Management */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                  06
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Business Setup and Management
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Enterprise take-off advisory, statutory documentation, operational setup, commercialization models, MoUs, partnership proposals, and sustainable new venture growth management.
              </p>
            </div>

            {/* 7. Human Resources Management */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  07
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Human Resources Management
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Comprehensive manpower audits, executive search & talent recruitment, job evaluations, staff appraisal frameworks, disciplinary and grievance resolution committees, and professional development grounded in NIM and MILR standards.
              </p>
            </div>
          </div>
        </section>

        {/* 6. INTERACTIVE AVAILABILITY CALENDAR SECTION */}
        <section id="availability-calendar" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                Real-Time Availability
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                Executive Engagement Calendar
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Check upcoming availability or click an open date to initiate your booking request.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>Open Invitation Form</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <InteractiveCalendar
            engagements={calendarEngagements}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDateFromCalendar}
          />
        </section>

        {/* 6B. FACILITATOR APPOINTMENTS & ENGAGEMENT ROSTER TABLE */}
        <section id="appointments-roster" className="space-y-4">
          <AppointmentsTable
            title="Facilitator Appointments & Engagement Roster"
            subtitle={
              currentUser?.role === 'admin'
                ? 'Live schedule of keynote invitations, masterclasses, and executive appointments with instant facilitator Accept/Decline toggle.'
                : 'Live official schedule of confirmed keynote invitations, masterclasses, and executive appointments.'
            }
            showAdminControls={currentUser?.role === 'admin'}
          />
        </section>

        {/* 7. CONTACT & OFFICIAL REFEREES SECTION */}
        <section className="p-6 rounded-2xl bg-slate-900 text-white space-y-5">
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Official Inquiries
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Official Engagement & Contact
            </h2>
            <p className="text-slate-400 text-xs">
              Reach out directly to arrange keynotes, executive administration, corporate training, or consulting engagements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <MapPin className="w-4 h-4" />
                <h4 className="font-bold text-white text-xs">Location</h4>
              </div>
              <p className="text-xs text-slate-300">Abeokuta, Ogun State, Nigeria</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Phone className="w-4 h-4" />
                <h4 className="font-bold text-white text-xs">Direct / WhatsApp</h4>
              </div>
              <a
                href="https://wa.me/2348034710699"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline block font-mono"
              >
                +2348034710699
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400">
                <Mail className="w-4 h-4" />
                <h4 className="font-bold text-white text-xs">Official Email</h4>
              </div>
              <a
                href="mailto:info@tintol.com.ng"
                className="text-xs text-emerald-400 hover:underline block"
              >
                info@tintol.com.ng
              </a>
            </div>
          </div>

          {/* Official Referee Statement (Strict Guardrail) */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Referee Policy:</strong> Institutional references available on request
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              DIGITAL WEALTH CREATORS & Tintol Business Services · Executive Secretariat
            </div>
          </div>
        </section>
      </div>

      {/* 8. FACILITATOR BOOKING MODAL */}
      <FacilitatorBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDate={selectedDate}
      />
    </div>
  );
}

export default PromoterProfilePage;
