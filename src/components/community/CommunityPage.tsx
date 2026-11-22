import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Hash,
  Search,
  PlusCircle,
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  Megaphone,
  BookOpen,
  Cpu,
  Crown,
  Layers,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ChatChannelsView } from './ChatChannelsView';
import { ForumBoardsView } from './ForumBoardsView';
import { ThreadDetailView } from './ThreadDetailView';
import { DEFAULT_FORUM_CATEGORIES } from '../../utils/community';
import type { CommunityChannel } from '../../types/marketplace';

interface CommunityPageProps {
  initialView?: 'chat' | 'forums' | 'thread';
  initialChannelId?: string;
  initialThreadId?: string;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  initialView = 'chat',
  initialChannelId,
  initialThreadId,
}) => {
  const {
    communityChannels,
    communityMessages,
    forumThreads,
    forumReplies,
    currentUser,
    createForumThread,
    navigate,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'forums'>(
    initialView === 'thread' || initialView === 'forums' ? 'forums' : 'chat'
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    initialChannelId || (communityChannels[0]?.id ?? 'chan-announcements')
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null
  );
  const [selectedForumCategory, setSelectedForumCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // New Thread Modal State
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState<string>(DEFAULT_FORUM_CATEGORIES[0]);
  const [newThreadTags, setNewThreadTags] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newThreadError, setNewThreadError] = useState<string | null>(null);

  // Sync props to internal state when route changes
  useEffect(() => {
    if (initialView === 'thread' && initialThreadId) {
      setActiveTab('forums');
      setSelectedThreadId(initialThreadId);
    } else if (initialView === 'forums') {
      setActiveTab('forums');
      setSelectedThreadId(null);
    } else if (initialView === 'chat') {
      setActiveTab('chat');
      if (initialChannelId) setSelectedChannelId(initialChannelId);
    }
  }, [initialView, initialChannelId, initialThreadId]);

  const solvedThreadsCount = forumThreads.filter((t) => t.isSolved).length;

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    setNewThreadError(null);

    const tagsArray = newThreadTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const result = createForumThread({
      title: newThreadTitle,
      body: newThreadBody,
      category: newThreadCategory,
      tags: tagsArray,
    });

    if (result.ok && result.thread) {
      setIsNewThreadModalOpen(false);
      setNewThreadTitle('');
      setNewThreadTags('');
      setNewThreadBody('');
      setSelectedThreadId(result.thread.id);
      setActiveTab('forums');
    } else {
      setNewThreadError(result.error || 'Failed to create discussion thread.');
    }
  };

  const getChannelIcon = (category: string) => {
    switch (category) {
      case 'announcements':
        return <Megaphone className="w-4 h-4 text-amber-500" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'software':
        return <Cpu className="w-4 h-4 text-emerald-500" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-purple-500" />;
      default:
        return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Community Hero Subheader */}
      <div className="bg-[#0a192f] text-white border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-400/20 text-[#f5c451]">
                  <Sparkles className="w-5 h-5 text-[#f5c451]" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Digital Wealth Creators Community Hub
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Real-time cohort chat channels & structured technical discussion boards. Replace
                disconnected WhatsApp groups with integrated peer-learning.
              </p>
            </div>

            {/* Quick Community Metrics */}
            <div className="flex items-center gap-4 bg-[#142a4d]/80 border border-[#d4af37]/30 rounded-xl px-4 py-2.5 shrink-0">
              <div className="text-center">
                <div className="text-base font-extrabold text-[#f5c451]">
                  {communityChannels.length}
                </div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Channels</div>
              </div>
              <div className="w-px h-7 bg-slate-700" />
              <div className="text-center">
                <div className="text-base font-extrabold text-white">
                  {communityMessages.length}
                </div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Messages</div>
              </div>
              <div className="w-px h-7 bg-slate-700" />
              <div className="text-center">
                <div className="text-base font-extrabold text-white">{forumThreads.length}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Threads</div>
              </div>
              <div className="w-px h-7 bg-slate-700" />
              <div className="text-center">
                <div className="text-base font-extrabold text-emerald-400">
                  {solvedThreadsCount}
                </div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Solved</div>
              </div>
            </div>
          </div>

          {/* Subheader Navigation Pills & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/80">
            {/* View Switcher Pills */}
            <div className="inline-flex rounded-xl bg-[#061224] p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  setSelectedThreadId(null);
                  navigate('/community/chat');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chat' && !selectedThreadId
                    ? 'bg-[#f5c451] text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Live Chat Channels</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('forums');
                  setSelectedThreadId(null);
                  navigate('/community/forums');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'forums' || selectedThreadId
                    ? 'bg-[#f5c451] text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussion Boards</span>
              </button>
            </div>

            {/* Keyword Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'chat'
                    ? 'Search messages or channels...'
                    : 'Search discussion topics...'
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-400 bg-[#061224] border border-slate-700 rounded-lg focus:outline-none focus:border-[#f5c451]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Responsive Two-Column Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-6 relative">
          {/* Collapsible Left Navigation Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 p-4 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 md:w-64 md:border md:rounded-xl md:shadow-sm md:shrink-0 ${
              mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
            }`}
          >
            {/* Mobile Sidebar Close Button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 md:hidden">
              <span className="font-bold text-sm text-slate-800">Community Directory</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar View: Chat Channels Directory */}
            {activeTab === 'chat' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Channels ({communityChannels.length})
                  </span>
                </div>

                <div className="space-y-1">
                  {communityChannels.map((ch: CommunityChannel) => {
                    const isSelected = selectedChannelId === ch.id;
                    const channelMsgsCount = communityMessages.filter((m) => m.channelId === ch.id).length;

                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setSelectedChannelId(ch.id);
                          setMobileSidebarOpen(false);
                          navigate(`/community/channels/${ch.id}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                          isSelected
                            ? 'bg-[#0a192f] text-[#f5c451] font-bold shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getChannelIcon(ch.category)}
                          <span className="truncate">{ch.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected ? 'bg-[#162a4d] text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {channelMsgsCount}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Cohort Channels
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      Course cohort channels automatically unlock when you enroll in the corresponding
                      course.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Sidebar View: Forum Discussion Categories */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Discussion Boards
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedForumCategory('all');
                      setSelectedThreadId(null);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                      selectedForumCategory === 'all' && !selectedThreadId
                        ? 'bg-[#0a192f] text-[#f5c451] font-bold shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span>All Categories</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">
                      {forumThreads.length}
                    </span>
                  </button>

                  {DEFAULT_FORUM_CATEGORIES.map((cat) => {
                    const isSelected = selectedForumCategory.toLowerCase() === cat.toLowerCase();
                    const count = forumThreads.filter((t) => t.category.toLowerCase() === cat.toLowerCase()).length;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedForumCategory(cat);
                          setSelectedThreadId(null);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                          isSelected && !selectedThreadId
                            ? 'bg-[#0a192f] text-[#f5c451] font-bold shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
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

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewThreadModalOpen(true);
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0a192f] text-[#f5c451] rounded-lg text-xs font-bold hover:bg-[#162a4d] transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Start New Thread</span>
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Backdrop for Mobile Drawer */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Main Active Surface */}
          <main className="flex-1 min-w-0">
            {selectedThreadId ? (
              <ThreadDetailView
                threadId={selectedThreadId}
                onBack={() => {
                  setSelectedThreadId(null);
                  navigate('/community/forums');
                }}
              />
            ) : activeTab === 'chat' ? (
              <ChatChannelsView
                channelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
                onOpenSidebar={() => setMobileSidebarOpen(true)}
              />
            ) : (
              <ForumBoardsView
                onSelectThread={(threadId) => {
                  setSelectedThreadId(threadId);
                  navigate(`/community/threads/${threadId}`);
                }}
                selectedCategory={selectedForumCategory}
                onCategoryChange={setSelectedForumCategory}
                onOpenNewThreadModal={() => setIsNewThreadModalOpen(true)}
                searchQuery={searchQuery}
              />
            )}
          </main>
        </div>
      </div>

      {/* New Discussion Thread Modal Dialog */}
      {isNewThreadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <span>Start a Discussion Thread</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewThreadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newThreadError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {newThreadError}
              </div>
            )}

            <form onSubmit={handleCreateThread} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discussion Title *
                </label>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="e.g. How to optimize server-sent events with Express and Vite?"
                  required
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={newThreadCategory}
                  onChange={(e) => setNewThreadCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a192f]"
                >
                  {DEFAULT_FORUM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newThreadTags}
                  onChange={(e) => setNewThreadTags(e.target.value)}
                  placeholder="architecture, sse, express, typescript"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a192f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thread Body / Description *
                </label>
                <textarea
                  value={newThreadBody}
                  onChange={(e) => setNewThreadBody(e.target.value)}
                  placeholder="Provide context, code snippets, or specific questions..."
                  rows={5}
                  required
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a192f] focus:ring-1 focus:ring-[#0a192f] resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewThreadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newThreadTitle.trim() || !newThreadBody.trim()}
                  className="px-5 py-2 bg-[#0a192f] hover:bg-[#162a4d] disabled:opacity-40 text-[#f5c451] text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Publish Discussion Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
