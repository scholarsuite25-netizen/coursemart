/**
 * Activity-based leaderboard utilities for the Community Module (R2).
 *
 * Computes member points from the same engagement signals as the community:
 * chat messages sent, thread creations, replies, solutions, pins and upvotes.
 * Runs client-side over the existing data model — no storage, no server calls.
 */

import type { CommunityChatMessage, CommunityForumReply, CommunityForumThread } from '../types/marketplace.ts';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  title: string;
  badge: string;
}

export const POINT_WEIGHTS = {
  message: 2,
  messageUpvote: 1,
  threadCreated: 10,
  threadUpvote: 1,
  reply: 5,
  replyUpvote: 1,
  solution: 15,
  pin: 3,
} as const;

const TITLES_BY_POINTS: Array<{ min: number; title: string }> = [
  { min: 500, title: 'Ambassador' },
  { min: 300, title: 'Star Performer' },
  { min: 150, title: 'Community Builder' },
  { min: 80, title: 'Helpful Contributor' },
  { min: 30, title: 'Active Builder' },
  { min: 10, title: 'Getting Started' },
  { min: 0, title: 'Community Member' },
];

function titleForPoints(points: number): string {
  const t = TITLES_BY_POINTS.find((entry) => points >= entry.min);
  return t ? t.title : TITLES_BY_POINTS[TITLES_BY_POINTS.length - 1].title;
}

function uniqueByUser(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const byUser = new Map<string, LeaderboardEntry>();
  entries.forEach((entry) => {
    const existing = byUser.get(entry.userId);
    if (existing) {
      existing.points += entry.points;
      existing.title = titleForPoints(existing.points);
    } else {
      byUser.set(entry.userId, entry);
    }
  });
  return Array.from(byUser.values());
}

function pushEntry(
  raw: LeaderboardEntry[],
  userId: string,
  userName: string,
  points: number,
  nameById?: Map<string, string>
) {
  if (!userId) return;
  raw.push({ userId, userName: userName || nameById?.get(userId) || userId, points, rank: 0, title: '', badge: '' });
}

export function calculateCommunityLeaderboard(
  messages: CommunityChatMessage[],
  threads: CommunityForumThread[],
  replies: CommunityForumReply[]
): LeaderboardEntry[] {
  // Build userId → userName index from all activity sources
  const nameById = new Map<string, string>();
  for (const m of messages) {
    if (m.userId && m.userName) nameById.set(m.userId, m.userName);
    if (m.authorId && m.authorName) nameById.set(m.authorId, m.authorName);
  }
  for (const t of threads) {
    if (t.authorId && t.authorName) nameById.set(t.authorId, t.authorName);
  }
  for (const r of replies) {
    if (r.authorId && r.authorName) nameById.set(r.authorId, r.authorName);
  }

  const raw: LeaderboardEntry[] = [];
  const add = (userId: string, userName: string, points: number) =>
    pushEntry(raw, userId, userName, points, nameById);

  for (const m of messages) {
    if (m.isModerated) continue;
    add(m.userId, m.userName, POINT_WEIGHTS.message);
    Object.values(m.reactions || {}).forEach((userIds) =>
      userIds.forEach((uid) => add(uid, nameById.get(uid) || uid, POINT_WEIGHTS.messageUpvote))
    );
  }

  for (const t of threads) {
    if (t.isModerated) continue;
    add(t.authorId, t.authorName, POINT_WEIGHTS.threadCreated);
    (t.upvotedUserIds || []).forEach((uid) =>
      add(uid, nameById.get(uid) || uid, POINT_WEIGHTS.threadUpvote)
    );
    if (t.isPinned) add(t.authorId, t.authorName, POINT_WEIGHTS.pin);
  }

  for (const r of replies) {
    if (r.isModerated) continue;
    add(r.authorId, r.authorName, POINT_WEIGHTS.reply);
    (r.upvotedUserIds || []).forEach((uid) =>
      add(uid, nameById.get(uid) || uid, POINT_WEIGHTS.replyUpvote)
    );
  }

  const deduped = uniqueByUser(raw);
  return deduped
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({
      ...e,
      rank: i + 1,
      title: titleForPoints(e.points),
      badge: titleForPoints(e.points),
    }));
}

export function getTopCommunityMembers(
  messages: CommunityChatMessage[],
  threads: CommunityForumThread[],
  replies: CommunityForumReply[],
  limit = 10
): LeaderboardEntry[] {
  return calculateCommunityLeaderboard(messages, threads, replies).slice(0, limit);
}
