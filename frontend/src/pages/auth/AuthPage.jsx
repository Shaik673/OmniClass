import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';
import OmniClassLogo from '../../components/shared/OmniClassLogo.jsx';

export default function AuthPage({ mode, onUser, onTheme }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const { data } = await api.post(path, form);
      const user = data?.data?.user || data?.user;
      onUser(user);
      if (user?.theme && onTheme) onTheme(user.theme);
      toast.success(mode === 'register' ? 'Welcome to OmniClass!' : 'Welcome back!');
      if (mode === 'register') {
        navigate('/onboarding');
      } else {
        navigate(user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/teaching' : '/dashboard');
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = (provider) => {
    // Initiate full browser OAuth flow via API endpoint
    window.location.href = `/api/v1/auth/${provider}`;
  };

  return (
    <div className="auth-layout">
      {/* Visual Side */}
      <div className="auth-visual">
        <header className="landing-nav">
          <Link to="/" className="brand">
            <OmniClassLogo size={28} />
          </Link>
        </header>
        <div className="auth-art">
          <div className="auth-orbit" />
          <div className="auth-orbit inner" />
          <div className="auth-emblem">✳</div>
          <span className="auth-star a">✦</span>
          <span className="auth-star b">✧</span>
        </div>
        <div className="auth-quote">
          <div>“</div>
          <p>
            Learning isn’t a race.
            <br />
            It’s a relationship with possibility.
          </p>
          <span>THE OMNICLASS APPROACH</span>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <Link to="/" className="back-home">
          <ChevronLeft size={16} /> Back home
        </Link>

        <div className="auth-form">
          <div className="section-kicker">
            {mode === 'register' ? 'YOUR STORY STARTS HERE' : 'GOOD TO SEE YOU AGAIN'}
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 26, letterSpacing: '-0.8px' }}>
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 18px', lineHeight: 1.5 }}>
            {mode === 'register'
              ? 'Join a community that learns with intention.'
              : 'Sign in and pick up where you left off.'}
          </p>

          {/* Social Authentication */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--faint)',
                letterSpacing: '0.08em',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Sign in with Social ID
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-indigo-500/50"
                title="Sign in with Google OAuth"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-indigo-500/50"
                title="Sign in with GitHub OAuth"
              >
                <svg className="w-4 h-4 fill-current text-slate-200" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('facebook')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-indigo-500/50"
                title="Sign in with Facebook OAuth"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>

          {/* Clean, Tightly-Spaced Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '16px 0 14px',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              or with email
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={submit}>
            {mode === 'register' && (
              <label className="field-label">
                Full name
                <input
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Alex Morgan"
                />
              </label>
            )}

            <label className="field-label">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@university.edu"
              />
            </label>

            <label className="field-label">
              Password
              <input
                required
                minLength={8}
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
              />
            </label>

            {mode === 'login' && (
              <div className="auth-switch" style={{ margin: '8px 0 14px' }}>
                <Link to="/forgot-password">Forgot your password?</Link> ·{' '}
                <Link to="/verify-email">Resend verification email</Link>
              </div>
            )}

            <button className="button button-primary auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={16} />
            </button>

            <div className="auth-switch">
              {mode === 'register' ? 'Already have an account?' : 'New to OmniClass?'}{' '}
              <Link to={mode === 'register' ? '/login' : '/register'}>
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </Link>
            </div>

            <div className="auth-footnote">
              <Shield size={14} /> Institutional identity protected. End-to-end token encryption.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
