import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStoreValueForRead,
  mergeById,
  mergeStoreValue,
  sanitizeEventRegistrations,
} from './storeSync';

const anon = { isAdmin: false, role: null };
const student = { isAdmin: false, role: 'customer', selfUserId: 'user-student-1' };
const instructor = { isAdmin: false, role: 'instructor', selfUserId: 'user-instructor-1' };
const admin = { isAdmin: true, role: 'admin', selfUserId: 'user-admin-1' };

/** Narrow a merge result's `value` to a list for assertions. */
function list(value: unknown): any[] {
  assert.ok(Array.isArray(value), 'expected merged value to be an array');
  return value as any[];
}

/** Index an array-valued merge result by record id. */
function byId(value: unknown): Map<string, any> {
  return new Map(list(value).map((u: { id: string }) => [u.id, u]));
}

test('mergeById upserts by id, appends new records and rejects id-less records', () => {
  const existing = [
    { id: 'a', v: 1 },
    { id: 'b', v: 2 },
  ];
  const { value, added, rejected } = mergeById(existing, [
    { id: 'a', v: 9 },
    { id: 'c', v: 3 },
    { v: 4 },
  ]);
  assert.equal(added, 1);
  assert.equal(rejected, 1);
  assert.deepEqual(
    value.map((x) => `${x.id}:${x.v}`),
    ['a:9', 'b:2', 'c:3']
  );
});

test('personal keys reject anonymous writers and scope signed-in users to their own records', () => {
  const existing = [
    { id: 'ord-1', userId: 'user-student-1', total: 100 },
    { id: 'ord-2', userId: 'someone-else', total: 500 },
  ];

  const denied = mergeStoreValue('orders', existing, existing, anon);
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.status, 401);

  const forged = mergeStoreValue(
    'orders',
    existing,
    [{ id: 'ord-3', userId: 'someone-else', total: 9999 }, { id: 'ord-4', userId: 'user-student-1', total: 42 }],
    student
  );
  assert.equal(forged.ok, true);
  if (forged.ok) {
    // Foreign forged order dropped; own order upserted; existing foreign order untouched.
    const ids = list(forged.value).map((o: { id: string }) => o.id);
    assert.deepEqual(ids.sort(), ['ord-1', 'ord-2', 'ord-4']);
    assert.ok(!ids.includes('ord-3'));
  }

  const adminAll = mergeStoreValue('orders', existing, [{ id: 'ord-2', userId: 'someone-else', total: 1 }], admin);
  assert.equal(adminAll.ok, true);
  if (adminAll.ok) {
    // Personal keys are upsert-merge even for admins: both records survive, ord-2 updated.
    assert.equal(list(adminAll.value).length, 2);
    assert.equal(list(adminAll.value)[1].total, 1);
  }
});

test('users merge: anonymous may add but never modify; passwords are never blanked', () => {
  const existing = [
    { id: 'u-1', email: 'a@x.com', password: 'pbkdf2$100000$salt$hash' },
    { id: 'u-2', email: 'b@x.com', password: 'demo1234' },
  ];

  // Anonymous cannot modify an existing account, only append new ones.
  const anonAttempt = mergeStoreValue(
    'users',
    existing,
    [
      { id: 'u-1', email: 'a@x.com', password: 'hijacked' },
      { id: 'u-3', email: 'c@x.com', password: 'new-secret' },
      { id: 'u-4', email: 'd@x.com', password: '' },
    ],
    anon
  );
  assert.equal(anonAttempt.ok, true);
  if (anonAttempt.ok) {
    const byId = new Map(list(anonAttempt.value).map((u: { id: string }) => [u.id, u as unknown as { password: string }]));
    assert.equal(byId.get('u-1')?.password, 'pbkdf2$100000$salt$hash');
    assert.ok(byId.has('u-3'));
    assert.ok(!byId.has('u-4'), 'passwordless records must never be created');
    assert.equal(anonAttempt.added, 1);
  }

  // A user session may update only their own record, and cannot blank their password.
  const selfUpdate = mergeStoreValue(
    'users',
    existing,
    [{ id: 'u-2', email: 'b@x.com', password: '' }, { id: 'u-1', email: 'a@x.com', password: 'other' }],
    { isAdmin: false, role: 'customer', selfUserId: 'u-2' }
  );
  assert.equal(selfUpdate.ok, true);
  if (selfUpdate.ok) {
    const byId = new Map(list(selfUpdate.value).map((u: { id: string }) => [u.id, u as unknown as { password: string }]));
    assert.equal(byId.get('u-2')?.password, 'demo1234');
    assert.equal(byId.get('u-1')?.password, 'pbkdf2$100000$salt$hash');
  }

  // Admin may update anyone.
  const adminUpdate = mergeStoreValue(
    'users',
    existing,
    [{ id: 'u-1', email: 'a@x.com', password: 'pbkdf2$100000$salt$newhash' }],
    admin
  );
  assert.equal(adminUpdate.ok, true);
  if (adminUpdate.ok) {
    const byId = new Map(list(adminUpdate.value).map((u: { id: string }) => [u.id, u as unknown as { password: string }]));
    assert.equal(byId.get('u-1')?.password, 'pbkdf2$100000$salt$newhash');
  }
});

