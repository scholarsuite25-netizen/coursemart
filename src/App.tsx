import React, { Suspense, lazy } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/storefront/AnnouncementBar';
import { CartDrawer } from './components/storefront/CartDrawer';
import { Footer } from './components/storefront/Footer';
import { Header } from './components/storefront/Header';
import { StorefrontPage } from './components/storefront/StorefrontPage';
import { EnquiryAssistantWidget } from './components/storefront/EnquiryAssistantWidget';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { TripwireWelcomeModal } from './components/storefront/TripwireWelcomeModal';
import { ExitIntentModal } from './components/storefront/ExitIntentModal';
import { parseAppRoute } from './utils/catalogAndBlogs';

// Route-level code splitting: only the shell and the default landing page load
// up front; every other page arrives as its own chunk on first navigation.
const AdminDashboardPage = lazy(() =>
  import('./components/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const LoginPage = lazy(() =>
  import('./components/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const BlogPostPage = lazy(() =>
  import('./components/blog/BlogPostPage').then((m) => ({ default: m.BlogPostPage }))
);
const BlogsPage = lazy(() =>
  import('./components/blog/BlogsPage').then((m) => ({ default: m.BlogsPage }))
);
const AffiliatesPage = lazy(() =>
  import('./components/affiliates/AffiliatesPage').then((m) => ({ default: m.AffiliatesPage }))
);
const EventsPage = lazy(() =>
  import('./components/events/EventsPage').then((m) => ({ default: m.EventsPage }))
);
const InstructorStudioPage = lazy(() =>
  import('./components/instructor/InstructorStudioPage').then((m) => ({
    default: m.InstructorStudioPage,
  }))
);
const CoursePlayerPage = lazy(() =>
  import('./components/lms/CoursePlayerPage').then((m) => ({ default: m.CoursePlayerPage }))
);
const LibraryPage = lazy(() =>
  import('./components/lms/LibraryPage').then((m) => ({ default: m.LibraryPage }))
);
const MembershipPage = lazy(() =>
  import('./components/membership/MembershipPage').then((m) => ({ default: m.MembershipPage }))
);
const ShowcasePage = lazy(() =>
  import('./components/showcase/ShowcasePage').then((m) => ({ default: m.ShowcasePage }))
);
const CatalogLandingPage = lazy(() =>
  import('./components/storefront/CatalogLandingPage').then((m) => ({
    default: m.CatalogLandingPage,
  }))
);
const ProductDetailPage = lazy(() =>
  import('./components/storefront/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  }))
);
const CommunityPage = lazy(() =>
  import('./components/community/CommunityPage').then((m) => ({ default: m.CommunityPage }))
);
const SalesFunnelPage = lazy(() =>
  import('./components/funnel/SalesFunnelPage').then((m) => ({ default: m.SalesFunnelPage }))
);
const MemberPromptVaultPage = lazy(() =>
  import('./components/vault/MemberPromptVaultPage').then((m) => ({
    default: m.MemberPromptVaultPage,
  }))
);
const TutorialDetailPage = lazy(() =>
  import('./components/tutorials/TutorialDetailPage').then((m) => ({
    default: m.TutorialDetailPage,
  }))
);

const promoterModules = import.meta.glob<{
  default?: React.ComponentType<any>;
  PromoterProfilePage?: React.ComponentType<any>;
}>('./components/promoter/PromoterProfilePage.{tsx,ts,jsx,js}');

const verifyModules = import.meta.glob<{
  default?: React.ComponentType<any>;
  VerifyCertificatePage?: React.ComponentType<any>;
}>('./components/lms/VerifyCertificatePage.{tsx,ts,jsx,js}');

const PromoterProfilePage = lazy(async () => {
  const keys = Object.keys(promoterModules);
  if (keys.length > 0 && promoterModules[keys[0]]) {
    const mod = await promoterModules[keys[0]]();
    return { default: mod.PromoterProfilePage || mod.default || (() => null) };
  }
  return {
    default: () => (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Executive Promoter Profile</h1>
        <p className="text-sm text-slate-500 mt-2">S. B. OMOTOSO (FCIA, MILR, MSc, MNIM) — Loading...</p>
      </div>
    ),
  };
});

const VerifyCertificatePage = lazy(async () => {
  const keys = Object.keys(verifyModules);
  if (keys.length > 0 && verifyModules[keys[0]]) {
    const mod = await verifyModules[keys[0]]();
    return { default: mod.VerifyCertificatePage || mod.default || (() => null) };
  }
  return {
    default: () => (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Certificate Verification</h1>
        <p className="text-sm text-slate-500 mt-2">Authenticating credential...</p>
      </div>
    ),
  };
});

function PageFallback() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    </div>
  );
}

function AppRouter() {
  const { route, toastMessage } = useStore();
  const parsed = parseAppRoute(route);

  const isStandaloneShell =
    parsed.page === 'admin' ||
    parsed.page === 'admin-login' ||
    parsed.page === 'learn' ||
    parsed.page === 'funnel';

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
    case 'community':
      content = (
        <CommunityPage
          initialView={parsed.subView}
          initialChannelId={parsed.channelId}
          initialThreadId={parsed.threadId}
        />
      );
      break;
    case 'funnel':
      content = <SalesFunnelPage key={parsed.slug} slug={parsed.slug} />;
      break;
    case 'vault':
      content = <MemberPromptVaultPage />;
      break;
    case 'tutorials-hub':
      content = <TutorialDetailPage />;
      break;
    case 'tutorial-detail':
      content = <TutorialDetailPage key={parsed.slug} slug={parsed.slug} />;
      break;
    case 'promoter':
      content = <PromoterProfilePage />;
      break;
    case 'verify-certificate':
      content = <VerifyCertificatePage certificateId={parsed.certificateId} />;
      break;
    case 'home':
    default:
      content = <StorefrontPage />;
      break;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-[#0b1329] dark:text-slate-100 transition-colors w-full max-w-full overflow-x-clip">
      {!isStandaloneShell && (
        <>
          <AnnouncementBar />
          <Header />
        </>
      )}

      <div className="flex-1">
        <Suspense fallback={<PageFallback />}>{content}</Suspense>
      </div>

      {!isStandaloneShell && <Footer />}

      {!isStandaloneShell && <EnquiryAssistantWidget />}

      <PwaInstallPrompt />

      <CartDrawer />
      <TripwireWelcomeModal />
      <ExitIntentModal />

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
