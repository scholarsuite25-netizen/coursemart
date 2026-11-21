import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Layers,
  Library,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { InteractiveCalendar } from './InteractiveCalendar';
import { FacilitatorBookingModal } from './FacilitatorBookingModal';

export function PromoterProfilePage() {
  const { calendarEngagements } = useStore();

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        {/* Subtle decorative background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center lg:text-left space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  Executive Promoter Profile
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Fellow, Chartered Institute of Administration (FCIA)
                </span>
              </div>

              {/* Title & Name */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
                  S. B. OMOTOSO
                </h1>
                <div className="mt-2 text-lg sm:text-xl font-bold text-emerald-400 tracking-wide font-mono">
                  FCIA, MILR, MSc, MNIM
                </div>
              </div>

              {/* Roles & Executive Summary */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed font-light">
                Pioneer AI Literacy Educator, Higher Education Administrator & Corporate
                Governance Specialist, Creator of{' '}
                <strong className="text-white font-semibold">CourseMart</strong> &{' '}
                <strong className="text-white font-semibold">Digital Wealth Creators</strong>.
              </p>

              {/* Location */}
              <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Abeokuta, Ogun State, Nigeria</span>
              </div>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Invite as Resource Person / Facilitator</span>
                </button>

                <a
                  href="https://wa.me/2348034710699"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm sm:text-base transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </a>
              </div>
            </div>

            {/* Executive Highlights Card */}
            <div className="w-full lg:w-96 shrink-0 bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-700/80">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  SO
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Key Credentials</h3>
                  <p className="text-xs text-slate-400">Institutional & Industry Standing</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>FCIA:</strong> Fellow, Chartered Institute of Administration
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MNIM:</strong> Member, Nigerian Institute of Management (Chartered)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MILR:</strong> Master of Industrial & Labour Relations
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>MSc:</strong> Master of Science in Management / Corporate Administration
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Consultant:</strong> NUC Licensing & Higher Ed Accreditation
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenBookingModal}
                  className="w-full py-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white font-semibold text-xs uppercase tracking-wider transition-colors text-center block"
                >
                  Check Availability & Book
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* 2. PLATFORM CAPABILITIES SHOWCASE */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Ecosystem Showcase
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              CourseMart & Digital Wealth Creators Ecosystem
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Pioneering high-impact digital education, artificial intelligence literacy, and production software capabilities across Nigeria and West Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                AI Literacy & Vibe Coding Curricula
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Comprehensive practical training empowering non-technical leaders and students to build production-grade web applications using agentic AI, natural language workflows, and rapid iteration.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Digital Toolkits & Downloadable Guides
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Curated operational blueprints, institutional governance frameworks, prompt engineering repositories, and downloadable guides engineered for immediate workplace implementation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                High-Definition Video LMS & Certificates
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern learning management system featuring in-player timestamped notes with 1-click document export, interactive quizzes, and automated completion certificates with public QR verification.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Prompt Engineering Vault
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise prompt libraries for executives, administrators, and software architects designed to maximize LLM reasoning, code generation, and automated documentation.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Software Products & Web Applications
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                End-to-end full-stack digital marketplace, LMS platforms, affiliate monetization systems, and cloud-native solutions engineered for African internet infrastructure and Naira commerce.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                University Incubators & Tech Hubs
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Collaborative programs bringing university students and faculty into modern startup development, entrepreneurship mentoring, and real-world software product creation.
              </p>
            </div>
          </div>
        </section>

        {/* 3. TEACHING & AUTHORSHIP TRACK RECORD */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              Educational Impact
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Teaching & Authorship Track Record
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A demonstrated history of pioneering technical education and youth digital transformation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Chrisland University
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                University Lecturer in Vibe Coding, Web App Development & AI Literacy at Chrisland University, training the next generation of software innovators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Abeokuta Polo Club Training
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Facilitator of the intensive training for 120 Ogun State Youths in Vibe Coding, equipping emerging talent with marketable software creation skills.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Published Author
                </h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Author of <em>"Vibe Coding: The Complete Pipeline"</em> — a definitive practical manual on taking software concepts from natural language prompts to production deployment.
              </p>
            </div>
          </div>
        </section>

        {/* 4. THREE CONSULTANCY DOMAINS */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Strategic Advisory
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Three Specialized Consultancy Tracks
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Decades of multidisciplinary leadership across higher education statutory governance, campus digital networks, and professional human capital development.
            </p>
          </div>

          <div className="space-y-6">
            {/* Track 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                  01
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Institutional Governance & Higher Education Registry Consultancy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Statutory organs, NUC licensing, program accreditation & administrative take-off
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pl-0 lg:pl-16">
                Specialized advisory services covering National Universities Commission (NUC) licensing requirements, academic program accreditation, university registry structure design, statutory council protocols, and operational take-off frameworks across prestigious institutions including{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Bowen University, Edwin Clark University, Dominion University, Atiba University, and Chrisland University
                </strong>.
              </p>
            </div>

            {/* Track 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  02
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Digital Infrastructure & Smart Library Consultancy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Campus gigabit networks, e-libraries, CBT centres & LMS modernization
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pl-0 lg:pl-16">
                Architecting campus-wide gigabit wireless and fibre optic networks, institutional digital repositories, modern university e-libraries, computer-based test (CBT) examination centres, and custom LMS deployments spearheaded through{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Scholar Suite
                </strong>{' '}
                and{' '}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Tintol Business Services
                </strong>.
              </p>
            </div>

            {/* Track 3 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
                  03
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Human Capital & Executive Management Consultancy
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Registry operations, executive recruitment, statutory committees & NIM frameworks
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pl-0 lg:pl-16">
                Governance advisory, executive search & registry staff recruitment, institutional committee leadership, and professional management development grounded in Nigerian Institute of Management (NIM) frameworks and Chartered Institute of Administration best practices.
              </p>
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE AVAILABILITY CALENDAR SECTION */}
        <section id="availability-calendar" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Real-Time Availability
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                Executive Engagement Calendar
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Check upcoming availability or click an open date to initiate your booking request.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
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

        {/* 6. CONTACT & OFFICIAL REFEREES SECTION */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white space-y-8">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Official Inquiries
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Official Engagement & Contact
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Reach out directly to arrange keynotes, institutional advisory, executive training, or university partnership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-3 text-emerald-400">
                <MapPin className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Location</h4>
              </div>
              <p className="text-sm text-slate-300">Abeokuta, Ogun State, Nigeria</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-3 text-emerald-400">
                <Phone className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Direct / WhatsApp</h4>
              </div>
              <a
                href="https://wa.me/2348034710699"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-400 hover:underline block font-mono"
              >
                +2348034710699
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-3 text-emerald-400">
                <Mail className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">Official Email</h4>
              </div>
              <a
                href="mailto:info@tintol.com.ng"
                className="text-sm text-emerald-400 hover:underline block"
              >
                info@tintol.com.ng
              </a>
            </div>
          </div>

          {/* Official Referee Statement (Strict Guardrail) */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Referee Policy:</strong> Institutional references available on request
              </span>
            </div>
            <div className="text-slate-500 text-xs">
              CourseMart & Tintol Business Services · Executive Secretariat
            </div>
          </div>
        </section>
      </div>

      {/* 7. FACILITATOR BOOKING MODAL */}
      <FacilitatorBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialDate={selectedDate}
      />
    </div>
  );
}

export default PromoterProfilePage;