test('event_registrations: anonymous writers are append-only with server-side duplicate detection', () => {
  const existing = [
    { id: 'r-1', eventId: 'ev-1', email: 'taken@x.com', fullName: 'Taken' },
  ];

  // A partial overwrite attempt can never wipe existing registrations.
  const wipe = mergeStoreValue('event_registrations', existing, [], anon);
  assert.equal(wipe.ok, true);
  if (wipe.ok) assert.equal(list(wipe.value).length, 1);

  const next = mergeStoreValue(
    'event_registrations',
    existing,
    [
      { id: 'r-1', eventId: 'ev-1', email: 'taken@x.com', fullName: 'Taken' }, // idempotent re-push
      { id: 'r-2', eventId: 'ev-1', email: 'TAKEN@x.com', fullName: 'Dup Email' }, // dup per event
      { id: 'r-3', eventId: 'ev-1', email: 'new@x.com', fullName: 'New Attendee' }, // valid
      { id: 'r-4', email: 'missing-event@x.com', fullName: 'Invalid' }, // invalid shape
    ],
    anon
  );
  assert.equal(next.ok, true);
  if (next.ok) {
    assert.equal(list(next.value).length, 2);
    assert.equal(next.added, 1);
    assert.equal(next.skippedDuplicates, 1);
    assert.equal(next.rejected, 1);
  }

  const badShape = mergeStoreValue('event_registrations', existing, [{ nope: true }], anon);
  assert.equal(badShape.ok, true);
  if (badShape.ok) assert.equal(badShape.rejected, 1);
});

test('products: admin replaces (deletions propagate), instructors only upsert their own, others are denied', () => {
  const existing = [
    { id: 'p-1', instructorId: 'user-instructor-1' },
    { id: 'p-2', instructorId: 'someone-else' },
  ];

  const anonWrite = mergeStoreValue('products', existing, existing, anon);
  assert.equal(anonWrite.ok, false);
  if (!anonWrite.ok) assert.equal(anonWrite.status, 403);

  const instructorFlood = mergeStoreValue(
    'products',
    existing,
    [
      { id: 'p-1', instructorId: 'user-instructor-1', title: 'edited' },
      { id: 'p-2', instructorId: 'someone-else', title: 'hijacked' },
      { id: 'p-3', instructorId: 'user-instructor-1', title: 'new' },
    ],
    instructor
  );
  assert.equal(instructorFlood.ok, true);
  if (instructorFlood.ok) {
    const byIdMap = byId(instructorFlood.value);
    assert.equal(byIdMap.get('p-1').title, 'edited');
    assert.equal(byIdMap.get('p-2').title, undefined);
    assert.ok(byIdMap.has('p-3'));
  }

  const adminDelete = mergeStoreValue('products', existing, [{ id: 'p-1', instructorId: 'user-instructor-1' }], admin);
  assert.equal(adminDelete.ok, true);
  if (adminDelete.ok) assert.equal(list(adminDelete.value).length, 1, 'admin replace must drop deleted products');
});

