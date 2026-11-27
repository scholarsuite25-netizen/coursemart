import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { SocialPlatform, SocialPostDraft } from '../../types/marketplace';
import {
  buildDeterministicSocialDrafts,
  buildPlatformShareIntentUrl,
} from '../../utils/automation';

const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; badgeClass: string; helper: string }
> = {
  linkedin: {
    label: 'LinkedIn Post',
    badgeClass: 'bg-sky-100 text-sky-900',
    helper: 'Editorial post for LinkedIn Company / Personal Feed',
  },
  x: {
    label: 'X / Twitter Post',
    badgeClass: 'bg-slate-900 text-white',
    helper: 'Concise thread opener (<= 240 chars)',
  },
  whatsapp_group: {
    label: 'Manual WhatsApp Group Copy',
    badgeClass: 'bg-emerald-100 text-emerald-900',
    helper: 'Safe human copy-paste message (zero automated blasting)',
  },
  facebook: {
    label: 'Facebook Post',
    badgeClass: 'bg-blue-100 text-blue-900',
    helper: 'Page feed post via Meta Graph API',
  },
  instagram: {
    label: 'Instagram Media',
    badgeClass: 'bg-pink-100 text-pink-900',
    helper: 'Media post via Instagram Graph API',
  },
  youtube: {
    label: 'YouTube Video Meta',
    badgeClass: 'bg-red-100 text-red-900',
    helper: 'Video upload metadata and chapters',
  },
};

