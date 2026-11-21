import React, { useState } from 'react';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Pin,
  Lock,
  Trash2,
  Send,
  Sparkles,
  Tag,
  Shield,
  GraduationCap,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CommunityForumReply, UserRole } from '../../types/marketplace';

interface ThreadDetailViewProps {
  threadId: string;
  onBack: () => void;
}

export const ThreadDetailView: React.FC<ThreadDetailViewProps> = ({ threadId, onBack }) => {
  const {
    forumThreads,
    forumReplies,
    currentUser,
    upvoteForumThread,
    createForumReply,
    upvoteForumReply,
    markAcceptedForumReply,
    deleteForumReply,
    toggleThreadPin,
    toggleThreadLock,
    deleteForumThread,
    quickLoginAsRole,
  } = useStore();

  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const thread = forumThreads.find((t) => t.id === threadId);

  if (!thread) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Discussion thread not found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This thread may have been removed or archived.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-[#f5c451] text-xs font-bold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discussions
        </button>
      </div>
    );
  }

  const threadReplies = forumReplies.filter((r) => r.threadId === thread.id);
  const isUpvoted = currentUser && thread.upvotedUserIds?.includes(currentUser.id);
  const isAuthor = currentUser?.id === thread.authorId;
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'instructor';
  const isPinned = Boolean(thread.isPinned || thread.pinned);

  // Solution reply if any
  const solutionReply = thread.solutionReplyId
    ? threadReplies.find((r) => r.id === thread.solutionReplyId)
    : threadReplies.find((r) => r.isSolution);

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setSubmitting(true);
    const res = createForumReply(thread.id, replyBody);
    setSubmitting(false);

    if (res.ok) {
      setReplyBody('');
    }
  };

  const renderRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 border border-amber-300">
            <Shield className="w-3 h-3 text-amber-600" /> Admin
          </span>
        );
      case 'instructor':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-700 border border-blue-300">
            <GraduationCap className="w-3 h-3 text-blue-600" /> Instructor
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 max-w-4xl mx-auto w-full">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussion Boards</span>
        </button>

        {isStaff && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleThreadPin(thread.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                isPinned
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-amber-600" />
              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleThreadLock(thread.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                thread.isLocked
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>{thread.isLocked ? 'Unlock' : 'Lock'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this discussion thread?')) {
                  deleteForumThread(thread.id);
                  onBack();
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Original Post Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {thread.category}
          </span>
          {isPinned && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              <Pin className="w-3 h-3 text-amber-600" /> Pinned
            </span>
          )}
          {thread.isSolved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Solved
            </span>
          )}
          {thread.isLocked && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              <Lock className="w-3 h-3 text-slate-500" /> Locked
            </span>
          )}
        </div>

        {/* Thread Title */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
          {thread.title}
        </h1>

        {/* Author Meta Row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-[#0a192f] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
            {thread.authorAvatar ? (
              <img src={thread.authorAvatar} alt={thread.authorName} className="w-full h-full object-cover" />
            ) : (
              thread.authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm">{thread.authorName}</span>
            {renderRoleBadge(thread.authorRole)}
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Posted on {new Date(thread.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Thread Full Body */}
        <div className="text-sm text-slate-800 mt-5 leading-relaxed whitespace-pre-wrap break-words">
          {thread.body || thread.content}
        </div>

        {/* Tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-5 pt-4 border-t border-slate-100">
            {thread.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-mono"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Upvote & Reply stats */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => upvoteForumThread(thread.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              isUpvoted
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-amber-600 text-amber-600' : ''}`} />
            <span>{isUpvoted ? 'Upvoted' : 'Upvote'}</span>
            <span className="bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
              {thread.upvotes || 0}
            </span>
          </button>

          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>{threadReplies.length} replies</span>
          </span>
        </div>
      </div>

      {/* Verified Solution Highlight Card if present */}
      {solutionReply && (
        <div className="bg-emerald-50/70 border-2 border-emerald-400 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Verified Solution
            </span>
            <span className="text-[11px] text-emerald-800 font-medium">
              Marked by thread author or instructor
            </span>
          </div>

          <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
            {solutionReply.body || solutionReply.content}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-900">
            <span className="font-bold">Answered by {solutionReply.authorName}</span>
            <span className="text-[11px]">
              {new Date(solutionReply.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Replies Stream */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Replies ({threadReplies.length})</span>
        </h3>

        {threadReplies.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No replies yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Have insights or an answer? Post your reply below!
            </p>
          </div>
        ) : (
          threadReplies.map((reply: CommunityForumReply) => {
            const replyUpvoted = currentUser && reply.upvotedUserIds?.includes(currentUser.id);
            const canMarkSolution = (isAuthor || isStaff) && !reply.isSolution;
            const canDeleteReply =
              currentUser?.id === reply.authorId ||
              currentUser?.role === 'admin' ||
              currentUser?.role === 'instructor';

            return (
              <div
                key={reply.id}
                className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${
                  reply.isSolution
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0a192f] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {reply.authorAvatar ? (
                        <img src={reply.authorAvatar} alt={reply.authorName} className="w-full h-full object-cover" />
                      ) : (
                        reply.authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900">{reply.authorName}</span>
                    {renderRoleBadge(reply.authorRole)}
                    <span className="text-[11px] text-slate-400">
                      {new Date(reply.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {reply.isSolution && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Solution
                      </span>
                    )}
                  </div>

                  {canDeleteReply && (
                    <button
                      type="button"
                      onClick={() => deleteForumReply(reply.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 text-xs"
                      title="Delete reply"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words pl-9">
                  {reply.body || reply.content}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 pl-9">
                  <button
                    type="button"
                    onClick={() => upvoteForumReply(reply.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      replyUpvoted
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${replyUpvoted ? 'fill-amber-600 text-amber-600' : ''}`} />
                    <span>{reply.upvotes || 0}</span>
                  </button>

                  {canMarkSolution && (
                    <button
                      type="button"
                      onClick={() => markAcceptedForumReply(thread.id, reply.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark as Verified Solution</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Composer Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        {thread.isLocked ? (
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-slate-600 text-xs font-medium">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>This discussion thread is locked. No further replies can be added.</span>
          </div>
        ) : !currentUser ? (
          <div className="p-4 bg-gradient-to-r from-[#0a192f] to-[#162a4d] rounded-xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#f5c451] shrink-0" />
              <p className="text-xs text-slate-200">
                Sign in to participate in discussion threads and share your questions or solutions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => quickLoginAsRole('customer')}
              className="px-4 py-1.5 bg-[#f5c451] hover:bg-[#d4af37] text-slate-950 text-xs font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handlePostReply} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leave a Reply
            </h4>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your constructive reply, answer, or technical solution..."
              rows={4}
              required
              className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] resize-y"
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !replyBody.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#0a192f] hover:bg-[#162a4d] disabled:opacity-40 text-[#f5c451] text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Posting...' : 'Post Reply'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
