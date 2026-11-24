import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  FileText,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CoursemartEvent, EventFormat, PreEventMaterial } from '../../types/marketplace';
import { BLOG_AI_VIBE_IMAGE, INSTRUCTOR_AVATAR } from '../../data/seedData';
import {
  EVENT_FORMAT_META,
  buildAttendeesCsv,
  buildPreEventAcknowledgementHtml,
  getEventSeatStats,
  isEventFree,
  validateEventPricing,
} from '../../utils/events';
import { formatNaira } from '../../utils/currency';
import { slugifyText } from '../../utils/catalogAndBlogs';

function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '2026-12-20T14:00';
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return '2026-12-20T14:00';
  }
}

const MATERIAL_TYPE_LABELS: Record<PreEventMaterial['type'], string> = {
  pdf: 'PDF Document',
  slides: 'Presentation Slides',
  repo: 'Code Repository',
  checklist: 'Setup Checklist',
  video: 'Video Briefing',
};

export function EventsManagerPanel() {
  const {
    events,
    eventRegistrations,
    upsertEvent,
    deleteEvent,
    updateEventRegistrationPayment,
    markEventMaterialsSent,
    publicServerConfig,
    navigate,
    showToast,
  } = useStore();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [format, setFormat] = useState<EventFormat>('workshop');
  const [category, setCategory] = useState('AI');
  const [speakerName, setSpeakerName] = useState('Dr. Elena Vance');
  const [startAt, setStartAt] = useState('2026-12-20T14:00');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0');
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState('100');
  const [locationOrLink, setLocationOrLink] = useState('Live Zoom Studio Link');
  const [agendaText, setAgendaText] = useState(
    'Part 1 · Core Architecture & Specs\nPart 2 · Live Implementation Lab\nPart 3 · Deployment & Q&A'
  );

  // Create Multi-material Kit State
  const [materials, setMaterials] = useState<PreEventMaterial[]>([
    {
      id: 'mat-init-1',
      title: 'Pre-Event Setup Guide & Starter Checklist',
      type: 'checklist',
      urlOrNotes: 'Complete Node 22 setup and review starter architecture brief before session kickoff.',
      summary: 'Included automatically in attendee confirmation pack.',
    },
  ]);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState<PreEventMaterial['type']>('pdf');
  const [newMatUrlOrNotes, setNewMatUrlOrNotes] = useState('');
  const [newMatSummary, setNewMatSummary] = useState('');

  // Edit Event Modal State
  const [editingEvent, setEditingEvent] = useState<CoursemartEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editFormat, setEditFormat] = useState<EventFormat>('workshop');
  const [editCategory, setEditCategory] = useState('');
  const [editSpeakerName, setEditSpeakerName] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editIsFree, setEditIsFree] = useState(true);
  const [editPrice, setEditPrice] = useState('0');
  const [editPricingError, setEditPricingError] = useState<string | null>(null);
  const [editCapacity, setEditCapacity] = useState('100');
  const [editLocationOrLink, setEditLocationOrLink] = useState('');
  const [editAgendaText, setEditAgendaText] = useState('');
  const [editMaterials, setEditMaterials] = useState<PreEventMaterial[]>([]);
  const [editNewMatTitle, setEditNewMatTitle] = useState('');
  const [editNewMatType, setEditNewMatType] = useState<PreEventMaterial['type']>('pdf');
  const [editNewMatUrlOrNotes, setEditNewMatUrlOrNotes] = useState('');
  const [editNewMatSummary, setEditNewMatSummary] = useState('');

  const [sendingMaterials, setSendingMaterials] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  );

  const attendees = useMemo(
    () =>
      activeEvent
        ? eventRegistrations.filter((r) => r.eventId === activeEvent.id)
        : [],
    [activeEvent, eventRegistrations]
  );

  const handleAddMaterialToCreate = () => {
    if (!newMatTitle.trim()) {
      showToast('Enter a material title');
      return;
    }
    const mat: PreEventMaterial = {
      id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newMatTitle.trim(),
      type: newMatType,
      urlOrNotes: newMatUrlOrNotes.trim() || 'Access details provided in attendee email',
      summary: newMatSummary.trim() || 'Pre-event preparation resource',
    };
    setMaterials((prev) => [...prev, mat]);
    setNewMatTitle('');
    setNewMatUrlOrNotes('');
    setNewMatSummary('');
    showToast('Added material to pre-event kit');
  };

  const handleRemoveMaterialFromCreate = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4) {
      showToast('Enter an event title (at least 4 characters)');
      return;
    }

    const priceNum = isFree ? 0 : Number(price) || 0;
    const priceCheck = validateEventPricing(isFree, priceNum);
    if (!priceCheck.valid) {
      setPricingError(priceCheck.error || 'Invalid pricing configuration');
      return;
    }
    setPricingError(null);

    const startIso = new Date(startAt).toISOString();
    const endIso = new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const newEvent: CoursemartEvent = {
      id: `evt-${Date.now()}`,
      slug: slugifyText(title) || `event-${Date.now()}`,
      title: title.trim(),
      subtitle:
        subtitle.trim() || 'Live interactive session with downloadable pre-event kit.',
      description:
        subtitle.trim() ||
        'Interactive live event with Q&A, structured agenda, and pre-event preparation materials.',
      format,
      category,
      deliveryMode: 'Live Virtual (Zoom/Meet)',
      locationOrLink: locationOrLink.trim() || 'Private Zoom Link',
      startAt: startIso,
      endAt: endIso,
      timezone: 'WAT (UTC+1)',
      speakerName: speakerName.trim() || 'Dr. Elena Vance',
      speakerRole: 'Lead Instructor',
      speakerAvatar: INSTRUCTOR_AVATAR,
      coverImage: BLOG_AI_VIBE_IMAGE,
      price: priceNum,
      isFree,
      capacity: Math.max(5, Number(capacity) || 100),
      status: 'published',
      featured: true,
      agenda: agendaText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      preEventMaterials: materials.length > 0 ? materials : [
        {
          id: `mat-${Date.now()}`,
          title: 'Pre-Event Preparation Guide',
          type: 'checklist',
          urlOrNotes: 'Review pre-event setup instructions',
          summary: 'Included automatically in attendee confirmation pack.',
        },
      ],
      acknowledgementMessage:
        'Your seat is reserved! Review your pre-event preparation materials and calendar invite.',
      createdAt: new Date().toISOString(),
    };

    upsertEvent(newEvent);
    setSelectedEventId(newEvent.id);
    setTitle('');
    setSubtitle('');
    setShowCreateForm(false);
    showToast('Event created successfully');
  };

  const handleOpenEditModal = (ev: CoursemartEvent) => {
    setEditingEvent(ev);
    setEditTitle(ev.title);
    setEditSubtitle(ev.subtitle);
    setEditFormat(ev.format);
    setEditCategory(ev.category);
    setEditSpeakerName(ev.speakerName);
    setEditStartAt(toDatetimeLocal(ev.startAt));
    const eventIsFree = isEventFree(ev);
    setEditIsFree(eventIsFree);
    setEditPrice(String(ev.price ?? 0));
    setEditPricingError(null);
    setEditCapacity(String(ev.capacity));
    setEditLocationOrLink(ev.locationOrLink);
    setEditAgendaText(ev.agenda.join('\n'));
    setEditMaterials([...ev.preEventMaterials]);
    setEditNewMatTitle('');
    setEditNewMatUrlOrNotes('');
    setEditNewMatSummary('');
  };

  const handleAddMaterialToEdit = () => {
    if (!editNewMatTitle.trim()) {
      showToast('Enter a material title');
      return;
    }
    const mat: PreEventMaterial = {
      id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: editNewMatTitle.trim(),
      type: editNewMatType,
      urlOrNotes: editNewMatUrlOrNotes.trim() || 'Access details provided in attendee email',
      summary: editNewMatSummary.trim() || 'Pre-event preparation resource',
    };
    setEditMaterials((prev) => [...prev, mat]);
    setEditNewMatTitle('');
    setEditNewMatUrlOrNotes('');
    setEditNewMatSummary('');
    showToast('Added material to pre-event kit');
  };

  const handleRemoveMaterialFromEdit = (id: string) => {
    setEditMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    if (editTitle.trim().length < 4) {
      showToast('Enter an event title (at least 4 characters)');
      return;
    }

    const priceNum = editIsFree ? 0 : Number(editPrice) || 0;
    const priceCheck = validateEventPricing(editIsFree, priceNum);
    if (!priceCheck.valid) {
      setEditPricingError(priceCheck.error || 'Invalid pricing configuration');
      return;
    }
    setEditPricingError(null);

    const startIso = new Date(editStartAt).toISOString();
    const endIso = new Date(new Date(editStartAt).getTime() + 2 * 60 * 60 * 1000).toISOString();

    const updatedEvent: CoursemartEvent = {
      ...editingEvent,
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      description: editSubtitle.trim() || editingEvent.description,
      format: editFormat,
      category: editCategory.trim() || editingEvent.category,
      speakerName: editSpeakerName.trim() || editingEvent.speakerName,
      startAt: startIso,
      endAt: endIso,
      locationOrLink: editLocationOrLink.trim() || editingEvent.locationOrLink,
      price: priceNum,
      isFree: editIsFree,
      capacity: Math.max(5, Number(editCapacity) || 100),
      agenda: editAgendaText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      preEventMaterials: editMaterials,
    };

    upsertEvent(updatedEvent);
    if (selectedEventId === updatedEvent.id) {
      setSelectedEventId(updatedEvent.id);
    }
    setEditingEvent(null);
    showToast('Event updated successfully');
  };

  const handleSendPreEventMaterialsBatch = async () => {
    if (!activeEvent || attendees.length === 0 || sendingMaterials) return;
    setSendingMaterials(true);
    setDispatchNotice(null);

    const samplePayload = buildPreEventAcknowledgementHtml(activeEvent, attendees[0]);
    try {
      const resp = await fetch('/api/email/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: attendees.map((a) => ({ email: a.email, name: a.fullName })),
          subject: `[Reminder & Pre-Event Kit] ${activeEvent.title}`,
          html: samplePayload.html,
        }),
      });
      const json = (await resp.json()) as {
        ok?: boolean;
        sentCount?: number;
        provider?: string;
        error?: string;
      };
      if (resp.ok && json.ok) {
        markEventMaterialsSent(attendees.map((a) => a.id));
        setDispatchNotice(
          `Dispatched pre-event materials to ${json.sentCount ?? attendees.length} attendee(s) via ${json.provider?.toUpperCase()}.`
        );
        showToast('Pre-event materials emailed to attendees');
      } else {
        setDispatchNotice(
          json.error ||
            'Email API key not configured. Add EMAILBUMP_API_KEY, RESEND_API_KEY, or BREVO_API_KEY in .env to email attendees directly.'
        );
      }
    } catch {
      setDispatchNotice('Network error reaching email broadcast endpoint.');
    } finally {
      setSendingMaterials(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Events, Registrations & Attendee Roster
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage Online Courses, Seminars, and Workshops, configure pre-event materials, free/paid controls, and track attendee roster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm cursor-pointer"
          >
            View Public Events Page
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCreateForm ? 'Close Event Form' : 'Create New Event'}</span>
          </button>
        </div>
      </div>

      {/* Create Event Drawer / Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-4 shadow-sm"
        >
          <h2 className="font-display text-sm font-bold text-[#1d2327] border-b border-slate-200 pb-2">
            Schedule Online Course, Seminar, or Workshop
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Supabase & Vercel Deployment Clinic"
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as EventFormat)}
                className="w-full h-9 px-2 border border-[#8c8f94] rounded-sm bg-white"
              >
                <option value="workshop">Hands-On Workshop</option>
                <option value="seminar">Executive Seminar</option>
                <option value="online-course">Online Course Cohort</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Speaker/Instructor</label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                min={5}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm"
              />
            </div>
          </div>

          {/* Pricing Controls: Free Admission vs Paid Ticket */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-sm space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-800">Event Pricing Controls (Free/Paid Admission)</span>
              <div className="inline-flex rounded-sm border border-[#8c8f94] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFree(true);
                    setPrice('0');
                    setPricingError(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
                    isFree
                      ? 'bg-[#0a192f] text-[#f5c451]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Free Admission
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFree(false);
                    setPricingError(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
                    !isFree
                      ? 'bg-[#0a192f] text-[#f5c451]'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Paid Ticket
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ticket Fee (₦) {isFree ? '(Enforced ₦0 for Free Events)' : '*'}
                </label>
                <input
                  type="number"
                  min={0}
                  disabled={isFree}
                  value={isFree ? 0 : price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setPricingError(null);
                  }}
                  className={`w-full h-9 px-2.5 border rounded-sm ${
                    isFree
                      ? 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed'
                      : 'bg-white border-[#8c8f94]'
                  }`}
                />
              </div>
              <div className="text-slate-600 text-[11px] pt-1">
                {isFree ? (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Free Admission configured. Attendees register without payment gateway.</span>
                  </p>
                ) : (
                  <p className="text-slate-700 font-medium">
                    Paid Ticket configured. Requires positive fee and Paystack/GTB checkout.
                  </p>
                )}
              </div>
            </div>
            {pricingError && (
              <p className="text-rose-600 font-bold text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pricingError}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subtitle/Summary</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="One-sentence takeaway for attendees..."
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue/Virtual Link</label>
              <input
                type="text"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Agenda (one item per line)</label>
              <textarea
                rows={2}
                value={agendaText}
                onChange={(e) => setAgendaText(e.target.value)}
                className="w-full p-2.5 border border-[#8c8f94] rounded-sm font-mono text-xs"
              />
            </div>
          </div>

          {/* Pre-Event Preparation Materials Multi-Item Editor */}
          <div className="border border-slate-200 rounded-sm p-4 bg-slate-50 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2271b1]" />
                <span>Pre-Event Preparation Materials Kit ({materials.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Materials included automatically in attendee confirmation packs.
              </span>
            </div>

            {/* List of current materials */}
            {materials.length === 0 ? (
              <p className="text-slate-500 italic py-2">
                No materials added yet. Add PDFs, slides, repositories, checklists, or videos below.
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((mat, idx) => (
                  <div
                    key={mat.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {mat.type}
                        </span>
                        <strong className="text-slate-900">{idx + 1}. {mat.title}</strong>
                      </div>
                      <p className="text-[11px] text-slate-600">{mat.summary}</p>
                      <p className="text-[11px] text-blue-700 font-mono">{mat.urlOrNotes}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialFromCreate(mat.id)}
                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-sm text-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new material input box */}
            <div className="border border-dashed border-slate-300 p-3 bg-white rounded-sm space-y-2">
              <p className="font-bold text-slate-800 text-[11px]">Add Material to Pre-Event Kit</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Title *</label>
                  <input
                    type="text"
                    value={newMatTitle}
                    onChange={(e) => setNewMatTitle(e.target.value)}
                    placeholder="e.g. Starter Architecture PDF"
                    className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Type</label>
                  <select
                    value={newMatType}
                    onChange={(e) => setNewMatType(e.target.value as PreEventMaterial['type'])}
                    className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm bg-white text-xs"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="slides">Presentation Slides</option>
                    <option value="repo">Code Repository</option>
                    <option value="checklist">Setup Checklist</option>
                    <option value="video">Video Briefing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">URL/Notes *</label>
                  <input
                    type="text"
                    value={newMatUrlOrNotes}
                    onChange={(e) => setNewMatUrlOrNotes(e.target.value)}
                    placeholder="https://... or instructions"
                    className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Summary</label>
                  <input
                    type="text"
                    value={newMatSummary}
                    onChange={(e) => setNewMatSummary(e.target.value)}
                    placeholder="Brief explanation for attendees"
                    className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddMaterialToCreate}
                className="mt-1 px-3 py-1.5 text-xs font-bold text-[#2271b1] bg-blue-50 border border-[#2271b1] hover:bg-blue-100 rounded-sm cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Material</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
          >
            Publish Event to Storefront
          </button>
        </form>
      )}

      {/* Scheduled Events Table */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2271b1]" />
          <span>Scheduled Events ({events.length})</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-2.5">Event</th>
              <th className="px-4 py-2.5">Format</th>
              <th className="px-4 py-2.5">Schedule</th>
              <th className="px-4 py-2.5">Registered</th>
              <th className="px-4 py-2.5">Fee</th>
              <th className="px-4 py-2.5 text-right">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {events.map((ev) => {
              const seats = getEventSeatStats(ev, eventRegistrations);
              const isSelected = activeEvent?.id === ev.id;
              const eventFree = isEventFree(ev);
              return (
                <tr
                  key={ev.id}
                  className={isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className="font-bold text-[#2271b1] hover:underline text-left cursor-pointer"
                    >
                      {ev.title}
                    </button>
                    <p className="text-[11px] text-slate-500">
                      {ev.speakerName} · {ev.preEventMaterials.length} prep kit items
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {EVENT_FORMAT_META[ev.format].label}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(ev.startAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {seats.registeredCount} / {ev.capacity}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {eventFree ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] uppercase font-extrabold">
                        Free Admission
                      </span>
                    ) : (
                      <span className="text-slate-900">{formatNaira(ev.price)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(ev)}
                      className="px-2.5 py-1 text-[11px] font-semibold border border-[#2271b1] text-[#2271b1] rounded-sm bg-white hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Event</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold border border-[#8c8f94] rounded-sm bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      View Roster ({seats.registeredCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEvent(ev.id)}
                      aria-label={`Delete ${ev.title}`}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Edit Event Modal / Drawer */}
      {editingEvent && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Edit ${editingEvent.title}`}
        >
          <div className="bg-white rounded-sm border border-slate-300 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#1d2327]">
                  Edit Event: {editingEvent.title}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Update event details, pre-event preparation materials kit, and free/paid admission controls.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                aria-label="Close edit event dialog"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format</label>
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value as EventFormat)}
                    className="w-full h-9 px-2 border border-[#8c8f94] rounded-sm bg-white"
                  >
                    <option value="workshop">Hands-On Workshop</option>
                    <option value="seminar">Executive Seminar</option>
                    <option value="online-course">Online Course Cohort</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Speaker/Instructor</label>
                  <input
                    type="text"
                    value={editSpeakerName}
                    onChange={(e) => setEditSpeakerName(e.target.value)}
                    className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editStartAt}
                    onChange={(e) => setEditStartAt(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={5}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm"
                  />
                </div>
              </div>

              {/* Explicit Free/Paid Pricing Controls in Edit Modal */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800">Event Pricing Controls (Free/Paid Admission)</span>
                  <div className="inline-flex rounded-sm border border-[#8c8f94] bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditIsFree(true);
                        setEditPrice('0');
                        setEditPricingError(null);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
                        editIsFree
                          ? 'bg-[#0a192f] text-[#f5c451]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Free Admission
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditIsFree(false);
                        setEditPricingError(null);
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-sm cursor-pointer transition-colors ${
                        !editIsFree
                          ? 'bg-[#0a192f] text-[#f5c451]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Paid Ticket
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Ticket Fee (₦) {editIsFree ? '(Enforced ₦0 for Free Events)' : '*'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={editIsFree}
                      value={editIsFree ? 0 : editPrice}
                      onChange={(e) => {
                        setEditPrice(e.target.value);
                        setEditPricingError(null);
                      }}
                      className={`w-full h-9 px-2.5 border rounded-sm ${
                        editIsFree
                          ? 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed'
                          : 'bg-white border-[#8c8f94]'
                      }`}
                    />
                  </div>
                  <div className="text-slate-600 text-[11px] pt-1">
                    {editIsFree ? (
                      <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Free Admission configured. Attendees register without payment gateway.</span>
                      </p>
                    ) : (
                      <p className="text-slate-700 font-medium">
                        Paid Ticket configured. Requires positive fee and Paystack/GTB checkout.
                      </p>
                    )}
                  </div>
                </div>
                {editPricingError && (
                  <p className="text-rose-600 font-bold text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{editPricingError}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtitle/Summary</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue/Virtual Link</label>
                  <input
                    type="text"
                    value={editLocationOrLink}
                    onChange={(e) => setEditLocationOrLink(e.target.value)}
                    className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Agenda (one item per line)</label>
                  <textarea
                    rows={2}
                    value={editAgendaText}
                    onChange={(e) => setEditAgendaText(e.target.value)}
                    className="w-full p-2.5 border border-[#8c8f94] rounded-sm font-mono text-xs"
                  />
                </div>
              </div>

              {/* Pre-Event Preparation Materials Multi-Item Editor in Modal */}
              <div className="border border-slate-200 rounded-sm p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#2271b1]" />
                    <span>Pre-Event Preparation Materials Kit ({editMaterials.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Add or update materials included in attendee confirmation packs.
                  </span>
                </div>

                {/* Materials review list */}
                {editMaterials.length === 0 ? (
                  <p className="text-slate-500 italic py-2">
                    No materials in this prep kit yet. Add materials below.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editMaterials.map((mat, idx) => (
                      <div
                        key={mat.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-slate-200 rounded-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {MATERIAL_TYPE_LABELS[mat.type] || mat.type}
                            </span>
                            <strong className="text-slate-900">{idx + 1}. {mat.title}</strong>
                          </div>
                          <p className="text-[11px] text-slate-600">{mat.summary}</p>
                          <p className="text-[11px] text-blue-700 font-mono">{mat.urlOrNotes}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialFromEdit(mat.id)}
                          className="px-2 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-sm text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new material form */}
                <div className="border border-dashed border-slate-300 p-3 bg-white rounded-sm space-y-2">
                  <p className="font-bold text-slate-800 text-[11px]">Add Material to Pre-Event Kit</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Title *</label>
                      <input
                        type="text"
                        value={editNewMatTitle}
                        onChange={(e) => setEditNewMatTitle(e.target.value)}
                        placeholder="e.g. Slide Deck or Starter Code"
                        className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Type</label>
                      <select
                        value={editNewMatType}
                        onChange={(e) => setEditNewMatType(e.target.value as PreEventMaterial['type'])}
                        className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm bg-white text-xs"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="slides">Presentation Slides</option>
                        <option value="repo">Code Repository</option>
                        <option value="checklist">Setup Checklist</option>
                        <option value="video">Video Briefing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">URL/Notes *</label>
                      <input
                        type="text"
                        value={editNewMatUrlOrNotes}
                        onChange={(e) => setEditNewMatUrlOrNotes(e.target.value)}
                        placeholder="https://... or instructions"
                        className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Summary</label>
                      <input
                        type="text"
                        value={editNewMatSummary}
                        onChange={(e) => setEditNewMatSummary(e.target.value)}
                        placeholder="Brief summary for attendee"
                        className="w-full h-8 px-2 border border-[#8c8f94] rounded-sm text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMaterialToEdit}
                    className="mt-1 px-3 py-1.5 text-xs font-bold text-[#2271b1] bg-blue-50 border border-[#2271b1] hover:bg-blue-100 rounded-sm cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Material</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 border border-[#8c8f94] text-slate-700 hover:bg-slate-50 rounded-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm cursor-pointer"
                >
                  Save Event Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendee Roster for Selected Event */}
      {activeEvent && (
        <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#c3c4c7] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2271b1]" />
                <span>
                  Attendee Roster ({attendees.length}) — {activeEvent.title}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Live list of who is attending, attendance preference, learning goals, and pre-event
                materials status.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={attendees.length === 0}
                onClick={() =>
                  downloadCsv(
                    `${activeEvent.slug}-attendees.csv`,
                    buildAttendeesCsv(activeEvent, attendees)
                  )
                }
                className="px-3 py-1.5 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                disabled={attendees.length === 0 || sendingMaterials}
                onClick={handleSendPreEventMaterialsBatch}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingMaterials
                    ? 'Sending...'
                    : `Send Pre-Event Kit Email (${publicServerConfig.emailProvider === 'none' ? 'Needs Key' : publicServerConfig.emailProvider.toUpperCase()})`}
                </span>
              </button>
            </div>
          </div>

          {dispatchNotice && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0 text-amber-700" />
              <span>{dispatchNotice}</span>
            </div>
          )}

          {attendees.length === 0 ? (
            <p className="p-6 text-xs text-slate-500">
              No attendees registered yet for this event. Share `/events` to start collecting
              registrations.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Code</th>
                    <th className="px-4 py-2.5">Attendee</th>
                    <th className="px-4 py-2.5">Role/Org</th>
                    <th className="px-4 py-2.5">Mode & Goals</th>
                    <th className="px-4 py-2.5">Newsletter</th>
                    <th className="px-4 py-2.5">Ticket/Kit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendees.map((att) => (
                    <tr key={att.id}>
                      <td className="px-4 py-2.5 font-mono font-bold text-[#2271b1]">
                        {att.confirmationCode}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-900">{att.fullName}</p>
                        <p className="text-[11px] text-slate-500">{att.email}</p>
                        {att.phone && (
                          <p className="text-[11px] text-slate-500">{att.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-slate-800">{att.roleTitle}</p>
                        <p className="text-[11px] text-slate-500">
                          {att.organization || 'Independent'} · {att.experienceLevel}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 max-w-xs">
                        <p className="font-semibold text-slate-800">{att.attendanceMode}</p>
                        {att.learningGoals && (
                          <p className="text-[11px] text-slate-600 line-clamp-2">
                            {att.learningGoals}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${
                            att.newsletterOptIn
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {att.newsletterOptIn ? 'Opted-In' : 'Event Only'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-slate-100 text-slate-800">
                            {att.paymentStatus}
                          </span>
                          {(att.paymentStatus === 'pending_gtb' ||
                            att.paymentStatus === 'pending_paystack') && (
                            <button
                              type="button"
                              onClick={() => updateEventRegistrationPayment(att.id, 'paid_paystack')}
                              className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-700 rounded-sm inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {att.paymentStatus === 'pending_gtb' ? 'Verify GTB' : 'Verify Paystack'}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {att.preEventMaterialsSentAt
                            ? `Kit emailed ${att.preEventMaterialsSentAt.slice(0, 10)}`
                            : 'Kit unlocked in-app'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}