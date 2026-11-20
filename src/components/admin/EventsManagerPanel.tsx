import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CoursemartEvent, EventFormat, PreEventMaterial } from '../../types/marketplace';
import { BLOG_AI_VIBE_IMAGE, INSTRUCTOR_AVATAR } from '../../data/seedData';
import {
  EVENT_FORMAT_META,
  buildAttendeesCsv,
  buildPreEventAcknowledgementHtml,
  getEventSeatStats,
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

  // Create / Edit event draft
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [format, setFormat] = useState<EventFormat>('workshop');
  const [category, setCategory] = useState('AI');
  const [speakerName, setSpeakerName] = useState('Dr. Elena Vance');
  const [startAt, setStartAt] = useState('2026-12-20T14:00');
  const [price, setPrice] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [locationOrLink, setLocationOrLink] = useState('Live Zoom Studio Link');
  const [agendaText, setAgendaText] = useState(
    'Part 1 · Core Architecture & Specs\nPart 2 · Live Implementation Lab\nPart 3 · Deployment & Q&A'
  );
  const [materialTitle, setMaterialTitle] = useState('Pre-Event Setup Guide & Starter Checklist');
  const [materialNotes, setMaterialNotes] = useState(
    'Complete Node 22 setup and review starter architecture brief before session kickoff.'
  );
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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 4) {
      showToast('Enter an event title (at least 4 characters)');
      return;
    }
    const startIso = new Date(startAt).toISOString();
    const endIso = new Date(new Date(startAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const mat: PreEventMaterial = {
      id: `mat-${Date.now()}`,
      title: materialTitle.trim() || 'Pre-Event Preparation Guide',
      type: 'checklist',
      urlOrNotes: materialNotes.trim(),
      summary: 'Included automatically in attendee confirmation pack.',
    };
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
      deliveryMode: 'Live Virtual (Zoom / Meet)',
      locationOrLink: locationOrLink.trim() || 'Private Zoom Link',
      startAt: startIso,
      endAt: endIso,
      timezone: 'WAT (UTC+1)',
      speakerName: speakerName.trim() || 'Dr. Elena Vance',
      speakerRole: 'Lead Instructor',
      speakerAvatar: INSTRUCTOR_AVATAR,
      coverImage: BLOG_AI_VIBE_IMAGE,
      price: Math.max(0, Number(price) || 0),
      capacity: Math.max(5, Number(capacity) || 100),
      status: 'published',
      featured: true,
      agenda: agendaText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      preEventMaterials: [mat],
      acknowledgementMessage:
        'Your seat is reserved! Review your pre-event preparation materials and calendar invite.',
      createdAt: new Date().toISOString(),
    };

    upsertEvent(newEvent);
    setSelectedEventId(newEvent.id);
    setTitle('');
    setSubtitle('');
    setShowCreateForm(false);
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
            Manage Online Courses, Seminars, and Workshops, track attendee profiles, and dispatch
            pre-event materials.
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

      {/* Create Event Drawer */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-4"
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
              <label className="block font-bold text-slate-700 mb-1">Speaker / Instructor</label>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Price (₦)</label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Subtitle / Summary</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="One-sentence takeaway for attendees..."
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue / Virtual Link</label>
              <input
                type="text"
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Agenda (one item per line)</label>
              <textarea
                rows={3}
                value={agendaText}
                onChange={(e) => setAgendaText(e.target.value)}
                className="w-full p-2.5 border border-[#8c8f94] rounded-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Pre-Event Preparation Material</label>
              <input
                type="text"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="Material Title"
                className="w-full h-8 px-2.5 border border-[#8c8f94] rounded-sm"
              />
              <input
                type="text"
                value={materialNotes}
                onChange={(e) => setMaterialNotes(e.target.value)}
                placeholder="Pre-event instructions or link..."
                className="w-full h-8 px-2.5 border border-[#8c8f94] rounded-sm"
              />
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
                    {ev.price === 0 ? 'Free' : formatNaira(ev.price)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
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
                    <th className="px-4 py-2.5">Role / Org</th>
                    <th className="px-4 py-2.5">Mode & Goals</th>
                    <th className="px-4 py-2.5">Newsletter</th>
                    <th className="px-4 py-2.5">Ticket / Kit Status</th>
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
