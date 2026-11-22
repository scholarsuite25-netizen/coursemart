import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { FacilitatorBooking } from '../../types/promoter';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export interface AppointmentsTableProps {
  title?: string;
  subtitle?: string;
  showAdminControls?: boolean;
}

export function AppointmentsTable({
  title = 'Facilitator Appointments & Booking Roster',
  subtitle = 'Live schedule of keynote invitations, corporate masterclasses, and executive consultations.',
  showAdminControls = false,
}: AppointmentsTableProps) {
  const {
    facilitatorBookings,
    calendarEngagements,
    isFacilitatorDateFree,
    setFacilitatorBookingStatus,
    deleteFacilitatorBooking,
    showToast,
    currentUser,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin' && showAdminControls === true;

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<FacilitatorBooking | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Copy reference code to clipboard
  const handleCopyRef = (refCode: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refCode);
      setCopiedRef(refCode);
      showToast(`Copied reference ${refCode} to clipboard!`);
      setTimeout(() => setCopiedRef(null), 2500);
    }
  };

  // Filtered bookings: strictly restrict public visitors to accepted/confirmed engagements only
  const filteredBookings = useMemo(() => {
    return facilitatorBookings.filter((b) => {
      // SECURITY & PRIVACY GUARDRAIL: Visitors only see accepted or confirmed engagements
      if (!isAdmin) {
        if (b.status !== 'accepted' && b.status !== 'confirmed') {
          return false;
        }
      } else {
        // Status filter for Administrator view
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'accepted'
            ? b.status === 'accepted' || b.status === 'confirmed'
            : b.status === statusFilter;

        if (!matchesStatus) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const refMatch = (b.reference || '').toLowerCase().includes(q);
      const nameMatch = (b.name || '').toLowerCase().includes(q);
      const orgMatch = (b.organization || '').toLowerCase().includes(q);
      const titleMatch = (b.eventTitle || '').toLowerCase().includes(q);
      const dateMatch = (b.date || '').toLowerCase().includes(q);
      const venueMatch = (b.venue || '').toLowerCase().includes(q);

      return refMatch || nameMatch || orgMatch || titleMatch || dateMatch || venueMatch;
    });
  }, [facilitatorBookings, statusFilter, searchQuery, isAdmin]);

  // Counts
  const counts = useMemo(() => {
    const total = facilitatorBookings.length;
    const pending = facilitatorBookings.filter((b) => b.status === 'pending').length;
    const accepted = facilitatorBookings.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    ).length;
    const declined = facilitatorBookings.filter((b) => b.status === 'declined').length;
    return { total, pending, accepted, declined };
  }, [facilitatorBookings]);

  // Handle Facilitator Toggle Action
  const handleToggleStatus = (
    booking: FacilitatorBooking,
    targetStatus: 'accepted' | 'declined' | 'pending'
  ) => {
    if (targetStatus === 'accepted') {
      const isFree = isFacilitatorDateFree(booking.date, booking.id);
      if (!isFree) {
        showToast(
          `Cannot accept: Date (${booking.date}) is not free in the first instance. It is already booked for another engagement.`
        );
        return;
      }
    }
    setFacilitatorBookingStatus(booking.id, targetStatus);
  };

  // Build WhatsApp Update Link to Applicant
  const buildStatusWhatsAppUrl = (booking: FacilitatorBooking, status: 'ACCEPTED' | 'DECLINED') => {
    const cleanPhone = (booking.phone || '').replace(/\D/g, '');
    const phoneTarget = cleanPhone.length >= 10 ? cleanPhone : '2348034710699';
    const message = [
      `*OFFICIAL FACILITATION APPOINTMENT UPDATE*`,
      `Reference: *${booking.reference}*`,
      `Event: *${booking.eventTitle}*`,
      `Proposed Date: *${booking.date}*`,
      `Applicant: *${booking.name}* (${booking.organization})`,
      `--------------------------------------`,
      `Status: *${status}* by Facilitator (S. B. OMOTOSO, FCIA, MILR)`,
      status === 'ACCEPTED'
        ? `Congratulations! Your invitation has been accepted and scheduled on the executive calendar.`
        : `Thank you for your inquiry. Regrettably, this date cannot be accommodated.`,
      `--------------------------------------`,
      `DIGITAL WEALTH CREATORS (DWC) Promoter Portal`,
    ].join('\n');

    return buildWhatsAppUrl(message, phoneTarget);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden my-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Status Count Pills (Admin) vs Public Confirmed Badge (Visitor) */}
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({counts.pending})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'accepted'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accepted ({counts.accepted})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('declined')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter === 'declined'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Declined ({counts.declined})</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmed Engagements ({counts.accepted})</span>
          </div>
        )}
      </div>

      {/* Date Availability Rule Banner (Admin) vs Official Schedule Notice (Visitor) */}
      {isAdmin ? (
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Strict Availability Protocol:</strong> An appointment <em>cannot be accepted</em> if
            the date is not free in the first instance. Accepting an appointment locks that date on the
            public Facilitator Calendar immediately.
          </span>
        </div>
      ) : (
        <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Official Engagement Roster:</strong> Displaying confirmed keynote addresses, corporate masterclasses, and executive training appointments.
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference code (e.g. FAC-2026-394B), convener name, institution, or event..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Appointments Table */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-400" />
          <p className="font-semibold text-sm">No appointment records found.</p>
          <p className="text-xs mt-1">
            {searchQuery
              ? `No bookings matched "${searchQuery}". Try a different keyword.`
              : 'Appointments submitted through the booking form will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                {isAdmin && <th className="py-3 px-4">Booking Ref</th>}
                <th className="py-3 px-4">Event Date</th>
                <th className="py-3 px-4">Event Title & Scope</th>
                <th className="py-3 px-4">{isAdmin ? 'Convener & Institution' : 'Host Institution'}</th>
                <th className="py-3 px-4">Format / Venue</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-right">Facilitator Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.map((b) => {
                const isAccepted = b.status === 'accepted' || b.status === 'confirmed';
                const isPending = b.status === 'pending';
                const isDeclined = b.status === 'declined';
                const dateFree = isFacilitatorDateFree(b.date, b.id);

                return (
                  <tr
                    key={b.id || b.reference}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* 1. Reference (Admin Only) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                            {b.reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyRef(b.reference)}
                            title="Copy reference"
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                          >
                            {copiedRef === b.reference ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                          {new Date(b.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </td>
                    )}

                    {/* 2. Event Date & Availability Check */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.date}</span>
                      </div>
                      <div className="mt-1">
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> Date Booked
                          </span>
                        ) : dateFree ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Date Free
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500"
                            title="Another engagement is already booked on this date"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            Date Occupied
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Event Title & Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {b.eventTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {b.scope}
                        </span>
                        {b.audienceSize && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            ~{b.audienceSize} attendees
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Convener & Organization (Contact info & private brief redacted for visitors) */}
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.organization}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {b.email && (
                              <a
                                href={`mailto:${b.email}`}
                                title={b.email}
                                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {b.phone && (
                              <a
                                href={`tel:${b.phone}`}
                                title={b.phone}
                                className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForDetails(b)}
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1 cursor-pointer"
                            >
                              View Brief
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{b.organization || 'Institutional Client'}</span>
                          </div>
                          {b.name && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                              Convened by {b.name}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 5. Format / Venue */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {b.locationType}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[140px]">
                        {b.venue}
                      </p>
                    </td>

                    {/* 6. Current Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accepted
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Declined
                        </span>
                      )}
                    </td>

                    {/* 7. Facilitator Action Controls (Admin Only) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Accept Action */}
                          {!isAccepted ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(b, 'accepted')}
                              disabled={!dateFree}
                              title={
                                !dateFree
                                  ? 'Date is already booked! Cannot accept in the first instance.'
                                  : 'Accept appointment and lock date on Facilitator Calendar'
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                dateFree
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          ) : (
                            <span
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg"
                              title="Appointment is accepted and date is committed"
                            >
                              Committed ✓
                            </span>
                          )}

                          {/* Decline Action */}
                          {!isDeclined && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(b, 'declined')}
                              title="Decline appointment and release date"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <span>Decline</span>
                            </button>
                          )}

                          {/* If Declined, allow reset to Pending */}
                          {isDeclined && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(b, 'pending')}
                              title="Reset status back to Pending"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <span>Reset</span>
                            </button>
                          )}

                          {/* WhatsApp Notify */}
                          <a
                            href={buildStatusWhatsAppUrl(b, isAccepted ? 'ACCEPTED' : 'DECLINED')}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Dispatch official WhatsApp status update"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove appointment ${b.reference}?`)) {
                                deleteFacilitatorBooking(b.id);
                              }
                            }}
                            title="Delete record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Appointment Detail Modal / Dossier (Admin Only) */}
      {isAdmin && selectedBookingForDetails && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {selectedBookingForDetails.reference}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedBookingForDetails.eventTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Proposed Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBookingForDetails.date}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Format & Scope:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBookingForDetails.scope} ({selectedBookingForDetails.locationType})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Convener:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBookingForDetails.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Institution:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedBookingForDetails.organization}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">
                  Venue / Meeting Stream:
                </span>
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200">
                  {selectedBookingForDetails.venue}
                </p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1">
                  Strategic Objectives & Requirements:
                </span>
                <p className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedBookingForDetails.objectives || 'No detailed objectives provided.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
