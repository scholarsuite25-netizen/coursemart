import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  Pin,
  Trash2,
  Lock,
  Smile,
  Shield,
  GraduationCap,
  Sparkles,
  Users,
  Menu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { CommunityChannel, CommunityChatMessage, UserRole } from '../../types/marketplace';

interface ChatChannelsViewProps {
  channelId: string;
  onSelectChannel: (id: string) => void;
  onOpenSidebar?: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '🚀', '🎉', '💡', '🔥'];

export const ChatChannelsView: React.FC<ChatChannelsViewProps> = ({
  channelId,
  onOpenSidebar,
}) => {
  const {
    communityChannels,
    communityMessages,
    currentUser,
    sendCommunityMessage,
    toggleMessageReaction,
    deleteCommunityMessage,
    pinCommunityMessage,
    quickLoginAsRole,
    products,
    isOwnedByCurrentUser,
    navigate,
  } = useStore();

  const [inputContent, setInputContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<CommunityChatMessage | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel: CommunityChannel | undefined =
    communityChannels.find((c) => c.id === channelId) || communityChannels[0];

  const channelMessages = communityMessages.filter((m) => m.channelId === channel?.id);
  const pinnedMessages = channelMessages.filter((m) => m.isPinned);
  const displayedMessages = showPinnedOnly ? pinnedMessages : channelMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length, channelId]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <p>No community channel selected.</p>
      </div>
    );
  }

  // Check enrollment gating if enrolled_only channel
  const isEnrolledOnly =
    channel.visibility === 'enrolled_only' || channel.accessLevel === 'enrolled';
  // Product-gated VIP space (members_only + productId): access via ownership
  const isProductGated =
    (channel.visibility === 'members_only' || channel.accessLevel === 'members') &&
    Boolean(channel.productId);
  const hasCourseAccess =
    !isProductGated ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'instructor' ||
    (channel.productId ? isOwnedByCurrentUser(channel.productId) : true);

  const isReadOnly = Boolean(channel.isReadOnly);
  const canPost =
    currentUser && (!isReadOnly || currentUser.role === 'admin' || currentUser.role === 'instructor');

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim()) return;

    sendCommunityMessage(channel.id, inputContent, replyToMessage?.id);
    setInputContent('');
    setReplyToMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const linkedProduct = channel.productId
    ? products.find((p) => p.id === channel.productId)
    : undefined;

  const renderRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-300">
            <Shield className="w-3 h-3 text-amber-600" /> Admin
          </span>
        );
      case 'instructor':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 border border-blue-300">
            <GraduationCap className="w-3 h-3 text-blue-600" /> Instructor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            Student
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[750px] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Channel Top Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200"
              aria-label="Open Channels Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#0a192f] text-[#f5c451] rounded-lg">
              <Hash className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{channel.name}</h2>
                {isReadOnly && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Read Only
                  </span>
                )}
                {isEnrolledOnly && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Cohort
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{channel.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          {pinnedMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPinnedOnly((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                showPinnedOnly
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-amber-600" />
              <span>{pinnedMessages.length} Pinned</span>
              {showPinnedOnly ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>{channel.memberCount || 120} members</span>
          </div>
        </div>
      </div>

      {/* Pinned Messages Notice Bar */}
      {pinnedMessages.length > 0 && !showPinnedOnly && (
        <div className="bg-amber-50/70 border-b border-amber-200/80 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2 truncate">
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold shrink-0">Pinned Announcement:</span>
            <span className="truncate">{pinnedMessages[pinnedMessages.length - 1].content}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPinnedOnly(true)}
            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline ml-2 shrink-0"
          >
            View all
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <Hash className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No messages in #{channel.slug} yet</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Be the first to say hello or ask a question in this channel!
            </p>
          </div>
        ) : (
          displayedMessages.map((msg) => {
            const isAuthor = currentUser?.id === (msg.userId || msg.authorId);
            const isStaff =
              currentUser?.role === 'admin' || currentUser?.role === 'instructor';
            const userReactions = msg.reactions || {};

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50/80 transition-colors relative ${
                  msg.isPinned ? 'bg-amber-50/40 border-l-2 border-amber-400 pl-3' : ''
                }`}
              >
                {/* Author Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0a192f] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName || msg.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (msg.userName || msg.authorName || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">
                      {msg.userName || msg.authorName}
                    </span>
                    {renderRoleBadge(msg.userRole || msg.authorRole)}
                    <span className="text-[11px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.isPinned && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                        <Pin className="w-2.5 h-2.5 text-amber-600" /> Pinned
                      </span>
                    )}
                  </div>

                  {/* Quoted Reply reference if present */}
                  {msg.replyToId && (
                    <div className="text-xs bg-slate-100 text-slate-600 border-l-2 border-slate-400 px-2 py-1 mt-1 rounded text-slate-500 italic">
                      Replying to earlier message
                    </div>
                  )}

                  {/* Body text */}
                  <div className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                    {msg.content}
                  </div>

                  {/* Emoji Reactions Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {Object.entries(userReactions).map(([emoji, userIds]) => {
                      const userReacted = currentUser && userIds.includes(currentUser.id);
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleMessageReaction(msg.id, emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            userReacted
                              ? 'bg-amber-100/70 border-amber-300 text-amber-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-[11px]">{userIds.length}</span>
                        </button>
                      );
                    })}

                    {/* Quick Add Reaction Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setEmojiPickerMsgId((prev) => (prev === msg.id ? null : msg.id))
                      }
                      className="inline-flex items-center p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
                      title="Add reaction"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Inline Emoji Selector Popup */}
                  {emojiPickerMsgId === msg.id && (
                    <div className="absolute z-10 bg-white border border-slate-200 shadow-md rounded-lg p-1.5 flex items-center gap-1 mt-1">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            toggleMessageReaction(msg.id, emoji);
                            setEmojiPickerMsgId(null);
                          }}
                          className="p-1.5 text-base hover:bg-slate-100 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Message Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute top-2 right-2 bg-white/95 border border-slate-200 shadow-sm rounded-lg px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() => setReplyToMessage(msg)}
                    className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                    title="Reply in chat"
                  >
                    Reply
                  </button>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => pinCommunityMessage(msg.id)}
                      className={`p-1 hover:text-amber-600 text-xs ${
                        msg.isPinned ? 'text-amber-600' : 'text-slate-400'
                      }`}
                      title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {(isAuthor || isStaff) && (
                    <button
                      type="button"
                      onClick={() => deleteCommunityMessage(msg.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 text-xs"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Cohort Gating Lock Screen */}
      {!hasCourseAccess && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700">
              <Lock className="w-5 h-5 text-amber-600" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {isProductGated ? 'VIP Mastermind Space' : 'Enrolled Cohort Channel'}
              </p>
              <p className="text-xs text-slate-500">
                {isProductGated
                  ? `Join #${channel.slug} by holding the ${linkedProduct?.title || 'Mastermind Pass'} product.`
                  : `Participation in #${channel.slug} requires enrollment in ${linkedProduct?.title || 'the related course'}.`}
              </p>
            </div>
          </div>
          {linkedProduct && (
            <button
              type="button"
              onClick={() => navigate(`/product/${linkedProduct.slug}`)}
              className="px-4 py-2 bg-[#0a192f] text-[#f5c451] hover:bg-[#162a4d] text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              {isProductGated ? 'Get Pass →' : 'Enroll to Join Cohort →'}
            </button>
          )}
        </div>
      )}

      {/* Guest Sign-in Bar */}
      {hasCourseAccess && !currentUser && (
        <div className="p-3 bg-gradient-to-r from-[#0a192f] to-[#162a4d] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f5c451] shrink-0" />
            <p className="text-xs text-slate-200">
              Sign in to participate in real-time chat discussions with instructors and fellow students.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => quickLoginAsRole('customer')}
              className="px-3 py-1.5 bg-[#f5c451] hover:bg-[#d4af37] text-slate-950 text-xs font-bold rounded-md shadow-sm transition-colors whitespace-nowrap"
            >
              Quick Sign In
            </button>
          </div>
        </div>
      )}

      {/* Read-Only Notice for Customers */}
      {hasCourseAccess && currentUser && !canPost && (
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-600 font-medium">
          🔒 #{channel.slug} is an official announcements channel. Only instructors and platform
          administrators can publish messages here.
        </div>
      )}

      {/* Message Composer Bar */}
      {hasCourseAccess && canPost && (
        <div className="p-3 bg-white border-t border-slate-200">
          {replyToMessage && (
            <div className="mb-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
              <span className="truncate">
                Replying to <span className="font-bold">{replyToMessage.userName}</span>:{' '}
                {replyToMessage.content}
              </span>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="text-slate-400 hover:text-slate-700 ml-2 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-300 focus-within:border-[#0a192f] focus-within:ring-1 focus-within:ring-[#0a192f] rounded-xl overflow-hidden transition-all">
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${channel.slug}... (Press Enter to send)`}
                rows={2}
                className="w-full px-3 py-2 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!inputContent.trim()}
              className="p-3 bg-[#0a192f] hover:bg-[#162a4d] disabled:opacity-40 disabled:cursor-not-allowed text-[#f5c451] rounded-xl transition-all shadow-sm shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
