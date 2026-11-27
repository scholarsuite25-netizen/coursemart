import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  BookmarkPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Download,
  FileText,
  Headphones,
  Image,
  Lock,
  Megaphone,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Subtitles,
  Trash2,
  Video,
  Volume1,
  Volume2,
  VolumeX,
  Mic,
  Printer,
  Tv,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CourseModule } from '../../types/marketplace';
import {
  CERTIFICATE_PASS_MARK,
  calculateModuleProgress,
  canIssueCourseCertificate,
  getCourseProgressSummary,
  isLectureUnlocked,
  isModuleCompleted,
  isModuleQuizUnlocked,
  isModuleUnlocked,
  shuffleQuestionOptionIndices,
} from '../../utils/commerce';
import { generateCertificateCode } from '../../utils/certificateUtils';
import { CertificateModal } from './CertificateModal';
import { runEnquiryAgent } from '../../utils/agentAutomation';
import { isCopyProtectionActive } from '../../utils/contentProtection';
import { LectureVideoCanvasPlayer } from './LectureVideoCanvasPlayer';
import { ContentProtectionWrapper } from './ContentProtectionWrapper';
import { DynamicWatermarkOverlay } from './DynamicWatermarkOverlay';
import { triggerFileDownload, triggerDirectLinkDownload } from '../../utils/fileDownloader';

interface CoursePlayerPageProps {
  productId: string;
}

