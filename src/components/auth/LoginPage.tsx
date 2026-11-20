import { useState } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { validateAuthForm } from '../../utils/commerce';
import { getAccentTheme } from '../../utils/theme';

interface LoginPageProps {
  mode: 'standard' | 'admin';
}

export function LoginPage({ mode }: LoginPageProps) {
  const {
    appearance,
    loginWithCredentials,
    loginAdminWithServer,
    registerUser,
    navigate,
    quickLoginAsRole,
  } = useStore();
  const accent = getAccentTheme(appearance.accentTheme);

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const [registerRole, setRegisterRole] = useState<'customer' | 'instructor'>('customer');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminMode = mode === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    const check = validateAuthForm(
      email,
      password,
      name,
      !isAdminMode && tab === 'register'
    );
    setFieldErrors(check.errors);
    if (!check.valid) return;

    if (isAdminMode) {
      setIsSubmitting(true);
      const adminRes = await loginAdminWithServer(email, password);
      setIsSubmitting(false);
      if (!adminRes.ok) {
        setFormError(adminRes.error ?? 'Administrator authentication failed.');
        return;
      }
      navigate('/admin');
      return;
    }

    if (tab === 'register') {
      const res = registerUser(name, email, password, registerRole, newsletterOptIn);
      if (!res.ok) {
        setFormError(res.error ?? 'Could not create account.');
        return;
      }
      navigate(registerRole === 'instructor' ? '/instructor' : '/library');
      return;
    }

    const res = loginWithCredentials(email, password);
    if (!res.ok || !res.user) {
      setFormError(res.error ?? 'Authentication failed.');
      return;
    }

    if (res.user.role === 'admin') {
      const serverAdmin = await loginAdminWithServer(email, password);
      if (!serverAdmin.ok) {
        setFormError(serverAdmin.error ?? 'Use /admin-login to verify admin session.');
        return;
      }
      navigate('/admin');
    } else if (res.user.role === 'instructor') {
      navigate('/instructor');
    } else {
      navigate('/library');
    }
  };

  const handleAutofillDemo = (role: 'customer' | 'instructor') => {
    setFieldErrors({});
    setFormError(null);
    if (role === 'instructor') {
      setTab('login');
      setEmail('instructor@coursemart.io');
      setPassword('demo1234');
    } else {
      setTab('login');
      setEmail('student@coursemart.io');
      setPassword('demo1234');
    }
  };

  const handleInstantLogin = (role: 'customer' | 'instructor') => {
    const user = quickLoginAsRole(role);
    if (!user) return;
    if (role === 'instructor') navigate('/instructor');
    else navigate('/library');
  };

  if (isAdminMode) {
    return (
      <main className="min-h-screen bg-[#f0f0f1] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#1d2327] text-white mx-auto flex items-center justify-center mb-3 shadow-sm">
              <ShieldCheck className="w-7 h-7 text-[#72aee6]" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#1d2327]">
              {appearance.brandName} Admin
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Marketplace & LMS Operations Console
            </p>
          </div>

          <div className="bg-white border border-[#c3c4c7] shadow-sm p-6 rounded-sm space-y-5">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-[#1d2327] mb-1"
                >
                  Administrator Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ops@company.com"
                  className="w-full h-10 px-3 text-sm bg-white border border-[#8c8f94] rounded-sm focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                />
                {fieldErrors.email && (
                  <p className="text-xs text-rose-700 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-[#1d2327] mb-1"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 text-sm bg-white border border-[#8c8f94] rounded-sm focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-rose-700 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 rounded-sm">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#2271b1]"
                  />
                  <span>Remember Me</span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-60 rounded-sm cursor-pointer"
                >
                  {isSubmitting ? 'Verifying...' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              Protected by server-verified HMAC HttpOnly session authentication (<code className="font-mono">ADMIN_EMAIL</code> / <code className="font-mono">ADMIN_PASSWORD</code>).
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-600 px-1">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1 hover:text-[#2271b1] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to {appearance.brandName}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hover:text-[#2271b1] cursor-pointer"
            >
              Student / Instructor Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-7 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            {tab === 'login' ? `Sign in to ${appearance.brandName}` : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Access purchased courses, DRM-free eBooks, and software license keys.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setFieldErrors({});
              setFormError(null);
            }}
            className={`py-2 text-xs font-bold rounded-md cursor-pointer ${
              tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setFieldErrors({});
              setFormError(null);
            }}
            className={`py-2 text-xs font-bold rounded-md cursor-pointer ${
              tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Takahashi"
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                />
                {fieldErrors.name && (
                  <p className="text-xs text-rose-700 mt-1">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('customer')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-md cursor-pointer ${
                      registerRole === 'customer'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    Student / Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('instructor')}
                    className={`py-2 px-3 text-xs font-semibold border rounded-md cursor-pointer ${
                      registerRole === 'instructor'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    Instructor / Vendor
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@coursemart.io"
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
            />
            {fieldErrors.email && (
              <p className="text-xs text-rose-700 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full h-10 px-3 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
            />
            {fieldErrors.password && (
              <p className="text-xs text-rose-700 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#0a192f]"
              />
              <span>Remember me on this device</span>
            </label>

            {tab === 'register' && (
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-0.5 accent-[#0a192f]"
                />
                <span>
                  <strong className="text-slate-900">Subscribe to Newsletter & Event Releases</strong>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    Receive weekly digests, free Vibe Coding articles, and seminar invites via email. Unsubscribe anytime in My Library.
                  </span>
                </span>
              </label>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-medium text-rose-800">
              {formError}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-4 text-sm font-bold text-white ${accent.primaryBg} ${accent.primaryHoverBg} rounded-md transition-colors cursor-pointer`}
          >
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Instant Demo Role Switcher */}
        <div className="pt-5 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700">Instant Demo Role Switcher</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleInstantLogin('customer')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border border-slate-300 rounded-md text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Demo Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleInstantLogin('instructor')}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold border border-slate-300 rounded-md text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-700" />
              <span>Demo Instructor</span>
            </button>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => handleAutofillDemo('customer')}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Autofill preview student
            </button>
            <span className="text-[11px] text-slate-400">Preview role switcher</span>
          </div>
        </div>
      </div>
    </main>
  );
}
