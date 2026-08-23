import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/UIComponents';
import { SkeletonCard } from '../components/Skeletons';
import { Settings, Clock, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const { addToast } = useToast();
  const { fetchSettings } = useSettings();

  const [settings, setSettings] = useState({
    overdue_threshold_days: '5',
    society_name: 'Angan Digital Society',
    support_email: 'office@society.com',
    emergency_phone: '+91 98765 43210',
    email_notifications: 'enabled',
    max_upload_size_mb: '5',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/settings');
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load society settings.');
      addToast('Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setError('');

    const parsedDays = parseInt(settings.overdue_threshold_days, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      const msg = 'Overdue SLA threshold must be at least 1 day.';
      setError(msg);
      addToast(msg, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await client.put('/settings', { settings });
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
      await fetchSettings();
      addToast('Society configuration updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to save settings.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-6 max-w-4xl">
      <PageHeader
        title="Society Settings & Governance"
        subtitle="Manage society branding, SLA breach parameters, emergency contacts, and automation rules."
      />

      {loading ? (
        <SkeletonCard count={3} />
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-500 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Society Identity & Contacts */}
          <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 space-y-4">
            <h3 className="font-display font-semibold text-base text-ink border-b border-line pb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-terracotta-400" />
              <span>Society Profile & Emergency Contacts</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="settings-society-name" className="block text-xs font-semibold text-ink-muted">
                  Society Name / Association Title <span className="text-clay-500">*</span>
                </label>
                <input
                  id="settings-society-name"
                  type="text"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                  value={settings.society_name}
                  onChange={(e) => handleChange('society_name', e.target.value)}
                  placeholder="e.g. Angan Residential Society"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-support-email" className="block text-xs font-semibold text-ink-muted">
                  Management Office Email <span className="text-clay-500">*</span>
                </label>
                <input
                  id="settings-support-email"
                  type="email"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                  value={settings.support_email}
                  onChange={(e) => handleChange('support_email', e.target.value)}
                  placeholder="e.g. office@society.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-emergency-phone" className="block text-xs font-semibold text-ink-muted">
                  24/7 Security Helpline Phone
                </label>
                <input
                  id="settings-emergency-phone"
                  type="text"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                  value={settings.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section 2: SLA & Overdue Determination Rules */}
          <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 space-y-4">
            <h3 className="font-display font-semibold text-base text-ink border-b border-line pb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-mustard-500" />
              <span>Service Level Agreement (SLA) & Overdue Rules</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="settings-overdue-days" className="block text-xs font-semibold text-ink-muted">
                  Automatic SLA Overdue Threshold (Days) <span className="text-clay-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="settings-overdue-days"
                    type="number"
                    min="1"
                    className="w-32 rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                    value={settings.overdue_threshold_days}
                    onChange={(e) => handleChange('overdue_threshold_days', e.target.value)}
                    required
                  />
                  <span className="text-xs text-ink-muted font-semibold">days unresolved</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-max-upload" className="block text-xs font-semibold text-ink-muted">
                  Max Photo Upload Size (MB)
                </label>
                <select
                  id="settings-max-upload"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                  value={settings.max_upload_size_mb}
                  onChange={(e) => handleChange('max_upload_size_mb', e.target.value)}
                >
                  <option value="2">2 MB (Compact)</option>
                  <option value="5">5 MB (Standard Default)</option>
                  <option value="10">10 MB (High Resolution)</option>
                </select>
              </div>
            </div>

            <div className="bg-mustard-50/70 border border-mustard-400/30 rounded-lg p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-mustard-500 shrink-0 mt-0.5" />
              <p className="text-xs text-ink-secondary leading-relaxed">
                Complaints remaining open beyond <strong className="text-ink font-semibold">{settings.overdue_threshold_days} days</strong> automatically surface with an <code className="bg-mustard-100 text-mustard-500 px-1 py-0.5 rounded text-[11px] font-mono">OVERDUE</code> SLA badge on administrative dashboards.
              </p>
            </div>
          </div>

          {/* Section 3: System Automation & Audit Security */}
          <div className="bg-paper-card rounded-xl border border-line shadow-card p-6 space-y-4">
            <h3 className="font-display font-semibold text-base text-ink border-b border-line pb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-olive-500" />
              <span>System Notifications & Security Preferences</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="settings-email-notifications" className="block text-xs font-semibold text-ink-muted">
                  Resident Email Status Notifications
                </label>
                <select
                  id="settings-email-notifications"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
                  value={settings.email_notifications}
                  onChange={(e) => handleChange('email_notifications', e.target.value)}
                >
                  <option value="enabled">Enabled (Send email on status change)</option>
                  <option value="disabled">Disabled (Internal dashboard only)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink-muted">Audit Trail Logging Policy</label>
                <div className="p-2.5 bg-paper border border-line rounded-lg text-xs text-ink-secondary flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-olive-50 text-olive-600 font-semibold text-[11px]">Active</span>
                  <span>Immutable Append-Only Audit Logging</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit Action */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={saving}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {saving ? 'Saving Settings...' : 'Save All Configurations'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