test('admin-only keys reject non-admin writers and replace for admins', () => {
  for (const key of ['events', 'coupons', 'appearance', 'social_drafts', 'blog_posts']) {
    const denied = mergeStoreValue(key, [{ id: 'x' }], [{ id: 'y' }], student);
    assert.equal(denied.ok, false, `${key} must deny non-admin`);
    const allowed = mergeStoreValue(key, [{ id: 'x' }], [{ id: 'y' }], admin);
    assert.equal(allowed.ok, true, `${key} must allow admin`);
    if (allowed.ok) assert.deepEqual(allowed.value, [{ id: 'y' }]);
  }
});

test('blog_bookmarks and progress are owner-scoped for signed-in users', () => {
  const denied = mergeStoreValue('blog_bookmarks', { a: ['b'] }, { a: ['b'] }, anon);
  assert.equal(denied.ok, false);

  const bookmarks = mergeStoreValue(
    'blog_bookmarks',
    { 'user-student-1': ['old'], other: ['keep'] },
    { 'user-student-1': ['new'], other: ['clobbered'] },
    student
  );
  assert.equal(bookmarks.ok, true);
  if (bookmarks.ok) {
    assert.deepEqual(bookmarks.value, { 'user-student-1': ['new'], other: ['keep'] });
  }

  const progressDenied = mergeStoreValue('progress', [], [{ userId: 'user-student-1', productId: 'p' }], anon);
  assert.equal(progressDenied.ok, false);

  const progress = mergeStoreValue(
    'progress',
    [{ userId: 'other', productId: 'p-1', updatedAt: 'old' }],
    [
      { userId: 'other', productId: 'p-1', updatedAt: 'hijack' },
      { userId: 'user-student-1', productId: 'p-1', updatedAt: 'mine' },
    ],
    student
  );
  assert.equal(progress.ok, true);
  if (progress.ok) {
    assert.equal(list(progress.value).length, 2);
    const own = list(progress.value).find((p: { userId: string }) => p.userId === 'user-student-1') as { updatedAt: string };
    assert.equal(own.updatedAt, 'mine');
    const foreign = list(progress.value).find((p: { userId: string }) => p.userId === 'other') as { updatedAt: string };
    assert.equal(foreign.updatedAt, 'old', 'foreign progress must not be modified');
  }
});

test('read filters: anonymous gets public data only, with event attendee PII stripped', () => {
  const products = [{ id: 'p-1' }];
  assert.deepEqual(filterStoreValueForRead('products', products, anon), products);
  assert.equal(filterStoreValueForRead('orders', [{ id: 'o' }], anon), null);
  assert.equal(filterStoreValueForRead('users', [{ id: 'u' }], anon), null);
  assert.equal(filterStoreValueForRead('social_drafts', [{ id: 's' }], anon), null);
  assert.equal(filterStoreValueForRead('progress', [{ id: 'x' }], anon), null);

  const regs = [
    {
      id: 'r-1',
      eventId: 'ev-1',
      email: 'person@x.com',
      fullName: 'Person',
      phone: '+2341',
      confirmationCode: 'CODE',
      paymentStatus: 'free',
    },
  ];
  const sanitized = filterStoreValueForRead('event_registrations', regs, anon);
  assert.ok(Array.isArray(sanitized));
  const first = (sanitized as Array<Record<string, unknown>>)[0];
  assert.equal(first.email, undefined);
  assert.equal(first.fullName, undefined);
  assert.equal(first.phone, undefined);
  assert.equal(first.confirmationCode, undefined);
  assert.equal(first.paymentStatus, 'free', 'capacity-relevant fields are preserved');
});

