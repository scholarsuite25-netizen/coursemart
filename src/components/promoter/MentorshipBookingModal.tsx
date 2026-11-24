import React, { useState } from 'react';
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, MessageSquare, Phone, Send, Sparkles, User, Users, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export interface MentorshipBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

const DEFAULT_SERVICE = 'Taster Mentorship Session (30 min)';
const DEFAULT_PRICE_NGN = 9500;

export const MENTORSHIP_SERVICES: Array<{ title: string; priceNgn: number }> = [
  { title: 'Taster Mentorship Session (30 min)', priceNgn: 9500 },
  { title: 'Deep Dive Mentorship (60 min)', priceNgn: 24900 },
  { title: 'Program Guided Session (90 min)', priceNgn: 34900 },
  { title: 'Pathway Planning Consult (45 min)', priceNgn: 17500 },
];

export function MentorshipBookingModal({ isOpen, onClose, onBooked }: MentorshipBookingModalProps) {
  const { currentUser, createForumThread, showToast, navigate } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const service = MENTORSHIP_SERVICES.find((s) => s.title === DEFAULT_SERVICE) || MENTORSHIP_SERVICES[0];
  const canSubmit =
    isSubmitting === false && !!name.trim() && !!email.trim() && !!topic.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError('Please sign in to book a mentorship session.');
      return;
    }

    const subject = `Mentorship enquiry — ${name.trim() || currentUser.name}`.slice(0, 120);
    const body = [
      `Mentorship enquiry: ${topic.trim()}`,
      '',
      `Service: ${service.title} (₦${service.priceNgn.toLocaleString('en-US')})`,
      sessionDate ? `Preferred session date: ${sessionDate}` : 'Preferred session date: TBD',
      `Booked by: ${name.trim()} <${email.trim()}>`,
      phone.trim() ? `Phone: ${phone.trim()}` : null,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    setIsSubmitting(true);
    const result = createForumThread({
      title: subject,
      body,
      category: 'Services & Mentorship',
      tags: ['mentorship', 'coaching', 'session', 'booking'],
    });

    setIsSubmitting(false);
    if (!result.ok || !result.thread) {
      setError(result.error || 'Unable to book mentorship session.');
      return;
    }

    showToast(`Mentorship booking enquiry sent for "${result.thread.title}"`);
    setName('');
    setEmail('');
    setPhone('');
    setTopic('');
    setSessionDate('');
    setNotes('');
    onBooked?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1526]/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#f5c451]" />
            <h3 className="text-base font-bold text-white">Book a Mentorship Session</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Request a personalized mentorship session with the platform promoter. Our mentors are
            the same experts driving platforms, courses, and masterclasses across DWC. Your enquiry
            goes directly to the mentor — they typically respond within 24–48 hours.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Service
              </label>
              <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200">
                {service.title} — <span className="text-[#f5c451] font-bold">₦{service.priceNgn.toLocaleString('en-US')}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
                className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@dwc.com"
                required
                className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Phone (optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 803 123 4567"
                className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                What would you like help with? *
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="I want to build a personal brand and need a roadmap..."
                rows={3}
                required
                className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Preferred Session Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the mentor should know (interests, goals, timelines)..."
                rows={2}
                className="w-full px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451] resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 bg-[#0a192f] hover:bg-[#162a4d] disabled:opacity-40 text-[#f5c451] text-xs font-bold rounded-lg shadow-lg shadow-[#0a192f]/20 cursor-pointer"
            >
              Send Booking Enquiry
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            Bookings are confirmed by the promoter via their reply. Your details stay private to the
            promoter — never share credit cards or passwords here.
          </p>
        </div>
      </div>
    </div>
  );
}
