import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import SVGIcon from '../components/SVGIcon';
import { SkeletonCard } from '../components/Skeletons';

export default function AdminSettings() {
  const { addToast } = useToast();

  const [overdueThreshold, setOverdueThreshold] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/settings/overdue-threshold');
      if (res.data && res.data.days !== undefined) {
        setOverdueThreshold(Number(res.data.days));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load current SLA settings.');
      addToast('Failed to load society settings.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSaveSettings(e) {
    e.preventDefault();
    setError('');

    const parsedDays = parseInt(overdueThreshold, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      const msg = 'Please enter a valid positive integer for overdue threshold days.';
      setError(msg);
      addToast(msg, 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await client.put('/settings/overdue-threshold', {
        days: parsedDays,
      });
      setOverdueThreshold(Number(res.data.days));
      addToast(`SLA overdue threshold updated to ${res.data.days} days!`, 'success');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to update threshold settings.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container admin-settings-container">
      <PageHeader
        title="Society Settings"
        subtitle="Configure SLA breach threshold parameters and operational settings."
      />

      <div style={{ maxWidth: 700 }}>
        <div className="content-card">
          <h3
            className="card-title"
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: 16,
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SVGIcon name="settings" size={18} color="#2563EB" />
            <span>Complaint SLA Settings</span>
          </h3>

          {loading ? (
            <SkeletonCard count={1} />
          ) : (
            <form onSubmit={handleSaveSettings}>
              {error && <div className="field-error-box mb-4">{error}</div>}

              <div className="form-group mb-4">
                <label htmlFor="settings-overdue-days" className="form-label">
                  Overdue Threshold (Days) <span className="text-danger">*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 300 }}>
                  <input
                    id="settings-overdue-days"
                    type="number"
                    min="1"
                    className="form-control"
                    value={overdueThreshold}
                    onChange={(e) => setOverdueThreshold(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    days
                  </span>
                </div>
              </div>

              <div
                className="info-subtext-box mb-6"
                style={{
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <SVGIcon name="alert-circle" size={16} color="#64748B" style={{ marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Complaints that remain unresolved beyond this number of days are marked overdue.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving Settings...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