test('read filters: signed-in users see only their own records; admins see everything', () => {
  const orders = [
    { id: 'ord-1', userId: 'user-student-1' },
    { id: 'ord-2', userId: 'other' },
  ];
  assert.deepEqual(filterStoreValueForRead('orders', orders, student), [orders[0]]);
  assert.deepEqual(filterStoreValueForRead('orders', orders, { isAdmin: true }), orders);

  const users = [
    { id: 'user-student-1', email: 'me@x.com', password: 'pbkdf2$1$s$2' },
    { id: 'other', email: 'other@x.com', password: 'pbkdf2$1$s$3' },
  ];
  const self = filterStoreValueForRead('users', users, student);
  assert.deepEqual(self, [users[0]], 'own record incl. password verifier for offline login');
  assert.equal(filterStoreValueForRead('users', users, anon), null);
  assert.deepEqual(filterStoreValueForRead('users', users, { isAdmin: true }), users);

  const bookmarks = { 'user-student-1': ['b1'], other: ['b2'] };
  assert.deepEqual(filterStoreValueForRead('blog_bookmarks', bookmarks, student), {
    'user-student-1': ['b1'],
  });
  assert.deepEqual(filterStoreValueForRead('blog_bookmarks', bookmarks, anon), null);

  const regs = [{ id: 'r-1', email: 'x@y.com', fullName: 'X' }];
  assert.deepEqual(filterStoreValueForRead('event_registrations', regs, { isAdmin: true }), regs);

  const campaigns = [{ id: 'c-1' }];
  assert.equal(filterStoreValueForRead('email_campaigns', campaigns, student), null);
  assert.deepEqual(filterStoreValueForRead('email_campaigns', campaigns, { isAdmin: true }), campaigns);
});

test('sanitizeEventRegistrations strips every contact field from each record', () => {
  const out = sanitizeEventRegistrations([
    {
      id: 'r',
      eventId: 'e',
      email: 'a@b.c',
      fullName: 'A',
      phone: '1',
      organization: 'Org',
      roleTitle: 'Dev',
      learningGoals: 'learn',
      newsletterOptIn: true,
      confirmationCode: 'X',
      paymentStatus: 'free',
      registeredAt: 'now',
    },
  ]);
  const rec = out[0] as Record<string, unknown>;
  for (const field of ['email', 'fullName', 'phone', 'organization', 'roleTitle', 'learningGoals', 'newsletterOptIn', 'confirmationCode']) {
    assert.equal(field in rec, false, `${field} must be stripped`);
  }
  assert.equal(rec.paymentStatus, 'free');
  assert.equal(rec.registeredAt, 'now');
});

test('community collections permit public read for anonymous visitors', () => {
  const channels = [{ id: 'c-1', name: 'General' }];
  const messages = [{ id: 'm-1', content: 'Hello' }];
  const threads = [{ id: 't-1', title: 'Discussion' }];
  const replies = [{ id: 'r-1', body: 'Reply' }];

  assert.deepEqual(filterStoreValueForRead('community_channels', channels, anon), channels);
  assert.deepEqual(filterStoreValueForRead('community_messages', messages, anon), messages);
  assert.deepEqual(filterStoreValueForRead('forum_threads', threads, anon), threads);
  assert.deepEqual(filterStoreValueForRead('forum_replies', replies, anon), replies);
});