export function SocialQueuePanel() {
  const {
    blogPosts,
    products,
    events,
    socialDrafts,
    addSocialDrafts,
    updateSocialDraft,
    approveAndScheduleSocialDraft,
    deleteSocialDraft,
    showToast,
  } = useStore();

  const [sourceType, setSourceType] = useState<'blog' | 'product' | 'event'>('blog');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(blogPosts[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'posted'>('all');
  const [generating, setGenerating] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const sourceOptions =
    sourceType === 'blog'
      ? blogPosts.map((b) => ({
          id: b.id,
          title: b.title,
          summary: b.excerpt,
          targetPath: `/blog/${b.slug}`,
          category: b.category,
        }))
      : sourceType === 'product'
      ? products.map((p) => ({
          id: p.id,
          title: p.title,
          summary: p.subtitle,
          targetPath: `/product/${p.slug}`,
          category: p.category,
        }))
      : events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          summary: ev.subtitle,
          targetPath: '/events',
          category: ev.category,
        }));

  const currentSource =
    sourceOptions.find((o) => o.id === selectedSourceId) ?? sourceOptions[0] ?? null;

  const handleGenerateDrafts = async () => {
    if (!currentSource || generating) return;
    setGenerating(true);
    const nowIso = new Date().toISOString();

    try {
      const resp = await fetch('/api/gemini/social-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceTitle: currentSource.title,
          summary: currentSource.summary,
          targetPath: currentSource.targetPath,
          category: currentSource.category,
        }),
      });

      if (resp.ok) {
        const json = (await resp.json()) as {
          drafts?: {
            linkedin: string;
            x: string;
            whatsapp_group: string;
            hashtags: string[];
          };
        };
        if (json.drafts) {
          const generated: SocialPostDraft[] = [
            {
              id: `soc-${Date.now()}-li`,
              sourceType,
              sourceId: currentSource.id,
              sourceTitle: currentSource.title,
              platform: 'linkedin',
              content: json.drafts.linkedin,
              hashtags: json.drafts.hashtags ?? [],
              status: 'draft',
              generatedBy: 'gemini',
              createdAt: nowIso,
              updatedAt: nowIso,
            },
            {
              id: `soc-${Date.now()}-x`,
              sourceType,
              sourceId: currentSource.id,
              sourceTitle: currentSource.title,
              platform: 'x',
              content: json.drafts.x,
              hashtags: json.drafts.hashtags ?? [],
              status: 'draft',
              generatedBy: 'gemini',
              createdAt: nowIso,
              updatedAt: nowIso,
            },
            {
              id: `soc-${Date.now()}-wa`,
              sourceType,
              sourceId: currentSource.id,
              sourceTitle: currentSource.title,
              platform: 'whatsapp_group',
              content: json.drafts.whatsapp_group,
              hashtags: [],
              status: 'draft',
              generatedBy: 'gemini',
              createdAt: nowIso,
              updatedAt: nowIso,
            },
          ];
          addSocialDrafts(generated);
          setGenerating(false);
          return;
        }
      }
    } catch {
      // Fall back transparently to structured templates below
    }

    const fallbackTemplates = buildDeterministicSocialDrafts({
      sourceType,
      sourceId: currentSource.id,
      sourceTitle: currentSource.title,
      summary: currentSource.summary,
      targetPath: currentSource.targetPath,
      category: currentSource.category,
    });

    addSocialDrafts(
      fallbackTemplates.map((t, idx) => ({
        ...t,
        id: `soc-${Date.now()}-${idx}`,
        status: 'draft',
        createdAt: nowIso,
        updatedAt: nowIso,
      }))
    );
    setGenerating(false);
  };

  const handleDispatchDue = async () => {
    if (dispatching) return;
    setDispatching(true);
    try {
      const resp = await fetch('/api/automation/social-dispatch', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const json = (await resp.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        due?: number;
        dispatched?: number;
        failed?: number;
        skipped?: number;
        reason?: string;
      } | null;

      if (!resp.ok || !json?.ok) {
        showToast(json?.error || 'Social dispatch failed');
        return;
      }

      // Reflect server-side status changes (scheduled -> posted) in the UI.
      try {
        const draftsResp = await fetch('/api/store/social_drafts', {
          credentials: 'same-origin',
        });
        if (draftsResp.ok) {
          const draftsJson = (await draftsResp.json()) as { value?: unknown };
          const serverDrafts = Array.isArray(draftsJson.value)
            ? (draftsJson.value as SocialPostDraft[])
            : [];
          for (const serverDraft of serverDrafts) {
            const localDraft = socialDrafts.find((d) => d.id === serverDraft.id);
            if (localDraft && localDraft.status !== serverDraft.status) {
              updateSocialDraft(serverDraft);
            }
          }
        }
      } catch {
        // Status refresh is best-effort; dispatch already succeeded.
      }

      if ((json.dispatched ?? 0) > 0) {
        showToast(`Dispatched ${json.dispatched} scheduled post(s)`);
      } else if ((json.due ?? 0) === 0) {
        showToast('No scheduled posts are due yet');
      } else {
        showToast(json.reason || 'Scheduled posts remain queued');
      }
    } catch {
      showToast('Network error dispatching social posts');
    } finally {
      setDispatching(false);
    }
  };

  const visibleDrafts = socialDrafts.filter((d) =>
    statusFilter === 'all' ? true : d.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Social Distribution Queue (Draft + 1-Click Approve & Schedule)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generate LinkedIn, X, and manual WhatsApp Group announcements using free-tier Gemini
            (gemini-4-hydrogen). Every post requires your human review before scheduling or manual
            sharing — protecting your accounts & WhatsApp number.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDispatchDue}
          disabled={dispatching}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm disabled:opacity-60 cursor-pointer"
        >
          {dispatching ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{dispatching ? 'Dispatching…' : 'Dispatch Due Posts'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-sm px-3 py-2">
        Due scheduled posts are dispatched by the daily maintenance cron through
        <code className="mx-1 font-mono text-slate-700">SOCIAL_DISPATCH_WEBHOOK_URL</code>.
        Without that webhook configured, approved posts stay scheduled here for manual copy/paste —
        nothing is auto-blasted to your accounts or WhatsApp groups.
      </p>

      {/* Draft Generator Bar */}
      <section className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-3">
        <h2 className="font-display text-sm font-bold text-[#1d2327] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#2271b1]" />
          <span>Generate Multi-Channel Social Drafts</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs">
          <div className="md:col-span-3">
            <label htmlFor="soc-source-type" className="block font-bold text-slate-700 mb-1">
              Content Source
            </label>
            <select
              id="soc-source-type"
              value={sourceType}
              onChange={(e) => {
                const nextType = e.target.value as 'blog' | 'product' | 'event';
                setSourceType(nextType);
                setSelectedSourceId('');
              }}
              className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm bg-white"
            >
              <option value="blog">Blog Article</option>
              <option value="event">Live Event / Workshop</option>
              <option value="product">Course / Digital Product</option>
            </select>
          </div>
          <div className="md:col-span-6">
            <label htmlFor="soc-source-item" className="block font-bold text-slate-700 mb-1">
              Select Item to Promote
            </label>
            <select
              id="soc-source-item"
              value={currentSource?.id || ''}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full h-9 px-2.5 border border-[#8c8f94] rounded-sm bg-white"
            >
              {sourceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <button
              type="button"
              disabled={generating || !currentSource}
              onClick={handleGenerateDrafts}
              className="w-full h-9 px-4 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generating ? 'Drafting...' : 'Generate 3 Drafts'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'draft', 'scheduled', 'posted'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-sm capitalize cursor-pointer ${
              statusFilter === st
                ? 'bg-[#2271b1] text-white'
                : 'bg-white text-slate-700 border border-[#c3c4c7] hover:bg-slate-50'
            }`}
          >
            {st} ({st === 'all' ? socialDrafts.length : socialDrafts.filter((d) => d.status === st).length})
          </button>
        ))}
      </div>

      {/* Draft Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleDrafts.map((draft) => {
          const meta = PLATFORM_META[draft.platform];
          const originUrl =
            typeof window !== 'undefined' ? window.location.origin : 'https://digitalwealthcreators.org.ng';
          const shareUrl = buildPlatformShareIntentUrl(
            draft.platform,
            draft.content,
            originUrl
          );

          return (
            <article
              key={draft.id}
              className="bg-white border border-[#c3c4c7] rounded-sm p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-sm ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm inline-flex items-center gap-1 ${
                      draft.status === 'scheduled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : draft.status === 'posted'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {draft.status === 'scheduled' ? (
                      <Clock className="w-3 h-3" />
                    ) : draft.status === 'posted' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : null}
                    {draft.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Source: <strong className="text-slate-800">{draft.sourceTitle}</strong> ·{' '}
                  {meta.helper}
                </p>

                <textarea
                  rows={5}
                  aria-label={`Edit ${meta.label} draft for ${draft.sourceTitle}`}
                  value={draft.content}
                  onChange={(e) => updateSocialDraft({ ...draft, content: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-[#2271b1]"
                />

                {draft.scheduledFor && draft.status === 'scheduled' && (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Approved & Scheduled for {new Date(draft.scheduledFor).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {draft.status !== 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => approveAndScheduleSocialDraft(draft.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-sm inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1-Click Approve & Schedule</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(draft.content).catch(() => {});
                      }
                      showToast('Copied post copy to clipboard');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-sm hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>

                  {shareUrl && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#2271b1] border border-sky-200 rounded-sm hover:bg-sky-50 inline-flex items-center gap-1"
                    >
                      {draft.platform === 'whatsapp_group' ? (
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {draft.platform === 'whatsapp_group' ? 'Open WhatsApp Share' : 'Post'}
                      </span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => deleteSocialDraft(draft.id)}
                  aria-label="Delete social draft"
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
