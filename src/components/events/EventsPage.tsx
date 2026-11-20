import { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileText,
  Landmark,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type {
  CoursemartEvent,
  EventFormat,
  EventRegistration,
} from '../../types/marketplace';
import {
  EVENT_FORMAT_META,
  buildEventIcsContent,
  filterEvents,
  getEventSeatStats,
  type EventRegistrationInput,
} from '../../utils/events';
import { formatNaira } from '../../utils/currency';
import {
  resolvePaystackChannels,
  type PaystackPaymentOptionId,
} from '../../utils/paystack';
import { TINTOL_PAYMENT_DETAILS, buildWhatsAppUrl } from '../../utils/whatsapp';
import { PaystackChannelPicker } from '../common/PaystackChannelPicker';

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function EventsPage() {
  const {
    events,
    eventRegistrations,
    registerForEvent,
    verifyPaystackReference,
    currentUser,
    publicServerConfig,
    showToast,
  } = useStore();

  const [formatFilter, setFormatFilter] = useState<EventFormat | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CoursemartEvent | null>(null);
  const [confirmedReg, setConfirmedReg] = useState<EventRegistration | null>(null);

  // Registration form fields
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [roleTitle, setRoleTitle] = useState(currentUser?.title || '');
  const [experienceLevel, setExperienceLevel] =
    useState<EventRegistrationInput['experienceLevel']>('Intermediate');
  const [attendanceMode, setAttendanceMode] =
    useState<EventRegistrationInput['attendanceMode']>('Live Virtual');
  const [learningGoals, setLearningGoals] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(
    Boolean(currentUser?.newsletterOptIn)
  );
  const [ticketPayMethod, setTicketPayMethod] = useState<'paystack' | 'gtb_whatsapp'>('paystack');
  const [paystackOption, setPaystackOption] = useState<PaystackPaymentOptionId>('all');
  const [gtbReference, setGtbReference] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [verifyingPaystack, setVerifyingPaystack] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState<string | null>(null);

  const visibleEvents = useMemo(
    () =>
      filterEvents(events, {
        format: formatFilter,
        search: searchQuery,
        includeDrafts: false,
      }),
    [events, formatFilter, searchQuery]
  );

  const totalSeatsLeft = useMemo(
    () =>
      visibleEvents.reduce(
        (sum, ev) => sum + getEventSeatStats(ev, eventRegistrations).remainingSeats,
        0
      ),
    [visibleEvents, eventRegistrations]
  );

  const openRegistrationModal = (event: CoursemartEvent) => {
    setSelectedEvent(event);
    setConfirmedReg(null);
    setPaystackAuthUrl(null);
    setFormErrors({});
    if (currentUser) {
      setFullName((prev) => prev || currentUser.name);
      setEmail((prev) => prev || currentUser.email);
      setRoleTitle((prev) => prev || currentUser.title || '');
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || submitting) return;
    setFormErrors({});

    if (selectedEvent.price > 0 && ticketPayMethod === 'gtb_whatsapp' && gtbReference.trim().length < 3) {
      setFormErrors({
        payment: 'Enter your GTB transfer reference or sender name before submitting.',
      });
      return;
    }

    setPaystackAuthUrl(null);
    setSubmitting(true);
    let paymentInfo: {
      paymentStatus: EventRegistration['paymentStatus'];
      paymentReference?: string;
    } = {
      paymentStatus: selectedEvent.price === 0 ? 'free' : 'paid_paystack',
    };

    if (selectedEvent.price > 0) {
      if (ticketPayMethod === 'gtb_whatsapp') {
        paymentInfo = {
          paymentStatus: 'pending_gtb',
          paymentReference: gtbReference.trim(),
        };
      } else {
        try {
          const ref = `EVT-PSK-${Date.now()}`;
          const initRes = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              amountNgn: selectedEvent.price,
              channels: resolvePaystackChannels(paystackOption),
              reference: ref,
              callbackUrl:
                typeof window !== 'undefined' ? window.location.origin + '/events' : undefined,
              metadata: {
                eventId: selectedEvent.id,
                eventTitle: selectedEvent.title,
                paystackOption,
              },
            }),
          });
          const initJson = (await initRes.json()) as {
            mode?: string;
            configured?: boolean;
            authorizationUrl?: string;
            reference?: string;
            error?: string;
          };
          if (!initRes.ok) {
            setFormErrors({ payment: initJson.error || 'Paystack initialization failed.' });
            setSubmitting(false);
            return;
          }
          if (initJson.configured && initJson.authorizationUrl) {
            setPaystackAuthUrl(initJson.authorizationUrl);
            paymentInfo = {
              paymentStatus: 'pending_paystack',
              paymentReference: initJson.reference || ref,
            };
          } else {
            paymentInfo = {
              paymentStatus: 'paid_paystack',
              paymentReference: initJson.reference || ref,
            };
          }
        } catch {
          paymentInfo = {
            paymentStatus: 'paid_paystack',
            paymentReference: `EVT-PSK-LOCAL-${Date.now()}`,
          };
        }
      }
    }

    const res = await registerForEvent(
      selectedEvent.id,
      {
        fullName,
        email,
        phone,
        organization,
        roleTitle,
        experienceLevel,
        attendanceMode,
        learningGoals,
        newsletterOptIn,
      },
      paymentInfo
    );
    setSubmitting(false);

    if (!res.ok || !res.registration) {
      setFormErrors(res.errors ?? { general: res.error ?? 'Could not complete registration.' });
      return;
    }

    setConfirmedReg(res.registration);
    setLearningGoals('');
    setGtbReference('');
  };

  const handleDownloadIcs = (event: CoursemartEvent, code?: string) => {
    const ics = buildEventIcsContent(event, code);
    triggerDownload(`${event.slug}.ics`, ics, 'text/calendar;charset=utf-8');
    showToast('Downloaded calendar invite (.ics)');
  };

  const handleDownloadPreEventBrief = (event: CoursemartEvent, reg: EventRegistration) => {
    const lines = [
      `COURSEMART PRE-EVENT PREPARATION KIT`,
      `======================================`,
      `Event: ${event.title}`,
      `Format: ${EVENT_FORMAT_META[event.format].label}`,
      `Attendee: ${reg.fullName} (${reg.email})`,
      `Confirmation Code: ${reg.confirmationCode}`,
      `When: ${new Date(event.startAt).toLocaleString()} (${event.timezone})`,
      `Delivery: ${event.deliveryMode}`,
      `Access / Venue: ${event.locationOrLink}`,
      ``,
      `AGENDA:`,
      ...event.agenda.map((a, i) => `  ${i + 1}. ${a}`),
      ``,
      `PRE-EVENT MATERIALS:`,
      ...event.preEventMaterials.map(
        (m, i) => `  ${i + 1}. [${m.type.toUpperCase()}] ${m.title}\n     ${m.summary}\n     Resource: ${m.urlOrNotes}`
      ),
    ].join('\n');
    triggerDownload(`${event.slug}-pre-event-kit.txt`, lines, 'text/plain;charset=utf-8');
    showToast('Downloaded Pre-Event Preparation Kit');
  };

  return (
    <main className="pb-20 bg-white">
      {/* Navy & Gold Hero Header */}
      <section className="bg-[#0a192f] text-white border-b-4 border-[#d4af37]">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 lg:py-16 space-y-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#f5c451]">
              Live Learning · Events Management Portal
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
              Online Courses, Seminars & Hands-On Workshops
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Reserve your seat in under a minute. Every registration unlocks your personalized
              confirmation code, calendar invite, and pre-event preparation materials immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl pt-2">
            <div className="bg-[#112240] border border-[#233554] rounded-lg px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#f5c451]">Scheduled Events</p>
              <p className="font-display text-2xl font-extrabold text-white tabular-nums mt-0.5">
                {visibleEvents.length}
              </p>
            </div>
            <div className="bg-[#112240] border border-[#233554] rounded-lg px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#f5c451]">Open Live Seats</p>
              <p className="font-display text-2xl font-extrabold text-white tabular-nums mt-0.5">
                {totalSeatsLeft}
              </p>
            </div>
            <div className="bg-[#112240] border border-[#233554] rounded-lg px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[#f5c451]">Pre-Event Kits</p>
              <p className="font-display text-2xl font-extrabold text-white mt-0.5">
                Instant + Email
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter events by format">
            {(
              [
                { id: 'all', label: 'All Events' },
                { id: 'online-course', label: 'Online Courses' },
                { id: 'seminar', label: 'Seminars' },
                { id: 'workshop', label: 'Workshops' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormatFilter(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  formatFilter === tab.id
                    ? 'bg-[#0a192f] text-[#f5c451]'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic, speaker, format..."
              aria-label="Search upcoming events"
              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
            />
          </div>
        </div>

        {/* Events Grid */}
        {visibleEvents.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center space-y-2 bg-slate-50">
            <Calendar className="w-9 h-9 text-slate-400 mx-auto" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              No matching upcoming events
            </h2>
            <p className="text-sm text-slate-600">
              Try clearing your filter or search query to view all scheduled sessions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleEvents.map((ev) => {
              const seats = getEventSeatStats(ev, eventRegistrations);
              const meta = EVENT_FORMAT_META[ev.format];
              const startDate = new Date(ev.startAt);
              const dateLabel = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeLabel = startDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              });

              return (
                <article
                  key={ev.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                      <img
                        src={ev.coverImage}
                        alt={ev.title}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold rounded ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-extrabold rounded bg-[#0a192f] text-[#f5c451] tabular-nums">
                        {ev.price === 0 ? 'FREE' : formatNaira(ev.price)}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-[#0a192f]" />
                          {dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {timeLabel} · {ev.timezone}
                        </span>
                      </div>

                      <h2 className="font-display text-lg font-extrabold text-slate-900 leading-snug">
                        {ev.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {ev.subtitle}
                      </p>

                      <div className="space-y-1.5 pt-1 text-xs text-slate-700">
                        <p className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#0a192f] shrink-0" />
                          <span>{ev.deliveryMode}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#0a192f] shrink-0" />
                          <span>
                            Host: <strong>{ev.speakerName}</strong> ({ev.speakerRole})
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Includes {ev.preEventMaterials.length} Pre-Event Prep Materials
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 tabular-nums">
                        <span>{seats.registeredCount} attending</span>
                        <span>
                          {seats.isFull
                            ? 'Waitlist / Full'
                            : `${seats.remainingSeats} of ${ev.capacity} seats left`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#d4af37]"
                          style={{ width: `${Math.max(8, seats.percentFilled)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openRegistrationModal(ev)}
                      className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors cursor-pointer"
                    >
                      {seats.isFull ? 'View Materials & Status' : 'Register & Get Pre-Event Kit'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Registration & Pre-Event Materials Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={`Event registration for ${selectedEvent.title}`}
        >
          <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full my-auto max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Navy Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-[#0a192f] text-white border-b-2 border-[#d4af37] flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#f5c451]">
                  {EVENT_FORMAT_META[selectedEvent.format].label} · {selectedEvent.deliveryMode}
                </p>
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {selectedEvent.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setConfirmedReg(null);
                }}
                aria-label="Close event registration modal"
                className="p-1.5 text-slate-300 hover:text-[#f5c451] rounded-md hover:bg-[#112240] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmedReg ? (
              /* Post-Registration Acknowledgement & Pre-Event Materials View */
              <div className="p-6 sm:p-8 space-y-6">
                <div
                  className={`p-5 rounded-xl border space-y-2 ${
                    confirmedReg.paymentStatus === 'pending_paystack' ||
                    confirmedReg.paymentStatus === 'pending_gtb'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div
                      className={`flex items-center gap-2 font-bold text-base ${
                        confirmedReg.paymentStatus === 'pending_paystack' ||
                        confirmedReg.paymentStatus === 'pending_gtb'
                          ? 'text-amber-900'
                          : 'text-emerald-900'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>
                        {confirmedReg.paymentStatus === 'pending_paystack'
                          ? 'Seat Reserved — Complete Paystack Payment'
                          : confirmedReg.paymentStatus === 'pending_gtb'
                          ? 'Seat Reserved — Pending GTB Verification'
                          : 'Registration Confirmed!'}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded bg-[#0a192f] text-[#f5c451] font-mono text-xs font-extrabold">
                      {confirmedReg.confirmationCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {selectedEvent.acknowledgementMessage}
                  </p>
                  <p className="text-xs text-slate-700 font-medium pt-1">
                    {confirmedReg.acknowledgementEmailStatus === 'sent_via_esp'
                      ? `Confirmation & pre-event materials emailed to ${confirmedReg.email}.`
                      : `Confirmation & pre-event kit unlocked directly below for ${confirmedReg.email}. (Configure EMAILBUMP_API_KEY, RESEND_API_KEY, or BREVO_API_KEY in .env to also deliver automated inbox emails.)`}
                  </p>
                  {confirmedReg.paymentStatus === 'pending_gtb' && (
                    <p className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded px-3 py-2 mt-2">
                      Ticket payment via GTB transfer is marked Pending Verification until Admin confirms settlement.
                    </p>
                  )}
                  {confirmedReg.paymentStatus === 'pending_paystack' && (
                    <div className="bg-[#0a192f] text-white border border-[#d4af37] rounded-lg px-4 py-3 mt-2 space-y-2.5">
                      <p className="text-xs font-bold text-[#f5c451]">
                        Ticket Seat Reserved · Complete Paystack Payment ({formatNaira(selectedEvent.price)})
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Your registration code is held as Pending Payment until Paystack settlement is verified.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {paystackAuthUrl && (
                          <a
                            href={paystackAuthUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Proceed to Paystack Checkout</span>
                          </a>
                        )}
                        {confirmedReg.paymentReference && (
                          <button
                            type="button"
                            disabled={verifyingPaystack}
                            onClick={async () => {
                              setVerifyingPaystack(true);
                              const check = await verifyPaystackReference(
                                confirmedReg.paymentReference!
                              );
                              setVerifyingPaystack(false);
                              if (check.verified) {
                                setConfirmedReg((prev) =>
                                  prev ? { ...prev, paymentStatus: 'paid_paystack' } : prev
                                );
                                setPaystackAuthUrl(null);
                              } else {
                                showToast(check.message);
                              }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#f5c451] border border-[#d4af37]/60 hover:bg-[#112240] rounded-md cursor-pointer disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {verifyingPaystack ? 'Verifying...' : 'Verify Paystack Payment'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div>
                    <p className="text-slate-500">Attendee</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {confirmedReg.fullName} · {confirmedReg.roleTitle}
                    </p>
                    <p className="text-slate-600">{confirmedReg.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Session Access</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {new Date(selectedEvent.startAt).toLocaleString()} ({selectedEvent.timezone})
                    </p>
                    <p className="text-slate-600">{selectedEvent.locationOrLink}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(selectedEvent, confirmedReg.confirmationCode)}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-[#0a192f] hover:bg-[#112240] rounded-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#f5c451]" />
                    <span>Add to Calendar (.ics)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPreEventBrief(selectedEvent, confirmedReg)}
                    className="px-4 py-2.5 text-xs font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Pre-Event Kit (.txt)</span>
                  </button>
                  <a
                    href={buildWhatsAppUrl(
                      `Hello ${TINTOL_PAYMENT_DETAILS.accountName}, I registered for "${selectedEvent.title}" (Code: ${confirmedReg.confirmationCode}) and have a quick question.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-md inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask Support on WhatsApp</span>
                  </a>
                </div>

                {/* Pre-Event Materials List */}
                <div className="space-y-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0a192f]" />
                    <span>Your Pre-Event Preparation Materials</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvent.preEventMaterials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-4 border border-slate-200 rounded-lg bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {mat.type}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{mat.title}</p>
                        <p className="text-xs text-slate-600">{mat.summary}</p>
                        <p className="text-xs font-mono text-[#0a192f] bg-slate-50 p-2 rounded border border-slate-100">
                          {mat.urlOrNotes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Designed Registration Form + Agenda & Materials Preview */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
                {/* Left: Event Brief, Agenda & Pre-Event Materials */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>
                        <strong>{new Date(selectedEvent.startAt).toLocaleString()}</strong> (
                        {selectedEvent.timezone})
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>{selectedEvent.locationOrLink}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0a192f] shrink-0" />
                      <span>
                        Host: <strong>{selectedEvent.speakerName}</strong> ·{' '}
                        {selectedEvent.speakerRole}
                      </span>
                    </p>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Session Agenda
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {selectedEvent.agenda.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#0a192f] text-[#f5c451] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#b4690e]" />
                      <span>Pre-Event Materials Unlocked on Registration</span>
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {selectedEvent.preEventMaterials.map((mat) => (
                        <li key={mat.id} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-800">{mat.title}</strong> ({mat.type.toUpperCase()})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: Attendee Registration Form */}
                <form
                  onSubmit={handleSubmitRegistration}
                  noValidate
                  className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div>
                    <h3 className="font-display text-base font-extrabold text-slate-900">
                      Reserve Your Seat
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Complete the attendee profile so instructors can tailor the session and send your pre-event materials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ev-reg-name" className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        id="ev-reg-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Adaeze Okafor"
                        className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                      />
                      {formErrors.fullName && (
                        <p className="text-xs text-rose-700 mt-1">{formErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ev-reg-email" className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        id="ev-reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                      />
                      {formErrors.email && (
                        <p className="text-xs text-rose-700 mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ev-reg-role" className="block text-xs font-bold text-slate-700 mb-1">
                        Current Role / Title *
                      </label>
                      <input
                        id="ev-reg-role"
                        type="text"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="Software Engineer / Founder"
                        className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                      />
                      {formErrors.roleTitle && (
                        <p className="text-xs text-rose-700 mt-1">{formErrors.roleTitle}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ev-reg-org" className="block text-xs font-bold text-slate-700 mb-1">
                        Organization / Company (optional)
                      </label>
                      <input
                        id="ev-reg-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Acme Labs"
                        className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                      />
                    </div>

                    <div>
                      <label htmlFor="ev-reg-phone" className="block text-xs font-bold text-slate-700 mb-1">
                        Phone / WhatsApp (optional)
                      </label>
                      <input
                        id="ev-reg-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234..."
                        className="w-full h-9 px-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                      />
                    </div>

                    <div>
                      <label htmlFor="ev-reg-exp" className="block text-xs font-bold text-slate-700 mb-1">
                        Experience Level
                      </label>
                      <select
                        id="ev-reg-exp"
                        value={experienceLevel}
                        onChange={(e) =>
                          setExperienceLevel(
                            e.target.value as EventRegistrationInput['experienceLevel']
                          )
                        }
                        className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 rounded-md"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ev-reg-mode" className="block text-xs font-bold text-slate-700 mb-1">
                      Attendance Preference
                    </label>
                    <select
                      id="ev-reg-mode"
                      value={attendanceMode}
                      onChange={(e) =>
                        setAttendanceMode(
                          e.target.value as EventRegistrationInput['attendanceMode']
                        )
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 rounded-md"
                    >
                      <option value="Live Virtual">Live Virtual (Zoom / Meet)</option>
                      <option value="In-Person">In-Person Studio (if hybrid/physical)</option>
                      <option value="On-Demand Replay">Cannot Attend Live — Send Replay & Materials</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ev-reg-goals" className="block text-xs font-bold text-slate-700 mb-1">
                      What do you hope to learn or build? (optional)
                    </label>
                    <textarea
                      id="ev-reg-goals"
                      rows={2}
                      value={learningGoals}
                      onChange={(e) => setLearningGoals(e.target.value)}
                      placeholder="Share questions or topics you want the speaker to cover..."
                      className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#0a192f]"
                    />
                  </div>

                  {selectedEvent.price > 0 && (
                    <div className="p-3.5 rounded-lg bg-white border border-slate-300 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span>Ticket Fee (Paystack or GTB Transfer)</span>
                        <span className="text-sm tabular-nums">{formatNaira(selectedEvent.price)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTicketPayMethod('paystack')}
                          className={`py-2 px-3 text-xs font-bold rounded border inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            ticketPayMethod === 'paystack'
                              ? 'bg-[#0a192f] text-[#f5c451] border-[#0a192f]'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Paystack Instant</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTicketPayMethod('gtb_whatsapp')}
                          className={`py-2 px-3 text-xs font-bold rounded border inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            ticketPayMethod === 'gtb_whatsapp'
                              ? 'bg-[#0a192f] text-[#f5c451] border-[#0a192f]'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <Landmark className="w-3.5 h-3.5" />
                          <span>GTB Transfer</span>
                        </button>
                      </div>
                      {ticketPayMethod === 'paystack' && (
                        <PaystackChannelPicker
                          selectedOption={paystackOption}
                          onSelect={setPaystackOption}
                          paystackConfigured={publicServerConfig.paystackConfigured}
                        />
                      )}
                      {ticketPayMethod === 'gtb_whatsapp' && (
                        <div className="space-y-1.5 text-xs bg-[#0a192f] text-white p-3 rounded">
                          <p className="font-mono text-[#f5c451] font-bold">
                            {TINTOL_PAYMENT_DETAILS.bankName} · {TINTOL_PAYMENT_DETAILS.accountNumber} ·{' '}
                            {TINTOL_PAYMENT_DETAILS.accountName}
                          </p>
                          <input
                            type="text"
                            value={gtbReference}
                            onChange={(e) => setGtbReference(e.target.value)}
                            placeholder="Enter GTB sender name or transfer ref"
                            className="w-full h-8 px-2.5 text-xs bg-[#112240] border border-[#263d66] rounded text-white placeholder:text-slate-400"
                          />
                        </div>
                      )}
                      {formErrors.payment && (
                        <p className="text-xs text-rose-700 font-semibold">{formErrors.payment}</p>
                      )}
                    </div>
                  )}

                  {/* Newsletter Consent Toggle */}
                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer bg-white border border-slate-200 rounded-md p-3">
                    <input
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={(e) => setNewsletterOptIn(e.target.checked)}
                      className="mt-0.5 accent-[#0a192f]"
                    />
                    <span>
                      <strong>Newsletter Consent:</strong> Yes, send me upcoming workshop
                      invitations, free engineering playbooks, and pre-event reminders (unsubscribe
                      anytime).
                    </span>
                  </label>

                  {(formErrors.capacity || formErrors.general) && (
                    <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5">
                      {formErrors.capacity || formErrors.general}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {submitting
                      ? 'Confirming Seat & Preparing Materials...'
                      : selectedEvent.price === 0
                      ? 'Confirm Free Registration & Get Materials'
                      : ticketPayMethod === 'paystack'
                      ? `Pay ${formatNaira(selectedEvent.price)} via Paystack & Register`
                      : `Submit GTB Transfer & Reserve Seat`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
