import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/UIComponents';
import { PriorityBadge, StatusBadge, ImportantBadge } from '../components/Badges';
import NoticeCard from '../components/NoticeCard';
import Timeline from '../components/Timeline';
import { formatFlatNumber, formatDate } from '../utils/formatters';
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
  Sparkles,
  Zap,
  ExternalLink,
  Code2,
  Check,
  Building2,
  History,
  Calendar,
} from 'lucide-react';
import heroCommunityIllustration from '../assets/hero-courtyard.png';

// Sleek Browser Frame Component for product mockups
function BrowserFrame({ url, children, title, className = '' }) {
  return (
    <div className={`rounded-2xl border border-line bg-paper shadow-lifted overflow-hidden flex flex-col h-full ${className}`}>
      <div className="bg-paper-hover px-4 py-2.5 border-b border-line flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        {url && (
          <div className="bg-paper px-3 py-0.5 rounded-md border border-line text-[11px] text-ink-muted font-mono max-w-xs truncate flex items-center gap-1">
            <span className="text-olive-600 font-semibold">https://</span>
            <span>{url}</span>
          </div>
        )}
        <div className="text-[11px] font-medium text-ink-muted hidden sm:block">{title || 'Angan Portal'}</div>
      </div>
      <div className="flex-1 flex flex-col bg-paper">{children}</div>
    </div>
  );
}

