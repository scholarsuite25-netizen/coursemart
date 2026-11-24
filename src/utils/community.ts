/**
 * Pure domain utilities for the In-Platform Community Module (R1).
 *
 * Implements channel access control, chat messaging operations, reactions,
 * unread counters, forum thread lifecycle, replies, solution workflows,
 * moderation, and global search.
 */

import type {
  CommunityChannel,
  CommunityChatMessage,
  CommunityForumReply,
  CommunityForumThread,
  CommunitySummaryStats,
  CommunityVisibility,
  ForumCategory,
  UserRole,
} from '../types/marketplace.ts';
import { slugifyText } from './catalogAndBlogs.ts';

/* ============================================================================
   1. Constants & Default Taxonomy
   ============================================================================ */

export const DEFAULT_FORUM_CATEGORIES: ForumCategory[] = [
  'Architecture & Systems',
  'AI & Vibe Coding',
  'Course Q&A',
  'Career & Leadership',
  'Showcase & Feedback',
  'Announcements',
];

export const DEFAULT_COMMUNITY_CHANNELS: CommunityChannel[] = [
  {
    id: 'chan-announcements',
    slug: 'announcements',
    name: 'Announcements',
    description: 'Official Digital Wealth Creators (DWC) announcements and platform updates.',
    category: 'announcements',
    visibility: 'public',
    isReadOnly: true,
    icon: 'megaphone',
    memberCount: 1420,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chan-general',
    slug: 'general',
    name: 'General Discussion',
    description: 'Open discussion on tech, engineering, and digital entrepreneurship.',
    category: 'general',
    visibility: 'public',
    isReadOnly: false,
    icon: 'message-circle',
    memberCount: 980,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chan-course-distributed',
    slug: 'distributed-systems',
    name: 'Distributed Systems Cohort',
    description: 'Cohort Q&A and architecture discussions for Distributed Systems course.',
    category: 'course',
    visibility: 'enrolled_only',
    productId: 'prod-course-1',
    isReadOnly: false,
    icon: 'book-open',
    memberCount: 245,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chan-vibe-coding',
    slug: 'vibe-coding-ai',
    name: 'AI & Vibe Coding Mastery',
    description: 'AI-assisted development, prompt workflows, and agent architecture.',
    category: 'course',
    visibility: 'enrolled_only',
    productId: 'prod-course-2',
    isReadOnly: false,
    icon: 'sparkles',
    memberCount: 310,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chan-software-gridforge',
    slug: 'gridforge-pro',
    name: 'GridForge Pro Support',
    description: 'Developer support, bug reports, and component showcases for GridForge Pro.',
    category: 'software',
    visibility: 'enrolled_only',
    productId: 'prod-sw-1',
    isReadOnly: false,
    icon: 'cpu',
    memberCount: 94,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'chan-vip-mastermind',
    slug: 'vip-mastermind',
    name: 'VIP Creator Mastermind',
    description: 'Exclusive lounge for members who hold the DWC Creator Mastermind Pass (paid space).',
    category: 'vip',
    visibility: 'members_only',
    productId: 'prod-vip-mastermind',
    isReadOnly: false,
    icon: 'crown',
    memberCount: 128,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

/* ============================================================================
   2. Channel Access & Filtering
   ============================================================================ */

export function canUserAccessChannel(
  channel: CommunityChannel,
  ctx?: { role?: UserRole; enrolledProductIds?: string[]; ownedProductIds?: string[]; isMember?: boolean }
): boolean {
  const vis = String(channel.visibility || channel.accessLevel || 'public');
  if (vis === 'public') {
    return true;
  }
  if (ctx?.role === 'admin') {
    return true;
  }
  if (vis === 'enrolled_only' || vis === 'enrolled') {
    if (!channel.productId) return true;
    return Boolean(ctx?.enrolledProductIds && ctx.enrolledProductIds.includes(channel.productId));
  }
  if (vis === 'members_only' || vis === 'members') {
    if (channel.productId) {
      // Paywalled space: instructors, or owners of the linked product.
      if (ctx?.role === 'instructor') return true;
      return Boolean(ctx?.ownedProductIds && ctx.ownedProductIds.includes(channel.productId));
    }
    return ctx?.role === 'instructor' || ctx?.isMember === true;
  }
  return false;
}

export function filterChannels(
  channels: CommunityChannel[],
  options?: {
    category?: string;
    search?: string;
    includeArchived?: boolean;
    user?: { role?: UserRole; enrolledProductIds?: string[]; ownedProductIds?: string[]; isMember?: boolean };
  }
): CommunityChannel[] {
  return channels.filter((c) => {
    if (!options?.includeArchived && c.isArchived) {
      return false;
    }
    if (options?.user && !canUserAccessChannel(c, options.user)) {
      return false;
    }
    if (options?.category && options.category !== 'all') {
      if (c.category.toLowerCase() !== options.category.toLowerCase()) {
        return false;
      }
    }
    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function canUserPostInChannel(
  channel: CommunityChannel,
  ctx?: { role?: UserRole; enrolledProductIds?: string[]; ownedProductIds?: string[]; isMember?: boolean }
): { allowed: boolean; reason?: string } {
  if (!ctx || !ctx.role) {
    return { allowed: false, reason: 'Sign-in required to post messages.' };
  }
  if (!canUserAccessChannel(channel, ctx)) {
    return { allowed: false, reason: 'You do not have access to this channel.' };
  }
  if (channel.isReadOnly) {
    if (ctx.role === 'admin' || ctx.role === 'instructor') {
      return { allowed: true };
    }
    return { allowed: false, reason: 'This channel is read-only. Only instructors and admins may post.' };
  }
  return { allowed: true };
}

/* ============================================================================
   3. Chat Message Operations
   ============================================================================ */

export function createChatMessage(params: {
  channelId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  content: string;
  replyToId?: string;
}): { ok: true; message: CommunityChatMessage } | { ok: false; error: string } {
  const trimmed = (params.content || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Message content cannot be empty.' };
  }
  if (trimmed.length > 2000) {
    return { ok: false, error: 'Message exceeds 2000 character limit.' };
  }
  if (!params.userId || !params.userName) {
    return { ok: false, error: 'User identity is required.' };
  }

  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const message: CommunityChatMessage = {
    id,
    channelId: params.channelId,
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    userAvatar: params.userAvatar,
    authorId: params.userId,
    authorName: params.userName,
    authorRole: params.userRole,
    content: trimmed,
    replyToId: params.replyToId,
    reactions: {},
    isPinned: false,
    isModerated: false,
    createdAt: now,
  };

  return { ok: true, message };
}

export function filterChatMessages(
  messages: CommunityChatMessage[],
  channelId: string,
  options?: { search?: string; includeModerated?: boolean }
): CommunityChatMessage[] {
  const filtered = messages.filter((m) => {
    if (m.channelId !== channelId) return false;
    if (!options?.includeModerated && m.isModerated) return false;
    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      const textMatch = (m.content || '').toLowerCase().includes(q);
      const nameMatch = (m.userName || m.authorName || '').toLowerCase().includes(q);
      if (!textMatch && !nameMatch) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function toggleChatMessageReaction(
  message: CommunityChatMessage,
  emoji: string,
  userId: string
): CommunityChatMessage {
  const reactions: Record<string, string[]> = {};
  if (message.reactions) {
    for (const [key, userIds] of Object.entries(message.reactions)) {
      reactions[key] = [...userIds];
    }
  }

  const list = reactions[emoji] ? [...reactions[emoji]] : [];
  const idx = list.indexOf(userId);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(userId);
  }

  if (list.length > 0) {
    reactions[emoji] = list;
  } else {
    delete reactions[emoji];
  }

  return { ...message, reactions };
}

export function togglePinChatMessage(
  message: CommunityChatMessage,
  requestingRole: UserRole
): { ok: true; message: CommunityChatMessage } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can pin messages.' };
  }
  return {
    ok: true,
    message: { ...message, isPinned: !message.isPinned },
  };
}

export function moderateChatMessage(
  message: CommunityChatMessage,
  requestingRole: UserRole,
  reason: string
): { ok: true; message: CommunityChatMessage } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can moderate messages.' };
  }
  return {
    ok: true,
    message: {
      ...message,
      isModerated: true,
      moderationReason: reason || 'Flagged by community moderator',
      updatedAt: new Date().toISOString(),
    },
  };
}

/* ============================================================================
   4. Unread Calculations
   ============================================================================ */

export function calculateUnreadMessageCount(
  messages: CommunityChatMessage[],
  channelId: string,
  lastReadTimestamp?: string | null,
  currentUserId?: string
): number {
  const lastReadMs = lastReadTimestamp ? new Date(lastReadTimestamp).getTime() : 0;

  return messages.reduce((count, m) => {
    if (m.channelId !== channelId) return count;
    if (m.isModerated) return count;
    if (currentUserId && (m.userId === currentUserId || m.authorId === currentUserId)) {
      return count;
    }
    const messageMs = new Date(m.createdAt).getTime();
    if (messageMs > lastReadMs) {
      return count + 1;
    }
    return count;
  }, 0);
}

export function calculateTotalUnreadCount(
  messages: CommunityChatMessage[],
  channels: CommunityChannel[],
  lastReadByChannel: Record<string, string>,
  currentUserId?: string
): number {
  return channels.reduce((sum, ch) => {
    const unread = calculateUnreadMessageCount(
      messages,
      ch.id,
      lastReadByChannel[ch.id] || null,
      currentUserId
    );
    return sum + unread;
  }, 0);
}

/* ============================================================================
   5. Forum Thread Operations
   ============================================================================ */

export function createForumThread(params: {
  title: string;
  body?: string;
  content?: string;
  category: string;
  productId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  tags?: string[];
}): { ok: true; thread: CommunityForumThread } | { ok: false; error: string } {
  const title = (params.title || '').trim();
  if (title.length < 5 || title.length > 150) {
    return { ok: false, error: 'Thread title must be between 5 and 150 characters.' };
  }

  const rawBody = params.body || params.content || '';
  const body = rawBody.trim();
  if (body.length < 10) {
    return { ok: false, error: 'Thread body must be at least 10 characters.' };
  }

  if (!params.authorId || !params.authorName) {
    return { ok: false, error: 'Author details required.' };
  }

  const slug = slugifyText(title) || `thread-${Date.now()}`;
  const id = `th_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const cleanTags = (params.tags || [])
    .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
    .filter((t) => t.length > 0)
    .slice(0, 5);

  const thread: CommunityForumThread = {
    id,
    slug,
    title,
    body,
    content: body,
    category: params.category || 'General',
    productId: params.productId,
    authorId: params.authorId,
    authorName: params.authorName,
    authorRole: params.authorRole,
    authorAvatar: params.authorAvatar,
    tags: cleanTags,
    upvotes: 0,
    upvotedUserIds: [],
    viewsCount: 0,
    replyCount: 0,
    isPinned: false,
    pinned: false,
    isLocked: false,
    isSolved: false,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  return { ok: true, thread };
}

/**
 * Automatically archives a high-value assistant answer into a CommunityForumThread
 * for community discussions/FAQ, SEO indexing, and reusable knowledge.
 */
export async function archiveAssistantAnswerToCommunity(
  question: string,
  answer: string,
  topics: string[] = [],
  existingThreads: CommunityForumThread[] = []
): Promise<CommunityForumThread | null> {
  const cleanQ = (question || '').trim();
  const cleanA = (answer || '').trim();

  // Substantive depth requirement: question >= 15 chars, answer is comprehensive (>= 20 chars)
  if (cleanQ.length < 15 || cleanA.length < 20) {
    return null;
  }

  const slug = slugifyText(cleanQ) || `faq-${Date.now()}`;

  // Check if thread with matching slug or title already exists
  const duplicate = existingThreads.some(
    (t) =>
      t.slug === slug ||
      t.title.trim().toLowerCase() === cleanQ.toLowerCase()
  );
  if (duplicate) {
    return null;
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const id = `th_faq_${timestamp}_${random}`;
  const now = new Date(timestamp).toISOString();

  // Category determination: 'FAQ' or 'Course Q&A'
  const isCourseQuestion = topics.some((topic) =>
    ['react', 'web-development', 'curriculum', 'lecture', 'hooks', 'course'].includes(
      topic.toLowerCase()
    )
  );
  const category = isCourseQuestion ? 'Course Q&A' : 'FAQ';

  const cleanTags = Array.from(
    new Set([
      'faq',
      'assistant-archive',
      ...topics
        .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
        .filter((t) => t.length > 0),
    ])
  ).slice(0, 6);

  const thread: CommunityForumThread = {
    id,
    slug,
    title: cleanQ.length > 150 ? cleanQ.slice(0, 147) + '...' : cleanQ,
    body: cleanA,
    content: cleanA,
    category,
    authorId: 'dwc-ai-assistant',
    authorName: 'DWC AI Assistant',
    authorRole: 'instructor',
    tags: cleanTags,
    upvotes: 0,
    upvotedUserIds: [],
    viewsCount: 1,
    replyCount: 0,
    isPinned: false,
    pinned: false,
    isLocked: false,
    isSolved: true,
    createdAt: now,
    updatedAt: now,
    lastActivityAt: now,
  };

  return thread;
}

export function filterAndSortForumThreads(
  threads: CommunityForumThread[],
  options?: {
    category?: string;
    productId?: string;
    tag?: string;
    search?: string;
    sortBy?: 'activity' | 'recent' | 'popular' | 'unanswered';
    includeModerated?: boolean;
  }
): CommunityForumThread[] {
  const filtered = threads.filter((t) => {
    if (!options?.includeModerated && t.isModerated) return false;
    if (options?.category && options.category !== 'all') {
      if (t.category.toLowerCase() !== options.category.toLowerCase()) return false;
    }
    if (options?.productId && t.productId !== options.productId) return false;
    if (options?.tag) {
      const qTag = options.tag.toLowerCase();
      if (!t.tags.some((tag) => tag.toLowerCase() === qTag)) return false;
    }
    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      const inTitle = t.title.toLowerCase().includes(q);
      const inBody = (t.body || t.content || '').toLowerCase().includes(q);
      const inTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!inTitle && !inBody && !inTags) return false;
    }
    return true;
  });

  const sortBy = options?.sortBy || 'activity';

  return [...filtered].sort((a, b) => {
    const aPinned = Boolean(a.isPinned || a.pinned);
    const bPinned = Boolean(b.isPinned || b.pinned);
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }

    if (sortBy === 'popular') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'unanswered') {
      const aUnanswered = a.replyCount === 0 ? 0 : 1;
      const bUnanswered = b.replyCount === 0 ? 0 : 1;
      if (aUnanswered !== bUnanswered) {
        return aUnanswered - bUnanswered;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Default 'activity'
    return new Date(b.lastActivityAt || b.updatedAt).getTime() - new Date(a.lastActivityAt || a.updatedAt).getTime();
  });
}

export function toggleThreadUpvote(
  thread: CommunityForumThread,
  userId: string
): CommunityForumThread {
  const currentList = thread.upvotedUserIds ? [...thread.upvotedUserIds] : [];
  const idx = currentList.indexOf(userId);

  if (idx >= 0) {
    currentList.splice(idx, 1);
    return {
      ...thread,
      upvotedUserIds: currentList,
      upvotes: Math.max(0, (thread.upvotes || 1) - 1),
    };
  } else {
    currentList.push(userId);
    return {
      ...thread,
      upvotedUserIds: currentList,
      upvotes: (thread.upvotes || 0) + 1,
    };
  }
}

export function togglePinThread(
  thread: CommunityForumThread,
  requestingRole: UserRole
): { ok: true; thread: CommunityForumThread } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can pin threads.' };
  }
  const nextPinned = !thread.isPinned;
  return {
    ok: true,
    thread: {
      ...thread,
      isPinned: nextPinned,
      pinned: nextPinned,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function toggleLockThread(
  thread: CommunityForumThread,
  requestingRole: UserRole
): { ok: true; thread: CommunityForumThread } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can lock threads.' };
  }
  return {
    ok: true,
    thread: {
      ...thread,
      isLocked: !thread.isLocked,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function moderateThread(
  thread: CommunityForumThread,
  requestingRole: UserRole,
  reason: string
): { ok: true; thread: CommunityForumThread } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can moderate threads.' };
  }
  return {
    ok: true,
    thread: {
      ...thread,
      isModerated: true,
      moderationReason: reason || 'Flagged by community moderator',
      updatedAt: new Date().toISOString(),
    },
  };
}

/* ============================================================================
   6. Forum Reply & Solution Workflows
   ============================================================================ */

export function createForumReply(params: {
  thread: CommunityForumThread;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  body?: string;
  content?: string;
}): { ok: true; reply: CommunityForumReply; updatedThread: CommunityForumThread } | { ok: false; error: string } {
  if (params.thread.isLocked) {
    return { ok: false, error: 'Cannot reply to a locked thread.' };
  }

  const rawBody = params.body || params.content || '';
  const body = rawBody.trim();
  if (!body) {
    return { ok: false, error: 'Reply body cannot be empty.' };
  }

  const now = new Date().toISOString();
  const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const reply: CommunityForumReply = {
    id,
    threadId: params.thread.id,
    authorId: params.authorId,
    authorName: params.authorName,
    authorRole: params.authorRole,
    authorAvatar: params.authorAvatar,
    body,
    content: body,
    upvotes: 0,
    upvotedUserIds: [],
    isSolution: false,
    isPinned: false,
    isModerated: false,
    createdAt: now,
  };

  const updatedThread: CommunityForumThread = {
    ...params.thread,
    replyCount: (params.thread.replyCount || 0) + 1,
    lastActivityAt: now,
    updatedAt: now,
  };

  return { ok: true, reply, updatedThread };
}

export function filterForumReplies(
  replies: CommunityForumReply[],
  threadId: string,
  options?: { includeModerated?: boolean }
): CommunityForumReply[] {
  const filtered = replies.filter((r) => {
    if (r.threadId !== threadId) return false;
    if (!options?.includeModerated && r.isModerated) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (a.isSolution !== b.isSolution) {
      return a.isSolution ? -1 : 1;
    }
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function toggleReplyUpvote(
  reply: CommunityForumReply,
  userId: string
): CommunityForumReply {
  const currentList = reply.upvotedUserIds ? [...reply.upvotedUserIds] : [];
  const idx = currentList.indexOf(userId);

  if (idx >= 0) {
    currentList.splice(idx, 1);
    return {
      ...reply,
      upvotedUserIds: currentList,
      upvotes: Math.max(0, (reply.upvotes || 1) - 1),
    };
  } else {
    currentList.push(userId);
    return {
      ...reply,
      upvotedUserIds: currentList,
      upvotes: (reply.upvotes || 0) + 1,
    };
  }
}

export function markReplyAsSolution(
  thread: CommunityForumThread,
  reply: CommunityForumReply,
  requestingUser: { id: string; role: UserRole }
): { ok: true; updatedThread: CommunityForumThread; updatedReply: CommunityForumReply } | { ok: false; error: string } {
  const isAuthor = thread.authorId === requestingUser.id;
  const isStaff = requestingUser.role === 'admin' || requestingUser.role === 'instructor';

  if (!isAuthor && !isStaff) {
    return { ok: false, error: 'Unauthorized: Only thread author or staff can mark solutions.' };
  }
  if (reply.threadId !== thread.id) {
    return { ok: false, error: 'Reply does not belong to this thread.' };
  }

  const now = new Date().toISOString();
  const updatedReply: CommunityForumReply = {
    ...reply,
    isSolution: true,
    updatedAt: now,
  };

  const updatedThread: CommunityForumThread = {
    ...thread,
    isSolved: true,
    solutionReplyId: reply.id,
    lastActivityAt: now,
    updatedAt: now,
  };

  return { ok: true, updatedThread, updatedReply };
}

export function moderateReply(
  reply: CommunityForumReply,
  requestingRole: UserRole,
  reason: string
): { ok: true; reply: CommunityForumReply } | { ok: false; error: string } {
  if (requestingRole !== 'admin' && requestingRole !== 'instructor') {
    return { ok: false, error: 'Unauthorized: Only admins and instructors can moderate replies.' };
  }
  return {
    ok: true,
    reply: {
      ...reply,
      isModerated: true,
      moderationReason: reason || 'Flagged by community moderator',
      updatedAt: new Date().toISOString(),
    },
  };
}

/* ============================================================================
   7. Global Search & Community Metrics
   ============================================================================ */

export function searchCommunity(
  query: string,
  channels: CommunityChannel[],
  messages: CommunityChatMessage[],
  threads: CommunityForumThread[]
): {
  matchedChannels: CommunityChannel[];
  matchedMessages: CommunityChatMessage[];
  matchedThreads: CommunityForumThread[];
} {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return {
      matchedChannels: channels,
      matchedMessages: messages.filter((m) => !m.isModerated),
      matchedThreads: threads.filter((t) => !t.isModerated),
    };
  }

  const matchedChannels = channels.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  );

  const matchedMessages = messages.filter(
    (m) =>
      !m.isModerated &&
      ((m.content || '').toLowerCase().includes(q) ||
        (m.userName || m.authorName || '').toLowerCase().includes(q))
  );

  const matchedThreads = threads.filter(
    (t) =>
      !t.isModerated &&
      (t.title.toLowerCase().includes(q) ||
        (t.body || t.content || '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)))
  );

  return { matchedChannels, matchedMessages, matchedThreads };
}

export function getCommunityStats(
  channels: CommunityChannel[],
  messages: CommunityChatMessage[],
  threads: CommunityForumThread[],
  replies: CommunityForumReply[]
): CommunitySummaryStats {
  return {
    totalChannels: channels.length,
    totalMessages: messages.filter((m) => !m.isModerated).length,
    totalThreads: threads.filter((t) => !t.isModerated).length,
    totalReplies: replies.filter((r) => !r.isModerated).length,
    solvedThreadsCount: threads.filter((t) => !t.isModerated && t.isSolved).length,
  };
}
