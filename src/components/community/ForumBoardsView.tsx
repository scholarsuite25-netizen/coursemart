import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  PlusCircle,
  Pin,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  GraduationCap,
  Shield,
  Tag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { DEFAULT_FORUM_CATEGORIES } from '../../utils/community';
import type { CommunityForumThread, UserRole } from '../../types/marketplace';

interface ForumBoardsViewProps {
  onSelectThread: (threadId: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onOpenNewThreadModal: () => void;
  searchQuery?: string;
}

export const ForumBoardsView: React.FC<ForumBoardsViewProps> = ({
  onSelectThread,
  selectedCategory = 'all',
  onCategoryChange,
  onOpenNewThreadModal,
  searchQuery = '',
}) => {
  const { forumThreads, currentUser, upvoteForumThread } = useStore();
  const [sortBy, setSortBy] = useState<'activity' | 'popular' | 'recent' | 'unanswered'>('activity');

  // Filter threads
  const filteredThreads = forumThreads.filter((t) => {
    if (selectedCategory && selectedCategory !== 'all') {
      if (t.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = t.title.toLowerCase().includes(q);
      const inBody = (t.body || t.content || '').toLowerCase().includes(q);
      const inTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!inTitle && !inBody && !inTags) return false;
    }
    return true;
  });

  // Sort threads (pinned always first)
  const sortedThreads = [...filteredThreads].sort((a, b) => {
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
    <div className="flex-1 flex flex-col space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Sort:</span>
          </div>

          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSortBy('activity')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                sortBy === 'activity'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Latest Activity
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                sortBy === 'popular'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Most Upvoted
            </button>
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                sortBy === 'recent'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('unanswered')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                sortBy === 'unanswered'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unanswered
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewThreadModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0a192f] hover:bg-[#162a4d] text-[#f5c451] text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => onCategoryChange?.('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#0a192f] text-[#f5c451] font-bold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Topics ({forumThreads.length})
        </button>
        {DEFAULT_FORUM_CATEGORIES.map((cat) => {
          const count = forumThreads.filter((t) => t.category.toLowerCase() === cat.toLowerCase()).length;
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange?.(cat)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#0a192f] text-[#f5c451] font-bold shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-[#162a4d] text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Discussion Threads List */}
      <div className="space-y-3">
        {sortedThreads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No discussions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? `No threads matched "${searchQuery}". Try a different keyword.`
                : 'Be the first to start a discussion in this category!'}
            </p>
            <button
              type="button"
              onClick={onOpenNewThreadModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-[#f5c451] text-xs font-bold rounded-lg hover:bg-[#162a4d]"
            >
              <PlusCircle className="w-4 h-4" /> Start Discussion
            </button>
          </div>
        ) : (
          sortedThreads.map((thread: CommunityForumThread) => {
            const isUpvoted = currentUser && thread.upvotedUserIds?.includes(currentUser.id);
            const isPinned = Boolean(thread.isPinned || thread.pinned);

            return (
              <div
                key={thread.id}
                className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex items-start gap-4 ${
                  isPinned
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Upvote Button Column */}
                <div className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      upvoteForumThread(thread.id);
                    }}
                    className={`flex flex-col items-center justify-center w-12 py-2 rounded-xl border transition-all ${
                      isUpvoted
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={isUpvoted ? 'Remove upvote' : 'Upvote discussion'}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isUpvoted ? 'fill-amber-600 text-amber-600' : ''}`} />
                    <span className="text-xs font-bold mt-1">{thread.upvotes || 0}</span>
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  {/* Badges Bar */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        <Pin className="w-3 h-3 text-amber-600" /> Pinned
                      </span>
                    )}
                    {thread.isSolved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Solved
                      </span>
                    )}
                    {thread.isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" /> Locked
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {thread.category}
                    </span>
                  </div>

                  {/* Thread Title */}
                  <h4
                    onClick={() => onSelectThread(thread.id)}
                    className="text-base font-bold text-slate-900 hover:text-amber-600 cursor-pointer transition-colors line-clamp-2 leading-snug"
                  >
                    {thread.title}
                  </h4>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {thread.body || thread.content}
                  </p>

                  {/* Tags */}
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      {thread.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-mono transition-colors"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{thread.authorName}</span>
                      {renderRoleBadge(thread.authorRole)}
                      <span className="text-[11px]">•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {new Date(thread.lastActivityAt || thread.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {thread.viewsCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        {thread.replyCount || 0} replies
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