test('community collections enforce authentication and RBAC for writes', () => {
  // 1. Anonymous writes are rejected
  const anonMsg = mergeStoreValue('community_messages', [], [{ id: 'm-1', content: 'Hello' }], anon);
  assert.equal(anonMsg.ok, false);
  if (!anonMsg.ok) assert.equal(anonMsg.status, 401);

  const anonThread = mergeStoreValue('forum_threads', [], [{ id: 't-1', title: 'Test' }], anon);
  assert.equal(anonThread.ok, false);
  if (!anonThread.ok) assert.equal(anonThread.status, 401);

  const anonReply = mergeStoreValue('forum_replies', [], [{ id: 'r-1', body: 'Test' }], anon);
  assert.equal(anonReply.ok, false);
  if (!anonReply.ok) assert.equal(anonReply.status, 401);

  // 2. Channel writes require admin session
  const studentChan = mergeStoreValue('community_channels', [], [{ id: 'c-new', name: 'Student Chan' }], student);
  assert.equal(studentChan.ok, false);
  if (!studentChan.ok) assert.equal(studentChan.status, 403);

  const adminChan = mergeStoreValue('community_channels', [], [{ id: 'c-new', name: 'Official Chan' }], admin);
  assert.equal(adminChan.ok, true);

  // 3. User message forgery prevention: student cannot post under another user ID
  const forgedMsg = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-forge', userId: 'user-other', content: 'Impersonation' }],
    student
  );
  assert.equal(forgedMsg.ok, true);
  if (forgedMsg.ok) {
    // Forged message was rejected, not added
    assert.equal((forgedMsg.value as any[]).length, 0);
  }

  // 4. Legitimate student message succeeds
  const legitMsg = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-valid', userId: 'user-student-1', content: 'Legit message' }],
    student
  );
  assert.equal(legitMsg.ok, true);
  if (legitMsg.ok) {
    assert.equal((legitMsg.value as any[]).length, 1);
  }

  // 5. Non-author cannot alter peer message content, but CAN toggle reactions
  const existingMsgs = [
    { id: 'm-1', userId: 'user-instructor-1', content: 'Important notice', reactions: {} },
  ];
  const tampered = mergeStoreValue(
    'community_messages',
    existingMsgs,
    [{ id: 'm-1', userId: 'user-instructor-1', content: 'Hacked content', reactions: { '👍': ['user-student-1'] } }],
    student
  );
  assert.equal(tampered.ok, true);
  if (tampered.ok) {
    const list = tampered.value as any[];
    assert.equal(list[0].content, 'Important notice'); // preserved original
    assert.deepEqual(list[0].reactions, { '👍': ['user-student-1'] }); // reaction allowed
  }

  // 6. Forum thread author can edit, non-author can upvote but cannot edit title/content
  const existingThreads = [
    { id: 't-1', authorId: 'user-student-1', title: 'Original Title', body: 'Original Body', upvotes: 0, upvotedUserIds: [] },
  ];
  // Student (author) updates title
  const authorEdit = mergeStoreValue(
    'forum_threads',
    existingThreads,
    [{ id: 't-1', authorId: 'user-student-1', title: 'Updated Title', body: 'Original Body' }],
    student
  );
  assert.equal(authorEdit.ok, true);
  if (authorEdit.ok) {
    assert.equal((authorEdit.value as any[])[0].title, 'Updated Title');
  }

  // Instructor (non-author) upvotes but cannot change title
  const peerUpvote = mergeStoreValue(
    'forum_threads',
    existingThreads,
    [{ id: 't-1', authorId: 'user-student-1', title: 'Hacked by Peer', upvotes: 1, upvotedUserIds: ['user-instructor-1'] }],
    instructor
  );
  assert.equal(peerUpvote.ok, true);
  if (peerUpvote.ok) {
    const list = peerUpvote.value as any[];
    assert.equal(list[0].title, 'Original Title'); // title not changed by non-author
    assert.equal(list[0].upvotes, 1); // upvote permitted
  }

  // 7. Admin can pin/lock/edit/delete any thread
  const adminManage = mergeStoreValue(
    'forum_threads',
    existingThreads,
    [{ id: 't-1', authorId: 'user-student-1', title: 'Admin Pinned', isPinned: true, isLocked: true }],
    admin
  );
  assert.equal(adminManage.ok, true);
  if (adminManage.ok) {
    const list = adminManage.value as any[];
    assert.equal(list[0].isPinned, true);
    assert.equal(list[0].isLocked, true);
  }
});

