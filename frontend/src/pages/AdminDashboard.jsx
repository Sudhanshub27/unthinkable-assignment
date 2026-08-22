import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

export default function AdminDashboard() {
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueThreshold, setOverdueThreshold] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const dashRes = await client.get('/dashboard');
      setStats(dashRes.data);
      if (dashRes.data && dashRes.data.overdueThresholdDays) {
        setOverdueThreshold(Number(dashRes.data.overdueThresholdDays));
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard analytics.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await client.put('/settings/overdue-threshold', {
        days: Number(overdueThreshold),
      });
      addToast('Overdue threshold settings updated successfully!', 'success');
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      addToast('Failed to update threshold settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading analytics console...</p>
      </div>
    );
  }

  const { totalComplaints = 0, byCategory = [], byStatus = [], overdueCount = 0 } = stats || {};
  const total = Number(totalComplaints || 0);

  const getStatusCount = (stName) => {
    const found = byStatus.find((s) => s.status === stName);
    return found ? Number(found.count) : 0;
  };

  const openCount = getStatusCount('Open');
  const progressCount = getStatusCount('In Progress');
  const resolvedCount = getStatusCount('Resolved');

  return (
    <div className="page-container">
      {/* Top Operational KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-indigo">📊</div>
          <div className="kpi-data">
            <div className="kpi-label">Total Logged</div>
            <div className="kpi-value">{total}</div>
          </div>
        </div>

        <div className={`kpi-card ${overdueCount > 0 ? 'kpi-card-alert' : ''}`}>
          <div className="kpi-icon kpi-icon-red">⚠️</div>
          <div className="kpi-data">
            <div className="kpi-label">Overdue Alerts</div>
            <div className="kpi-value text-danger">{overdueCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-amber">🔴</div>
          <div className="kpi-data">
            <div className="kpi-label">Open Issues</div>
            <div className="kpi-value">{openCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-blue">⏳</div>
          <div className="kpi-data">
            <div className="kpi-label">In Progress</div>
            <div className="kpi-value">{progressCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-emerald">🟢</div>
          <div className="kpi-data">
            <div className="kpi-label">Resolved</div>
            <div className="kpi-value">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Breakdown Charts & Threshold Config */}
      <div className="dashboard-two-col-grid">
        {/* Category Breakdown Card */}
        <div className="content-card">
          <h3 className="card-title">Complaints by Category</h3>
          <p className="card-subtitle">Distribution breakdown across maintenance categories</p>

          {byCategory.length === 0 ? (
            <EmptyState icon="📊" title="No category data recorded" />
          ) : (
            <div className="progress-bars-list">
              {byCategory.map((cat) => {
                const count = Number(cat.count);
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat.category} className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-cat-name">{cat.category}</span>
                      <span className="progress-cat-count font-bold">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill fill-indigo" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Distribution & Threshold Config */}
        <div className="dashboard-right-stack">
          {/* Status Breakdown Card */}
          <div className="content-card">
            <h3 className="card-title">Status Breakdown</h3>
            <p className="card-subtitle">Current workflow stage distribution</p>

            <div className="progress-bars-list">
              {byStatus.map((st) => {
                const count = Number(st.count);
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                const fillClass =
                  st.status === 'Resolved'
                    ? 'fill-emerald'
                    : st.status === 'In Progress'
                    ? 'fill-blue'
                    : 'fill-red';
                return (
                  <div key={st.status} className="progress-item">
                    <div className="progress-label-row">
                      <span className="progress-cat-name">{st.status}</span>
                      <span className="progress-cat-count font-bold">
                        {count} ({percent}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div className={`progress-fill ${fillClass}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue Threshold Settings Card */}
          <div className="content-card settings-card">
            <h3 className="card-title">⚙️ Overdue System Threshold</h3>
            <p className="card-subtitle">
              Configure how many days a complaint can remain unresolved before automated overdue alerts trigger.
            </p>

            <form onSubmit={handleSaveSettings} className="settings-form-row">
              <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                <label className="form-label">Threshold (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="30"
                  value={overdueThreshold}
                  onChange={(e) => setOverdueThreshold(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-end' }}
                disabled={savingSettings}
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="content-card" style={{ marginTop: 24 }}>
        <h3 className="card-title">Recent Operational Activity</h3>
        <p className="card-subtitle">Real-time audit stream of status changes and notice broadcasts</p>

        {recentActivity.length === 0 ? (
          <EmptyState icon="📜" title="No recent activity logged" />
        ) : (
          <div className="activity-list">
            {recentActivity.map((act, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-icon">🔄</div>
                <div className="activity-body">
                  <div className="activity-desc">
                    <span className="font-bold">{act.actor_name || 'System'}</span> ({act.actor_role}){' '}
                    {act.change_type === 'created'
                      ? 'created complaint'
                      : `updated status to ${act.new_value}`}
                  </div>
                  <div className="activity-time">
                    {new Date(act.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
