import { useState } from 'react';
import {
  Building2,
  Users,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export function GroupMembershipPanel() {
  const {
    groupMemberships,
    groupMembershipSeats,
    createGroupMembership,
    assignGroupMember,
    removeGroupMember,
    users,
    showToast,
  } = useStore();

  const [newGroupName, setNewGroupName] = useState('');
  const [openGroupSlug, setOpenGroupSlug] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberUserId, setMemberUserId] = useState('');

  const seatsByGroup = (slug: string) => groupMembershipSeats.filter((s) => s.groupSlug === slug);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const createGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      showToast('Group name is required.');
      return;
    }
    const result = createGroupMembership({
      groupName: trimmed,
      groupAdminName: users.find((u) => u.role === 'admin')?.name || 'Group Admin',
    });
    if (result.ok) {
      setNewGroupName('');
      setOpenGroupSlug(result.membership.slug);
    }
  };

  const handleAssign = (groupSlug: string) => {
    const name = memberName.trim();
    const userId = memberUserId.trim() || null;
    if (!name && !userId) {
      showToast('Enter a member email or name (or pick a user) before assigning.');
      return;
    }
    assignGroupMember(groupSlug, userId, userId ? undefined : name);
    setMemberName('');
    setMemberUserId('');
  };

  const groupsEmpty = groupMemberships.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Group Memberships
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Group Admins register for 15 seats with a lump-sum (₦75,000 for the DWC Group Membership Pass). Assigned members become paid seats for enquiries, courses and enquiry-based enquiries — plus promoter mentorship services.
          </p>
        </div>
      </div>

      {/* Create Group Card */}
      <div className="p-5 bg-white border border-[#c3c4c7] rounded-sm shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <PlusCircle className="w-4 h-4" />
          </span>
          <h2 className="font-bold text-[#1d2327] text-sm">New Group Registration</h2>
        </div>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. Lagos Tech Campus 2026"
            className="flex-1 px-3 py-2 text-xs text-[#1d2327] bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#2271b1]"
          />
          <button
            type="button"
            onClick={createGroup}
            disabled={!newGroupName.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Create Group (15 Seats)
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Group Admin becomes the "representative" — they manage seats and the group passes through this panel.
        </p>
      </div>

      {/* Groups Table */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex flex-wrap items-center justify-between gap-2 bg-slate-50">
          <h2 className="font-display text-sm font-bold text-[#1d2327]">
            Registered Groups ({groupMemberships.length})
          </h2>
          <span className="text-[11px] text-slate-500">Group Seats — max 15 per group pass</span>
        </div>
        {groupsEmpty ? (
          <div className="text-center py-10 px-4">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No groups registered yet</p>
            <p className="text-xs text-slate-500 mt-1">Create the first group above — its seats can be assigned immediately.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="px-4 py-2.5">Group</th>
                <th className="px-4 py-2.5">Admin</th>
                <th className="px-4 py-2.5">Seats</th>
                <th className="px-4 py-2.5">Purchased On</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groupMemberships.map((g) => {
                const seats = seatsByGroup(g.slug);
                const admin = userMap[g.groupAdminId || ''] || null;
                const isOpen = openGroupSlug === g.slug;
                return (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-slate-900">{g.groupName}</p>
                      <p className="text-[11px] font-mono text-slate-500">@{g.slug}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {admin ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{admin.name}</span>
                          <span className="text-[10px] text-slate-500">
                            {admin.email}{' '}
                            <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold uppercase">
                              {admin.role}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {seats.filter((s) => s.isActive && s.userId).length || seats.filter((s) => s.isActive).length}/{g.maxMembers} seats
                      </span>
                      {isOpen && (
                        <div className="mt-2 space-y-2 p-3 bg-slate-50 rounded border border-slate-200">
                          {seats.map((seat) => {
                            const u = seat.userId ? userMap[seat.userId] : null;
                            return (
                              <div key={seat.id} className="flex items-center justify-between gap-2 p-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Users className="w-3 h-3 text-blue-500" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 text-xs truncate">
                                      {u ? u.name : seat.label || '(Unassigned seat)'}
                                    </p>
                                    {u && (
                                      <p className="text-[10px] text-slate-500">{u.email}</p>
                                    )}
                                  </div>
                                </div>
                                {u && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeGroupMember(g.slug, seat.id);
                                    if (seat.userId) showToast('Member removed from group.');
                                  }}
                                  title="Remove member"
                                  className="p-1.5 rounded border border-[#c3c4c7] text-[#b32b2e]/70 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              value={memberName}
                              onChange={(e) => setMemberName(e.target.value)}
                              placeholder="Member email or name"
                              className="flex-1 px-2 py-1.5 text-xs text-[#1d2327] bg-white border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                            />
                            <button
                              type="button"
                              onClick={() => handleAssign(g.slug)}
                              disabled={!memberName.trim() && !memberUserId.trim()}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded disabled:opacity-40 cursor-pointer"
                            >
                              Assign Seat
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenGroupSlug(null)}
                              className="px-2.5 py-1.5 text-xs text-[#8c8f94] hover:bg-slate-100 rounded cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-[#1d2327]">
                      {new Date(g.purchasedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenGroupSlug(isOpen ? null : g.slug)}
                        className="p-1.5 text-slate-500 hover:text-[#2271b1] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
