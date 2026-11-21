import { useMemo, useState } from 'react';
import {
  BookOpen,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { BlogPost, Product } from '../../types/marketplace';
import { formatNaira } from '../../utils/currency';
import { formatProductTypeLabel } from '../../utils/theme';
import { ProductEditorModal } from '../admin/ProductEditorModal';
import { BlogEditorModal } from '../blog/BlogEditorModal';

export function InstructorStudioPage() {
  const {
    currentUser,
    products,
    orders,
    upsertProduct,
    blogPosts,
    upsertBlogPost,
    deleteBlogPost,
    toggleBlogPostStatus,
    navigate,
    quickLoginAsRole,
  } = useStore();
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null | undefined>(undefined);

  const instructorProducts = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return products;
    return products.filter((p) => p.instructorId === currentUser.id);
  }, [products, currentUser]);

  const instructorBlogs = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return blogPosts;
    return blogPosts.filter((b) => b.authorId === currentUser.id);
  }, [blogPosts, currentUser]);

  const metrics = useMemo(() => {
    const ownedIds = new Set(instructorProducts.map((p) => p.id));
    let revenue = 0;
    orders
      .filter((o) => o.status === 'completed')
      .forEach((o) =>
        o.items.forEach((item) => {
          if (ownedIds.has(item.productId)) revenue += item.price;
        })
      );
    const totalStudents = instructorProducts.reduce((s, p) => s + p.studentsCount, 0);
    const avgRating =
      instructorProducts.length > 0
        ? instructorProducts.reduce((s, p) => s + p.rating, 0) / instructorProducts.length
        : 0;
    return { revenue, totalStudents, avgRating };
  }, [instructorProducts, orders]);

  if (!currentUser || (currentUser.role !== 'instructor' && currentUser.role !== 'admin')) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Instructor Studio Access Required
        </h1>
        <p className="text-sm text-slate-600">
          Sign in as an Instructor / Vendor to publish courses, digital resources, editorial blog
          guides, and inspect sales analytics.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => quickLoginAsRole('instructor')}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#5624d0] rounded-md cursor-pointer"
          >
            Enter as Demo Instructor
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-md cursor-pointer"
          >
            Back to Storefront
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#5624d0]">Instructor & Creator Studio</p>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 mt-0.5">
            {currentUser.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/promoter')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#0a192f] bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md cursor-pointer dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#d4af37]" />
            <span>View Executive Promoter Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingBlog(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-[#0a192f] bg-[#d4af37] hover:bg-[#e5bf45] rounded-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write Blog Article</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingProduct(null)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#5624d0] hover:bg-[#401b9c] rounded-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Catalog Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {formatNaira(metrics.revenue)}
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Enrollments & Buyers</span>
            <Users className="w-4 h-4 text-[#5624d0]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {metrics.totalStudents.toLocaleString()}
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-5 bg-white">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Average Rating</span>
            <TrendingUp className="w-4 h-4 text-[#b4690e]" />
          </div>
          <p className="font-display text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">
            {metrics.avgRating.toFixed(2)} / 5.0
          </p>
        </div>
      </div>

      {/* Instructor Products Table */}
      <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Your Published & Draft Products ({instructorProducts.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Students</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {instructorProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{p.title}</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {formatProductTypeLabel(p.type, p.digitalSubType)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs font-bold capitalize ${
                        p.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">{formatNaira(p.price)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">
                    {p.studentsCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#5624d0] hover:underline cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Curriculum</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Instructor Blog Articles CMS */}
      <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0a192f]" />
            <span>Editorial Blog Articles ({instructorBlogs.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => setEditingBlog(null)}
            className="text-xs font-bold text-[#0a192f] hover:underline cursor-pointer"
          >
            + New Article
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3">Article Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Linked Products</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {instructorBlogs.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{post.title}</p>
                    <p className="text-xs text-slate-500">
                      {post.readTimeMinutes} min · {post.comments.length} comment(s)
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{post.category}</td>
                  <td className="px-5 py-3.5 text-slate-600">{post.relatedProductIds.length}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleBlogPostStatus(post.id)}
                      className={`text-xs font-bold capitalize underline cursor-pointer ${
                        post.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {post.status}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        aria-label={`View ${post.title}`}
                        className="text-slate-600 hover:text-[#0a192f] cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBlog(post)}
                        aria-label={`Edit article ${post.title}`}
                        className="text-[#5624d0] hover:underline inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBlogPost(post.id)}
                        aria-label={`Delete article ${post.title}`}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingProduct !== undefined && (
        <ProductEditorModal
          initialProduct={editingProduct}
          instructorId={currentUser.id}
          instructorName={currentUser.name}
          onSave={(saved) => {
            upsertProduct(saved);
            setEditingProduct(undefined);
          }}
          onClose={() => setEditingProduct(undefined)}
        />
      )}

      {editingBlog !== undefined && (
        <BlogEditorModal
          initialPost={editingBlog}
          authorId={currentUser.id}
          authorName={currentUser.name}
          authorRole={currentUser.title ?? 'Instructor & Author'}
          products={products}
          onSave={(saved) => {
            upsertBlogPost(saved);
            setEditingBlog(undefined);
          }}
          onClose={() => setEditingBlog(undefined)}
        />
      )}
    </main>
  );
}
