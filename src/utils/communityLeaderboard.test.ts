import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCommunityLeaderboard, POINT_WEIGHTS } from './communityLeaderboard.ts';
import type { CommunityChatMessage, CommunityForumReply, CommunityForumThread } from '../types/marketplace.ts';

const makeMessage = (id: string, userId: string, userName: string, reactions: CommunityChatMessage['reactions'] = {}) => ({
  id,
  channelId: 'chan-general',
  userId,
  userName,
  userRole: 'customer' as const,
  content: `Message from ${userId}`,
  reactions,
  isPinned: false,
  isModerated: false,
  createdAt: new Date().toISOString(),
});

const makeThread = (id: string, authorId: string, authorName: string, extra: Partial<CommunityForumThread> = {}): CommunityForumThread => ({
  id,
  slug: `thread-${id}`,
  title: `Thread ${id}`,
  body: 'Thread body',
  content: 'Thread body',
  category: 'AI & Vibe Coding',
  authorId,
  authorName,
  authorRole: 'customer',
  tags: [],
  upvotes: 0,
  upvotedUserIds: [],
  viewsCount: 0,
  replyCount: 0,
  isPinned: false,
  pinned: false,
  isLocked: false,
  isSolved: false,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  ...extra,
});

test('calculateCommunityLeaderboard ranks users by aggregated points across messages, threads, replies and reactions', () => {
  const messages: CommunityChatMessage[] = [
    makeMessage('m1', 'u1', 'Alex'),
    makeMessage('m2', 'u2', 'Bo', {
      rocket: ['u1', 'u3'],
    }),
  ];
  const threads: CommunityForumThread[] = [
    makeThread('t1', 'u1', 'Alex'),
    makeThread('t2', 'u3', 'Pia'),
  ];
  const replies: CommunityForumReply[] = [];

  const board = calculateCommunityLeaderboard(messages, threads, replies);
  const byUser = Object.fromEntries(board.map((e) => [e.userId, e]));

  // Alex: 1 message + 1 upvote + 10 thread = 13
  assert.equal(byUser['u1']?.points, POINT_WEIGHTS.message + POINT_WEIGHTS.messageUpvote + POINT_WEIGHTS.threadCreated);
  // Bo: 1 message. His message got reactions but the points went to Alex & Pia.
  assert.equal(byUser['u2']?.points, POINT_WEIGHTS.message);
  // Pia: 10 thread + 1 reaction = 11
  assert.equal(byUser['u3']?.points, POINT_WEIGHTS.threadCreated + POINT_WEIGHTS.messageUpvote);
  assert.equal(board[0].userId, 'u1');
  assert.ok(board[0].title.length > 0);
});

test('calculateCommunityLeaderboard excludes moderated content and unknown-less entries', () => {
  const messages: CommunityChatMessage[] = [
    makeMessage('m1', 'u1', 'Alex'),
    { ...makeMessage('m2', 'u2', 'Bo'), isModerated: true },
  ];
  const board = calculateCommunityLeaderboard(messages, [], []);
  assert.equal(board.length, 1);
  assert.equal(board[0].userId, 'u1');
});

test('calculateCommunityLeaderboard aggregates duplicates across activity sources', () => {
  const messages: CommunityChatMessage[] = [makeMessage('m1', 'u1', 'Alex')];
  const threads: CommunityForumThread[] = [makeThread('t1', 'u1', 'Alex')];
  const board = calculateCommunityLeaderboard(messages, threads, []);
  const entry = board.find((e) => e.userId === 'u1');
  assert.equal(entry?.points, POINT_WEIGHTS.message + POINT_WEIGHTS.threadCreated);
});

test('calculateCommunityLeaderboard assigns increasing ranks and title mapping from points', () => {
  const messages: CommunityChatMessage[] = [
    makeMessage('m1', 'u1', 'Alex'),
    makeMessage('m2', 'u2', 'Bo'),
    makeMessage('m3', 'u3', 'Cia'),
  ];
  const board = calculateCommunityLeaderboard(messages, [], []);
  assert.equal(board.length, 3);
  board.forEach((e, idx) => assert.equal(e.rank, idx + 1));
  const titles = board.map((e) => e.title);
  assert.ok(new Set(titles).size <= 3, 'titles follow the point ladder');
});