test('RBAC hardening: non-admin student cannot create a message with isPinned: true, isModerated: true, forged reactions, or spoofed role', () => {
  const forged = mergeStoreValue(
    'community_messages',
    [],
    [
      {
        id: 'm-forge-1',
        userId: 'user-student-1',
        content: 'I claim to be admin and pinned',
        isPinned: true,
        isModerated: true,
        userRole: 'admin',
        authorRole: 'admin',
        reactions: { '🎉': ['user-admin-1', 'user-other-2'] },
      },
    ],
    student
  );

  assert.equal(forged.ok, true);
  if (forged.ok) {
    const records = list(forged.value);
    assert.equal(records.length, 1);
    const msg = records[0];
    assert.equal(msg.id, 'm-forge-1');
    assert.equal(msg.userId, 'user-student-1');
    assert.equal(msg.authorId, 'user-student-1');
    assert.equal(msg.isPinned, false, 'isPinned must be forced to false for non-admin on insertion');
    assert.equal(msg.isModerated, false, 'isModerated must be forced to false for non-admin on insertion');
    assert.equal(msg.userRole, 'customer', 'userRole must be bound to ctx.role');
    assert.equal(msg.authorRole, 'customer', 'authorRole must be bound to ctx.role');
    assert.deepEqual(msg.reactions, {}, 'reactions must be initialized empty on new message insertion');
  }
});

test('RBAC hardening: author ID and user ID mismatch on message insertion is sanitized or rejected', () => {
  // Case A: rec.userId matches selfUserId, but rec.authorId points to another user (impersonation attempt) -> rejected
  const mismatchAuthor = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-mismatch-1', userId: 'user-student-1', authorId: 'user-admin-1', content: 'Spoofed authorId' }],
    student
  );
  assert.equal(mismatchAuthor.ok, true);
  if (mismatchAuthor.ok) {
    assert.equal(list(mismatchAuthor.value).length, 0, 'Message with foreign authorId must be rejected');
    assert.equal(mismatchAuthor.rejected, 1);
  }

  // Case B: rec.authorId matches selfUserId, but rec.userId points to another user -> rejected
  const mismatchUser = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-mismatch-2', userId: 'user-admin-1', authorId: 'user-student-1', content: 'Spoofed userId' }],
    student
  );
  assert.equal(mismatchUser.ok, true);
  if (mismatchUser.ok) {
    assert.equal(list(mismatchUser.value).length, 0, 'Message with foreign userId must be rejected');
    assert.equal(mismatchUser.rejected, 1);
  }

  // Case C: valid payload with matching userId and authorId -> accepted and authorId/userId synced
  const validBoth = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-valid-both', userId: 'user-student-1', authorId: 'user-student-1', content: 'Valid message' }],
    student
  );
  assert.equal(validBoth.ok, true);
  if (validBoth.ok) {
    assert.equal(list(validBoth.value).length, 1);
    assert.equal(list(validBoth.value)[0].userId, 'user-student-1');
    assert.equal(list(validBoth.value)[0].authorId, 'user-student-1');
  }

  // Case D: valid payload providing only userId -> authorId is automatically set to selfUserId
  const validUserIdOnly = mergeStoreValue(
    'community_messages',
    [],
    [{ id: 'm-valid-useronly', userId: 'user-student-1', content: 'Valid message user only' }],
    student
  );
  assert.equal(validUserIdOnly.ok, true);
  if (validUserIdOnly.ok) {
    assert.equal(list(validUserIdOnly.value).length, 1);
    assert.equal(list(validUserIdOnly.value)[0].userId, 'user-student-1');
    assert.equal(list(validUserIdOnly.value)[0].authorId, 'user-student-1');
  }
});

test('RBAC hardening: non-admin student cannot create a forum thread with isPinned: true, isLocked: true, or isSolved: true', () => {
  const forgedThread = mergeStoreValue(
    'forum_threads',
    [],
    [
      {
        id: 't-forge-1',
        authorId: 'user-student-1',
        title: 'Hacked announcement thread',
        body: 'Spam content',
        isPinned: true,
        pinned: true,
        isLocked: true,
        isSolved: true,
        solutionReplyId: 'r-fake-solution',
        authorRole: 'admin',
      },
    ],
    student
  );

  assert.equal(forgedThread.ok, true);
  if (forgedThread.ok) {
    const records = list(forgedThread.value);
    assert.equal(records.length, 1);
    const thread = records[0];
    assert.equal(thread.id, 't-forge-1');
    assert.equal(thread.authorId, 'user-student-1');
    assert.equal(thread.isPinned, false, 'Non-admin cannot create pinned thread');
    assert.equal(thread.pinned, false, 'Non-admin cannot create pinned thread');
    assert.equal(thread.isLocked, false, 'Non-admin cannot create pre-locked thread');
    assert.equal(thread.isSolved, false, 'Non-admin cannot create pre-solved thread');
    assert.equal(thread.solutionReplyId, undefined, 'Non-admin cannot attach solutionReplyId on insert');
    assert.equal(thread.authorRole, 'customer', 'authorRole must match ctx.role');
  }
});

