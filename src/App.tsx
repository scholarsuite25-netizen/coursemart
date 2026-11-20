import { StoreProvider, useStore } from './context/StoreContext';
import { AdminDashboardPage } from './components/admin/AdminDashboardPage';
import { LoginPage } from './components/auth/LoginPage';
import { BlogPostPage } from './components/blog/BlogPostPage';
import { BlogsPage } from './components/blog/BlogsPage';
import { AffiliatesPage } from './components/affiliates/AffiliatesPage';
import { EventsPage } from './components/events/EventsPage';
import { InstructorStudioPage } from './components/instructor/InstructorStudioPage';
import { CoursePlayerPage } from './components/lms/CoursePlayerPage';
import { LibraryPage } from './components/lms/LibraryPage';
import { MembershipPage } from './components/membership/MembershipPage';
import { ShowcasePage } from './components/showcase/ShowcasePage';
import { AnnouncementBar } from './components/storefront/AnnouncementBar';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CatalogLandingPage } from './components/storefront/CatalogLandingPage';
import { Footer } from './components/storefront/Footer';
import { Header } from './components/storefront/Header';
import { ProductDetailPage } from './components/storefront/ProductDetailPage';
import { StorefrontPage } from './components/storefront/StorefrontPage';
import { parseAppRoute } from './utils/catalogAndBlogs';

function AppRouter() {
  const { route, toastMessage } = useStore();
  const parsed = parseAppRoute(route);

  const isStandaloneShell =
    parsed.page === 'admin' ||
    parsed.page === 'admin-login' ||
    parsed.page === 'learn';

  let content: React.ReactNode = <StorefrontPage />;

  switch (parsed.page) {
    case 'login':
      content = <LoginPage mode="standard" />;
      break;
    case 'admin-login':
      content = <LoginPage mode="admin" />;
      break;
    case 'admin':
      content = <AdminDashboardPage />;
      break;
    case 'library':
      content = <LibraryPage />;
      break;
    case 'instructor':
      content = <InstructorStudioPage />;
      break;
    case 'learn':
      content = <CoursePlayerPage productId={parsed.productId} />;
      break;
    case 'product':
      content = <ProductDetailPage slug={parsed.slug} />;
      break;
    case 'courses':
      content = <CatalogLandingPage scope={{ kind: 'courses' }} />;
      break;
    case 'digital-hub':
      content = <CatalogLandingPage scope={{ kind: 'digital-hub' }} />;
      break;
    case 'digital-sub':
      content = (
        <CatalogLandingPage
          key={parsed.subType}
          scope={{ kind: 'digital-sub', subType: parsed.subType }}
        />
      );
      break;
    case 'software':
      content = <CatalogLandingPage scope={{ kind: 'software' }} />;
      break;
    case 'membership':
      content = <MembershipPage />;
      break;
    case 'affiliates':
      content = <AffiliatesPage />;
      break;
    case 'showcase':
      content = <ShowcasePage />;
      break;
    case 'events':
      content = <EventsPage />;
      break;
    case 'blogs-hub':
      content = <BlogsPage />;
      break;
    case 'blogs-category':
      content = <BlogsPage key={parsed.category} activeCategory={parsed.category} />;
      break;
    case 'blog-detail':
      content = <BlogPostPage key={parsed.slug} slug={parsed.slug} />;
      break;
    case 'home':
    default:
      content = <StorefrontPage />;
      break;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {!isStandaloneShell && (
        <>
          <AnnouncementBar />
          <Header />
        </>
      )}

      <div className="flex-1">{content}</div>

      {!isStandaloneShell && <Footer />}

      <CartDrawer />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 right-5 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xl border border-slate-700"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
