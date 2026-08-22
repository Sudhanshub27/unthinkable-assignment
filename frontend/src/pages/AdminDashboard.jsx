import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function load() {
    try {
      const res = await client.get('/dashboard');
      setData(res.data);
      setThresholdInput(res.data.overdueThresholdDays);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveThreshold(e) {
    e.preventDefault();
    setSavingThreshold(true);
    setSaveSuccess(false);
    try {
      await client.put('/settings/overdue-threshold', { days: Number(thresholdInput) });
      await load();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update threshold');
    } finally {
      setSavingThreshold(false);
    }
  }

  if (!data) {
    return (
      <div className="container">
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  const getStatusCount = (statusName) => {
    const found = data.byStatus.find((s) => s.status === statusName);
    return found ? found.count : 0;
  };

  const openCount = getStatusCount('Open');
  const inProgressCount = getStatusCount('In Progress');
  const resolvedCount = getStatusCount('Resolved');

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Settings</h1>
          <p className="page-subtitle">High-level metrics, category breakdown, and threshold controls.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">{data.totalComplaints}</div>
          <div className="stat-label">Total Complaints</div>
        </div>

        <div className="stat-card overdue">
          <div className="stat-number" style={{ color: '#f87171' }}>
            {data.overdueCount}
          </div>
          <div className="stat-label">Overdue Complaints</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: '#fca5a5' }}>
            {openCount}
          </div>
          <div className="stat-label">Open</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: '#fcd34d' }}>
            {inProgressCount}
          </div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card">
          <div className="stat-number" style={{ color: '#6ee7b7' }}>
            {resolvedCount}
          </div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 16 }}>Breakdown by Category</h3>
        {data.byCategory.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No category data available yet.</p>}
        {data.byCategory.map((c) => {
          const percentage = data.totalComplaints > 0 ? Math.round((c.count / data.totalComplaints) * 100) : 0;
          return (
            <div key={c.category} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>{c.category}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {c.count} complaint{c.count === 1 ? '' : 's'} ({percentage}%)
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: 'linear-gradient(90deg, #4f46e5, #10b981)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8 }}>Overdue Threshold Configuration</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Complaints remaining in <strong>Open</strong> or <strong>In Progress</strong> state longer than this threshold are automatically flagged as overdue and prioritized at the top of the queue.
        </p>

        <form onSubmit={saveThreshold} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            min="1"
            max="365"
            style={{ width: 120 }}
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>days</span>

          <button className="primary" type="submit" disabled={savingThreshold}>
            {savingThreshold ? 'Saving Settings...' : 'Save Configuration'}
          </button>
        </form>

        {saveSuccess && (
          <p style={{ color: '#6ee7b7', fontSize: '0.88rem', marginTop: 10, fontWeight: 600 }}>
            ✅ Overdue threshold updated successfully!
          </p>
        )}
      </div>
    </div>
  );
}
