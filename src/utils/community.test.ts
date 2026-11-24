import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserAccessChannel,
  canUserPostInChannel,
  filterChannels,
  createChatMessage,
  filterChatMessages,
  toggleChatMessageReaction,
  togglePinChatMessage,
  moderateChatMessage,
  calculateUnreadMessageCount,
  calculateTotalUnreadCount,
  createForumThread,
  filterAndSortForumThreads,
  toggleThreadUpvote,
  togglePinThread,
  toggleLockThread,
  moderateThread,
  createForumReply,
  filterForumReplies,
  toggleReplyUpvote,
  markReplyAsSolution,
  moderateReply,
  searchCommunity,
  getCommunityStats,
  DEFAULT_COMMUNITY_CHANNELS,
} from './community.ts';
import type {
  CommunityChannel,
  CommunityChatMessage,
  CommunityForumReply,
  CommunityForumThread,
} from '../types/marketplace.ts';

test('filterChannels and canUserAccessChannel enforce public, enrolled_only, and members_only permissions', () => {
  const publicChan: CommunityChannel = {
    id: 'c-pub',
    slug: 'public-lounge',
    name: 'Public Lounge',
    description: 'Everyone welcome',
    category: 'general',
    visibility: 'public',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const enrolledChan: CommunityChannel = {
    id: 'c-course',
    slug: 'course-qna',
    name: 'Course Q&A',
    description: 'Enrolled students only',
    category: 'course',
    visibility: 'enrolled_only',
    productId: 'prod-ts-101',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const vipChan: CommunityChannel = {
    id: 'c-vip',
    slug: 'vip-lounge',
    name: 'VIP Lounge',
    description: 'Members only',
    category: 'vip',
    visibility: 'members_only',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const allChannels = [publicChan, enrolledChan, vipChan];

  // Guest / Anonymous
  assert.equal(canUserAccessChannel(publicChan), true);
  assert.equal(canUserAccessChannel(enrolledChan), false);
  assert.equal(canUserAccessChannel(vipChan), false);

  // Student not enrolled
  const studentCtx = { role: 'customer' as const, enrolledProductIds: ['other-course'], isMember: false };
  assert.equal(canUserAccessChannel(publicChan, studentCtx), true);
  assert.equal(canUserAccessChannel(enrolledChan, studentCtx), false);
  assert.equal(canUserAccessChannel(vipChan, studentCtx), false);

  // Enrolled student
  const enrolledCtx = { role: 'customer' as const, enrolledProductIds: ['prod-ts-101'], isMember: false };
  assert.equal(canUserAccessChannel(enrolledChan, enrolledCtx), true);

  // Member student
  const memberCtx = { role: 'customer' as const, enrolledProductIds: [], isMember: true };
  assert.equal(canUserAccessChannel(vipChan, memberCtx), true);

  // Instructor
  const instructorCtx = { role: 'instructor' as const, isMember: false };
  assert.equal(canUserAccessChannel(vipChan, instructorCtx), true);

  // Admin has access to all
  const adminCtx = { role: 'admin' as const };
  assert.equal(canUserAccessChannel(publicChan, adminCtx), true);
  assert.equal(canUserAccessChannel(enrolledChan, adminCtx), true);
  assert.equal(canUserAccessChannel(vipChan, adminCtx), true);

  // Filtering channels by user
  const guestVisible = filterChannels(allChannels, { user: studentCtx });
  assert.equal(guestVisible.length, 1);
  assert.equal(guestVisible[0].id, 'c-pub');

  const adminVisible = filterChannels(allChannels, { user: adminCtx });
  assert.equal(adminVisible.length, 3);
});

test('product-gated members_only channels unlock for owners of the linked product', () => {
  const paidVipChan: CommunityChannel = {
    id: 'c-vip-paid',
    slug: 'vip-paid-lounge',
    name: 'VIP Mastermind Space',
    description: 'Paid lounge',
    category: 'vip',
    visibility: 'members_only',
    productId: 'prod-vip-mastermind',
    isReadOnly: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  // Guests and non-owners are locked out even if isMember is true
  assert.equal(canUserAccessChannel(paidVipChan), false);
  assert.equal(
    canUserAccessChannel(paidVipChan, { role: 'customer', isMember: true }),
    false
  );
  // Staff unlock (consistent with previous behavior)
  assert.equal(canUserAccessChannel(paidVipChan, { role: 'instructor' }), true);
  // Owners unlock
  assert.equal(
    canUserAccessChannel(paidVipChan, {
      role: 'customer',
      ownedProductIds: ['prod-vip-mastermind'],
    }),
    true
  );
  // Ownership does not leak access to other product owners
  assert.equal(
    canUserAccessChannel(paidVipChan, {
      role: 'customer',
      ownedProductIds: ['prod-other'],
    }),
    false
  );
  // canUserPostInChannel mirrors access rules
  const ownerPost = canUserPostInChannel(paidVipChan, {
    role: 'customer',
    ownedProductIds: ['prod-vip-mastermind'],
  });
  assert.equal(ownerPost.allowed, true);
  const guestPost = canUserPostInChannel(paidVipChan, { role: 'customer' });
  assert.equal(guestPost.allowed, false);
});

test('canUserPostInChannel blocks customer posting in read-only announcement channels', () => {
  const readOnlyChan: CommunityChannel = {
    id: 'c-announce',
    slug: 'announcements',
    name: 'Announcements',
    description: 'Read-only updates',
    category: 'announcements',
    visibility: 'public',
    isReadOnly: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const studentCtx = { role: 'customer' as const };
  const instructorCtx = { role: 'instructor' as const };
  const adminCtx = { role: 'admin' as const };

  const studentPost = canUserPostInChannel(readOnlyChan, studentCtx);
  assert.equal(studentPost.allowed, false);
  assert.match(studentPost.reason || '', /read-only/i);

  const instructorPost = canUserPostInChannel(readOnlyChan, instructorCtx);
  assert.equal(instructorPost.allowed, true);

  const adminPost = canUserPostInChannel(readOnlyChan, adminCtx);
  assert.equal(adminPost.allowed, true);
});

test('createChatMessage validates content length, sanitizes input, and initializes default fields', () => {
  const emptyRes = createChatMessage({
    channelId: 'chan-1',
    userId: 'u-1',
    userName: 'Alex',
    userRole: 'customer',
    content: '   ',
  });
  assert.equal(emptyRes.ok, false);

  const hugeContent = 'a'.repeat(2001);
  const hugeRes = createChatMessage({
    channelId: 'chan-1',
    userId: 'u-1',
    userName: 'Alex',
    userRole: 'customer',
    content: hugeContent,
  });
  assert.equal(hugeRes.ok, false);

  const validRes = createChatMessage({
    channelId: 'chan-1',
    userId: 'u-1',
    userName: 'Alex',
    userRole: 'customer',
    content: '  Hello fellow builders!  ',
  });
  assert.equal(validRes.ok, true);
  if (validRes.ok) {
    assert.equal(validRes.message.content, 'Hello fellow builders!');
    assert.equal(validRes.message.channelId, 'chan-1');
    assert.equal(validRes.message.userId, 'u-1');
    assert.equal(validRes.message.isPinned, false);
    assert.equal(validRes.message.isModerated, false);
    assert.deepEqual(validRes.message.reactions, {});
  }
});

test('toggleChatMessageReaction adds, removes, and cleans up empty reaction keys', () => {
  const msg: CommunityChatMessage = {
    id: 'msg-1',
    channelId: 'chan-1',
    userId: 'u-1',
    userName: 'Alex',
    userRole: 'customer',
    content: 'Check out this design',
    createdAt: '2026-01-01T12:00:00Z',
    reactions: {},
  };

  // Add rocket emoji
  const step1 = toggleChatMessageReaction(msg, '🚀', 'u-2');
  assert.deepEqual(step1.reactions, { '🚀': ['u-2'] });

  // Add another user to rocket emoji
  const step2 = toggleChatMessageReaction(step1, '🚀', 'u-3');
  assert.deepEqual(step2.reactions, { '🚀': ['u-2', 'u-3'] });

  // Remove u-2 from rocket emoji
  const step3 = toggleChatMessageReaction(step2, '🚀', 'u-2');
  assert.deepEqual(step3.reactions, { '🚀': ['u-3'] });

  // Remove u-3 from rocket emoji -> key should be deleted
  const step4 = toggleChatMessageReaction(step3, '🚀', 'u-3');
  assert.deepEqual(step4.reactions, {});
});

test('chat moderation and pin actions restrict execution to instructors and admins', () => {
  const msg: CommunityChatMessage = {
    id: 'msg-10',
    channelId: 'chan-1',
    userId: 'u-1',
    userName: 'Alex',
    userRole: 'customer',
    content: 'Community rules announcement',
    createdAt: '2026-01-01T12:00:00Z',
    isPinned: false,
  };

  // Customer cannot pin or moderate
  const custPin = togglePinChatMessage(msg, 'customer');
  assert.equal(custPin.ok, false);

  const custMod = moderateChatMessage(msg, 'customer', 'Spam');
  assert.equal(custMod.ok, false);

  // Admin can pin
  const adminPin = togglePinChatMessage(msg, 'admin');
  assert.equal(adminPin.ok, true);
  if (adminPin.ok) {
    assert.equal(adminPin.message.isPinned, true);
  }

  // Instructor can moderate
  const instMod = moderateChatMessage(msg, 'instructor', 'Inappropriate link');
  assert.equal(instMod.ok, true);
  if (instMod.ok) {
    assert.equal(instMod.message.isModerated, true);
    assert.equal(instMod.message.moderationReason, 'Inappropriate link');
  }
});

test('calculateUnreadMessageCount excludes authors own messages and moderated content', () => {
  const messages: CommunityChatMessage[] = [
    {
      id: 'm-1',
      channelId: 'chan-general',
      userId: 'u-other',
      userName: 'Bob',
      userRole: 'customer',
      content: 'Message 1',
      createdAt: '2026-01-01T10:00:00Z',
    },
    {
      id: 'm-2',
      channelId: 'chan-general',
      userId: 'u-me',
      userName: 'Alex',
      userRole: 'customer',
      content: 'My own message',
      createdAt: '2026-01-01T10:05:00Z',
    },
    {
      id: 'm-3',
      channelId: 'chan-general',
      userId: 'u-other',
      userName: 'Bob',
      userRole: 'customer',
      content: 'Message 3',
      createdAt: '2026-01-01T10:10:00Z',
    },
    {
      id: 'm-4',
      channelId: 'chan-general',
      userId: 'u-other',
      userName: 'Bob',
      userRole: 'customer',
      content: 'Spam message',
      isModerated: true,
      createdAt: '2026-01-01T10:15:00Z',
    },
    {
      id: 'm-5',
      channelId: 'chan-vip',
      userId: 'u-other',
      userName: 'Bob',
      userRole: 'customer',
      content: 'Different channel',
      createdAt: '2026-01-01T10:20:00Z',
    },
  ];

  // Read up to 10:02:00Z. Messages m-2 (own), m-3 (unread), m-4 (moderated) exist after timestamp.
  const unread = calculateUnreadMessageCount(
    messages,
    'chan-general',
    '2026-01-01T10:02:00Z',
    'u-me'
  );

  // Only m-3 should count as unread
  assert.equal(unread, 1);
});

test('createForumThread validates title, body, creates unique slug, and sets initial metrics', () => {
  const shortTitle = createForumThread({
    title: 'Hi',
    body: 'This is a long enough body text for a test',
    category: 'Architecture & Systems',
    authorId: 'u-1',
    authorName: 'Alex',
    authorRole: 'customer',
  });
  assert.equal(shortTitle.ok, false);

  const shortBody = createForumThread({
    title: 'Valid Thread Title Here',
    body: 'Short',
    category: 'Architecture & Systems',
    authorId: 'u-1',
    authorName: 'Alex',
    authorRole: 'customer',
  });
  assert.equal(shortBody.ok, false);

  const valid = createForumThread({
    title: 'How to structure high-throughput event queues?',
    body: 'Looking for best practices in TypeScript and Redis.',
    category: 'Architecture & Systems',
    tags: ['Architecture', 'Redis', 'Node'],
    authorId: 'u-1',
    authorName: 'Alex',
    authorRole: 'customer',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.thread.title, 'How to structure high-throughput event queues?');
    assert.match(valid.thread.slug, /how-to-structure-high-throughput-event-queues/);
    assert.equal(valid.thread.upvotes, 0);
    assert.equal(valid.thread.replyCount, 0);
    assert.equal(valid.thread.isPinned, false);
    assert.equal(valid.thread.isLocked, false);
    assert.equal(valid.thread.isSolved, false);
    assert.deepEqual(valid.thread.tags, ['architecture', 'redis', 'node']);
  }
});

test('filterAndSortForumThreads maintains pinned threads on top across activity, recent, and popular sorts', () => {
  const threadNormal: CommunityForumThread = {
    id: 't-1',
    slug: 'thread-normal',
    title: 'Normal Thread with many upvotes',
    body: 'Body text goes here',
    category: 'AI & Vibe Coding',
    authorId: 'u-1',
    authorName: 'Alex',
    authorRole: 'customer',
    tags: ['ai'],
    upvotes: 50,
    upvotedUserIds: [],
    viewsCount: 100,
    replyCount: 10,
    isPinned: false,
    isLocked: false,
    isSolved: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    lastActivityAt: '2026-01-02T00:00:00Z',
  };

  const threadPinned: CommunityForumThread = {
    id: 't-pinned',
    slug: 'thread-pinned',
    title: 'Pinned Official Welcome Guide',
    body: 'Official rules and guidelines',
    category: 'Announcements',
    authorId: 'u-admin',
    authorName: 'Marcus Sterling',
    authorRole: 'admin',
    tags: ['rules'],
    upvotes: 5,
    upvotedUserIds: [],
    viewsCount: 500,
    replyCount: 2,
    isPinned: true,
    isLocked: false,
    isSolved: false,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
    lastActivityAt: '2025-12-01T00:00:00Z',
  };

  const threads = [threadNormal, threadPinned];

  // Popular sort: pinned must remain first despite having fewer upvotes
  const sortedPopular = filterAndSortForumThreads(threads, { sortBy: 'popular' });
  assert.equal(sortedPopular[0].id, 't-pinned');
  assert.equal(sortedPopular[1].id, 't-1');

  // Recent sort: pinned must remain first despite older date
  const sortedRecent = filterAndSortForumThreads(threads, { sortBy: 'recent' });
  assert.equal(sortedRecent[0].id, 't-pinned');
  assert.equal(sortedRecent[1].id, 't-1');
});

test('createForumReply blocks posting on locked threads and updates thread replyCount and lastActivityAt', () => {
  const lockedThread: CommunityForumThread = {
    id: 't-locked',
    slug: 'locked-topic',
    title: 'Archived Discussion',
    body: 'This discussion is locked.',
    category: 'Announcements',
    authorId: 'u-admin',
    authorName: 'Marcus',
    authorRole: 'admin',
    tags: [],
    upvotes: 0,
    upvotedUserIds: [],
    viewsCount: 10,
    replyCount: 0,
    isPinned: false,
    isLocked: true,
    isSolved: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastActivityAt: '2026-01-01T00:00:00Z',
  };

  const lockedAttempt = createForumReply({
    thread: lockedThread,
    authorId: 'u-student',
    authorName: 'Alex',
    authorRole: 'customer',
    body: 'Trying to reply to locked thread',
  });
  assert.equal(lockedAttempt.ok, false);
  assert.match(lockedAttempt.error || '', /locked/i);

  const openThread: CommunityForumThread = {
    ...lockedThread,
    isLocked: false,
    replyCount: 2,
    lastActivityAt: '2026-01-01T00:00:00Z',
  };

  const replyRes = createForumReply({
    thread: openThread,
    authorId: 'u-student',
    authorName: 'Alex',
    authorRole: 'customer',
    body: 'Here is my helpful solution and explanation.',
  });

  assert.equal(replyRes.ok, true);
  if (replyRes.ok) {
    assert.equal(replyRes.reply.threadId, openThread.id);
    assert.equal(replyRes.reply.body, 'Here is my helpful solution and explanation.');
    assert.equal(replyRes.updatedThread.replyCount, 3);
    assert.notEqual(replyRes.updatedThread.lastActivityAt, '2026-01-01T00:00:00Z');
  }
});

test('markReplyAsSolution allows thread author and admin, rejects unauthorized users, and updates thread and reply state', () => {
  const thread: CommunityForumThread = {
    id: 't-sol',
    slug: 'question-on-indexes',
    title: 'How do database indexes improve read performance?',
    body: 'Looking for a clear explanation.',
    category: 'Architecture & Systems',
    authorId: 'u-author',
    authorName: 'Elena',
    authorRole: 'customer',
    tags: [],
    upvotes: 2,
    upvotedUserIds: [],
    viewsCount: 20,
    replyCount: 1,
    isPinned: false,
    isLocked: false,
    isSolved: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastActivityAt: '2026-01-01T00:00:00Z',
  };

  const reply: CommunityForumReply = {
    id: 'r-sol',
    threadId: 't-sol',
    authorId: 'u-helper',
    authorName: 'Dr. Vance',
    authorRole: 'instructor',
    body: 'B-Trees allow O(log n) lookups instead of full table scans O(n).',
    upvotes: 5,
    upvotedUserIds: [],
    createdAt: '2026-01-01T01:00:00Z',
  };

  // Unauthorized student tries to mark solution
  const randomStudent = { id: 'u-random', role: 'customer' as const };
  const denied = markReplyAsSolution(thread, reply, randomStudent);
  assert.equal(denied.ok, false);

  // Author marks solution
  const authorUser = { id: 'u-author', role: 'customer' as const };
  const accepted = markReplyAsSolution(thread, reply, authorUser);
  assert.equal(accepted.ok, true);
  if (accepted.ok) {
    assert.equal(accepted.updatedThread.isSolved, true);
    assert.equal(accepted.updatedThread.solutionReplyId, 'r-sol');
    assert.equal(accepted.updatedReply.isSolution, true);
  }

  // Community statistics and search check
  const stats = getCommunityStats(
    DEFAULT_COMMUNITY_CHANNELS,
    [],
    [accepted.ok ? accepted.updatedThread : thread],
    [accepted.ok ? accepted.updatedReply : reply]
  );
  assert.equal(stats.solvedThreadsCount, 1);
  assert.equal(stats.totalReplies, 1);
});
