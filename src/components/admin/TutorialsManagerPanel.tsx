import { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { DocumentTutorial, TutorialStatus } from '../../types/tutorial';
import { TutorialEditorModal } from '../tutorials/TutorialEditorModal';

const STATUS_BADGE: Record<TutorialStatus, { label: string; className: string }> = {
  published: {
    label: 'Published',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export function TutorialsManagerPanel() {
  const {
    tutorials,
    upsertTutorial,
    deleteTutorial,
    toggleTutorialStatus,
    navigate,
    currentUser,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TutorialStatus | 'all'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<DocumentTutorial | null>(null);

  const filteredTutorials = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tutorials.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.subtitle || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [tutorials, searchQuery, statusFilter]);

  const stats = useMemo(
    () => ({
      total: tutorials.length,
      published: tutorials.filter((t) => t.status === 'published').length,
      drafts: tutorials.filter((t) => t.status === 'draft').length,
      featured: tutorials.filter((t) => t.featured).length,
      totalSteps: tutorials.reduce((sum, t) => sum + (t.steps?.length || 0), 0),
    }),
    [tutorials]
  );

  const openEditor = (tutorial?: DocumentTutorial) => {
    setEditingTutorial(tutorial ?? null);
    setIsEditorOpen(true);
  };

  const handleDelete = (tutorial: DocumentTutorial) => {
    if (window.confirm(`Delete tutorial "${tutorial.title}"? This cannot be undone.`)) {
      deleteTutorial(tutorial.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d2327]">
            Tutorials & AI Video Guides
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Create, publish and manage the public tutorials hub at /tutorials — document walkthroughs, step checklists and video scripts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/tutorials')}
            className="px-3.5 py-2 text-xs font-bold text-[#1d2327] bg-white border border-[#8c8f94] hover:bg-slate-50 rounded-sm inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Hub</span>
          </button>
          <button
            type="button"
            onClick={() => openEditor()}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tutorial</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Tutorials
            </p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Published
            </p>
            <p className="text-2xl font-bold font-display text-emerald-700 mt-1 tabular-nums">
              {stats.published}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Drafts
            </p>
            <p className="text-2xl font-bold font-display text-slate-700 mt-1 tabular-nums">
              {stats.drafts}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <Edit3 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Featured
            </p>
            <p className="text-2xl font-bold font-display text-amber-700 mt-1 tabular-nums">
              {stats.featured}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#c3c4c7] rounded-sm shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Steps
            </p>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1 tabular-nums">
              {stats.totalSteps}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-[#c3c4c7] rounded-sm shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tutorials by title, category or tag..."
            className="w-full h-8 pl-8 pr-2 text-xs border border-[#8c8f94] rounded-sm text-slate-900 bg-white focus:outline-none focus:border-[#2271b1]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TutorialStatus | 'all')}
          className="h-8 px-2 text-xs border border-[#8c8f94] rounded-sm text-slate-900 bg-white font-semibold cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-[11px] text-slate-500 tabular-nums ml-auto">
          {filteredTutorials.length} of {tutorials.length} shown
        </span>
      </div>

      {/* Tutorials Table */}
      <section className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-[#c3c4c7] flex flex-wrap items-center justify-between gap-2 bg-slate-50">
          <div>
            <h2 className="font-display text-sm font-bold text-[#1d2327]">
              Tutorial Library ({tutorials.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Published tutorials appear on the public /tutorials hub and in the sitemap feed.
            </p>
          </div>
        </div>

        {filteredTutorials.length === 0 ? (
          <div className="text-center py-14 px-4">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">
              {tutorials.length === 0 ? 'No tutorials yet' : 'No tutorials match your filters'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {tutorials.length === 0
                ? 'Create the first tutorial to populate the public hub.'
                : 'Adjust the search or status filter above.'}
            </p>
            {tutorials.length === 0 && (
              <button
                type="button"
                onClick={() => openEditor()}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#2271b1] hover:bg-[#135e96] rounded-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Tutorial</span>
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="px-4 py-2.5">Tutorial</th>
                <th className="px-4 py-2.5">Category & Tags</th>
                <th className="px-4 py-2.5 text-center">Steps</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTutorials.map((tut) => {
                const badge = STATUS_BADGE[tut.status] ?? STATUS_BADGE.draft;
                return (
                  <tr key={tut.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 max-w-xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        {tut.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-400" />}
                        <span className="truncate">{tut.title}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 truncate" title={tut.subtitle || tut.slug}>
                        {tut.subtitle || `/tutorials/${tut.slug}`}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800">{tut.category || 'Uncategorised'}</p>
                      {tut.tags.length > 0 && (
                        <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {tut.tags.slice(0, 3).join(' · ')}
                          {tut.tags.length > 3 ? ' …' : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center tabular-nums font-semibold text-slate-700">
                      {tut.steps?.length || 0}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleTutorialStatus(tut.id)}
                          title={tut.status === 'published' ? 'Move to draft' : 'Publish now'}
                          className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-[#8c8f94] text-[#2271b1] hover:bg-blue-50 cursor-pointer"
                        >
                          {tut.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 whitespace-nowrap tabular-nums">
                      {new Date(tut.updatedAt || tut.createdAt).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/tutorials/${tut.slug}`)}
                          title="View on public hub"
                          className="p-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditor(tut)}
                          title="Edit tutorial"
                          className="p-1.5 rounded border border-slate-300 text-[#2271b1] hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tut)}
                          title="Delete tutorial"
                          className="p-1.5 rounded border border-slate-300 text-red-600 hover:bg-red-50 cursor-pointer"
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
        )}
      </section>

      {/* Tutorial Editor Modal (same editor as the public hub) */}
      {isEditorOpen && (
        <TutorialEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialTutorial={editingTutorial}
          onSave={(saved) => {
            const authored: DocumentTutorial = {
              ...saved,
              authorId: saved.authorId || currentUser?.id,
              authorName: saved.authorName || currentUser?.name || 'Platform Lead',
            };
            upsertTutorial(authored);
          }}
        />
      )}
    </div>
  );
}
