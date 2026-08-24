import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/UIComponents';
import { Mail, Lock, User, Shield, Building, Eye, EyeOff, ShieldCheck, Clock } from 'lucide-react';
import authIllustration from '../assets/auth-illustration-new.webp';

export default function Register() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'resident';

  const [activeRoleTab, setActiveRoleTab] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [flatNumber, setFlatNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminPendingState, setAdminPendingState] = useState(null);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = activeRoleTab === 'admin' ? 'Register for Admin Access — Angan' : 'Create Resident Account — Angan';
  }, [activeRoleTab]);

  function handleSwitchTab(role) {
    setActiveRoleTab(role);
    setError('');
    setSearchParams({ role });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        flatNumber: activeRoleTab === 'resident' ? (flatNumber.trim() || undefined) : undefined,
        role: activeRoleTab,
      });

      if (res && res.requiresApproval) {
        setAdminPendingState(res);
        addToast('Admin access request submitted for approval.', 'info');
      } else {
        addToast(`Welcome to your society portal, ${res.name}!`, 'success');
        if (res.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      addToast('Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

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
              <img src="/logo.webp" alt="Angan Logo" className="h-10 w-auto object-contain" />
              <span className="font-display font-semibold text-2xl text-ink">Angan</span>
            </Link>

            {!adminPendingState && (
              <div className="flex bg-paper-hover p-1 rounded-xl gap-1 w-full mt-4">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('resident')}
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
                  onClick={() => handleSwitchTab('admin')}
                  className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeRoleTab === 'admin'
                      ? 'bg-terracotta-400 text-white shadow-sm'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Access</span>
                </button>
              </div>
            )}
          </div>

          {/* Pending Admin Registration Success State Screen */}
          {adminPendingState ? (
            <div className="bg-paper-card p-6 rounded-2xl border border-line shadow-card text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="font-display font-bold text-xl text-ink">
                  {adminPendingState.title || 'Admin Registration Submitted'}
                </h2>
                <p className="text-xs text-ink-secondary leading-relaxed font-medium">
                  {adminPendingState.message || 'Your admin account has been created and is awaiting approval from an existing administrator.'}
                </p>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  {adminPendingState.subMessage || 'Once approved, you can sign in using your registered email and password.'}
                </p>
              </div>

              <div className="p-3 bg-paper rounded-xl border border-line text-left text-xs space-y-1">
                <div className="flex justify-between text-ink-muted text-[11px]">
                  <span>Requested Account:</span>
                  <span className="font-mono text-terracotta-500 font-semibold uppercase">Pending Approval</span>
                </div>
                <div className="font-semibold text-ink truncate">{name}</div>
                <div className="font-mono text-ink-secondary text-[11px] truncate">{email}</div>
              </div>

              <Button
                variant="primary"
                isFullWidth
                size="lg"
                onClick={() => navigate('/login?role=admin')}
              >
                Back to Admin Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center pt-1 space-y-1 min-h-[52px] flex flex-col justify-center">
                <h2 className="font-display text-2xl font-bold text-ink">
                  {activeRoleTab === 'admin' ? 'Register for Admin Access' : 'Create Resident Account'}
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed max-w-xs mx-auto">
                  {activeRoleTab === 'resident'
                    ? 'Join your digital society portal to submit complaints & view notices.'
                    : 'Admin accounts require approval from an existing administrator.'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-500 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink-muted">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-line px-4 py-3 pl-10 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-all placeholder:text-ink-muted"
                      placeholder="e.g. Sudhanshu Batra"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink-muted">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className="w-full rounded-lg border border-line px-4 py-3 pl-10 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-all placeholder:text-ink-muted"
                      placeholder={activeRoleTab === 'admin' ? 'admin.new@society.com' : 'resident@society.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Flat / Designation Field (Consistent field across both tabs to maintain identical form height) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink-muted">
                    {activeRoleTab === 'resident' ? 'Flat / Apartment Number' : 'Flat / Office Unit (Optional)'}
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-line px-4 py-3 pl-10 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-all placeholder:text-ink-muted"
                      placeholder={activeRoleTab === 'resident' ? 'e.g. Flat A-204' : 'e.g. Society Office / A-101'}
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
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
                  {loading ? 'Submitting Request...' : activeRoleTab === 'admin' ? 'Request Admin Access' : 'Register Resident Account'}
                </Button>
              </form>

              {/* Link to Login */}
              <div className="text-center text-xs text-ink-secondary pt-2">
                <span>{activeRoleTab === 'admin' ? 'Already an Admin? ' : 'Already registered? '}</span>
                <Link
                  to={`/login?role=${activeRoleTab}`}
                  className="text-terracotta-400 font-semibold hover:underline"
                >
                  {activeRoleTab === 'admin' ? 'Sign In as Admin' : 'Sign In as Resident'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
