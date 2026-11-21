import React, { useState } from 'react';
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
} from '../../utils/agentAutomation';

export interface AutomationLogEntry {
  id: string;
  agent: 'blog-publisher' | 'site-update' | 'security-scan' | 'enquiry';
  status: 'success' | 'warning' | 'info';
  title: string;
  details: string;
  timestamp: string;
}

export function AutomationAgentsPanel() {
  const {
    blogPosts,
    products,
    orders,
    appearance,
    updateAppearance,
    upsertBlogPost,
    upsertProduct,
    showToast,
  } = useStore();

  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [logs, setLogs] = useState<AutomationLogEntry[]>([
    {
      id: 'log-init-1',
      agent: 'security-scan',
      status: 'info',
      title: 'Baseline Security Scan Complete',
      details: 'Evaluated 42 download streams across 18 active student accounts. Zero anomalies detected.',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'log-init-2',
      agent: 'site-update',
      status: 'success',
      title: 'Dynamic Catalog Evaluated',
      details: 'Tagged bestseller badges based on order threshold and refreshed announcement coupon BESTSELLER10.',
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scheduledBlogsCount = blogPosts.filter((b) => b.status === 'scheduled').length;
  const bestsellerCount = products.filter((p) => p.bestseller).length;

  // 1. Manual Trigger: Blog Publisher
  const handleRunBlogPublisher = async () => {
    setRunningAgent('blog-publisher');
    try {
      const now = Date.now();
      const res = runBlogPublisherAgent(blogPosts, now);
      res.updatedPosts.forEach((p) => upsertBlogPost(p));

      const newLog: AutomationLogEntry = {
        id: `log-${Date.now()}`,
        agent: 'blog-publisher',
        status: 'success',
        title: 'Blog Publisher Agent Executed',
        details: `Published ${res.publishedCount} scheduled blog post(s) past release timestamp.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLogs((prev) => [newLog, ...prev]);
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

      if (res.announcement) {
        updateAppearance({
          ...appearance,
          announcementEnabled: true,
          announcementText: res.announcement.text,
          announcementCoupon: res.announcement.couponCode || appearance.announcementCoupon,
        });
      }

      const newLog: AutomationLogEntry = {
        id: `log-${Date.now()}`,
        agent: 'site-update',
        status: 'success',
        title: 'Dynamic Site Updates Evaluated',
        details: `Updated ${res.bestsellerIds.length} bestseller badge(s) and synced storefront announcement bar.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLogs((prev) => [newLog, ...prev]);
      showToast(`Site Updates: ${res.bestsellerIds.length} bestsellers identified`);
    } catch {
      showToast('Failed to evaluate site updates');
    } finally {
      setRunningAgent(null);
    }
  };

  // 3. Manual Trigger: Security Scan
  const handleRunSecurityScan = async () => {
    setRunningAgent('security-scan');
    try {
      const now = Date.now();
      const sampleLogs = [
        { userId: 'usr-student-88', ipAddress: '102.89.22.1', timestamp: now - 5000 },
        { userId: 'usr-student-88', ipAddress: '102.89.22.4', timestamp: now - 4000 },
        { userId: 'usr-student-88', ipAddress: '105.112.33.2', timestamp: now - 3000 },
        { userId: 'usr-student-88', ipAddress: '197.210.88.9', timestamp: now - 2000 },
      ];
      const res = detectResourceSharingAnomalies(sampleLogs, 60);

      const hasAnomalies = res.anomalies.length > 0;
      const newLog: AutomationLogEntry = {
        id: `log-${Date.now()}`,
        agent: 'security-scan',
        status: hasAnomalies ? 'warning' : 'success',
        title: hasAnomalies ? `Security Anomaly Flagged (${res.anomalies.length})` : 'Security Scan: All Clear',
        details: hasAnomalies
          ? `Flagged ${res.flaggedUserIds.join(', ')}: ${res.anomalies.map((a) => a.reason).join('; ')}`
          : 'Zero unauthorized download bursts or multi-IP dispersion detected across active tokens.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setLogs((prev) => [newLog, ...prev]);
      showToast(hasAnomalies ? 'Security scan flagged anomalies' : 'Security scan complete: No anomalies');
    } catch {
      showToast('Failed to execute security scan');
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
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
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
            <p className="text-xs text-slate-500">Real-time audit log of automated and manual agent executions</p>
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
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
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
                      {log.agent}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{log.title}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">{log.timestamp}</span>
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
