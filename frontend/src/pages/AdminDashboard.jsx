import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [thresholdInput, setThresholdInput] = useState('');
  const [savingThreshold, setSavingThreshold] = useState(false);

  async function load() {
    const res = await client.get('/dashboard');
    setData(res.data);
    setThresholdInput(res.data.overdueThresholdDays);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveThreshold(e) {
    e.preventDefault();
    setSavingThreshold(true);
    try {
      await client.put('/settings/overdue-threshold', { days: Number(thresholdInput) });
      await load();
    } finally {
      setSavingThreshold(false);
    }
  }

  if (!data) return <div className="container"><p>Loading dashboard...</p></div>;

  return (
    <div className="container">
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-number">{data.totalComplaints}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{data.overdueCount}</div>
          <div className="stat-label">Overdue</div>
        </div>
        {data.byStatus.map((s) => (
          <div className="stat-card" key={s.status}>
            <div className="stat-number">{s.count}</div>
            <div className="stat-label">{s.status}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>By Category</h3>
        {data.byCategory.map((c) => (
          <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <span>{c.category}</span>
            <strong>{c.count}</strong>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Overdue Threshold</h3>
        <p style={{ color: '#667085', fontSize: '0.9rem' }}>
          Complaints open longer than this many days (and not Resolved) are automatically flagged as overdue.
        </p>
        <form onSubmit={saveThreshold} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            style={{ width: 100 }}
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
          <span>days</span>
          <button className="primary" type="submit" disabled={savingThreshold}>
            {savingThreshold ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
