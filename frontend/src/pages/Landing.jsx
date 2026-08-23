import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/UIComponents';
import { PriorityBadge } from '../components/Badges';
import {
  ClipboardList,
  Clock,
  Megaphone,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  User,
  Shield,
  Pin,
} from 'lucide-react';
import heroCommunityIllustration from '../assets/nivaas-hero-community.png';

export default function Landing() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(null);

  // If user is already logged in, redirect to their dashboard
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  async function handleQuickDemo(email, password, roleLabel) {
    setDemoLoading(roleLabel);
    try {
      const loggedUser = await login(email, password);
      addToast(`Welcome back to your society portal, ${loggedUser.name}!`, 'success');
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Demo Login Error:', err);
      addToast('Demo sign-in failed. Please check server.', 'error');
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="bg-paper min-h-screen flex flex-col font-sans text-ink">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 bg-paper-card/90 backdrop-blur border-b border-line z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Angan Logo" className="h-9 w-auto object-contain" />
            <span className="font-display font-semibold text-lg text-ink">Angan</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-secondary">
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              How it Works
            </a>
            <a href="#previews" className="hover:text-ink transition-colors">
              Previews
            </a>
          </div>

          <Button variant="outline" size="sm" href="#role-selection">
            Sign In
          </Button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="min-h-[85vh] flex items-center bg-paper py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
          {/* Left Text Column */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-mustard-50 text-mustard-500 border border-mustard-400/30 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-mustard-500 animate-pulse" />
              <span>Your Community Portal</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-ink leading-tight">
              Your courtyard, now online.
            </h1>

            <p className="text-ink-secondary text-base md:text-lg max-w-md leading-relaxed">
              Raise maintenance complaints, track their progress, stay updated with society notices, and keep everything happening in your community organized.
            </p>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <Button
                variant="primary"
                size="lg"
                href="#role-selection"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Enter Your Society
              </Button>
              <Button variant="outline" size="lg" href="#features">
                Explore Features
              </Button>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="flex items-center justify-center">
            <img
              src={heroCommunityIllustration}
              alt="Digital Society Community Illustration"
              className="w-full h-auto max-w-lg object-contain"
            />
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="bg-paper-card py-20 border-y border-line">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              What can you do with Angan?
            </h2>
            <p className="text-ink-secondary text-base">
              Everything your residential society needs to stay connected, transparent, and organized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Raise a Complaint */}
            <div className="rounded-xl border border-line p-6 bg-paper hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-lg bg-terracotta-50 text-terracotta-400 border border-terracotta-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Raise a Complaint
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Report maintenance issues with photos and descriptions, so the right people can take action.
              </p>
            </div>

            {/* Card 2: Track Your Complaint */}
            <div className="rounded-xl border border-line p-6 bg-paper hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-lg bg-mustard-50 text-mustard-500 border border-mustard-100 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Track Your Complaint
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Follow every update from Open to In Progress to Resolved, with a complete history timeline.
              </p>
            </div>

            {/* Card 3: Stay Updated */}
            <div className="rounded-xl border border-line p-6 bg-paper hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-lg bg-olive-50 text-olive-500 border border-olive-100 flex items-center justify-center">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Stay Updated
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Never miss important society announcements, maintenance schedules, and meeting notices.
              </p>
            </div>

            {/* Card 4: Know What's Happening */}
            <div className="rounded-xl border border-line p-6 bg-paper hover:shadow-card transition-shadow space-y-4">
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-500 border border-teal-100 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Know What's Happening
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Get a clear view of your society's latest updates, status breakdowns, and activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-paper py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              How Angan works
            </h2>
            <p className="text-ink-secondary text-base">
              Three simple steps to manage maintenance and stay connected with your community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-paper-card rounded-xl border border-line p-8 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-terracotta-400 text-terracotta-400 bg-terracotta-50 font-display font-bold text-base flex items-center justify-center">
                01
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Raise an issue
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Submit a maintenance complaint with specific issue details and optional photo attachment.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-paper-card rounded-xl border border-line p-8 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-mustard-400 text-mustard-500 bg-mustard-50 font-display font-bold text-base flex items-center justify-center">
                02
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Track the progress
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Follow status changes, priority assignments, and updates from your society admin.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-paper-card rounded-xl border border-line p-8 shadow-soft space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-olive-400 text-olive-500 bg-olive-50 font-display font-bold text-base flex items-center justify-center">
                03
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Stay informed
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Receive important society notices, community updates, and meeting announcements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREVIEWS SECTION */}
      <section id="previews" className="bg-paper-card py-20 border-y border-line">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              Stay connected with your society
            </h2>
            <p className="text-ink-secondary text-base">
              A preview of how notices and complaint tracking look inside the portal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notice Board Preview Card */}
            <div className="bg-paper rounded-2xl border border-line p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-olive-500 font-display font-semibold text-lg">
                <Megaphone className="w-5 h-5" />
                <h3>Notice Board Preview</h3>
              </div>

              <div className="space-y-3">
                <div className="bg-mustard-50/60 border border-mustard-400/30 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-semibold text-mustard-500 uppercase tracking-wide flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Important Announcement
                  </div>
                  <h4 className="font-semibold text-sm text-ink">
                    Water supply maintenance scheduled tomorrow
                  </h4>
                  <p className="text-xs text-ink-secondary">
                    Water supply will be paused from 10:00 AM to 2:00 PM for overhead tank cleaning.
                  </p>
                </div>

                <div className="bg-olive-50/60 border border-olive-400/30 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-semibold text-olive-600 uppercase tracking-wide">
                    Community Update
                  </div>
                  <h4 className="font-semibold text-sm text-ink">
                    Society meeting this Sunday
                  </h4>
                  <p className="text-xs text-ink-secondary">
                    Annual general discussion on security upgrades and festival arrangements at 5 PM in the clubhouse.
                  </p>
                </div>

                <div className="bg-paper-card border border-line rounded-xl p-4 space-y-1">
                  <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                    General Notice
                  </div>
                  <h4 className="font-semibold text-sm text-ink">
                    New maintenance schedule available
                  </h4>
                  <p className="text-xs text-ink-secondary">
                    Monthly maintenance receipts and breakdown reports have been published.
                  </p>
                </div>
              </div>
            </div>

            {/* Complaint Tracker Preview Card */}
            <div className="bg-paper rounded-2xl border border-line p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-terracotta-400 font-display font-semibold text-lg">
                <ClipboardList className="w-5 h-5" />
                <h3>Complaint Tracker Preview</h3>
              </div>

              <div className="bg-paper-card rounded-xl border border-line p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-600 border border-teal-100">
                    Plumbing
                  </span>
                  <PriorityBadge priority="High" />
                </div>

                <div>
                  <h4 className="font-semibold text-base text-ink">
                    Water Leakage in Main Pipe
                  </h4>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Unit: Flat A-204 • Reported 2 hours ago
                  </p>
                </div>

                <div className="bg-paper-hover rounded-xl p-3.5 border border-line space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Live Progress Timeline
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-olive-500">Reported ✓</span>
                    <span className="text-olive-500">Under Review ✓</span>
                    <span className="text-mustard-500">In Progress ●</span>
                    <span className="text-ink-muted">Resolved ○</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ROLE SELECTION SECTION */}
      <section id="role-selection" className="bg-gradient-to-b from-paper to-olive-50/50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              How would you like to enter?
            </h2>
            <p className="text-ink-secondary text-base">
              Choose your role to access your society workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Resident Card */}
            <div className="bg-paper-card rounded-2xl shadow-card p-8 border border-line space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-terracotta-50 text-terracotta-400 border border-terracotta-100 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-terracotta-50 text-terracotta-500 border border-terracotta-100">
                    Resident Portal
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold text-ink">Resident</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Raise complaints, track issues, read notices and stay connected with your society.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-ink-secondary pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta-400 flex-shrink-0" />
                    <span>View & raise maintenance complaints</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta-400 flex-shrink-0" />
                    <span>Track resolution progress in real time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta-400 flex-shrink-0" />
                    <span>Read official society notices</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  variant="primary"
                  isFullWidth
                  size="lg"
                  href="/login?role=resident"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as Resident
                </Button>
                <Button
                  variant="secondary"
                  isFullWidth
                  size="sm"
                  onClick={() => handleQuickDemo('resident@society.com', 'Resident@123', 'resident')}
                  isLoading={demoLoading === 'resident'}
                >
                  {demoLoading === 'resident' ? 'Entering Resident Demo...' : '⚡ Quick Resident Demo'}
                </Button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="bg-paper-card rounded-2xl shadow-card p-8 border border-line space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-olive-50 text-olive-500 border border-olive-100 flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-olive-50 text-olive-600 border border-olive-100">
                    Management Control
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold text-ink">Admin</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">
                    Manage complaints, update statuses, publish notices and monitor society activity.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-ink-secondary pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    <span>Manage & update complaints queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    <span>Post & pin official society notices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    <span>Monitor overdue complaints & SLAs</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  variant="primary"
                  isFullWidth
                  size="lg"
                  href="/login?role=admin"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as Admin
                </Button>
                <Button
                  variant="secondary"
                  isFullWidth
                  size="sm"
                  onClick={() => handleQuickDemo('admin@society.com', 'Admin@123', 'admin')}
                  isLoading={demoLoading === 'admin'}
                >
                  {demoLoading === 'admin' ? 'Entering Admin Demo...' : '⚡ Quick Admin Demo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-ink text-white/70 py-10 border-t border-ink/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Angan Logo" className="h-8 w-auto object-contain brightness-200" />
            <span className="font-display font-semibold text-lg text-white">Angan</span>
          </div>

          <p className="text-xs text-white/50 text-center md:text-right">
            Your courtyard, now online. Built for residential communities.
          </p>
        </div>
      </footer>
    </div>
  );
}
