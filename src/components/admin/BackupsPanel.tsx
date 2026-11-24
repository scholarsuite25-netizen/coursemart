import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, Cloud, Database, History, ShieldCheck } from 'lucide-react';

interface BackupStatus {
  ok: boolean;
  exists: boolean;
  keyCount: number;
  backupKey?: string;
  createdAt?: string;
  daysToRetain: number;
}

export function BackupsPanel() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/backup/status', { credentials: 'same-origin' });
      const json = (await res.json().catch(() => null)) as BackupStatus | null;
      if (res.ok && json) setStatus(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load backup status.');
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const runBackup = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/cron/daily-backup', { method: 'POST' });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; keyCount?: number } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error || `Backup failed (HTTP ${res.status}).`);
        return;
      }
      await loadStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to run backup.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">Backups</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Automatic daily dumps of the KV store (users, courses, sales, orders, community, downloads, logs). Backup cron runs at 06:00 UTC via Vercel; the backup of each day is stored as `backup_history_YYYY-MM-DD` and the latest keys in `backup_latest`.
          </p>
        </div>
        <button
          type="button"
          onClick={runBackup}
          disabled={running}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>{running ? 'Running backup...' : 'Run Backup Now'}</span>
        </button>
      </div>

      {/* Backup Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Latest Backup</p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {status?.createdAt ? new Date(status.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Stored Entries</p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">{status?.keyCount ?? 0}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Retention</p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {status?.daysToRetain ?? 7} <span className="text-xs font-normal text-slate-500">days</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Storage</p>
            <p className="text-2xl font-bold font-display text-[#2271b1] mt-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{status?.exists ? 'On-demand + daily' : 'On-demand only'}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
