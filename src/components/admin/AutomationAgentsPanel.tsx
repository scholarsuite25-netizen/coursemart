import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  runBlogPublisherAgent,
  evaluateBestsellersAndBanners,
  detectResourceSharingAnomalies,
  buildBestsellerCoupon,
} from '../../utils/agentAutomation';

export interface AutomationLogEntry {
  id: string;
  agent: 'blog-publisher' | 'site-update' | 'security-scan' | 'enquiry' | 'maintenance';
  status: 'success' | 'warning' | 'info';
  title: string;
  details: string;
  timestamp: string;
}

const AGENT_LABELS: Record<AutomationLogEntry['agent'], string> = {
  'blog-publisher': 'Blog Publisher',
  'site-update': 'Site Update',
  'security-scan': 'Security Scan',
  enquiry: 'Enquiry Agent',
  maintenance: 'Daily Maintenance',
};

function formatLogTimestamp(value: string): string {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
}

export function AutomationAgentsPanel() {
  const {
    blogPosts,
    products,
    orders,
    coupons,
    appearance,
    updateAppearance,
    upsertBlogPost,
    upsertProduct,
    upsertCoupon,
    showToast,
  } = useStore();

  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      const resp = await fetch('/api/automation/logs', { credentials: 'same-origin' });
      if (resp.ok) {
        const json = (await resp.json()) as { logs?: AutomationLogEntry[] };
        setLogs(Array.isArray(json.logs) ? json.logs : []);
      }
    } catch {
      // Keep whatever is already displayed if the server is unreachable.
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const persistLog = useCallback(
    async (input: Omit<AutomationLogEntry, 'id' | 'timestamp'>) => {
      try {
        const resp = await fetch('/api/automation/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(input),
        });
        if (resp.ok) {
          const json = (await resp.json()) as { log?: AutomationLogEntry };
          if (json.log) {
            setLogs((prev) => [json.log as AutomationLogEntry, ...prev].slice(0, 500));
            return;
          }
        }
      } catch {
        // Fall through to an in-memory entry so the operator still sees the run.
      }
      setLogs((prev) => [
        {
          ...input,
          id: `log-local-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    []
  );

  const scheduledBlogsCount = blogPosts.filter((b) => b.status === 'scheduled').length;
  const bestsellerCount = products.filter((p) => p.bestseller).length;

  // 1. Manual Trigger: Blog Publisher
  const handleRunBlogPublisher = async () => {
    setRunningAgent('blog-publisher');
    try {
      const res = runBlogPublisherAgent(blogPosts, Date.now());
      res.updatedPosts.forEach((p) => upsertBlogPost(p));

      await persistLog({
        agent: 'blog-publisher',
        status: 'success',
        title: 'Blog Publisher Agent Executed',
        details: `Published ${res.publishedCount} scheduled blog post(s) past their release timestamp.`,
      });
      showToast(`Blog Publisher Agent: Published ${res.publishedCount} post(s)`);
    } catch {
      showToast('Failed to run Blog Publisher agent');
    } finally {
      setRunningAgent(null);
    }
  };

  // 2. Manual Trigger: Dynamic Site Updates
  const handleRunSiteUpdate = async () => {
    setRunningAgent('site-update');
    try {
      const res = evaluateBestsellersAndBanners(products, orders, { salesThreshold: 5 });
      res.updatedProducts.forEach((p) => upsertProduct(p));

      const hasBestsellers = res.bestsellerIds.length > 0;
      const needsCoupon =
        hasBestsellers &&
        Boolean(res.announcement.couponCode) &&
        !coupons.some((coupon) => coupon.code === 'BESTSELLER10');
      if (needsCoupon) {
        upsertCoupon(buildBestsellerCoupon());
      }

      updateAppearance({
        ...appearance,
        announcementEnabled: hasBestsellers,
        announcementText: hasBestsellers
          ? res.announcement.text
          : appearance.announcementText,
        announcementCoupon: hasBestsellers
          ? res.announcement.couponCode || appearance.announcementCoupon
          : appearance.announcementCoupon,
      });

      await persistLog({
        agent: 'site-update',
        status: 'success',
        title: 'Dynamic Site Updates Evaluated',
        details: `Updated ${res.bestsellerIds.length} bestseller badge(s) from completed-order sales and synced the storefront announcement bar.${
          needsCoupon ? ' Activated BESTSELLER10.' : ''
        }`,
      });
      showToast(`Site Updates: ${res.bestsellerIds.length} bestsellers identified`);
    } catch {
      showToast('Failed to evaluate site updates');
    } finally {
      setRunningAgent(null);
    }
  };

  // 3. Manual Trigger: Security Scan (real download telemetry)
  const handleRunSecurityScan = async () => {
    setRunningAgent('security-scan');
    try {
      let scannedCount = 0;
      let flaggedUserIds: string[] = [];
      let anomalyCount = 0;
      let incidentsCreated = 0;
      let source: 'store' | 'request' | 'offline' = 'store';

      try {
        const resp = await fetch('/api/agents/security-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ windowMinutes: 60 }),
        });
        if (resp.ok) {
          const json = (await resp.json()) as {
            scannedCount?: number;
            flaggedUserIds?: string[];
            anomalies?: Array<{ reason: string }>;
            incidentsCreated?: number;
            logsSource?: 'store' | 'request';
          };
          scannedCount = json.scannedCount ?? 0;
          flaggedUserIds = json.flaggedUserIds ?? [];
          anomalyCount = json.anomalies?.length ?? 0;
          incidentsCreated = json.incidentsCreated ?? 0;
          source = json.logsSource ?? 'store';
        } else {
          throw new Error(`Security scan failed (${resp.status})`);
        }
      } catch {
        // Offline/dev fallback: scan the stored telemetry directly if it is
        // available. Never substitute fabricated sample download logs.
        source = 'offline';
        const logsResp = await fetch('/api/agents/download-logs?limit=500', {
          credentials: 'same-origin',
        });
        if (!logsResp.ok) {
          throw new Error('Download telemetry is unavailable');
        }
        const json = (await logsResp.json()) as {
          logs?: Array<{ userId: string; ipAddress: string; timestamp: number }>;
        };
        const storedLogs = Array.isArray(json.logs) ? json.logs : [];
        const result = detectResourceSharingAnomalies(storedLogs, 60);
        scannedCount = storedLogs.length;
        flaggedUserIds = result.flaggedUserIds;
        anomalyCount = result.anomalies.length;
      }

      const hasAnomalies = anomalyCount > 0;
      await persistLog({
        agent: 'security-scan',
        status: hasAnomalies ? 'warning' : 'success',
        title: hasAnomalies
          ? `Security Anomaly Flagged (${anomalyCount})`
          : 'Security Scan: All Clear',
        details: hasAnomalies
          ? `Flagged ${flaggedUserIds.join(', ')} from ${scannedCount} stored download event(s). ${incidentsCreated} new incident(s) recorded.${
              source === 'offline' ? ' (offline fallback)' : ''
            }`
          : `Scanned ${scannedCount} stored download event(s). Zero unauthorized download bursts or multi-IP dispersion detected.${
              source === 'offline' ? ' (offline fallback)' : ''
            }`,
      });
      showToast(
        hasAnomalies
          ? `Security scan flagged ${anomalyCount} anomaly(ies)`
          : 'Security scan complete: No anomalies'
      );
    } catch {
      showToast('Failed to execute security scan');
    } finally {
      setRunningAgent(null);
    }
  };

  // 4. Manual Trigger: full daily maintenance routine (same work as cron)
  const handleRunDailyMaintenance = async () => {
    setRunningAgent('maintenance');
    try {
      const resp = await fetch('/api/cron/daily-maintenance', {
        credentials: 'same-origin',
      });
      if (!resp.ok) throw new Error(`Maintenance failed (${resp.status})`);
      const json = (await resp.json()) as {
        tasks?: Record<string, unknown>;
      };
      await loadLogs();
      const taskCount = json.tasks ? Object.keys(json.tasks).length : 0;
      showToast(`Daily maintenance completed (${taskCount} task groups)`);
    } catch {
      showToast('Failed to run daily maintenance');
    } finally {
      setRunningAgent(null);
    }
  };

  const filteredLogs = logs.filter((l) => (filterType === 'all' ? true : l.agent === filterType));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#0a192f]" />
            <span>Autonomous Operations & Automation Agents</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Trigger on-demand operational agents, review background publication pipelines, and inspect security access logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunDailyMaintenance}
            disabled={runningAgent === 'maintenance'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0a192f] text-xs font-semibold rounded-full border border-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            {runningAgent === 'maintenance' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Run Daily Maintenance</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Agents System Active
          </span>
        </div>
      </div>

      {/* 3 Action Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Blog Publisher */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {scheduledBlogsCount} Scheduled
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Scheduled Blog Publisher</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scans queued blog articles where scheduledAt is past due, automatically transitions status to published, and generates social distribution copy.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunBlogPublisher}
            disabled={runningAgent === 'blog-publisher'}
            className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 bg-[#0a192f] text-white text-xs font-bold rounded-md hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {runningAgent === 'blog-publisher' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Publish Scheduled Blogs</span>
          </button>
        </div>

        {/* Card 2: Dynamic Site Updates */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {bestsellerCount} Bestsellers
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Dynamic Site Updates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates completed order velocity to designate bestseller product badges, syncs countdown timers, and activates promotional coupons.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunSiteUpdate}
            disabled={runningAgent === 'site-update'}
            className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 bg-[#0a192f] text-white text-xs font-bold rounded-md hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {runningAgent === 'site-update' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Evaluate Site Updates</span>
          </button>
        </div>

        {/* Card 3: Security Scan */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">Enforced</span>
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">Resource Sharing Safeguards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Detects multi-IP dispersion (&gt;3 distinct IPs in 60m) and rapid download bursts (&gt;10 downloads) on gated LMS and software assets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRunSecurityScan}
            disabled={runningAgent === 'security-scan'}
            className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 bg-rose-700 text-white text-xs font-bold rounded-md hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
          >
            {runningAgent === 'security-scan' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            <span>Run Security Scan</span>
          </button>
        </div>
      </div>

      {/* Incident & Event Log Feed */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Automated Agent Event & Incident Log</h2>
            <p className="text-xs text-slate-500">Persistent audit log of automated and manual agent executions</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="all">All Agents</option>
              <option value="blog-publisher">Blog Publisher</option>
              <option value="site-update">Dynamic Site Update</option>
              <option value="security-scan">Security Safeguards</option>
              <option value="enquiry">Enquiry Agent</option>
              <option value="maintenance">Daily Maintenance</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {logsLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading agent logs…</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No agent logs recorded yet.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        log.status === 'warning'
                          ? 'bg-rose-100 text-rose-800'
                          : log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {AGENT_LABELS[log.agent] || log.agent}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{log.title}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {formatLogTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
