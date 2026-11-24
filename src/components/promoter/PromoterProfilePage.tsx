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
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText,
  Star,
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
    <div className="min-h-screen bg-[#070d18] text-slate-100 selection:bg-[#f5c451] selection:text-slate-950 pb-20 font-sans">
      {/* 1. HERO SECTION: EXECUTIVE COMMAND CENTER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1526] via-[#091220] to-[#070d18] text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 space-y-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
            {/* Left Column: Executive Identity & Badges */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs font-bold tracking-wide uppercase shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  Official Executive Promoter Profile
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/35 text-blue-300 text-xs font-semibold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Fellow, Chartered Institute of Administration (FCIA)
                </span>
              </div>

              {/* Title & Name */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-display">
                  S. B. OMOTOSO
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-0.5">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black tracking-wider border border-emerald-500/40">
                    FCIA
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 font-mono text-xs font-black tracking-wider border border-blue-500/40">
                    MILR
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs font-black tracking-wider border border-amber-500/40">
                    MSc
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-mono text-xs font-black tracking-wider border border-purple-500/40">
                    MNIM
                  </span>
                </div>
              </div>

              {/* Roles & Executive Summary */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-normal">
                Chief Executive, Institution Builder, Pioneer AI Literacy Educator & Corporate Governance Specialist. Visionary Leader of{' '}
                <strong className="text-white font-bold tracking-tight">DIGITAL WEALTH CREATORS (DWC)</strong>. Bringing decades of proven operational excellence, statutory institution building, and technology-forward human capital development across Nigeria and West Africa.
              </p>

              {/* Location & Standing */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-slate-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Abeokuta, Ogun State, Nigeria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>30+ Years Institutional & Executive Practice</span>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Invite as Resource Person/Facilitator</span>
                </button>

                <a
                  href="https://wa.me/2348034710699"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                <a
                  href="#availability-calendar"
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Schedule</span>
                </a>
              </div>
            </div>

            {/* Right Column: Executive Crest & Credentials Card */}
            <div className="w-full lg:w-96 shrink-0 bg-gradient-to-b from-slate-900/90 to-[#0c1626]/90 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Monogram Seal */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-700/80">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-950/60 border border-white/20">
                  SO
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Key Credentials</h3>
                  <p className="text-xs text-slate-400">Institutional & Industry Standing</p>
                </div>
              </div>

              {/* Credential Items */}
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">FCIA:</strong> Fellow, Chartered Institute of Administration
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">MNIM:</strong> Member, Nigerian Institute of Management (Chartered)
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">MILR:</strong> Master of Industrial & Labour Relations (UI)
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">MSc:</strong> Master of Science (LAUTECH)
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Executive:</strong> CEO for Hire, Administrator for Hire
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-950/50 text-center block cursor-pointer"
                >
                  Check Availability & Book →
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-black text-white font-display">30+ Years</span>
              <p className="text-[11px] text-slate-400 font-medium">Executive & Registry Leadership</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-display">10,000+</span>
              <p className="text-[11px] text-slate-400 font-medium">Educators, Librarians & Youths Trained</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-black text-blue-400 font-display">7 Domains</span>
              <p className="text-[11px] text-slate-400 font-medium">Specialized Consultancy Services</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 text-center sm:text-left">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-display">100%</span>
              <p className="text-[11px] text-slate-400 font-medium">Verified Operational Delivery</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* 2. SPECIAL HEADING: CEO FOR HIRE, ADMINISTRATOR FOR HIRE (Classic Royal Blue & Crimson Red Design) */}
        <section className="relative overflow-hidden p-6 sm:p-9 rounded-3xl bg-gradient-to-br from-[#0c1f38] via-[#0f2b52] to-[#0a192f] border-2 border-blue-500/40 text-white space-y-6 shadow-2xl shadow-blue-950/60">
          {/* Subtle decorative background glows */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-400/20">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-900/40">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/70 border border-red-500/40 px-2.5 py-0.5 rounded-full">
                    ★ Executive Mandate
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-950/70 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                    Advisory/Interim
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  CEO for Hire, Administrator for Hire
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 rounded-xl transition-all shadow-lg shadow-red-950/50 hover:scale-[1.02] cursor-pointer self-start sm:self-auto border border-red-400/40"
            >
              Initiate Executive Inquiry →
            </button>
          </div>

          <p className="relative text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Available for interim, fractional, or advisory chief executive and institutional registrar/administrative leadership mandates across higher institutions, corporate enterprises, educational foundations, and digital ventures seeking proven operational governance, institution building, and technology-forward stewardship.
          </p>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-[#091528]/80 border border-blue-500/25 space-y-2 hover:border-blue-400/50 transition-colors shadow-sm">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Strategic Leadership</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                End-to-end organizational direction, board relations, corporate governance & statutory compliance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#091528]/80 border border-blue-500/25 space-y-2 hover:border-blue-400/50 transition-colors shadow-sm">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Institution Building</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Administrative take-off, university registry setup, institutional policies & statutory accreditation structures.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#091528]/80 border border-red-500/25 space-y-2 hover:border-red-400/50 transition-colors shadow-sm">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>Turnaround Governance</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Crisis leadership, operational overhaul, continuity frameworks & human capital realignment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#091528]/80 border border-blue-500/25 space-y-2 hover:border-blue-400/50 transition-colors shadow-sm">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Cost Leadership</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Direct labor deployment & digital modernization delivering high impact at a fraction of traditional cost.
              </p>
            </div>
          </div>
        </section>

        {/* 3. TEACHING & AUTHORSHIP TRACK RECORD */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px] font-bold uppercase tracking-wider">
              Educational Impact & Proven Record
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Teaching & Authorship Track Record
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              A demonstrated history of pioneering technical education, university curriculum delivery, and grassroots youth digital transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {/* 1. Ogun State Library Board Collaboration */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-colors space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Ogun State Library Board
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-400">September 2026 Collaboration</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Organised AI Literacy, Vibe Coding and Web App Development Training for Librarians, Information Science Practitioners and Administrators in Ogun State, in collaboration with the Ogun State Library Board in September, 2026.
              </p>
            </div>

            {/* 2. Owu Youth Forum Abeokuta */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-colors space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Owu Youth Forum Abeokuta
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-400">October 2026 Youth Training</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Organised AI Literacy, Vibe Coding and Web App Development Training for the Owu Youth Forum Abeokuta, in October, 2026 amongs many others.
              </p>
            </div>

            {/* 3. Chrisland University */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-colors space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Chrisland University
                  </h4>
                  <span className="text-[10px] font-semibold text-purple-400">Academic Faculty</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                University Lecturer in Vibe Coding, Web App Development & AI Literacy at Chrisland University, training the next generation of software innovators.
              </p>
            </div>

            {/* 4. Abeokuta Polo Club Training */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Abeokuta Polo Club Training
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-400">120 Youths Empowered</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Facilitator of the intensive training for 120 Ogun State Youths in Vibe Coding, equipping emerging talent with marketable software creation skills.
              </p>
            </div>

            {/* 5. Published Author */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-colors space-y-3 md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Published Author
                  </h4>
                  <span className="text-[10px] font-semibold text-rose-400">Authoritative Manual</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Author of <strong className="text-white italic">"Vibe Coding: The Complete Pipeline"</strong> — a comprehensive, practical manual on taking software concepts from natural language prompts to production deployment across African infrastructure.
              </p>
            </div>
          </div>
        </section>

        {/* 4. PLATFORM CAPABILITIES SHOWCASE */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              Ecosystem Showcase
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              DIGITAL WEALTH CREATORS (DWC) Ecosystem
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Pioneering high-impact digital education, artificial intelligence literacy, and production software capabilities across Nigeria and West Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                AI Literacy & Vibe Coding Curricula
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practical training empowering non-technical leaders and students to build production web applications using agentic AI, natural language workflows, and rapid iteration.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Digital Toolkits & Downloadable Guides
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Curated operational blueprints, governance frameworks, prompt engineering repositories, and downloadable guides engineered for immediate workplace execution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Video LMS & Verified Certificates
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Modern LMS with in-player timestamped notes with 1-click document export, interactive quizzes, and automated completion certificates with public QR verification.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Prompt Engineering Vault
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enterprise prompt libraries for executives, administrators, and software architects designed to maximize LLM reasoning, code generation, and automated workflows.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Software Products & Web Applications
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Full-stack digital marketplace, LMS platforms, affiliate monetization systems, and cloud-native solutions engineered for African internet infrastructure and Naira commerce.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">
                University Incubators & Tech Hubs
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Collaborative programs bringing university students and faculty into modern startup development, entrepreneurship mentoring, and real-world software product creation.
              </p>
            </div>
          </div>
        </section>

        {/* 5. CONSULTANCY SERVICES (7 SPECIFIC DOMAINS) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
              Strategic Advisory
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Consultancy Portfolio & Specialized Advisory
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Specialized consultancy across institutional administration, enterprise technology, and human capital systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {/* 1. Management Consultancy */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  01
                </span>
                <h3 className="text-sm font-bold text-white">
                  Management Consultancy
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Corporate strategy formulation, organizational diagnosis, administrative restructuring, operational efficiency review, and policy documentation for institutions and commercial enterprises.
              </p>
            </div>

            {/* 2. Virtual Library Management Systems */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  02
                </span>
                <h3 className="text-sm font-bold text-white">
                  Virtual Library Management Systems
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Architecting and deploying multi-tenant academic virtual library platforms (AVL), OPAC catalogues, digital repositories, institutional book donation coordination, and digital content delivery.
              </p>
            </div>

            {/* 3. ICT Consultancy for Higher Institutions */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  03
                </span>
                <h3 className="text-sm font-bold text-white">
                  ICT Consultancy for Higher Institutions
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Campus-wide gigabit networking, fibre-optic & wireless infrastructure, computer-based test (CBT) examination centres, and learning management systems (LMS) deployed via cost-effective direct labor.
              </p>
            </div>

            {/* 4. School Portal and Web Development */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  04
                </span>
                <h3 className="text-sm font-bold text-white">
                  School Portal and Web Development
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Custom institutional web platforms, automated admissions workflows, student records administration engines, online result checkers, fee payment gateways, and cloud deployment.
              </p>
            </div>

            {/* 5. Scheduled Training and Development */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  05
                </span>
                <h3 className="text-sm font-bold text-white">
                  Scheduled Training and Development
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Custom structured corporate masterclasses, workforce upskilling retreats, administrative registry training, AI literacy workshops, and executive development seminars across public and private sectors.
              </p>
            </div>

            {/* 6. Business Setup and Management */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  06
                </span>
                <h3 className="text-sm font-bold text-white">
                  Business Setup and Management
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enterprise take-off advisory, statutory documentation, operational setup, commercialization models, MoUs, partnership proposals, and sustainable new venture growth management.
              </p>
            </div>

            {/* 7. Human Resources Management */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs font-mono">
                  07
                </span>
                <h3 className="text-sm font-bold text-white">
                  Human Resources Management
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Comprehensive manpower audits, executive search & talent recruitment, job evaluations, staff appraisal frameworks, disciplinary and grievance resolution committees, and professional development grounded in NIM and MILR standards.
              </p>
            </div>
          </div>
        </section>

        {/* 6. INTERACTIVE AVAILABILITY CALENDAR SECTION */}
        <section id="availability-calendar" className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                Real-Time Availability
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                Executive Engagement Calendar
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Check upcoming availability or click any open date to initiate your keynote or executive engagement request.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>Open Invitation Form</span>
              <ChevronRight className="w-4 h-4" />
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
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0a1526] border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-1.5 border-b border-slate-800 pb-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
              Official Inquiries
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Official Engagement & Contact
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Reach out directly to arrange keynotes, executive administration, corporate training, or consulting engagements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <MapPin className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Location</h4>
              </div>
              <p className="text-xs text-slate-300">Abeokuta, Ogun State, Nigeria</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Phone className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Direct/WhatsApp</h4>
              </div>
              <a
                href="https://wa.me/2348034710699"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline block font-mono font-bold"
              >
                +2348034710699
              </a>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Mail className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Official Email</h4>
              </div>
              <a
                href="mailto:info@tintol.com.ng"
                className="text-xs text-emerald-400 hover:underline block font-mono font-bold"
              >
                info@tintol.com.ng
              </a>
            </div>
          </div>

          {/* Official Referee Statement (Strict Guardrail) */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">Referee Policy:</strong> Institutional references available on request
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
