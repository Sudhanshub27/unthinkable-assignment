import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/UIComponents';
import { SkeletonCard } from '../components/Skeletons';
import {
  Settings,
  Clock,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  HardDrive,
  ShieldCheck,
  Save,
  Info,
  Trash2,
  RefreshCw,
} from 'lucide-react';

import ConfirmModal from '../components/ConfirmModal';

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
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
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
      console.warn('Could not fetch live settings from backend, using default configuration:', err);
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

  async function handleConfirmResetData() {
    setResetting(true);
    try {
      const res = await client.post('/settings/reset-data');
      addToast(res.data.message || 'Operational data emptied successfully!', 'success');
      setShowResetModal(false);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to empty operational data.', 'error');
    } finally {
      setResetting(false);
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
            <div className="p-3.5 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-600 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Society Identity & Contacts */}
          <div className="bg-paper-card rounded-2xl border border-line shadow-card p-6 space-y-5 transition-all">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-500 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Society Profile & Emergency Contacts
                </h3>
                <p className="text-xs text-ink-muted">
                  Basic association details displayed across resident portals, emails, and header badges.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="settings-society-name" className="block text-xs font-bold text-ink">
                  Society Name / Association Title <span className="text-clay-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-society-name"
                    type="text"
                    className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all"
                    value={settings.society_name}
                    onChange={(e) => handleChange('society_name', e.target.value)}
                    placeholder="e.g. Angan Residential Society"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-support-email" className="block text-xs font-bold text-ink">
                  Management Office Email <span className="text-clay-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-support-email"
                    type="email"
                    className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all"
                    value={settings.support_email}
                    onChange={(e) => handleChange('support_email', e.target.value)}
                    placeholder="e.g. office@society.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-emergency-phone" className="block text-xs font-bold text-ink">
                  24/7 Security Helpline Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-emergency-phone"
                    type="text"
                    className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all"
                    value={settings.emergency_phone}
                    onChange={(e) => handleChange('emergency_phone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: SLA & Overdue Determination Rules */}
          <div className="bg-paper-card rounded-2xl border border-line shadow-card p-6 space-y-5 transition-all">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  Service Level Agreement (SLA) & Overdue Rules
                </h3>
                <p className="text-xs text-ink-muted">
                  Configure automated resolution timelines, max attachment sizes, and escalation thresholds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="settings-overdue-days" className="block text-xs font-bold text-ink">
                  Automatic SLA Overdue Threshold <span className="text-clay-500">*</span>
                </label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="settings-overdue-days"
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all"
                      value={settings.overdue_threshold_days}
                      onChange={(e) => handleChange('overdue_threshold_days', e.target.value)}
                      required
                    />
                  </div>
                  <span className="text-xs font-semibold text-ink-muted shrink-0 bg-paper px-3 py-2.5 rounded-xl border border-line">
                    Days Unresolved
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-max-upload" className="block text-xs font-bold text-ink">
                  Max Photo Upload Limit
                </label>
                <div className="relative">
                  <HardDrive className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="settings-max-upload"
                    className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all cursor-pointer"
                    value={settings.max_upload_size_mb}
                    onChange={(e) => handleChange('max_upload_size_mb', e.target.value)}
                  >
                    <option value="2">2 MB (Compact Compression)</option>
                    <option value="5">5 MB (Standard Default)</option>
                    <option value="10">10 MB (High Resolution)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SLA Callout Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-ink">Automated SLA Escalation Policy</h4>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Complaints remaining open beyond <strong className="text-ink font-bold">{settings.overdue_threshold_days} days</strong> will automatically surface with an <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-clay-500/10 text-clay-600 border border-clay-500/20 font-mono">OVERDUE</span> badge on administrative dashboards and generate alert notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: System Automation & Audit Security */}
          <div className="bg-paper-card rounded-2xl border border-line shadow-card p-6 space-y-5 transition-all">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-olive-500/10 border border-olive-500/20 text-olive-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  System Notifications & Audit Security
                </h3>
                <p className="text-xs text-ink-muted">
                  Email dispatch rules and system audit trail logging preferences.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="settings-email-notifications" className="block text-xs font-bold text-ink">
                  Resident Email Status Notifications
                </label>
                <div className="relative">
                  <Bell className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="settings-email-notifications"
                    className="w-full rounded-xl border border-line px-4 py-2.5 pl-10 text-sm text-ink bg-paper hover:bg-paper-hover focus:bg-paper focus:ring-2 focus:ring-terracotta-400/30 focus:border-terracotta-400 outline-none transition-all cursor-pointer"
                    value={settings.email_notifications}
                    onChange={(e) => handleChange('email_notifications', e.target.value)}
                  >
                    <option value="enabled">Enabled (Send email on status change)</option>
                    <option value="disabled">Disabled (Internal dashboard only)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">Audit Trail Logging Policy</label>
                <div className="p-2.5 bg-paper border border-line rounded-xl text-xs text-ink-secondary flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-olive-600 shrink-0" />
                    <span className="font-medium text-ink">Immutable Audit Trail</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-olive-500/10 text-olive-600 border border-olive-500/20 font-bold text-[10px] uppercase">
                    Active & Protected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Data Management & Reset */}
          <div className="bg-paper-card rounded-2xl border border-line shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink">
                    Reset Operational Data
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Empty all active complaints, audit timeline history, notices, and email logs.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-clay-600 hover:bg-clay-500/10 border-clay-500/20 cursor-pointer font-medium"
                isLoading={resetting}
                onClick={() => setShowResetModal(true)}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Empty Operational Data
              </Button>
            </div>
          </div>

          {/* Form Submit Action Bar */}
          <div className="flex items-center justify-between pt-2 bg-paper-card p-4 rounded-2xl border border-line shadow-card">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Info className="w-4 h-4 text-terracotta-500 shrink-0" />
              <span>All updates apply immediately to live society operations.</span>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={saving}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {saving ? 'Saving Configurations...' : 'Save All Configurations'}
            </Button>
          </div>
        </form>
      )}

      {/* Confirmation Modal for Resetting Operational Data */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmResetData}
        title="Empty Operational Data?"
        message="This will permanently delete all active complaints, resolution timelines, notice board posts, resident notifications, and email logs. This action cannot be undone."
        confirmText="Empty All Data"
        cancelText="Cancel"
        type="danger"
        isLoading={resetting}
      />
    </div>
  );
}