// Sample Data matching exact database schemas for in-app component preview
const sampleNotices = [
  {
    id: 1,
    title: 'Water supply maintenance scheduled tomorrow',
    body: 'Water supply will be paused from 10:00 AM to 2:00 PM for annual overhead tank cleaning and filter replacement.',
    is_important: true,
    posted_by_name: 'Society Admin',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Annual General Body Meeting this Sunday',
    body: 'Discussion on security upgrades, CCTV installation, and festival arrangements at 5 PM in the clubhouse.',
    is_important: false,
    posted_by_name: 'Management Committee',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const sampleComplaint = {
  id: 33,
  category: 'Plumbing',
  title: 'Water Leakage in Main Riser Pipe',
  description: 'Water leaking near Flat A-204 main riser pipe. Requires technician inspection and valve replacement.',
  status: 'In Progress',
  priority: 'High',
  flat_number: 'A-204',
  user_name: 'John Resident',
  created_at: new Date(Date.now() - 7200000).toISOString(),
};

const sampleHistory = [
  {
    id: 101,
    change_type: 'created',
    new_value: 'Open',
    actor_role: 'resident',
    actor_name: 'John Resident',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 102,
    change_type: 'status_change',
    old_value: 'Open',
    new_value: 'In Progress',
    actor_role: 'admin',
    actor_name: 'Society Admin',
    note: 'Plumber dispatched to inspect valve and seal joint.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function Landing() {
  const { user, login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(null);
  const showDemo = import.meta.env.VITE_SHOW_DEMO === 'true';

  // Redirect logged in user directly to their respective workspace
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  const scrollToSection = (id) => (e) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 64; // height of sticky navbar
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  };

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
    <div className="bg-paper min-h-screen flex flex-col font-sans text-ink selection:bg-terracotta-100 selection:text-terracotta-600">
      {/* 1. STICKY BLUR NAVBAR */}
      <header className="sticky top-0 bg-paper-card/90 backdrop-blur-md border-b border-line z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <img src="/logo.png" alt="Angan Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-ink leading-tight">Angan</span>
              <span className="text-[10px] text-ink-muted font-medium tracking-wide">Society Management</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-ink-secondary">
            <a href="#features" onClick={scrollToSection('features')} className="hover:text-terracotta-500 transition-colors">
              Features
            </a>
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="hover:text-terracotta-500 transition-colors">
              Workflow
            </a>
            <a href="#previews" onClick={scrollToSection('previews')} className="hover:text-terracotta-500 transition-colors">
              Live Previews
            </a>
            <a href="#role-selection" onClick={scrollToSection('role-selection')} className="hover:text-terracotta-500 transition-colors">
              Portals
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" href="#role-selection">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-paper min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 md:py-20 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-terracotta-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-olive-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center relative">
          {/* Left Hero Text Column */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-terracotta-50 text-terracotta-600 border border-terracotta-100 rounded-full px-3.5 py-1 text-xs font-semibold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Built for Indian Residential Societies</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-ink leading-tight tracking-tight">
                Your courtyard, <br />
                <span className="bg-gradient-to-r from-terracotta-500 via-clay-500 to-olive-600 bg-clip-text text-transparent">
                  now online.
                </span>
              </h1>
              <p className="text-xs font-medium text-terracotta-600/90 italic">
                * Angan (आंगन) means courtyard — the shared heart of every housing society.
              </p>
            </div>

            <p className="text-ink-secondary text-base md:text-lg max-w-xl leading-relaxed font-sans">
              Raise maintenance complaints, track resolution timelines in real time, stay updated with official society notices, and foster an organized, transparent community.
            </p>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <Button
                variant="primary"
                size="lg"
                href="#role-selection"
                icon={<ArrowRight className="w-4.5 h-4.5" />}
                className="shadow-lifted"
              >
                Enter Your Society
              </Button>
              <Button variant="outline" size="lg" href="#features">
                Explore Features
              </Button>
            </div>
          </div>

          {/* Right Visual Column (In browser frame) */}
          <div className="md:col-span-5 flex items-center justify-center relative">
            <BrowserFrame url="angan.app" title="Angan Digital Courtyard">
              <div className="p-3 bg-paper-card relative">
                <img
                  src={heroCommunityIllustration}
                  alt="Digital Society Courtyard Illustration"
                  className="w-full h-auto rounded-xl object-contain"
                />
                <div className="mt-3 bg-paper rounded-xl p-3 border border-line flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-olive-500 animate-ping" />
                    <span className="font-semibold text-ink">Live Triage Status: Active</span>
                  </div>
                  <span className="text-ink-muted text-[11px]">100% Audit Tracked</span>
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION (Asymmetrical Hero Feature Showcase + Supporting Cards) */}
      <section id="features" className="bg-paper min-h-[calc(100vh-4rem)] flex flex-col justify-center py-16 scroll-mt-16 border-t border-line/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta-500 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-100">
              Core Capabilities
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              Built for Complete Maintenance Transparency
            </h2>
            <p className="text-ink-secondary text-base leading-relaxed">
              Empower residents with transparent status updates while giving management total control over issue resolution.
            </p>
          </div>

          {/* Asymmetric Showcase: Big Highlighted Feature Row */}
          <div className="bg-paper rounded-2xl border border-line p-8 shadow-card grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-6 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-terracotta-50 text-terracotta-500 border border-terracotta-100 flex items-center justify-center shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-display font-bold text-2xl text-ink">
                  Real-Time Complaint & Audit Tracking
                </h3>
                <p className="text-ink-secondary text-sm leading-relaxed">
                  Never wonder about the status of a leaky pipe or broken lift again. Residents can attach photos, select categories, and follow an immutable timeline of every action taken by society staff.
                </p>
              </div>

              <ul className="space-y-3 text-xs text-ink-secondary pt-2">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-terracotta-500 shrink-0" />
                  <span className="font-medium text-ink">Category Tagging (Plumbing, Electrical, Elevator, Security)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-terracotta-500 shrink-0" />
                  <span className="font-medium text-ink">Photo attachments for clear visual proof</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-terracotta-500 shrink-0" />
                  <span className="font-medium text-ink">Step-by-step resolution history log</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-6">
              <BrowserFrame url="angan.app/complaints/33" title="Complaint View">
                {/* Authentic Complaint Card Layout */}
                <div className="bg-paper-card p-5 border-l-4 border-terracotta-400 space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-paper-hover border border-line/50 text-terracotta-500">
                        {sampleComplaint.category}
                      </span>
                      <span className="text-xs text-ink-muted font-mono font-medium">#{sampleComplaint.id}</span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-paper-hover text-ink-secondary">
                        {formatFlatNumber(sampleComplaint.flat_number)}
                      </span>
                    </div>
                    <StatusBadge status={sampleComplaint.status} />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-ink">{sampleComplaint.title}</h4>
                    <p className="text-xs text-ink-secondary leading-relaxed">{sampleComplaint.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
                    <div className="flex items-center gap-1.5 text-ink-muted">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                      <span>{formatDate(sampleComplaint.created_at)}</span>
                      <span>• {sampleComplaint.user_name}</span>
                    </div>
                    <PriorityBadge priority={sampleComplaint.priority} />
                  </div>
                </div>
              </BrowserFrame>
            </div>
          </div>

          {/* Supporting 3 Features Row Below */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Digital Notice Board */}
            <div className="group rounded-2xl border border-line/80 bg-paper-card p-6 shadow-card hover:shadow-lifted hover:-translate-y-1.5 hover:border-olive-300/60 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-olive-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-olive-50 text-olive-600 border border-olive-100/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <Megaphone className="w-5 h-5 text-olive-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-olive-50 text-olive-600 border border-olive-100">
                    Instant Broadcast
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ink group-hover:text-olive-700 transition-colors">
                    Digital Notice Board
                  </h3>
                  <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                    Publish society announcements, pin critical notices, and broadcast water or power schedule changes instantly.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-line/50 flex items-center gap-2 text-xs font-medium text-olive-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-olive-500 shrink-0" />
                <span>Supports Pinned & Important badges</span>
              </div>
            </div>

            {/* Card 2: Overdue SLA Alerts */}
            <div className="group rounded-2xl border border-line/80 bg-paper-card p-6 shadow-card hover:shadow-lifted hover:-translate-y-1.5 hover:border-mustard-300/60 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mustard-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-mustard-50 text-mustard-600 border border-mustard-100/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 text-mustard-600" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-mustard-50 text-mustard-600 border border-mustard-100">
                    Automated SLA
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ink group-hover:text-mustard-700 transition-colors">
                    Overdue SLA Alerts
                  </h3>
                  <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                    Automatic flags highlight complaints pending beyond expected resolution timelines to ensure accountability.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-line/50 flex items-center gap-2 text-xs font-medium text-mustard-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-mustard-500 shrink-0" />
                <span>Visual escalation indicators</span>
              </div>
            </div>

            {/* Card 3: Role-Based Command */}
            <div className="group rounded-2xl border border-line/80 bg-paper-card p-6 shadow-card hover:shadow-lifted hover:-translate-y-1.5 hover:border-terracotta-300/60 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta-400 to-clay-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-terracotta-50 text-terracotta-500 border border-terracotta-100/80 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
                    <LayoutDashboard className="w-5 h-5 text-terracotta-500" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-terracotta-50 text-terracotta-500 border border-terracotta-100">
                    Dual Dashboard
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-lg text-ink group-hover:text-terracotta-600 transition-colors">
                    Role-Based Command
                  </h3>
                  <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                    Tailored interfaces for Residents to submit & track, and Admins to manage queues & post notices.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-line/50 flex items-center gap-2 text-xs font-medium text-terracotta-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-terracotta-400 shrink-0" />
                <span>Dedicated Resident & Admin views</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (Sequential Stepper Connector Layout) */}
      <section id="how-it-works" className="bg-paper min-h-[calc(100vh-4rem)] flex flex-col justify-center py-16 scroll-mt-16 border-t border-line/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-mustard-600 bg-mustard-50 px-3 py-1 rounded-full border border-mustard-100">
              Sequential Process
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              How Angan Works
            </h2>
            <p className="text-ink-secondary text-base leading-relaxed">
              A transparent, 3-step workflow connecting residents directly with society management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-line z-0" />

            <div className="bg-paper-card rounded-2xl border border-line p-8 shadow-card space-y-4 relative z-10 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full border-2 border-terracotta-400 text-terracotta-500 bg-terracotta-50 font-display font-bold text-base flex items-center justify-center shadow-xs">
                  01
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-terracotta-50 text-terracotta-500 border border-terracotta-100">
                  Step 1
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink">Raise an Issue</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Resident selects a category (Plumbing, Lift, Security, etc.), describes the problem, and uploads a photo.
              </p>
            </div>

            <div className="bg-paper-card rounded-2xl border border-line p-8 shadow-card space-y-4 relative z-10 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full border-2 border-mustard-400 text-mustard-600 bg-mustard-50 font-display font-bold text-base flex items-center justify-center shadow-xs">
                  02
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-mustard-50 text-mustard-600 border border-mustard-100">
                  Step 2
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink">Triage & Assign</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Society Admin reviews the ticket, sets priority, updates status, and dispatches maintenance personnel.
              </p>
            </div>

            <div className="bg-paper-card rounded-2xl border border-line p-8 shadow-card space-y-4 relative z-10 hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full border-2 border-olive-400 text-olive-600 bg-olive-50 font-display font-bold text-base flex items-center justify-center shadow-xs">
                  03
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-olive-50 text-olive-600 border border-olive-100">
                  Step 3
                </span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink">Resolve & Audit</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Issue is marked resolved with detailed audit notes, giving residents complete resolution transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREVIEWS SECTION (Rendering Authentic In-App NoticeCard and Timeline Components) */}
      <section id="previews" className="bg-paper min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 md:py-12 scroll-mt-16 border-t border-line/60">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-olive-600 bg-olive-50 px-3 py-1 rounded-full border border-olive-100">
              Authentic UI Previews
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">
              Actual In-App Component Previews
            </h2>
            <p className="text-ink-secondary text-sm leading-relaxed">
              Real React components (`NoticeCard` and `Timeline`) rendered exactly as they appear inside the portal.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notice Board Preview Card using authentic NoticeCard components */}
            <BrowserFrame url="angan.app/notices" title="Official Notice Board">
              <div className="p-4 sm:p-5 bg-paper flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2.5 shrink-0">
                  <div className="flex items-center gap-2 text-olive-600 font-display font-bold text-sm">
                    <Megaphone className="w-4 h-4" />
                    <span>Society Notice Board</span>
                  </div>
                  <span className="text-[11px] text-ink-muted font-medium">Live Feed</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  <NoticeCard notice={sampleNotices[0]} />
                  <NoticeCard notice={sampleNotices[1]} />
                </div>
              </div>
            </BrowserFrame>

            {/* Complaint Audit Timeline Preview using authentic Timeline component */}
            <BrowserFrame url="angan.app/complaints/33" title="Audit Log Timeline">
              <div className="p-4 sm:p-5 bg-paper flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2.5 shrink-0">
                  <div className="flex items-center gap-2 text-terracotta-500 font-display font-bold text-sm">
                    <History className="w-4 h-4" />
                    <span>Complaint Audit History (#33)</span>
                  </div>
                  <StatusBadge status={sampleComplaint.status} />
                </div>

                <div className="bg-paper-card p-3.5 rounded-xl border border-line flex-1">
                  <Timeline history={sampleHistory} />
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </section>

      {/* 6. ROLE SELECTION SECTION */}
      <section id="role-selection" className="bg-paper min-h-[calc(100vh-4rem)] flex flex-col justify-center py-16 scroll-mt-16 border-t border-line/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta-500 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-100">
              Access Workspace
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">
              Choose Your Role to Enter
            </h2>
            <p className="text-ink-secondary text-base leading-relaxed">
              Select your workspace role to sign in or test drive the portal instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Resident Card */}
            <div className="bg-paper-card rounded-2xl shadow-card hover:shadow-lifted transition-all duration-200 p-8 border border-line space-y-6 flex flex-col justify-between">
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
                    <span>View & raise maintenance complaints with photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta-400 flex-shrink-0" />
                    <span>Track resolution progress in real time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta-400 flex-shrink-0" />
                    <span>Read official society notices & updates</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-line">
                <Button
                  variant="primary"
                  isFullWidth
                  size="lg"
                  href="/login?role=resident"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as Resident
                </Button>
              </div>
            </div>

            {/* Admin Card */}
            <div className="bg-paper-card rounded-2xl shadow-card hover:shadow-lifted transition-all duration-200 p-8 border border-line space-y-6 flex flex-col justify-between">
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
                    <span>Manage & triage maintenance complaints queue</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    <span>Post & pin official society announcements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-olive-500 flex-shrink-0" />
                    <span>Monitor overdue complaints & resolution SLAs</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-line">
                <Button
                  variant="primary"
                  isFullWidth
                  size="lg"
                  href="/login?role=admin"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue as Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ENHANCED DEVELOPER FOOTER */}
      <footer className="bg-ink text-white py-14 border-t border-ink/20">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Angan Logo" className="h-8 w-auto object-contain brightness-200" />
                <span className="font-display font-bold text-xl text-white">Angan</span>
              </div>
              <p className="text-xs text-white/60 max-w-sm leading-relaxed">
                Angan (आंगन) — The digital courtyard for modern Indian housing societies. Simplifying maintenance complaints, notice broadcasts, and audit logging.
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="font-semibold text-white uppercase tracking-wider mb-2">Navigation</div>
              <div><a href="#features" onClick={scrollToSection('features')} className="text-white/60 hover:text-white transition-colors">Features & Capabilities</a></div>
              <div><a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-white/60 hover:text-white transition-colors">Sequential Workflow</a></div>
              <div><a href="#previews" onClick={scrollToSection('previews')} className="text-white/60 hover:text-white transition-colors">Interface Previews</a></div>
              <div><a href="#role-selection" onClick={scrollToSection('role-selection')} className="text-white/60 hover:text-white transition-colors">Portals & Sign In</a></div>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="font-semibold text-white uppercase tracking-wider mb-2">Developer & Code</div>
              <p className="text-white/60">Built with React, TailwindCSS, Express & Drizzle ORM.</p>
              <div className="pt-1 flex items-center gap-4">
                <a
                  href="https://github.com/Sudhanshub27/unthinkable-assignment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta-400 hover:text-terracotta-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  GitHub Repository
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Angan Society Maintenance Tracker. Designed & Developed by Sudhanshu Batra.</p>
            <p>Unthinkable SDE Assignment Project</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