export function CoursePlayerPage({ productId }: CoursePlayerPageProps) {
  const {
    products,
    currentUser,
    isOwnedByCurrentUser,
    getCourseProgress,
    toggleLectureComplete,
    toggleModuleComplete,
    setLastViewedLecture,
    resetCourseProgress,
    saveLectureNote,
    addTimestampedNote,
    deleteTimestampedNote,
    submitModuleQuiz,
    issueCourseCertificate,
    addLectureQuestion,
    answerLectureQuestion,
    navigate,
    showToast,
    appearance,
  } = useStore();

  const product = products.find((p) => p.id === productId && p.type === 'course');
  const isProtected = isCopyProtectionActive(
    product?.copyProtectionEnabled,
    appearance?.globalCopyProtection
  );
  const flatLectures = useMemo(() => {
    if (!product?.courseData) return [];
    return product.courseData.modules.flatMap((m) =>
      m.lectures.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
    );
  }, [product]);

  const progress = product ? getCourseProgress(product.id) : undefined;
  const completedIds = progress?.completedLectureIds ?? [];

  const [activeLectureId, setActiveLectureId] = useState<string>(
    progress?.lastLectureId || flatLectures[0]?.id || ''
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'transcript' | 'resources' | 'notes' | 'qa' | 'announcements'
  >('overview');
  const [noteDraft, setNoteDraft] = useState('');
  const [pinnedNoteText, setPinnedNoteText] = useState('');
  const [questionDraft, setQuestionDraft] = useState('');
  const [loadingAiAnswerId, setLoadingAiAnswerId] = useState<string | null>(null);
  const [isSubmittingAi, setIsSubmittingAi] = useState<boolean>(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [autoOpenedCert, setAutoOpenedCert] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  // Interactive Quiz modal state
  const [activeQuizModule, setActiveQuizModule] = useState<CourseModule | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizOptionOrderByQuestion, setQuizOptionOrderByQuestion] = useState<
    Record<string, number[]>
  >({});

  const activeLectureIndex = Math.max(
    0,
    flatLectures.findIndex((l) => l.id === activeLectureId)
  );
  const activeLecture = flatLectures[activeLectureIndex] ?? flatLectures[0];
  const totalLectureSeconds = (activeLecture?.durationMinutes ?? 15) * 60;

  useEffect(() => {
    if (activeLecture && product) {
      setNoteDraft(progress?.notesByLecture[activeLecture.id] ?? '');
      setElapsedSeconds(0);
      setIsPlaying(false);
      setLastViewedLecture(product.id, activeLecture.id);
    }
  }, [activeLecture?.id, product?.id]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + playbackSpeed;
        if (next >= totalLectureSeconds) {
          setIsPlaying(false);
          if (product && activeLecture && !completedIds.includes(activeLecture.id)) {
            toggleLectureComplete(product.id, activeLecture.id);
          }
          if (autoAdvance && activeLectureIndex < flatLectures.length - 1) {
            const assumed = activeLecture
              ? Array.from(new Set([...completedIds, activeLecture.id]))
              : completedIds;
            tryAdvanceToNextLecture(assumed);
          }
          return totalLectureSeconds;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [
    isPlaying,
    playbackSpeed,
    totalLectureSeconds,
    autoAdvance,
    activeLectureIndex,
    flatLectures,
    product,
    activeLecture,
    completedIds,
    toggleLectureComplete,
  ]);

  const modules = product?.courseData?.modules ?? [];
  const quizScoresByModule = progress?.quizScoresByModule;
  const certificateEligibility = useMemo(() => {
    if (!product) {
      return { eligible: false, completionPercent: 0, unpassedQuizModules: [] as string[] };
    }
    return canIssueCourseCertificate(product, completedIds, quizScoresByModule);
  }, [product, completedIds, quizScoresByModule]);

  // Auto-open certificate modal ONLY when all sequential steps and 80%+ quizzes are passed
  useEffect(() => {
    if (product && certificateEligibility.eligible && !autoOpenedCert) {
      if (!progress?.certificateCode) {
        issueCourseCertificate(product.id);
      }
      setCertificateOpen(true);
      setAutoOpenedCert(true);
    }
  }, [
    product,
    certificateEligibility.eligible,
    autoOpenedCert,
    progress?.certificateCode,
    issueCourseCertificate,
  ]);

  if (!product || !product.courseData) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Course not found</h1>
        <button
          type="button"
          onClick={() => navigate('/library')}
          className="mt-5 px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-md cursor-pointer"
        >
          Back to My Library
        </button>
      </main>
    );
  }

  const isFreeProduct = product.price === 0 || product.includedInMembershipTier === 'free';
  const hasAccess =
    currentUser &&
    (isFreeProduct ||
      isOwnedByCurrentUser(product.id) ||
      currentUser.role === 'admin' ||
      currentUser.role === 'instructor');

  if (!hasAccess) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Enrollment Required
        </h1>
        <p className="text-sm text-slate-600">
          Purchase "{product.title}" or activate a qualifying Membership to open the course player.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/product/${product.slug}`)}
          className="px-5 py-2.5 text-sm font-bold text-white bg-[#5624d0] rounded-md cursor-pointer"
        >
          View Course Details
        </button>
      </main>
    );
  }

  const progressSummary = getCourseProgressSummary(product, completedIds);
  const progressPct = progressSummary.percent;
  const isCurrentCompleted = activeLecture ? completedIds.includes(activeLecture.id) : false;
  const activeTimestampedNotes =
    (activeLecture && progress?.timestampedNotesByLecture?.[activeLecture.id]) ?? [];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleSeekToNoteTimestamp = (timeLabel: string) => {
    const clean = timeLabel.replace(/[\[\]]/g, '').trim();
    const parts = clean.split(':').map((p) => parseInt(p, 10));
    let sec = 0;
    if (!parts.some(isNaN)) {
      if (parts.length === 2) {
        sec = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    }
    setElapsedSeconds(sec);
    setIsPlaying(true);
    showToast(`Jumped player to [${clean}]`);
  };

  const handlePrintNotes = () => {
    if (!product || !activeLecture) return;
    const printWindow = window.open('', '_blank', 'width=850,height=700');
    const student = currentUser?.name || 'Digital Wealth Creators Student';
    const notesContent = progress?.notesByLecture[activeLecture.id] || noteDraft || 'No general scratchpad notes entered.';
    const timestampNotes = (progress?.timestampedNotesByLecture?.[activeLecture.id] || [])
      .map((tn) => `<li style="margin-bottom:8px;"><strong>[${tn.timeLabel}]</strong> ${tn.text}</li>`)
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Study Notes - ${product.title} - ${activeLecture.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 36px; color: #0a192f; line-height: 1.6; }
    .header { border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { font-size: 18px; font-weight: 800; color: #0a192f; letter-spacing: 1px; }
    .badge { font-size: 11px; font-weight: bold; color: #d4af37; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 4px 0; color: #0a192f; }
    h2 { font-size: 16px; color: #475569; margin: 0 0 16px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; background: #f8fafc; padding: 12px; border-radius: 6px; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0a192f; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; }
    .scratchpad { white-space: pre-wrap; font-size: 14px; background: #f8fafc; padding: 14px; border-radius: 6px; border: 1px solid #e2e8f0; }
    ul { list-style: none; padding-left: 0; }
    li { font-size: 13px; }
    .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="badge">DIGITAL WEALTH CREATORS (DWC)</div>
      <div class="logo">Official Executive Study Notes</div>
    </div>
    <div style="text-align:right; font-size:12px; color:#64748b;">
      Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </div>
  </div>
  <h1>${product.title}</h1>
  <h2>Lecture: ${activeLecture.title} (${activeLecture.moduleTitle})</h2>
  <div class="meta">
    <strong>Student:</strong> ${student} &nbsp;|&nbsp;
    <strong>Instructor:</strong> ${product.instructorName} &nbsp;|&nbsp;
    <strong>Course Progress:</strong> ${progressPct}%
  </div>

  <div class="section-title">Timestamped Lecture Bookmarks & Insights</div>
  ${timestampNotes ? `<ul>${timestampNotes}</ul>` : '<p style="font-size:13px; color:#64748b;">No timestamped notes saved for this lecture.</p>'}

  <div class="section-title">Full Lesson Scratchpad Notes</div>
  <div class="scratchpad">${notesContent}</div>

  <div class="footer">
    Generated from Digital Wealth Creators (DWC) LMS Platform &bull; Endorsed by S. B. OMOTOSO
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
</body>
</html>`;
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
    showToast('Study notes printable view opened');
  };

  const handleDownloadNotesDoc = (format: 'doc' | 'txt' = 'doc') => {
    if (!product || !activeLecture) return;
    const student = currentUser?.name || 'Digital Wealth Creators Student';
    const notesContent = progress?.notesByLecture[activeLecture.id] || noteDraft || 'No scratchpad notes entered.';
    const timestampNotes = progress?.timestampedNotesByLecture?.[activeLecture.id] || [];

    if (format === 'txt') {
      const txt = `DIGITAL WEALTH CREATORS (DWC) - STUDY NOTES
=====================================================
Course:     ${product.title}
Lecture:    ${activeLecture.title} (${activeLecture.moduleTitle})
Student:    ${student}
Instructor: ${product.instructorName}
Date:       ${new Date().toISOString().slice(0, 10)}
Progress:   ${progressPct}%

TIMESTAMPED BOOKMARKS:
-----------------------------------------------------
${timestampNotes.length > 0 ? timestampNotes.map((tn) => `[${tn.timeLabel}] ${tn.text}`).join('\n') : '(None)'}

FULL LESSON SCRATCHPAD NOTES:
-----------------------------------------------------
${notesContent}

=====================================================
Endorsed by S. B. OMOTOSO (FCIA, MILR, MSc, MNIM)
DIGITAL WEALTH CREATORS (DWC)
`;
      triggerFileDownload(
        `${product.slug}-${activeLecture.id}-study-notes.txt`,
        txt,
        'text/plain;charset=utf-8'
      );
      showToast('Study notes (.txt) downloaded');
    } else {
      const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Study Notes - ${product.title}</title>
<style>
body { font-family: Arial, sans-serif; padding: 20pt; }
h1 { color: #0a192f; font-size: 18pt; }
h2 { color: #555555; font-size: 13pt; }
.header { border-bottom: 2pt solid #d4af37; padding-bottom: 10pt; margin-bottom: 15pt; }
.meta { background-color: #f1f5f9; padding: 10pt; font-size: 10pt; }
.section { font-weight: bold; font-size: 12pt; margin-top: 15pt; color: #0a192f; border-bottom: 1pt solid #cbd5e1; }
.scratchpad { background-color: #f8fafc; padding: 10pt; border: 1pt solid #e2e8f0; font-size: 10pt; }
</style>
</head>
<body>
<div class='header'>
  <div style='color:#d4af37; font-weight:bold; font-size:10pt;'>DIGITAL WEALTH CREATORS (DWC)</div>
  <h1>${product.title}</h1>
  <h2>Lecture: ${activeLecture.title} (${activeLecture.moduleTitle})</h2>
  <div class='meta'>
    <b>Student:</b> ${student} | <b>Instructor:</b> ${product.instructorName} | <b>Date:</b> ${new Date().toLocaleDateString()}
  </div>
</div>
<div class='section'>Timestamped Lecture Insights</div>
${timestampNotes.length > 0 ? `<ul>${timestampNotes.map((tn) => `<li><b>[${tn.timeLabel}]</b> ${tn.text}</li>`).join('')}</ul>` : '<p>No timestamped notes.</p>'}
<div class='section'>Scratchpad Notes</div>
<div class='scratchpad'>${notesContent.replace(/\n/g, '<br/>')}</div>
<p style='margin-top:20pt; font-size:9pt; color:#64748b;'>Endorsed by S. B. OMOTOSO &bull; Digital Wealth Creators (DWC) LMS</p>
</body>
</html>`;
      triggerFileDownload(
        `${product.slug}-${activeLecture.id}-study-notes.doc`,
        docHtml,
        'application/msword;charset=utf-8'
      );
      showToast('Study notes (.doc) downloaded');
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLecture) return;
    saveLectureNote(product.id, activeLecture.id, noteDraft);
  };

  const handleAddPinnedNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLecture || !pinnedNoteText.trim()) return;
    addTimestampedNote(
      product.id,
      activeLecture.id,
      formatTimer(elapsedSeconds),
      pinnedNoteText
    );
    setPinnedNoteText('');
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLecture || !questionDraft.trim()) return;
    addLectureQuestion(product.id, activeLecture.id, questionDraft);
    setQuestionDraft('');
  };

  // Ask the server-side enquiry agent first (Gemini-backed when configured),
  // then fall back to the deterministic local knowledge base on network errors.
  const requestEnquiryAnswer = async (
    questionText: string
  ): Promise<{
    answer: string;
    matchedTopics?: string[];
    suggestedForumThreadSlug?: string;
  }> => {
    const context = {
      courseName: product.title,
      lectureTitle: activeLecture?.title,
    };

    try {
      const resp = await fetch('/api/agents/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, context }),
      });
      if (resp.ok) {
        const json = (await resp.json()) as {
          answer?: string;
          matchedTopics?: string[];
          suggestedForumThreadSlug?: string;
        };
        if (typeof json.answer === 'string' && json.answer.trim()) {
          return {
            answer: json.answer,
            matchedTopics: json.matchedTopics,
            suggestedForumThreadSlug: json.suggestedForumThreadSlug,
          };
        }
      }
    } catch {
      // Fall through to the local agent below.
    }

    const fallback = runEnquiryAgent(questionText, context);
    return {
      answer: fallback.answer,
      matchedTopics: fallback.matchedTopics,
      suggestedForumThreadSlug: fallback.suggestedForumThreadSlug,
    };
  };

  const handleRequestAiTutorAnswer = async (questionId: string, questionText: string) => {
    if (!activeLecture || loadingAiAnswerId) return;
    setLoadingAiAnswerId(questionId);

    try {
      const res = await requestEnquiryAnswer(questionText);
      answerLectureQuestion(product.id, questionId, `[AI Tutor]: ${res.answer}`);
      showToast('AI Tutor Answer generated');
    } catch {
      showToast('AI Tutor could not answer right now. Please try again.');
    } finally {
      setLoadingAiAnswerId(null);
    }
  };

  const handleAskAiTutorDirectly = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeLecture || !questionDraft.trim() || isSubmittingAi) return;
    setIsSubmittingAi(true);

    const text = questionDraft.trim();
    setQuestionDraft('');

    const questionId = addLectureQuestion(product.id, activeLecture.id, text);
    if (!questionId) {
      setIsSubmittingAi(false);
      return;
    }

    try {
      const res = await requestEnquiryAnswer(text);
      answerLectureQuestion(product.id, questionId, `[AI Tutor]: ${res.answer}`);
      showToast('Question posted with instant AI Tutor answer!');
    } catch {
      showToast('Question posted. The AI Tutor is temporarily unavailable.');
    } finally {
      setIsSubmittingAi(false);
    }
  };

  const handleDownloadResource = async (fileName: string) => {
    try {
      const res = await fetch(`/api/resources/${product.id}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          triggerDirectLinkDownload(data.downloadUrl, fileName);
          showToast(`Initiating secure download for ${fileName}...`);
          return;
        }
      }
      if (res.status === 403) {
        // The server explicitly denied (e.g. download limit reached). Never
        // bypass that decision with a client-generated file.
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(data.error || 'Download not permitted for this item.');
        return;
      }
    } catch {
      // Fallback to client-side blob only if offline / server route unavailable
    }

    const deliverableText = [
      `================================================================================`,
      `DIGITAL WEALTH CREATORS (DWC) — Lecture Resource & Lab Kit`,
      `================================================================================`,
      `Course: ${product.title}`,
      `Instructor: ${product.instructorName}`,
      `Module/Lecture: ${activeLecture?.title || 'Lecture Resource'}`,
      `File: ${fileName}`,
      `Delivered At: ${new Date().toISOString()}`,
      `================================================================================`,
      `\nLecture Summary:`,
      activeLecture?.summary || 'Comprehensive hands-on lab and reference notes.',
      `\nKey Takeaways:`,
      ...(activeLecture?.keyTakeaways || []).map((t, idx) => `  ${idx + 1}. ${t}`),
      `\n================================================================================`,
      `Hands-On Resource Guide:`,
      `1. Review the lecture video and follow along with the code/templates below.`,
      `2. Implement these concepts in your local workspace or client deliverables.`,
      `3. For mastermind questions or code reviews, post in the DWC Community channels.`,
      `================================================================================`,
      `\n// Production Code & Implementation Notes:`,
      `export const ${product.slug.replace(/[^a-zA-Z0-9]/g, '_')}_resource = {`,
      `  courseId: "${product.id}",`,
      `  resourceFile: "${fileName}",`,
      `  verified: true,`,
      `  unlocked: true,`,
      `};`,
    ].join('\n');

    triggerFileDownload(fileName, deliverableText, 'text/plain;charset=utf-8');
    showToast(`Downloaded ${fileName}`);
  };

  const tryAdvanceToNextLecture = (assumedCompletedIds: string[] = completedIds) => {
    if (activeLectureIndex >= flatLectures.length - 1) return;
    const nextLec = flatLectures[activeLectureIndex + 1];
    if (!nextLec) return;
    if (isLectureUnlocked(modules, nextLec.id, assumedCompletedIds, quizScoresByModule)) {
      setActiveLectureId(nextLec.id);
    } else {
      showToast(
        `Complete all lessons and pass the section quiz (${CERTIFICATE_PASS_MARK}%+) before moving to the next section.`
      );
    }
  };

  const handleOpenCertificate = () => {
    if (certificateEligibility.eligible && !progress?.certificateCode) {
      issueCourseCertificate(product.id);
    }
    setCertificateOpen(true);
  };

  const handleDownloadCertificate = () => {
    if (!certificateEligibility.eligible) {
      showToast(
        certificateEligibility.reason ||
          `Complete 100% of all sections and pass all quizzes (${CERTIFICATE_PASS_MARK}%+) to download your certificate.`
      );
      return;
    }
    const certCode = progress?.certificateCode || issueCourseCertificate(product.id);
    if (!certCode) {
      showToast('Certificate is not available yet. Complete all sections and quizzes (80%+) first.');
      return;
    }
    const certHtml = `<!doctype html><html><head><title>Certificate - ${product.title}</title></head><body style="font-family:sans-serif;padding:48px;text-align:center;border:8px solid #0a192f;max-width:800px;margin:40px auto;"><h1>Verified Certificate of Completion</h1><p>Verification ID: <strong>${certCode}</strong></p><p>This certifies that</p><h2>${currentUser?.name}</h2><p>has successfully completed all curriculum modules of</p><h3>${product.title}</h3><p>Instructor: ${product.instructorName}</p><p>Issued: ${new Date().toISOString().slice(0, 10)}</p></body></html>`;
    triggerFileDownload(
      `${product.slug}-certificate.html`,
      certHtml,
      'text/html;charset=utf-8'
    );
    showToast('Verified Certificate downloaded');
  };

  const buildShuffledOptionOrders = (mod: CourseModule) => {
    const orders: Record<string, number[]> = {};
    for (const q of mod.quiz?.questions ?? []) {
      orders[q.id] = shuffleQuestionOptionIndices(q.options.length);
    }
    return orders;
  };

  const handleOpenModuleQuiz = (mod: CourseModule) => {
    setActiveQuizModule(mod);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizOptionOrderByQuestion(buildShuffledOptionOrders(mod));
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuizModule?.quiz) return;
    submitModuleQuiz(product.id, activeQuizModule.id, quizAnswers);
    setQuizSubmitted(true);
  };

  const announcements = product.courseData.announcements ?? [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Dark Course Player Top Bar */}
      <header className="h-14 bg-[#0a192f] text-white border-b border-[#d4af37]/50 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-[#f5c451] shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My Library</span>
          </button>
          <span className="text-slate-600">|</span>
          <h1 className="font-display text-sm font-bold text-white truncate">
            {product.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-slate-300 tabular-nums">
            <div
              className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden hidden sm:block"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course completion percentage"
            >
              <div
                className={`h-full transition-all duration-300 ${progressPct === 100 ? 'bg-emerald-400' : 'bg-[#d4af37]'
                  }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span>
              <strong className="text-white">{progressPct}%</strong> complete (
              {progressSummary.completedLectures}/{progressSummary.totalLectures})
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenCertificate}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${progressPct === 100
              ? 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
              : 'border border-slate-600 text-slate-300 hover:text-white'
              }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {progressPct === 100 ? 'View Certificate' : 'Certificate'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTheaterMode((prev) => !prev)}
            title={theaterMode ? 'Exit theater mode' : 'Enter theater mode'}
            aria-label={theaterMode ? 'Exit theater mode' : 'Enter theater mode'}
            className={`p-1.5 rounded cursor-pointer transition ${theaterMode
              ? 'bg-[#d4af37] text-[#0a192f] font-bold'
              : 'text-slate-300 hover:text-white hover:bg-[#112240]'
              }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Collapse curriculum sidebar' : 'Expand curriculum sidebar'}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#112240] cursor-pointer"
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Split: Video Theater + Tabs Left, Curriculum Sidebar Right */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <ContentProtectionWrapper enabled={isProtected} className="flex-1 min-w-0 flex flex-col">
          {/* Theater Video Player OR Audio / Infographic / Text Lesson Stage */}
          {activeLecture && (() => {
            const isAudioLesson =
              activeLecture.lectureType === 'audio' ||
              (!activeLecture.videoUrl && Boolean(activeLecture.audioUrl));
            const isInfographicLesson =
              activeLecture.lectureType === 'infographic' ||
              activeLecture.lectureType === 'image' ||
              (!activeLecture.videoUrl && !activeLecture.audioUrl && Boolean(activeLecture.infographicUrl || activeLecture.imageUrl));
            const isTextLesson =
              activeLecture.lectureType === 'text' ||
              activeLecture.lectureType === 'article' ||
              (!activeLecture.videoUrl &&
                !activeLecture.audioUrl &&
                !activeLecture.infographicUrl &&
                !activeLecture.imageUrl &&
                Boolean(activeLecture.textContent));
            const visualUrl = activeLecture.infographicUrl || activeLecture.imageUrl;
            return (
              <div className={`transition-colors duration-300 text-white ${theaterMode ? 'bg-[#030712] py-4' : 'bg-[#081221]'}`}>
                <div className={`mx-auto p-3 sm:p-6 space-y-4 transition-all duration-300 ${theaterMode ? 'max-w-7xl' : 'max-w-5xl'}`}>
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="truncate pr-2">{activeLecture.moduleTitle}</span>
                    <span className="font-mono shrink-0">
                      Lecture {activeLectureIndex + 1} of {flatLectures.length}
                    </span>
                  </div>

                  {isAudioLesson ? (
                    /* Audio Podcast / Lecture Stage */
                    <div className="w-full rounded-xl border border-[#233554] bg-[#0c1a30] p-5 sm:p-8 space-y-6 text-slate-100 shadow-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233554] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold shadow-inner">
                            <Headphones className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Audio Lesson / Podcast
                              </span>
                              <span className="text-xs text-slate-300 font-mono">
                                ⏱ {activeLecture.durationMinutes} min listen
                              </span>
                            </div>
                            <h2 className="font-display text-lg sm:text-2xl font-black text-white mt-1">
                              {activeLecture.title}
                            </h2>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLectureComplete(product.id, activeLecture.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                            isCurrentCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isCurrentCompleted ? 'Lesson Completed' : 'Mark as Completed'}</span>
                        </button>
                      </div>

                      {activeLecture.audioUrl ? (
                        <div className="p-4 rounded-xl bg-[#112240] border border-[#263d66]">
                          <audio controls className="w-full" src={activeLecture.audioUrl}>
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#112240] border border-[#263d66] text-xs text-amber-200">
                          Audio stream link not configured yet. Review the accompanying show notes and transcript below.
                        </div>
                      )}

                      {(activeLecture.textContent || activeLecture.summary) && (
                        <div className="space-y-2 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                          {activeLecture.textContent || activeLecture.summary}
                        </div>
                      )}
                    </div>
                  ) : isInfographicLesson ? (
                    /* Infographic & Visual Diagram Stage */
                    <div className="w-full rounded-xl border border-[#233554] bg-[#0c1a30] p-5 sm:p-8 space-y-6 text-slate-100 shadow-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233554] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-bold shadow-inner">
                            <Image className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Infographic & Visual Diagram
                              </span>
                              <span className="text-xs text-slate-300 font-mono">
                                ⏱ {activeLecture.durationMinutes} min study
                              </span>
                            </div>
                            <h2 className="font-display text-lg sm:text-2xl font-black text-white mt-1">
                              {activeLecture.title}
                            </h2>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleLectureComplete(product.id, activeLecture.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                            isCurrentCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isCurrentCompleted ? 'Lesson Completed' : 'Mark as Completed'}</span>
                        </button>
                      </div>

                      {visualUrl ? (
                        <div className="rounded-xl overflow-hidden border border-[#263d66] bg-slate-950 flex justify-center">
                          <img
                            src={visualUrl}
                            alt={activeLecture.title}
                            className="max-h-[540px] w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-[#112240] border border-[#263d66] text-xs text-emerald-200">
                          Infographic image URL not set yet. Review the visual breakdown below.
                        </div>
                      )}

                      {(activeLecture.textContent || activeLecture.summary) && (
                        <div className="space-y-2 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                          {activeLecture.textContent || activeLecture.summary}
                        </div>
                      )}
                    </div>
                  ) : isTextLesson ? (
                    /* Pure Text-Based Reading Lesson Workspace */
                    <div className="w-full rounded-xl border border-[#233554] bg-[#0c1a30] p-5 sm:p-8 space-y-6 text-slate-100 shadow-2xl">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#233554] pb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center font-bold shadow-inner">
                            <BookOpen className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Text-Based Lesson
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ⏱ {activeLecture.durationMinutes} min read
                              </span>
                            </div>
                            <h2 className="font-display text-lg sm:text-2xl font-black text-white mt-1">
                              {activeLecture.title}
                            </h2>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleLectureComplete(product.id, activeLecture.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow ${
                              isCurrentCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45]'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isCurrentCompleted ? 'Lesson Completed' : 'Mark as Completed'}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={activeLectureIndex === 0}
                              onClick={() =>
                                setActiveLectureId(flatLectures[activeLectureIndex - 1].id)
                              }
                              aria-label="Previous lecture"
                              className="p-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={activeLectureIndex >= flatLectures.length - 1}
                              onClick={() => tryAdvanceToNextLecture(completedIds)}
                              aria-label="Next lecture"
                              className="p-2 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lesson Article Body */}
                      <div className="space-y-4 text-slate-200 text-sm sm:text-base leading-relaxed">
                        {activeLecture.textContent ? (
                          <div className="whitespace-pre-line font-sans leading-relaxed text-slate-200">
                            {activeLecture.textContent}
                          </div>
                        ) : (
                          <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
                            {activeLecture.summary}
                          </p>
                        )}

                        {activeLecture.keyTakeaways && activeLecture.keyTakeaways.length > 0 && (
                          <div className="mt-6 p-4 sm:p-5 rounded-xl bg-[#112240] border border-[#263d66] space-y-2.5">
                            <h4 className="text-xs font-bold text-[#f5c451] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Key Takeaways & Summary</span>
                            </h4>
                            <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                              {activeLecture.keyTakeaways.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Live HTML5 Video Theater Stage */}
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#233554] bg-black">
                        <LectureVideoCanvasPlayer
                          lecture={activeLecture}
                          isPlaying={isPlaying}
                          elapsedSeconds={elapsedSeconds}
                          totalSeconds={totalLectureSeconds}
                          playbackSpeed={playbackSpeed}
                          captionsEnabled={captionsEnabled}
                          volume={volume}
                          isMuted={isMuted}
                          voiceEnabled={voiceEnabled}
                          watermarkUser={currentUser}
                          copyProtectionEnabled={isProtected}
                          onTogglePlay={() => setIsPlaying((prev) => !prev)}
                          onVideoEnded={() => {
                            setIsPlaying(false);
                            if (!completedIds.includes(activeLecture.id)) {
                              toggleLectureComplete(product.id, activeLecture.id);
                            }
                            if (autoAdvance && activeLectureIndex < flatLectures.length - 1) {
                              const assumed = Array.from(new Set([...completedIds, activeLecture.id]));
                              tryAdvanceToNextLecture(assumed);
                            }
                          }}
                        />
                        <DynamicWatermarkOverlay user={currentUser} visible={isProtected} />
                        {!isPlaying && !activeLecture.videoUrl && (
                          <button
                            type="button"
                            onClick={() => setIsPlaying(true)}
                            aria-label="Play lecture video"
                            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#d4af37] hover:bg-[#e5bf45] text-[#0a192f] flex items-center justify-center shadow-xl transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Play className="w-7 h-7 ml-0.5" />
                          </button>
                        )}
                      </div>

                      {/* Video Player Controls Bar + Chapter Markers */}
                      <div className="space-y-2.5">
                        {activeLecture.chapters && activeLecture.chapters.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 font-semibold mr-1">Chapters:</span>
                            {activeLecture.chapters.map((ch) => (
                              <button
                                key={ch.label}
                                type="button"
                                onClick={() => setElapsedSeconds(ch.timeSeconds)}
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-[#d4af37] hover:text-[#0a192f] text-slate-200 transition-colors cursor-pointer tabular-nums"
                              >
                                {formatTimer(ch.timeSeconds)} · {ch.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <input
                          type="range"
                          min={0}
                          max={totalLectureSeconds}
                          value={elapsedSeconds}
                          onChange={(e) => setElapsedSeconds(Number(e.target.value))}
                          aria-label="Seek lecture timeline"
                          className="w-full accent-[#d4af37] cursor-pointer"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setIsPlaying((prev) => !prev)}
                              className="inline-flex items-center gap-1 font-semibold hover:text-[#f5c451] cursor-pointer"
                            >
                              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              <span>{isPlaying ? 'Pause' : 'Play'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setElapsedSeconds(0)}
                              aria-label="Restart lecture"
                              className="text-slate-300 hover:text-white cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono tabular-nums text-slate-300">
                              {formatTimer(elapsedSeconds)} / {formatTimer(totalLectureSeconds)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setAutoAdvance((v) => !v)}
                              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                autoAdvance
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              Auto-Next: {autoAdvance ? 'ON' : 'OFF'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const speeds: Array<1 | 1.25 | 1.5 | 2> = [1, 1.25, 1.5, 2];
                                const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                                setPlaybackSpeed(next);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono text-xs cursor-pointer"
                            >
                              {playbackSpeed}x
                            </button>

                            {/* Volume & Audio Controls */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-slate-300">
                              <button
                                type="button"
                                onClick={() => setIsMuted((m) => !m)}
                                aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                                className="p-0.5 hover:text-[#f5c451] cursor-pointer"
                              >
                                {isMuted || volume === 0 ? (
                                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                                ) : volume < 0.5 ? (
                                  <Volume1 className="w-3.5 h-3.5 text-[#f5c451]" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5 text-[#f5c451]" />
                                )}
                              </button>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  setVolume(v);
                                  if (v > 0 && isMuted) setIsMuted(false);
                                }}
                                aria-label="Audio volume"
                                className="w-16 h-1 accent-[#d4af37] cursor-pointer"
                              />
                              <span className="font-mono text-[10px] tabular-nums text-slate-400 w-7 text-right">
                                {isMuted ? 'MUT' : `${Math.round(volume * 100)}%`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setVoiceEnabled((v) => !v)}
                              aria-label="Toggle spoken voice narration"
                              className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1 ${
                                voiceEnabled && !isMuted
                                  ? 'bg-amber-900/60 text-[#f5c451] border border-amber-700/60'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              <Mic className="w-3 h-3" />
                              <span>Voice: {voiceEnabled && !isMuted ? 'ON' : 'OFF'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setCaptionsEnabled((prev) => !prev)}
                              aria-label="Toggle captions"
                              className={`p-1 rounded cursor-pointer ${
                                captionsEnabled ? 'text-[#f5c451]' : 'text-slate-400'
                              }`}
                            >
                              <Subtitles className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleLectureComplete(product.id, activeLecture.id)}
                              className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                                isCurrentCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-900 hover:bg-slate-100'
                              }`}
                            >
                              {isCurrentCompleted ? 'Completed' : 'Mark Complete'}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={activeLectureIndex === 0}
                                onClick={() =>
                                  setActiveLectureId(flatLectures[activeLectureIndex - 1].id)
                                }
                                aria-label="Previous lecture"
                                className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={activeLectureIndex >= flatLectures.length - 1}
                                onClick={() => tryAdvanceToNextLecture(completedIds)}
                                aria-label="Next lecture"
                                className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Multimedia Companion Assets (Audio, Infographic & Reading Guide) */}
                      {(activeLecture.lectureType === 'multimedia' ||
                        activeLecture.lectureType === 'mixed' ||
                        (activeLecture.videoUrl && (activeLecture.textContent || activeLecture.audioUrl || activeLecture.infographicUrl || activeLecture.imageUrl))) && (
                        <div className="mt-4 p-5 rounded-xl bg-[#0c1a30] border border-[#233554] space-y-4">
                          <h4 className="text-xs font-bold text-[#f5c451] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Multimedia Companion Materials</span>
                          </h4>
                          {activeLecture.audioUrl && (
                            <div className="p-3 rounded-lg bg-[#112240] border border-[#263d66] space-y-1.5">
                              <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Companion Audio Briefing</span>
                              </p>
                              <audio controls className="w-full" src={activeLecture.audioUrl}>
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          {(activeLecture.infographicUrl || activeLecture.imageUrl) && (
                            <div className="rounded-lg overflow-hidden border border-[#263d66] bg-slate-950 p-2 flex flex-col items-center gap-2">
                              <img
                                src={activeLecture.infographicUrl || activeLecture.imageUrl}
                                alt={`${activeLecture.title} visual diagram`}
                                className="max-h-[420px] w-auto object-contain rounded"
                              />
                            </div>
                          )}
                          {(activeLecture.textContent || activeLecture.summary) && (
                            <div className="whitespace-pre-line text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                              {activeLecture.textContent || activeLecture.summary}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Below-Player Tabs: Overview, Transcript, Resources, Timestamped Notes, Q&A, Announcements */}
          <div className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
            <div className="flex items-center gap-6 overflow-x-auto border-b border-slate-200 text-sm font-bold">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'transcript', label: 'Transcript' },
                  { id: 'resources', label: 'Resources & Code' },
                  {
                    id: 'notes',
                    label: `Notes (${activeTimestampedNotes.length})`,
                  },
                  { id: 'qa', label: `Q&A (${progress?.questions.length ?? 0})` },
                  {
                    id: 'announcements',
                    label: `Announcements (${announcements.length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeTab === tab.id
                    ? 'border-[#0a192f] text-[#0a192f]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && activeLecture && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {activeLecture.title}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">{activeLecture.summary}</p>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Key Takeaways</h4>
                  <ul className="space-y-1.5">
                    {activeLecture.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && activeLecture && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Lecture Transcript · {activeLecture.title}
                  </h3>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {activeLecture.durationMinutes} min lesson
                  </span>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeLecture.transcript ||
                    `[00:00] Welcome to "${activeLecture.title}". ${activeLecture.summary}\n\n[02:30] Primary Focus: ${activeLecture.keyTakeaways.join(' · ')}.\n\n[06:00] Review the attached starter repository file before attempting the module quiz to validate your implementation patterns.`}
                </div>
              </div>
            )}

            {activeTab === 'resources' && activeLecture && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold text-slate-900">
                  Lecture Downloads
                </h3>
                {activeLecture.resourceFileName ? (
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#5624d0]" />
                      <div>
                        <p className="text-sm font-mono font-bold text-slate-900">
                          {activeLecture.resourceFileName}
                        </p>
                        <p className="text-xs text-slate-500">Starter template & reference file</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(activeLecture.resourceFileName!)}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#0a192f] rounded-md hover:bg-[#112240] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No supplementary code files attached to this lecture.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'notes' && activeLecture && (
              <div className="space-y-5">
                {/* 1-Click Study Notes Export Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900">
                      Study Notes & Lecture Bookmarks
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any timestamp to seek video. Export notes for offline revision.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrintNotes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a192f] text-white rounded text-xs font-semibold hover:bg-[#112240] transition cursor-pointer shadow-sm"
                      title="Print or save notes as PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Print / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadNotesDoc('doc')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                      title="Download notes formatted for Microsoft Word"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download .doc</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadNotesDoc('txt')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-300 bg-white text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                      title="Download notes as plain text"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>.txt</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 space-y-4">
                    <form onSubmit={handleAddPinnedNote} className="space-y-2.5">
                      <label
                        htmlFor="pinned-note-input"
                        className="block font-display text-sm font-bold text-slate-900"
                      >
                        Pin Timestamped Note at {formatTimer(elapsedSeconds)}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="pinned-note-input"
                          type="text"
                          value={pinnedNoteText}
                          onChange={(e) => setPinnedNoteText(e.target.value)}
                          placeholder="Bookmark insight at current timestamp..."
                          className="flex-1 h-9 px-3 text-xs border border-slate-300 rounded-md"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 px-3 h-9 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded-md cursor-pointer shrink-0"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>Pin</span>
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      {activeTimestampedNotes.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No timestamped bookmarks for this lecture yet.
                        </p>
                      ) : (
                        activeTimestampedNotes.map((tn) => (
                          <div
                            key={tn.id}
                            className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-start justify-between gap-3"
                          >
                            <div>
                              <button
                                type="button"
                                onClick={() => handleSeekToNoteTimestamp(tn.timeLabel)}
                                className="font-mono text-[11px] font-bold text-[#0a192f] inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 hover:bg-[#d4af37]/40 transition cursor-pointer"
                                title={`Click to jump video player to ${tn.timeLabel}`}
                                aria-label={`Jump video player to timestamp ${tn.timeLabel}`}
                              >
                                <Clock className="w-3 h-3 text-[#b48a1c]" />
                                <span>[{tn.timeLabel}]</span>
                              </button>
                              <p className="text-xs text-slate-800 mt-1">{tn.text}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                deleteTimestampedNote(product.id, activeLecture.id, tn.id)
                              }
                              aria-label="Delete pinned note"
                              className="text-slate-400 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSaveNote} className="md:col-span-6 space-y-3">
                    <label
                      htmlFor="lecture-notes-area"
                      className="block font-display text-sm font-bold text-slate-900"
                    >
                      Full Lesson Scratchpad
                    </label>
                    <textarea
                      id="lecture-notes-area"
                      rows={6}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Capture architecture insights, snippets, or reminders..."
                      className="w-full p-3.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-[#0a192f] hover:bg-[#112240] rounded-md cursor-pointer"
                    >
                      Save Scratchpad
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'qa' && activeLecture && (
              <div className="space-y-6">
                <form onSubmit={handleAskQuestion} className="space-y-3">
                  <label
                    htmlFor="lecture-qa-input"
                    className="block font-display text-base font-bold text-slate-900"
                  >
                    Ask the Instructor
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="lecture-qa-input"
                      type="text"
                      value={questionDraft}
                      onChange={(e) => setQuestionDraft(e.target.value)}
                      placeholder="Ask a question about this lecture..."
                      className="flex-1 h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      className="px-4 h-10 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
                    >
                      Post Question
                    </button>
                    <button
                      type="button"
                      onClick={handleAskAiTutorDirectly}
                      disabled={!questionDraft.trim() || isSubmittingAi}
                      className="px-3.5 h-10 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      {isSubmittingAi ? 'Answering...' : 'Instant AI Answer'}
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {(progress?.questions ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">No questions posted yet.</p>
                  ) : (
                    progress!.questions.map((q) => (
                      <div key={q.id} className="p-4 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {q.userName}
                          </span>
                          <span>{q.createdAt.slice(0, 10)}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">{q.question}</p>
                        {!q.answer && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-amber-600 font-medium">Awaiting instructor reply</span>
                            <button
                              type="button"
                              onClick={() => handleRequestAiTutorAnswer(q.id, q.question)}
                              disabled={loadingAiAnswerId === q.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              {loadingAiAnswerId === q.id ? 'Generating Answer...' : 'AI Tutor Answer'}
                            </button>
                          </div>
                        )}
                        {q.answer && q.answer.startsWith('[AI Tutor]:') ? (
                          <div className="mt-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded text-xs text-slate-800 space-y-1">
                            <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                              <span>AI Course Tutor Reply</span>
                              <span className="text-[10px] font-normal text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                                Automated Agent
                              </span>
                            </div>
                            <p className="leading-relaxed">{q.answer.replace(/^\[AI Tutor\]:\s*/, '')}</p>
                          </div>
                        ) : q.answer ? (
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                            <strong className="text-slate-900">Instructor Reply: </strong>
                            {q.answer}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#0a192f]" />
                  <span>Instructor Announcements</span>
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No cohort announcements posted for this course yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <article
                        key={ann.id}
                        className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-slate-900">
                            {ann.title}
                          </h4>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {ann.createdAt}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{ann.body}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ContentProtectionWrapper>

        {/* Right Collapsible Curriculum & Quiz Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-white shrink-0">
            <div className="px-4 py-4 border-b border-slate-200 space-y-2.5 bg-slate-50/70">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Course Progress
                </h2>
                <span className="text-xs font-bold text-[#0a192f] tabular-nums">
                  {progressPct}%
                </span>
              </div>

              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${progressPct === 100 ? 'bg-emerald-600' : 'bg-[#0a192f]'
                    }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
                <span>
                  {progressSummary.completedLectures} of {progressSummary.totalLectures} lessons ·{' '}
                  {progressSummary.completedModules} of {progressSummary.totalModules} modules
                </span>
                {progressSummary.completedLectures > 0 && (
                  <button
                    type="button"
                    onClick={() => resetCourseProgress(product.id)}
                    className="text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {product.courseData.modules.map((mod, mIdx) => {
                const modStats = calculateModuleProgress(mod, completedIds);
                const modQuizResult = progress?.quizScoresByModule?.[mod.id];
                const modUnlocked = isModuleUnlocked(modules, mIdx, completedIds, quizScoresByModule);
                const modDone = isModuleCompleted(mod, completedIds, quizScoresByModule);
                const quizUnlocked = isModuleQuizUnlocked(modules, mIdx, completedIds, quizScoresByModule);
                const requiredPass = Math.max(mod.quiz?.passingScore ?? CERTIFICATE_PASS_MARK, CERTIFICATE_PASS_MARK);

                return (
                  <div key={mod.id} className={modUnlocked ? '' : 'opacity-70'}>
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span
                          aria-label={
                            !modUnlocked
                              ? `Section "${mod.title}" is locked until previous section is completed`
                              : modDone
                                ? `Section "${mod.title}" completed`
                                : `Section "${mod.title}" in progress`
                          }
                          className="mt-0.5 text-slate-500 shrink-0"
                        >
                          {!modUnlocked ? (
                            <Lock className="w-4 h-4 text-slate-400" />
                          ) : modDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display text-xs font-bold text-slate-900 leading-snug">
                              {mod.title}
                            </p>
                            <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
                              {modStats.completedCount}/{modStats.totalCount}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${modDone ? 'bg-emerald-600' : 'bg-[#5624d0]'
                                }`}
                              style={{ width: `${modStats.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {mod.lectures.map((lec) => {
                        const isActive = lec.id === activeLecture?.id;
                        const isDone = completedIds.includes(lec.id);
                        const lecUnlocked = isLectureUnlocked(
                          modules,
                          lec.id,
                          completedIds,
                          quizScoresByModule
                        );
                        return (
                          <div
                            key={lec.id}
                            className={`px-4 py-3 flex items-start gap-3 transition-colors ${isActive
                              ? 'bg-[#f3effc]'
                              : lecUnlocked
                                ? 'hover:bg-slate-50'
                                : 'bg-slate-50/60'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!lecUnlocked && !isDone) {
                                  showToast(
                                    `Complete the previous step / section (including ${CERTIFICATE_PASS_MARK}% quiz passmark) first.`
                                  );
                                  return;
                                }
                                toggleLectureComplete(product.id, lec.id);
                              }}
                              aria-label={
                                !lecUnlocked && !isDone
                                  ? `"${lec.title}" is locked`
                                  : `Mark "${lec.title}" as ${isDone ? 'incomplete' : 'complete'}`
                              }
                              className={`mt-0.5 shrink-0 ${lecUnlocked || isDone
                                ? 'text-slate-500 hover:text-[#5624d0] cursor-pointer'
                                : 'text-slate-400 cursor-not-allowed'
                                }`}
                            >
                              {!lecUnlocked && !isDone ? (
                                <Lock className="w-4 h-4 text-slate-400" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-[#5624d0]" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!lecUnlocked) {
                                  showToast(
                                    !modUnlocked
                                      ? `Complete the previous section and pass its quiz (${CERTIFICATE_PASS_MARK}%+) to unlock this section.`
                                      : 'Complete the previous lesson first to unlock this step.'
                                  );
                                  return;
                                }
                                setActiveLectureId(lec.id);
                              }}
                              className={`flex-1 text-left ${lecUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                            >
                              <p
                                className={`text-xs font-semibold leading-snug ${isActive ? 'text-[#5624d0]' : 'text-slate-900'
                                  }`}
                              >
                                {lec.title}
                              </p>
                              <div className="text-[11px] text-slate-500 mt-1 tabular-nums flex items-center gap-1.5 flex-wrap">
                                {lec.lectureType === 'audio' || (!lec.videoUrl && lec.audioUrl) ? (
                                  <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                                    <Headphones className="w-3 h-3" />
                                    <span>Audio ({lec.durationMinutes}m)</span>
                                  </span>
                                ) : lec.lectureType === 'infographic' || lec.lectureType === 'image' ? (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                                    <Image className="w-3 h-3" />
                                    <span>Infographic ({lec.durationMinutes}m)</span>
                                  </span>
                                ) : lec.lectureType === 'text' || lec.lectureType === 'article' || (!lec.videoUrl && !lec.audioUrl && lec.textContent) ? (
                                  <span className="inline-flex items-center gap-0.5 text-blue-600 font-semibold">
                                    <BookOpen className="w-3 h-3" />
                                    <span>Reading ({lec.durationMinutes}m)</span>
                                  </span>
                                ) : lec.lectureType === 'multimedia' || lec.lectureType === 'mixed' ? (
                                  <span className="inline-flex items-center gap-0.5 text-purple-600 font-semibold">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Multimedia ({lec.durationMinutes}m)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-slate-600 font-semibold">
                                    <Video className="w-3 h-3" />
                                    <span>Video ({lec.durationMinutes}m)</span>
                                  </span>
                                )}
                                {lec.resourceFileName ? ` · ${lec.resourceFileName}` : ''}
                              </div>
                            </button>
                          </div>
                        );
                      })}

                      {/* Interactive Module Quiz Row */}
                      {mod.quiz && (
                        <div className="px-4 py-3 bg-[#f8fafc] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0a192f] flex items-center gap-1.5">
                              {quizUnlocked ? (
                                <ClipboardCheck className="w-3.5 h-3.5 text-[#b4690e] shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{mod.quiz.title}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                              {mod.quiz.questions.length} questions · Pass {requiredPass}%
                              {modQuizResult
                                ? ` · Score ${modQuizResult.scorePercent}% (${modQuizResult.passed && modQuizResult.scorePercent >= requiredPass ? 'Passed' : 'Retry'
                                })`
                                : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!quizUnlocked) {
                                showToast('Complete all lessons in this section first to unlock the quiz.');
                                return;
                              }
                              handleOpenModuleQuiz(mod);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded shrink-0 ${quizUnlocked
                              ? 'bg-[#0a192f] text-[#f5c451] hover:bg-[#112240] cursor-pointer'
                              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              }`}
                          >
                            {!quizUnlocked ? 'Locked' : modQuizResult ? 'Retake Quiz' : 'Start Quiz'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Interactive Module Quiz Modal */}
      {activeQuizModule && activeQuizModule.quiz && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeQuizModule.quiz.title}
        >
          <div className="bg-white text-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#f5c451]">{activeQuizModule.title}</p>
                <h3 className="font-display text-base font-bold">
                  {activeQuizModule.quiz.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuizModule(null)}
                aria-label="Close quiz dialog"
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitQuiz} className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeQuizModule.quiz.questions.map((q, qIdx) => {
                const selectedIdx = quizAnswers[q.id];
                const isCorrect = selectedIdx === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {qIdx + 1}. {q.prompt}
                    </p>
                    <div className="space-y-2">
                      {(quizOptionOrderByQuestion[q.id] || q.options.map((_, idx) => idx)).map(
                        (origIdx, displayIdx) => {
                          const opt = q.options[origIdx];
                          const letter = String.fromCharCode(65 + displayIdx);
                          return (
                            <label
                              key={`${q.id}-${origIdx}`}
                              className={`flex items-center gap-2.5 p-2.5 rounded border text-xs cursor-pointer ${quizSubmitted && origIdx === q.correctIndex
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                                : quizSubmitted && selectedIdx === origIdx && !isCorrect
                                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                                  : selectedIdx === origIdx
                                    ? 'bg-amber-50 border-[#0a192f] text-slate-900 font-semibold'
                                    : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100'
                                }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedIdx === origIdx}
                                onChange={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [q.id]: origIdx }))
                                }
                                disabled={quizSubmitted}
                                className="accent-[#0a192f]"
                              />
                              <span className="font-bold text-slate-500 shrink-0">{letter}.</span>
                              <span>{opt}</span>
                            </label>
                          );
                        }
                      )}
                    </div>
                    {quizSubmitted && (
                      <p className="text-xs text-slate-700 bg-white border border-slate-200 rounded p-2.5">
                        <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {isCorrect ? 'Correct: ' : 'Explanation: '}
                        </strong>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveQuizModule(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-md cursor-pointer"
                >
                  Close
                </button>
                {quizSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                      if (activeQuizModule) {
                        setQuizOptionOrderByQuestion(buildShuffledOptionOrders(activeQuizModule));
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold bg-[#0a192f] text-[#f5c451] rounded-md cursor-pointer"
                  >
                    Retry Quiz
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#d4af37] text-[#0a192f] rounded-md cursor-pointer"
                  >
                    Submit & Grade Quiz
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {certificateOpen && (
        certificateEligibility.eligible ? (
          <CertificateModal
            isOpen={certificateOpen}
            onClose={() => setCertificateOpen(false)}
            certificateCode={
              progress?.certificateCode ||
              (currentUser && product ? generateCertificateCode(currentUser.id, product.id) : 'CM-CERT-VERIFIED')
            }
            studentName={currentUser?.name || 'Graduate Student'}
            courseTitle={product.title}
            completionDate={
              progress?.updatedAt
                ? new Date(progress.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                : new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
            }
            instructorName={product.instructorName}
            track={product.category || 'Executive Technology Mastery'}
          />
        ) : (
          <div
            className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Course completion certificate status"
          >
            <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 space-y-5 relative shadow-2xl text-center">
              <button
                type="button"
                onClick={() => setCertificateOpen(false)}
                aria-label="Close certificate dialog"
                className="absolute right-4 top-4 p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border-2 border-[#d4af37] text-[#b48a1c] flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Complete All Sections & Quizzes ({CERTIFICATE_PASS_MARK}%+) to Unlock Certificate
                </h3>
                <p className="text-sm text-slate-600">
                  You are currently at <strong className="text-slate-900">{progressPct}%</strong> lesson completion ({completedIds.length} of {flatLectures.length} lectures).
                </p>
                {certificateEligibility.unpassedQuizModules.length > 0 && (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2.5">
                    Pending section quiz passmark ({CERTIFICATE_PASS_MARK}%+ required):{' '}
                    <strong>{certificateEligibility.unpassedQuizModules.join(', ')}</strong>
                  </p>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-[#d4af37] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => setCertificateOpen(false)}
                className="w-full py-2.5 px-4 bg-[#0a192f] text-white rounded-lg text-xs font-bold hover:bg-[#132742] transition cursor-pointer"
              >
                Resume Course
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
