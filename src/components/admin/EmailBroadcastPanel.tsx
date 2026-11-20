import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Mail, Send, Users } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { EmailBroadcastAudience, EmailBroadcastCampaign } from '../../types/marketplace';
import { resolveBroadcastRecipients } from '../../utils/automation';
import { escapeHtml } from '../../utils/sanitize';

export function EmailBroadcastPanel() {
  const {
    users,
    events,
    eventRegistrations,
    blogPosts,
    emailCampaigns,
    addEmailCampaign,
    publicServerConfig,
  } = useStore();

  const [audience, setAudience] = useState<EmailBroadcastAudience>('newsletter_opted_in');
  const [eventIdFilter, setEventIdFilter] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [bodyText, setBodyText] = useState(
    'Hello Builder,\n\nWe have new training releases, engineering playbooks, and upcoming live workshops waiting inside Coursemart.\n\nExplore the latest release today.'
  );
  const [sending, setSending] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const recipients = useMemo(
    () =>
      resolveBroadcastRecipients(
        audience,
        users,
        eventRegistrations,
        eventIdFilter || undefined
      ),
    [audience, users, eventRegistrations, eventIdFilter]
  );

  const handleInsertBlog = (blogId: string) => {
    const post = blogPosts.find((p) => p.id === blogId);
    if (!post) return;
    setSubject(post.title);
    setPreheader(post.excerpt);
    setBodyText(
      `New Coursemart Guide: ${post.title}\n\n${post.excerpt}\n\nRead the full article at /blog/${post.slug}`
    );
  };

  const handleInsertEvent = (evId: string) => {
    const ev = events.find((e) => e.id === evId);
    if (!ev) return;
    setSubject(`Live Invite: ${ev.title}`);
    setPreheader(ev.subtitle);
    setBodyText(
      `Join our upcoming ${ev.format}: ${ev.title}\n\nWhen: ${new Date(
        ev.startAt
      ).toLocaleString()} (${ev.timezone})\nHost: ${ev.speakerName}\n\n${ev.subtitle}\n\nReserve your seat & download pre-event materials at /events.`
    );
  };

  const handleSaveOrSend = async (mode: 'draft' | 'send') => {
    setStatusFeedback(null);
    if (subject.trim().length < 3) {
      setStatusFeedback({ type: 'error', text: 'Enter an email subject line (min 3 characters).' });
      return;
    }

    const safeSubjectHtml = escapeHtml(subject.trim());
    const safeParagraphsHtml = bodyText
      .split('\n\n')
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;line-height:1.6;">
      <div style="background:#0a192f;color:#ffffff;padding:20px;border-bottom:4px solid #d4af37;">
        <h2 style="margin:0;">${safeSubjectHtml}</h2>
      </div>
      <div style="padding:20px;">
        ${safeParagraphsHtml}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
        <p style="font-size:12px;color:#64748b;">You received this message because you opted in on Coursemart.</p>
      </div>
    </div>`;

    if (mode === 'draft') {
      const draft: EmailBroadcastCampaign = {
        id: `camp-${Date.now()}`,
        subject: subject.trim(),
        preheader: preheader.trim(),
        bodyHtml,
        audience,
        eventIdFilter: eventIdFilter || undefined,
        recipientCount: recipients.length,
        provider: 'draft_only',
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      addEmailCampaign(draft);
      setStatusFeedback({ type: 'info', text: 'Saved broadcast campaign draft.' });
      return;
    }

    if (recipients.length === 0) {
      setStatusFeedback({
        type: 'error',
        text: 'No opted-in recipients found for the selected audience.',
      });
      return;
    }

    setSending(true);
    try {
      const resp = await fetch('/api/email/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: subject.trim(),
          html: bodyHtml,
          preferredProvider: selectedProvider || undefined,
        }),
      });
      const json = (await resp.json()) as {
        ok?: boolean;
        provider?: 'emailbump' | 'resend' | 'brevo' | 'none';
        sentCount?: number;
        error?: string;
      };

      const campaign: EmailBroadcastCampaign = {
        id: `camp-${Date.now()}`,
        subject: subject.trim(),
        preheader: preheader.trim(),
        bodyHtml,
        audience,
        eventIdFilter: eventIdFilter || undefined,
        recipientCount: resp.ok && json.ok ? json.sentCount ?? recipients.length : recipients.length,
        provider: json.provider && json.provider !== 'none' ? json.provider : 'draft_only',
        status: resp.ok && json.ok ? 'sent' : 'failed',
        errorMessage: json.error,
        createdAt: new Date().toISOString(),
        sentAt: resp.ok && json.ok ? new Date().toISOString() : undefined,
      };
      addEmailCampaign(campaign);

      if (resp.ok && json.ok) {
        setStatusFeedback({
          type: 'success',
          text: `Live broadcast sent to ${campaign.recipientCount} opted-in recipient(s) via ${json.provider?.toUpperCase()}.`,
        });
        setSubject('');
        setPreheader('');
      } else {
        setStatusFeedback({
          type: 'error',
          text:
            json.error ||
            'Configure EMAILBUMP_API_KEY, RESEND_API_KEY, or BREVO_API_KEY in .env to send live emails.',
        });
      }
    } catch {
      setStatusFeedback({
        type: 'error',
        text: 'Failed to reach email broadcast endpoint.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Email Broadcast Studio & Opt-In Subscribers
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Send newsletters and pre-event alerts exclusively to opted-in members & registrants via
            EmailBump, Resend, or Brevo.
          </p>
        </div>

        <span
          className={`px-3 py-1.5 text-xs font-bold rounded-sm border ${
            publicServerConfig.emailProvider === 'none'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
          }`}
        >
          ESP Status:{' '}
          {publicServerConfig.emailProvider === 'none'
            ? 'API Key Not Configured (Draft / Preview Mode)'
            : `${publicServerConfig.emailProvider.toUpperCase()} Live Connected`}
        </span>
      </div>

      {publicServerConfig.emailProvider === 'none' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-950 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Self-Configured ESP Required for Live Delivery</p>
            <p>
              To send live inbox emails, add{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                EMAILBUMP_API_KEY
              </code>{' '}
              (EmailBump REST v1),{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                RESEND_API_KEY
              </code>{' '}
              (free 3,000/mo), or{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                BREVO_API_KEY
              </code>{' '}
              (free 300/day) plus{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
                EMAIL_FROM
              </code>{' '}
              in your environment variables / Vercel dashboard. Drafts & opted-in subscriber
              filtering work immediately.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer */}
        <section className="lg:col-span-7 bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <h2 className="font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#2271b1]" />
              <span>Compose Broadcast</span>
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                aria-label="Insert content from blog post"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleInsertBlog(e.target.value);
                }}
                className="h-7 px-2 border border-[#8c8f94] rounded-sm bg-white"
              >
                <option value="">Insert from Blog...</option>
                {blogPosts
                  .filter((b) => b.status === 'published')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title.slice(0, 40)}
                    </option>
                  ))}
              </select>
              <select
                aria-label="Insert content from event"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleInsertEvent(e.target.value);
                }}
                className="h-7 px-2 border border-[#8c8f94] rounded-sm bg-white"
              >
                <option value="">Insert from Event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor="email-audience" className="block font-bold text-slate-700 mb-1">
                Recipient Audience (Consent-Safe)
              </label>
              <select
                id="email-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as EmailBroadcastAudience)}
                className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm bg-white"
              >
                <option value="newsletter_opted_in">Opted-In Newsletter Subscribers</option>
                <option value="event_registrants">Event Registrants (Transactional / Prep)</option>
              </select>
            </div>
            {audience === 'event_registrants' && (
              <div>
                <label htmlFor="email-event-filter" className="block font-bold text-slate-700 mb-1">
                  Filter by Specific Event
                </label>
                <select
                  id="email-event-filter"
                  value={eventIdFilter}
                  onChange={(e) => setEventIdFilter(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm bg-white"
                >
                  <option value="">All Events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(publicServerConfig.emailProvidersConfigured?.length ?? 0) > 1 && (
              <div>
                <label htmlFor="email-provider-select" className="block font-bold text-slate-700 mb-1">
                  Active Email Provider
                </label>
                <select
                  id="email-provider-select"
                  value={selectedProvider || publicServerConfig.emailProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm bg-white"
                >
                  {publicServerConfig.emailProvidersConfigured?.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-xs">
            <label htmlFor="email-subject" className="block font-bold text-slate-700 mb-1">
              Email Subject *
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Pre-Event Preparation Kit + New Vibe Coding Playbook"
              className="w-full h-9 px-3 border border-[#8c8f94] rounded-sm"
            />
          </div>

          <div className="text-xs">
            <label htmlFor="email-body" className="block font-bold text-slate-700 mb-1">
              Message Content
            </label>
            <textarea
              id="email-body"
              rows={6}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full p-3 border border-[#8c8f94] rounded-sm"
            />
          </div>

          {statusFeedback && (
            <div
              className={`p-3 rounded-sm text-xs font-medium flex items-center gap-2 ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : statusFeedback.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusFeedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-600 tabular-nums">
              Matched Recipients: <strong>{recipients.length}</strong> opted-in contact(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveOrSend('draft')}
                className="px-4 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => handleSaveOrSend('send')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Dispatching...' : 'Send Broadcast Now'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Opted-In Subscriber List + Campaign History */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2271b1]" />
                <span>Matched Recipients ({recipients.length})</span>
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {recipients.length === 0 ? (
                <p className="p-4 text-slate-500">No opted-in recipients in this filter.</p>
              ) : (
                recipients.map((rec) => (
                  <div key={rec.email} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{rec.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{rec.email}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white border border-[#c3c4c7] rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#c3c4c7] font-display text-sm font-bold text-[#1d2327]">
              Campaign Log ({emailCampaigns.length})
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {emailCampaigns.map((camp) => (
                <div key={camp.id} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 truncate">{camp.subject}</p>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm shrink-0 ${
                        camp.status === 'sent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : camp.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {camp.recipientCount} recipients · Provider: {camp.provider.toUpperCase()}
                  </p>
                  {camp.errorMessage && (
                    <p className="text-[11px] text-rose-700">{camp.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
