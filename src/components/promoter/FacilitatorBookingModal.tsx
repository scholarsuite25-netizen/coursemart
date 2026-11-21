import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type {
  FacilitatorBooking,
  FacilitatorBookingInput,
  FacilitatorLocationType,
  FacilitatorScope,
} from '../../types/promoter';

export interface FacilitatorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

const SCOPE_OPTIONS: FacilitatorScope[] = [
  'Keynote',
  'Corporate Masterclass',
  'Workshop',
  'Executive Panel',
  'Bootcamp',
];

const LOCATION_OPTIONS: FacilitatorLocationType[] = ['Physical', 'Virtual', 'Hybrid'];

const DEFAULT_FORM: FacilitatorBookingInput = {
  name: '',
  organization: '',
  email: '',
  phone: '',
  eventTitle: '',
  date: '',
  venue: '',
  locationType: 'Physical',
  scope: 'Keynote',
  audienceSize: '',
  objectives: '',
};

export function FacilitatorBookingModal({
  isOpen,
  onClose,
  initialDate,
}: FacilitatorBookingModalProps) {
  const { isFacilitatorDateFree, submitFacilitatorBooking } = useStore();

  const [formData, setFormData] = useState<FacilitatorBookingInput>({
    ...DEFAULT_FORM,
    date: initialDate || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submittedBooking, setSubmittedBooking] = useState<{
    booking: FacilitatorBooking;
    whatsappUrl: string;
  } | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync initialDate when changed
  useEffect(() => {
    if (initialDate) {
      setFormData((prev) => ({ ...prev, date: initialDate }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.date;
        return next;
      });
    }
  }, [initialDate]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      setSubmittedBooking(null);
      setGeneralError(null);
      setErrors({});
      setTouched({});
      if (initialDate) {
        setFormData((prev) => ({ ...prev, date: initialDate }));
      }
    }
  }, [isOpen, initialDate]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Validate a single field
  const validateField = (
    field: keyof FacilitatorBookingInput,
    value: any
  ): string | undefined => {
    const strVal = typeof value === 'string' ? value.trim() : String(value || '').trim();

    switch (field) {
      case 'name':
        if (!strVal) return 'Full Name is required.';
        if (strVal.length < 2) return 'Please enter your full name.';
        break;

      case 'organization':
        if (!strVal) return 'Organization or Institution is required.';
        break;

      case 'email':
        if (!strVal) return 'Official Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
          return 'Please enter a valid email address.';
        }
        break;

      case 'phone':
        if (!strVal) return 'Phone / WhatsApp number is required.';
        const digits = strVal.replace(/\D/g, '');
        if (digits.length < 7) {
          return 'Please enter a valid phone number (at least 7 digits).';
        }
        break;

      case 'eventTitle':
        if (!strVal) return 'Event or Session Title is required.';
        break;

      case 'date':
        if (!strVal) return 'Event Date is required.';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(strVal)) {
          return 'Date must follow YYYY-MM-DD format.';
        }
        const todayIso = new Date().toISOString().slice(0, 10);
        if (strVal < todayIso) {
          return 'Selected date cannot be in the past.';
        }
        if (!isFacilitatorDateFree(strVal)) {
          return 'This date is already committed for another engagement. Please choose an open date from the calendar.';
        }
        break;

      case 'venue':
        if (!strVal) return 'Venue Address or Platform Link is required.';
        break;

      case 'locationType':
        if (!strVal || !['Physical', 'Virtual', 'Hybrid'].includes(strVal)) {
          return 'Please select a valid location format.';
        }
        break;

      case 'scope':
        if (!strVal || !SCOPE_OPTIONS.includes(strVal as FacilitatorScope)) {
          return 'Please select a valid engagement scope.';
        }
        break;

      case 'audienceSize':
        if (!strVal) return 'Expected audience size is required.';
        const num = Number(strVal);
        if (isNaN(num) || num <= 0) {
          return 'Audience size must be a positive number.';
        }
        break;

      case 'objectives':
        if (!strVal) return 'Event objectives and key focus areas are required.';
        if (strVal.length < 15) {
          return 'Please provide more details on event goals (min 15 characters).';
        }
        break;
    }
    return undefined;
  };

  const handleChange = (
    field: keyof FacilitatorBookingInput,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const errorMsg = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (errorMsg) next[field] = errorMsg;
        else delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof FacilitatorBookingInput) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) next[field] = errorMsg;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validate all 11 fields
    const newErrors: Record<string, string> = {};
    const fieldsToValidate: (keyof FacilitatorBookingInput)[] = [
      'name',
      'organization',
      'email',
      'phone',
      'eventTitle',
      'date',
      'venue',
      'locationType',
      'scope',
      'audienceSize',
      'objectives',
    ];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Mark all as touched so errors highlight
      const allTouched: Record<string, boolean> = {};
      fieldsToValidate.forEach((f) => (allTouched[f] = true));
      setTouched(allTouched);
      setGeneralError('Please resolve all validation errors in the form before submitting.');
      return;
    }

    // Call submitFacilitatorBooking
    const result = submitFacilitatorBooking({
      ...formData,
      phoneWhatsApp: formData.phone,
    });

    if (result.success && result.booking) {
      setSubmittedBooking({
        booking: result.booking,
        whatsappUrl: result.whatsappUrl,
      });
    } else {
      setGeneralError(result.error || 'Failed to submit invitation. Please check your details.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-scale-in">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="booking-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white"
              >
                {submittedBooking
                  ? 'Facilitator Invitation Confirmed'
                  : 'Invite Me as Your Resource Person or Facilitator'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {submittedBooking
                  ? 'Your invitation reference code and notification dispatch'
                  : 'Submit event parameters for S. B. OMOTOSO (FCIA, MILR, MSc, MNIM)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 max-h-[75vh] overflow-y-auto">
          {submittedBooking ? (
            /* Confirmation View */
            <div className="space-y-6 animate-fade-in">
              <div className="text-center p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                  Invitation Successfully Recorded!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  Official Booking Reference:
                </p>
                <div className="inline-block mt-2 px-4 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider shadow-sm">
                  {submittedBooking.booking.reference}
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 text-sm">
                <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  Engagement Overview
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Event Title:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {submittedBooking.booking.eventTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Organization:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {submittedBooking.booking.organization}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Date:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {submittedBooking.booking.date}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Format & Scope:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {submittedBooking.booking.scope} ({submittedBooking.booking.locationType})
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Notice */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs sm:text-sm leading-relaxed">
                <p>
                  A copy has been recorded in the platform database. You may also follow up
                  directly at{' '}
                  <strong className="font-semibold">+2348034710699</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <a
                  href={submittedBooking.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all text-center"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Structured WhatsApp Notification to Promoter</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-75" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('appointments-roster');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  View in Appointments Table
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedBooking(null);
                    setFormData({ ...DEFAULT_FORM, date: initialDate || '' });
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Book Another Engagement
                </button>
              </div>
            </div>
          ) : (
            /* 11-Field Invitation Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {generalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Row 1: Name & Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    1. Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="e.g. Prof. Babatunde Adeleke"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.name && touched.name
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    2. Organization / Institution <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
                      onBlur={() => handleBlur('organization')}
                      placeholder="e.g. Dominion University / Chrisland University"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.organization && touched.organization
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.organization && touched.organization && (
                    <p className="mt-1 text-xs text-rose-500">{errors.organization}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    3. Official Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="e.g. registry@institution.edu.ng"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.email && touched.email
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    4. Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="e.g. +234 802 345 6789"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.phone && touched.phone
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 3: Event Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  5. Event / Session Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.eventTitle}
                    onChange={(e) => handleChange('eventTitle', e.target.value)}
                    onBlur={() => handleBlur('eventTitle')}
                    placeholder="e.g. University Senate AI Governance Retreat & Registry Modernization"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                      errors.eventTitle && touched.eventTitle
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.eventTitle && touched.eventTitle && (
                  <p className="mt-1 text-xs text-rose-500">{errors.eventTitle}</p>
                )}
              </div>

              {/* Row 4: Event Date & Location Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    6. Event Date (YYYY-MM-DD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      onBlur={() => handleBlur('date')}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.date && touched.date
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.date && touched.date && (
                    <p className="mt-1 text-xs text-rose-500">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    8. Location Format <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.locationType}
                    onChange={(e) =>
                      handleChange('locationType', e.target.value as FacilitatorLocationType)
                    }
                    onBlur={() => handleBlur('locationType')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors focus:border-emerald-500"
                  >
                    {LOCATION_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Venue Address / Platform Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  7. Venue Address / Platform Link <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => handleChange('venue', e.target.value)}
                    onBlur={() => handleBlur('venue')}
                    placeholder="e.g. Senate Chambers, Main Campus / Zoom / Google Meet Link"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                      errors.venue && touched.venue
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.venue && touched.venue && (
                  <p className="mt-1 text-xs text-rose-500">{errors.venue}</p>
                )}
              </div>

              {/* Row 6: Engagement Scope & Audience Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    9. Engagement Scope <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) =>
                      handleChange('scope', e.target.value as FacilitatorScope)
                    }
                    onBlur={() => handleBlur('scope')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors focus:border-emerald-500"
                  >
                    {SCOPE_OPTIONS.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    10. Expected Audience Size <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      value={formData.audienceSize}
                      onChange={(e) => handleChange('audienceSize', e.target.value)}
                      onBlur={() => handleBlur('audienceSize')}
                      placeholder="e.g. 150"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                        errors.audienceSize && touched.audienceSize
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                  {errors.audienceSize && touched.audienceSize && (
                    <p className="mt-1 text-xs text-rose-500">{errors.audienceSize}</p>
                  )}
                </div>
              </div>

              {/* Row 7: Objectives & Key Focus Areas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  11. Event Objectives & Key Focus Areas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.objectives}
                  onChange={(e) => handleChange('objectives', e.target.value)}
                  onBlur={() => handleBlur('objectives')}
                  placeholder="Outline the session objectives, desired learning outcomes, and key audience expectations..."
                  className={`w-full p-3.5 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 transition-colors ${
                    errors.objectives && touched.objectives
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                />
                {errors.objectives && touched.objectives && (
                  <p className="mt-1 text-xs text-rose-500">{errors.objectives}</p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Facilitator Invitation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
