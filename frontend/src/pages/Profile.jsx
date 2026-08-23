import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import { formatFlatNumber } from '../utils/formatters';
import { User, Mail, Building, Shield, Lock, Phone } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    document.title = 'Profile Settings — Angan';
  }, []);

  if (!user) return null;

  const flatDisplay = user.role === 'resident'
    ? (user.flat_number ? formatFlatNumber(user.flat_number) : 'Flat not specified')
    : (user.flat_number ? formatFlatNumber(user.flat_number) : 'N/A (Admin)');

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your account parameters and view profile information."
      />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Avatar Card */}
        <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-terracotta-400 text-white text-2xl font-display font-bold flex items-center justify-center shadow-soft shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-ink">{user.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                  user.role === 'admin'
                    ? 'bg-terracotta-50 text-terracotta-500 border border-terracotta-100'
                    : 'bg-olive-50 text-olive-600 border border-olive-100'
                }`}
              >
                {user.role}
              </span>

              {user.role === 'resident' && (
                <span className="text-xs font-medium text-ink-secondary bg-paper px-2.5 py-0.5 rounded-md border border-line">
                  {flatDisplay}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Account Attributes Card */}
        <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-base text-ink border-b border-line pb-3">
            Account Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Full Name
              </label>
              <input
                type="text"
                readOnly
                value={user.name || ''}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper-hover outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                type="email"
                readOnly
                value={user.email || ''}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper-hover outline-none"
              />
            </div>

            {user.role === 'resident' && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Flat Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={flatDisplay}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper-hover outline-none"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Role Designation
              </label>
              <input
                type="text"
                readOnly
                value={user.role || ''}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper-hover outline-none capitalize"
              />
            </div>
          </div>
        </div>

        {/* Society Helplines & Office Contact Info */}
        <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-base text-ink border-b border-line pb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-olive-500" />
            <span>Society Office & Emergency Helplines</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-paper rounded-lg p-3.5 border border-line space-y-1">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-terracotta-400" /> Society Association
              </span>
              <p className="text-sm font-semibold text-ink">
                {settings.society_name || 'Angan Digital Society Portal'}
              </p>
            </div>

            <div className="bg-paper rounded-lg p-3.5 border border-line space-y-1">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-olive-500" /> Management Email
              </span>
              <p className="text-sm font-semibold text-ink">
                <a href={`mailto:${settings.support_email}`} className="text-terracotta-400 hover:underline">
                  {settings.support_email || 'office@society.com'}
                </a>
              </p>
            </div>

            <div className="bg-paper rounded-lg p-3.5 border border-line space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-clay-500" /> 24/7 Emergency Helpline
              </span>
              <p className="text-sm font-bold text-clay-500">
                {settings.emergency_phone || '+91 98765 43210'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Security Card */}
        <div className="bg-paper-card rounded-xl border border-line shadow-card p-5 space-y-2">
          <h3 className="font-display font-semibold text-sm text-ink flex items-center gap-2">
            <Lock className="w-4 h-4 text-terracotta-400" />
            <span>Account Security & Session</span>
          </h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Your account is authenticated via encrypted JSON Web Tokens (JWT) with RBAC access control.
          </p>
        </div>
      </div>
    </div>
  );
}
