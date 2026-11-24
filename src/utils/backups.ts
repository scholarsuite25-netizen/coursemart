/**
 * Daily backup snapshot utilities (writes the full KV store via the server).
 *
 * Routes (in src/server/createApp.ts):
 *  - POST /api/cron/daily-backup  (Vercel cron) — dumps every KV key into the store.
 *  - GET  /api/backup/status      — latest backup + counts.
 */

export interface BackupStatus {
  exists: boolean;
  createdAt?: string;
  keyCount?: number;
  keys?: string[];
  daysToRetain: number;
  success?: boolean;
}

export function todayUtcKey(prefix = 'backup_history_'): string {
  return prefix + new Date().toISOString().slice(0, 10);
}

export function pruneBackupKeys(existingKeys: string[], daysToRetain = 7): string[] {
  const cutoff = Date.now() - daysToRetain * 24 * 60 * 60 * 1000;
  return existingKeys.filter((key) => {
    const m = key.match(/backup_history_(\d{4}-\d{2}-\d{2})/);
    if (!m) return true; // always keep non-dated keys (e.g. backup_latest)
    const date = new Date(m[1] + 'T00:00:00Z').getTime();
    return date >= cutoff;
  });
}
