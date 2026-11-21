import React, { useState } from 'react';
import {
  Hash,
  MessageSquare,
  Pin,
  Lock,
  Trash2,
  CheckCircle2,
  Shield,
  Search,
  PlusCircle,
  Eye,
  Megaphone,
  BookOpen,
  Cpu,
  Crown,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CommunityChannel, CommunityChannelCategory, CommunityVisibility } from '../../types/marketplace';

export const CommunityModerationPanel: React.FC = () => {
  const {
    communityChannels,
    communityMessages,
    forumThreads,
    forumReplies,
    upsertCommunityChannel,
    deleteCommunityChannel,
    toggleThreadPin,
    toggleThreadLock,
    deleteForumThread,
    deleteCommunityMessage,
    pinCommunityMessage,
    products,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'channels' | 'threads' | 'messages' | 'governance'>('channels');

  // Channel Form State
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelSlug, setChannelSlug] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelCategory, setChannelCategory] = useState<CommunityChannelCategory>('general');
  const [channelVisibility, setChannelVisibility] = useState<CommunityVisibility>('public');
  const [channelProductId, setChannelProductId] = useState('');
  const [channelReadOnly, setChannelReadOnly] = useState(false);

  // Search & Filter States
  const [threadSearch, setThreadSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('all');

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    const slug =
      channelSlug.trim() ||
      channelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const newChannel: CommunityChannel = {
      id: `chan-${Date.now()}`,
      slug,
      name: channelName.trim(),
      description: channelDesc.trim(),
      category: channelCategory,
      visibility: channelVisibility,
      productId: channelProductId || undefined,
      isReadOnly: channelReadOnly,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    };

    upsertCommunityChannel(newChannel);
    setIsAddingChannel(false);
    setChannelName('');
    setChannelSlug('');
    setChannelDesc('');
    setChannelProductId('');
    setChannelReadOnly(false);
  };

  const filteredThreads = forumThreads.filter((t) => {
    if (!threadSearch.trim()) return true;
    const q = threadSearch.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.authorName.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const filteredMessages = communityMessages.filter((m) => {
    if (selectedChannelFilter !== 'all' && m.channelId !== selectedChannelFilter) {
      return false;
    }
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        (m.userName || m.authorName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'announcements':
        return <Megaphone className="w-3.5 h-3.5 text-amber-500" />;
      case 'course':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'software':
        return <Cpu className="w-3.5 h-3.5 text-emerald-500" />;
      case 'vip':
        return <Crown className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Hash className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Community Moderation & Channels
          </h1>
          <p className="text-sm text-slate-600">
            Govern in-platform chat channels, moderate forum discussions, and monitor community interactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Active RBAC Governance
          </span>
        </div>
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('channels')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'channels'
              ? 'bg-[#0a192f] text-[#f5c451]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Channels ({communityChannels.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('threads')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'threads'
              ? 'bg-[#0a192f] text-[#f5c451]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Discussion Threads ({forumThreads.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('messages')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'messages'
              ? 'bg-[#0a192f] text-[#f5c451]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chat Feed Audit ({communityMessages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('governance')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'governance'
              ? 'bg-[#0a192f] text-[#f5c451]'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Metrics & Rules
        </button>
      </div>

      {/* 1. CHANNELS MANAGEMENT SUBTAB */}
      {activeSubTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Community Channels</h2>
            <button
              type="button"
              onClick={() => setIsAddingChannel((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a192f] hover:bg-[#162a4d] text-[#f5c451] text-xs font-bold rounded-lg shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isAddingChannel ? 'Cancel' : 'Create Channel'}</span>
            </button>
          </div>

          {/* Add Channel Modal / Form */}
          {isAddingChannel && (
            <form
              onSubmit={handleCreateChannel}
              className="bg-white border border-slate-300 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in"
            >
              <h3 className="text-sm font-bold text-slate-900">New Channel Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. Next.js Architecture Lab"
                    required
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={channelSlug}
                    onChange={(e) => setChannelSlug(e.target.value)}
                    placeholder="e.g. nextjs-architecture-lab"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="Channel objective, discussion guidelines, or cohort details"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={channelCategory}
                    onChange={(e) => setChannelCategory(e.target.value as CommunityChannelCategory)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="general">General</option>
                    <option value="announcements">Announcements</option>
                    <option value="course">Course Cohort</option>
                    <option value="software">Software Support</option>
                    <option value="vip">VIP Mastermind</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Access Rule</label>
                  <select
                    value={channelVisibility}
                    onChange={(e) => setChannelVisibility(e.target.value as CommunityVisibility)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="enrolled_only">Enrolled Students Only</option>
                    <option value="members_only">VIP Members Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Linked Product (for Cohorts)
                  </label>
                  <select
                    value={channelProductId}
                    onChange={(e) => setChannelProductId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="">None (Open Cohort)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chan-read-only"
                  checked={channelReadOnly}
                  onChange={(e) => setChannelReadOnly(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="chan-read-only" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Read-Only Mode (Only administrators and instructors can post messages)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingChannel(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0a192f] text-[#f5c451] text-xs font-bold rounded-md hover:bg-[#162a4d]"
                >
                  Save Channel
                </button>
              </div>
            </form>
          )}

          {/* Channels Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Channel Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Access Level</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {communityChannels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(ch.category)}
                        <div>
                          <p className="font-bold text-slate-900">#{ch.slug}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{ch.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 capitalize font-semibold text-slate-700">
                      {ch.category}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ch.visibility === 'public'
                            ? 'bg-slate-100 text-slate-700'
                            : ch.visibility === 'enrolled_only'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {ch.visibility.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {ch.isReadOnly ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Read Only
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Active Chat
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete channel #${ch.slug}?`)) {
                            deleteCommunityChannel(ch.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. FORUM THREADS MODERATION SUBTAB */}
      {activeSubTab === 'threads' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800">Discussion Threads Moderation</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search threads or author..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Thread Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Engagement</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredThreads.map((thread) => {
                  const isPinned = Boolean(thread.isPinned || thread.pinned);
                  return (
                    <tr key={thread.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">
                        {thread.title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{thread.category}</td>
                      <td className="py-2.5 px-3 text-slate-700">{thread.authorName}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {thread.upvotes} upvotes · {thread.replyCount} replies
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {isPinned && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              Pinned
                            </span>
                          )}
                          {thread.isLocked && (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                              Locked
                            </span>
                          )}
                          {thread.isSolved && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Solved
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleThreadPin(thread.id)}
                            className={`p-1 rounded text-xs ${
                              isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title={isPinned ? 'Unpin thread' : 'Pin thread to top'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleThreadLock(thread.id)}
                            className={`p-1 rounded text-xs ${
                              thread.isLocked ? 'text-slate-900 bg-slate-200' : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title={thread.isLocked ? 'Unlock thread' : 'Lock thread'}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this forum thread?')) {
                                deleteForumThread(thread.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CHAT FEED AUDIT SUBTAB */}
      {activeSubTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800">Live Chat Message Stream Audit</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedChannelFilter}
                onChange={(e) => setSelectedChannelFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Channels</option>
                {communityChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.slug}
                  </option>
                ))}
              </select>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Filter messages..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Sender</th>
                  <th className="py-2.5 px-3">Message Preview</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.slice(0, 50).map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                      #{communityChannels.find((c) => c.id === msg.channelId)?.slug || msg.channelId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {msg.userName || msg.authorName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 max-w-md truncate">
                      {msg.content}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => pinCommunityMessage(msg.id)}
                          className={`p-1 rounded ${
                            msg.isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                          }`}
                          title="Toggle pin"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this message?')) {
                              deleteCommunityMessage(msg.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. METRICS & RULES SUBTAB */}
      {activeSubTab === 'governance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Community Aggregates
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xl font-extrabold text-slate-900">{communityChannels.length}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Channels</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xl font-extrabold text-slate-900">{communityMessages.length}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Chat Messages</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xl font-extrabold text-slate-900">{forumThreads.length}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Forum Threads</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xl font-extrabold text-slate-900">{forumReplies.length}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Forum Replies</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Security & RBAC Policies
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Chat messages and threads require authenticated user session tokens.</li>
              <li>Read-only channels allow posting exclusively by instructors and administrators.</li>
              <li>Course cohort channels verify course enrollment entitlement before granting posting access.</li>
              <li>Verified solutions may only be marked by the original thread author or platform instructors.</li>
              <li>Message and thread deletion cascades cleanly across KV store and localStorage.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
