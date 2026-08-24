import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/UIComponents';
import { Mail, Lock, User, Shield, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import authIllustration from '../assets/auth-illustration-new.png';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'resident';

  const [activeRoleTab, setActiveRoleTab] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign In — Angan';
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'resident') {
      setActiveRoleTab(paramRole);
    }
  }, [searchParams]);

  function handleResetSession() {
    logout();
    setEmail('');
    setPassword('');
    setError('');
    addToast('Cleared cached session data.', 'info');
  }

  async function performLogin(loginEmail, loginPassword) {
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(loginEmail, loginPassword);
      addToast(`Welcome back to your society, ${loggedUser.name}!`, 'success');

      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login Error:', err);
      let errMsg = 'Sign in failed. Please check your credentials.';
      if (!err.response) {
        errMsg = 'Backend server is unavailable. Please make sure backend is running.';
      } else if (err.response.status === 401) {
        errMsg = err.response.data?.error || 'Invalid email or password.';
      } else if (err.response.status === 403) {
        errMsg = err.response.data?.error || 'Access forbidden for this role.';
      } else if (err.response.data?.error) {
        errMsg = err.response.data.error;
      }
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    performLogin(email, password);
  }

  function handleQuickFill(targetEmail, targetPassword, role) {
    setActiveRoleTab(role);
    setEmail(targetEmail);
    setPassword(targetPassword);
    performLogin(targetEmail, targetPassword);
  }

  const showDemo = import.meta.env.VITE_SHOW_DEMO === 'true';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left Panel: Hero Illustration (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-olive-500 to-olive-600 relative overflow-hidden">
        <img
          src={authIllustration}
          alt="Angan Portal Illustration"
          className="max-w-md w-full object-contain relative z-10 drop-shadow-md"
        />
        <div className="relative z-10 text-center mt-8 space-y-2">
          <h1 className="text-white font-display text-2xl font-bold">
            Your courtyard, online.
          </h1>
          <p className="text-white/70 text-sm max-w-sm mx-auto">
            Manage maintenance requests, notice announcements, and community affairs seamlessly.
          </p>
        </div>
      </div>

      {/* Right Panel: Form Side */}
      <div className="bg-paper flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="max-w-sm w-full space-y-6">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Angan Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-semibold text-2xl text-ink">Angan</span>
            </Link>

            {/* Role Pill Buttons */}
            <div className="flex bg-paper-hover p-1 rounded-xl gap-1 w-full mt-4">
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('resident');
                  setError('');
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeRoleTab === 'resident'
                    ? 'bg-terracotta-400 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Resident</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('admin');
                  setError('');
                }}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeRoleTab === 'admin'
                    ? 'bg-terracotta-400 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            <div className="pt-2">
              <h2 className="font-display text-2xl font-bold text-ink">Welcome back</h2>
              <p className="text-xs text-ink-muted mt-1">
                {activeRoleTab === 'resident'
                  ? 'Sign in to access your resident portal'
                  : 'Sign in to access society administrative operations'}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  className="w-full rounded-lg border border-line px-4 py-3 pl-10 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-all placeholder:text-ink-muted"
                  placeholder={activeRoleTab === 'resident' ? 'resident@society.com' : 'admin@society.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-lg border border-line px-4 py-3 pl-10 pr-10 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-all placeholder:text-ink-muted"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button variant="primary" isFullWidth size="lg" isLoading={loading} type="submit">
              {loading ? 'Signing in...' : `Sign in as ${activeRoleTab === 'admin' ? 'Admin' : 'Resident'}`}
            </Button>
          </form>

          {/* 1-Click Demo Login Panel */}
          <div className="pt-4 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                <span>1-Click Demo Accounts</span>
              </div>
              <span className="text-[10px] text-terracotta-600 bg-terracotta-50 font-semibold px-2 py-0.5 rounded-full border border-terracotta-100/80">
                Quick Test Drive
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Resident Demo Card */}
              <button
                type="button"
                onClick={() => handleQuickFill('resident@society.com', 'Resident@123', 'resident')}
                className="group relative flex items-center justify-between p-3 rounded-xl border border-terracotta-200/60 bg-gradient-to-r from-terracotta-50/40 to-paper-card hover:from-terracotta-50 hover:to-terracotta-100/40 hover:border-terracotta-400 hover:shadow-card transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-terracotta-100/90 border border-terracotta-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <User className="w-4.5 h-4.5 text-terracotta-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-ink group-hover:text-terracotta-600 transition-colors">
                        Resident Portal Demo
                      </span>
                      <span className="text-[9px] font-mono bg-paper px-1.5 py-0.5 rounded border border-line text-ink-muted">
                        Pass: Resident@123
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-secondary block truncate mt-0.5">
                      resident@society.com
                    </span>
                  </div>
                </div>
                <div className="text-terracotta-400 group-hover:text-terracotta-600 group-hover:translate-x-1 transition-all pl-2 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Admin Demo Card */}
              <button
                type="button"
                onClick={() => handleQuickFill('admin@society.com', 'Admin@123', 'admin')}
                className="group relative flex items-center justify-between p-3 rounded-xl border border-olive-200/60 bg-gradient-to-r from-olive-50/40 to-paper-card hover:from-olive-50 hover:to-olive-100/40 hover:border-olive-400 hover:shadow-card transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-olive-100/90 border border-olive-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Shield className="w-4.5 h-4.5 text-olive-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-ink group-hover:text-olive-700 transition-colors">
                        Admin Control Center Demo
                      </span>
                      <span className="text-[9px] font-mono bg-paper px-1.5 py-0.5 rounded border border-line text-ink-muted">
                        Pass: Admin@123
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-ink-secondary block truncate mt-0.5">
                      admin@society.com
                    </span>
                  </div>
                </div>
                <div className="text-olive-500 group-hover:text-olive-700 group-hover:translate-x-1 transition-all pl-2 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Link to Register */}
          <div className="text-center text-xs text-ink-secondary pt-1 space-y-2">
            <div>
              <span>Don't have an account? </span>
              <Link
                to={`/register?role=${activeRoleTab}`}
                className="text-terracotta-400 font-semibold hover:underline"
              >
                Register as {activeRoleTab === 'admin' ? 'Admin' : 'Resident'}
              </Link>
            </div>

            <button
              type="button"
              className="text-[11px] text-ink-muted hover:text-ink underline block mx-auto pt-0.5"
              onClick={handleResetSession}
            >
              Clear Session Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
