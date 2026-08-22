import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import SVGIcon from '../components/SVGIcon';
import { SkeletonCard } from '../components/Skeletons';

export default function AdminSettings() {
  const { addToast } = useToast();
  const { fetchSettings } = useSettings();

  const [settings, setSettings] = useState({
    overdue_threshold_days: '5',
    society_name: 'Unthinkable Sudhanshu Society',
    support_email: 'office@sudhanshubatraunthinkable.com',
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
    <div className="page-container admin-settings-container">
      <PageHeader
        title="Society Settings & Governance"
        subtitle="Manage society branding, SLA breach parameters, emergency contacts, and automation rules."
      />

      {loading ? (
        <div style={{ maxWidth: 900 }}>
          <SkeletonCard count={3} />
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} style={{ maxWidth: 900 }}>
          {error && <div className="field-error-box mb-4">{error}</div>}

          {/* Section 1: Society Identity & Contacts */}
          <div className="content-card mb-6" style={{ padding: '24px' }}>
            <h3
              className="card-title"
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                marginBottom: 18,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SVGIcon name="settings" size={20} color="#2563EB" />
              <span>Society Profile & Emergency Contacts</span>
            </h3>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="settings-society-name" className="form-label">
                  Society Name / Association Title <span className="text-danger">*</span>
                </label>
                <input
                  id="settings-society-name"
                  type="text"
                  className="form-control"
                  value={settings.society_name}
                  onChange={(e) => handleChange('society_name', e.target.value)}
                  placeholder="e.g. Green Valley Housing Co-Op"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-support-email" className="form-label">
                  Management Office Email <span className="text-danger">*</span>
                </label>
                <input
                  id="settings-support-email"
                  type="email"
                  className="form-control"
                  value={settings.support_email}
                  onChange={(e) => handleChange('support_email', e.target.value)}
                  placeholder="e.g. office@society.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-emergency-phone" className="form-label">
                  24/7 Security Helpline Phone
                </label>
                <input
                  id="settings-emergency-phone"
                  type="text"
                  className="form-control"
                  value={settings.emergency_phone}
                  onChange={(e) => handleChange('emergency_phone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section 2: SLA & Overdue Determination Rules */}
          <div className="content-card mb-6" style={{ padding: '24px' }}>
            <h3
              className="card-title"
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                marginBottom: 18,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SVGIcon name="clock" size={20} color="#D97706" />
              <span>Service Level Agreement (SLA) & Overdue Rules</span>
            </h3>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="settings-overdue-days" className="form-label">
                  Automatic SLA Overdue Threshold (Days) <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    id="settings-overdue-days"
                    type="number"
                    min="1"
                    className="form-control"
                    value={settings.overdue_threshold_days}
                    onChange={(e) => handleChange('overdue_threshold_days', e.target.value)}
                    style={{ maxWidth: 140 }}
                    required
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    days unresolved
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="settings-max-upload" className="form-label">
                  Max Photo Upload Size (MB)
                </label>
                <select
                  id="settings-max-upload"
                  className="form-control"
                  value={settings.max_upload_size_mb}
                  onChange={(e) => handleChange('max_upload_size_mb', e.target.value)}
                >
                  <option value="2">2 MB (Compact)</option>
                  <option value="5">5 MB (Standard Default)</option>
                  <option value="10">10 MB (High Resolution)</option>
                </select>
              </div>
            </div>

            <div
              className="info-subtext-box mt-4"
              style={{
                background: 'rgba(217, 119, 6, 0.06)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <SVGIcon name="alert-triangle" size={18} color="#D97706" style={{ marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#B45309', lineHeight: 1.5 }}>
                Complaints remaining open beyond <strong>{settings.overdue_threshold_days} days</strong> automatically surface with an <code>OVERDUE</code> SLA badge on administrative dashboards.
              </p>
            </div>
          </div>

          {/* Section 3: System Automation & Audit Security */}
          <div className="content-card mb-6" style={{ padding: '24px' }}>
            <h3
              className="card-title"
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                marginBottom: 18,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <SVGIcon name="bell" size={20} color="#059669" />
              <span>System Notifications & Security Preferences</span>
            </h3>

            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="settings-email-notifications" className="form-label">
                  Resident Email Status Notifications
                </label>
                <select
                  id="settings-email-notifications"
                  className="form-control"
                  value={settings.email_notifications}
                  onChange={(e) => handleChange('email_notifications', e.target.value)}
                >
                  <option value="enabled">Enabled (Send email on status change)</option>
                  <option value="disabled">Disabled (Internal dashboard only)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Trail Logging Policy</label>
                <div style={{ padding: '10px 14px', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-status-resolved" style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Active</span>
                  <span>Immutable Append-Only Logging</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
              style={{ minWidth: 180, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {saving ? (
                <>
                  <span className="btn-spinner-inline" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <SVGIcon name="check-circle" size={18} />
                  Save All Configurations
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