test('RBAC hardening: non-admin student cannot create a reply with isSolution: true, isPinned: true, or isModerated: true', () => {
  const forgedReply = mergeStoreValue(
    'forum_replies',
    [],
    [
      {
        id: 'r-forge-1',
        threadId: 't-1',
        authorId: 'user-student-1',
        body: 'Pre-solved accepted answer',
        isSolution: true,
        isPinned: true,
        isModerated: true,
        authorRole: 'admin',
      },
    ],
    student
  );

  assert.equal(forgedReply.ok, true);
  if (forgedReply.ok) {
    const records = list(forgedReply.value);
    assert.equal(records.length, 1);
    const reply = records[0];
    assert.equal(reply.id, 'r-forge-1');
    assert.equal(reply.authorId, 'user-student-1');
    assert.equal(reply.isSolution, false, 'Non-admin cannot insert reply with isSolution: true');
    assert.equal(reply.isPinned, false, 'Non-admin cannot insert reply with isPinned: true');
    assert.equal(reply.isModerated, false, 'Non-admin cannot insert reply with isModerated: true');
    assert.equal(reply.authorRole, 'customer', 'authorRole must match ctx.role');
  }
});

test('RBAC hardening: peer student cannot mark another students reply as isSolution: true', () => {
  const existingReplies = [
    {
      id: 'r-peer-1',
      threadId: 't-1',
      authorId: 'user-student-2',
      body: 'Peer constructive reply',
      isSolution: false,
      upvotes: 0,
      upvotedUserIds: [],
    },
  ];

  // Peer student attempts to mark peer's reply as verified solution while upvoting
  const peerTamper = mergeStoreValue(
    'forum_replies',
    existingReplies,
    [
      {
        id: 'r-peer-1',
        isSolution: true,
        upvotes: 1,
        upvotedUserIds: ['user-student-1'],
      },
    ],
    student
  );

  assert.equal(peerTamper.ok, true);
  if (peerTamper.ok) {
    const records = list(peerTamper.value);
    assert.equal(records.length, 1);
    const reply = records[0];
    assert.equal(reply.id, 'r-peer-1');
    assert.equal(reply.isSolution, false, 'Peer student must not be able to mark reply as solution');
    assert.equal(reply.upvotes, 1, 'Legitimate upvote must still be applied');
    assert.deepEqual(reply.upvotedUserIds, ['user-student-1']);
  }

  // Reply author also cannot mark their own reply as verified solution via store sync
  const authorAttempt = mergeStoreValue(
    'forum_replies',
    existingReplies,
    [
      {
        id: 'r-peer-1',
        authorId: 'user-student-2',
        body: 'Peer updated reply body',
        isSolution: true,
      },
    ],
    { isAdmin: false, role: 'customer', selfUserId: 'user-student-2' }
  );

  assert.equal(authorAttempt.ok, true);
  if (authorAttempt.ok) {
    const records = list(authorAttempt.value);
    assert.equal(records[0].isSolution, false, 'Reply author cannot mark self reply as solution');
    assert.equal(records[0].body, 'Peer updated reply body', 'Author body update is preserved');
  }

  // Admin CAN update isSolution
  const adminSolution = mergeStoreValue(
    'forum_replies',
    existingReplies,
    [
      {
        id: 'r-peer-1',
        isSolution: true,
      },
    ],
    admin
  );

  assert.equal(adminSolution.ok, true);
  if (adminSolution.ok) {
    const records = list(adminSolution.value);
    assert.equal(records[0].isSolution, true, 'Admin can mark reply as verified solution');
  }
});
