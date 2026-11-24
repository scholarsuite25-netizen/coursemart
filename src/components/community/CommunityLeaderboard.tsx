import React from 'react';
import { FlaskConical, Award, TrendingUp, Users, Github } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { calculateCommunityLeaderboard, type LeaderboardEntry } from '../../utils/communityLeaderboard';

const TROPHIES = [
  { icon: FlaskConical, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { icon: Award, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
];

export const CommunityLeaderboard: React.FC = () => {
  const { communityMessages, forumThreads, forumReplies } = useStore();

  const board: LeaderboardEntry[] = calculateCommunityLeaderboard(
    communityMessages,
    forumThreads,
    forumReplies
  );
  const top3 = board.slice(0, 3);
  const rest = board.slice(3, 10);

  return (
    <div className="space-y-5 p-5 lg:p-6 rounded-2xl bg-slate-950 border border-slate-800">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#f5c451]" />
          <h2 className="text-base font-black text-white tracking-tight">Community Leaderboard</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
          Earn points by posting messages, starting threads, replying, pinning and upvoting. Top
          contributors unlock titles — great ways to showcase expertise and stand out in the
          community.
        </p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2">
        {top3.map((entry, idx) => {
          const trophy = TROPHIES[idx] ?? TROPHIES[0];
          const sizeClass = idx === 0 ? 'scale-100' : 'scale-90';
          return (
            <div
              key={entry.userId}
              className={`flex flex-col items-center text-center px-2 py-3 rounded-xl border ${trophy.bg} border-slate-800 hover:border-slate-700 transition-colors ${sizeClass}`}
            >
              <div className={`w-7 h-7 rounded-full ${trophy.bg} flex items-center justify-center mb-2`}>
                <trophy.icon className={`w-4 h-4 ${trophy.color}`} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Rank #{entry.rank}
              </p>
              <p className="font-black text-white text-xs truncate" title={entry.userName}>
                {entry.userName}
              </p>
              <p className="text-[#f5c451] font-black text-sm tabular-nums">{entry.points} pts</p>
              <p className="text-[10px] text-slate-300 mt-0.5">{entry.title}</p>
            </div>
          );
        })}
      </div>

      {/* Full Board */}
      <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
        {rest.length === 0 && top3.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">The community is warming up — be the first to earn points!</p>
          </div>
        ) : (
          rest.map((entry) => (
            <div key={entry.userId} className="flex items-center justify-between px-3 py-2 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 w-5 text-right">#{entry.rank}</span>
                <span className="font-bold text-white truncate">{entry.userName}</span>
              </div>
              <span className="text-[#f5c451] font-black text-xs tabular-nums mr-6">{entry.points} pts</span>
              <span className="text-[10px] text-slate-400 hidden lg:inline">{entry.title}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
