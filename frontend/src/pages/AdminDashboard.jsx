import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import EmptyState from '../components/EmptyState';

export default function AdminDashboard() {
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overdueThreshold, setOverdueThreshold] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function loadDashboardData(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const [dashRes, complaintsRes] = await Promise.all([
        client.get('/dashboard'),
        client.get('/complaints'),
      ]);
      setStats(dashRes.data);
      setComplaints(complaintsRes.data || []);
      if (dashRes.data && dashRes.data.overdueThresholdDays) {
        setOverdueThreshold(Number(dashRes.data.overdueThresholdDays));
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard operational analytics.', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData(true);
  }, []);

  async function handleSaveSettings(e) {
    e.preventDefault();
    const parsedDays = parseInt(overdueThreshold, 10);
    if (isNaN(parsedDays) || parsedDays < 1) {
      addToast('Please enter a valid positive integer for SLA threshold days.', 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await client.put('/settings/overdue-threshold', {
        days: parsedDays,
      });
      setOverdueThreshold(res.data.days);
      addToast(`SLA overdue threshold updated to ${res.data.days} days!`, 'success');
      await loadDashboardData(false);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update threshold settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleOpenDetail(c) {
    setSelectedComplaint(c);
    setLoadingHistory(true);

    try {
      const res = await client.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data.complaint || res.data);
      setComplaintHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch complaint timeline history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleUpdateComplaintStatus(complaintId, patchPayload) {
    try {
      await client.patch(`/complaints/${complaintId}`, patchPayload);
      addToast(`Complaint #${complaintId} updated successfully!`, 'success');
      await loadDashboardData(false);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update complaint.', 'error');
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading society operations console...</p>
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

  const overdueComplaints = complaints.filter((c) => c.is_overdue);
  const highPriorityCount = complaints.filter((c) => c.priority === 'High').length;
  const mediumPriorityCount = complaints.filter((c) => c.priority === 'Medium').length;
  const lowPriorityCount = complaints.filter((c) => c.priority === 'Low').length;

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="page-container admin-dashboard-container">
      {/* 1. HEADER */}
      <PageHeader
        title="Society Operations Overview"
        subtitle="Real-time complaint triage, overdue SLA monitoring & service performance"
        breadcrumb={currentDateFormatted}
      />

      {/* 2. TOP PRIMARY KPIs ROW */}
      <div className="kpi-grid">
        <StatCard label="Total Complaints" value={total} icon="clipboard" variant="primary" />
        <StatCard label="Open" value={openCount} icon="clock" variant="danger" />
        <StatCard label="In Progress" value={progressCount} icon="clock" variant="warning" />
        <StatCard label="Resolved" value={resolvedCount} icon="check-circle" variant="success" />
        <StatCard
          label="Overdue Alerts"
          value={overdueCount}
          icon="alert-triangle"
          variant="danger"
          alert={overdueCount > 0}
        />
      </div>

      {total === 0 ? (
        <div className="content-card" style={{ marginTop: 20 }}>
          <EmptyState
            icon="clipboard"
            title="No complaints recorded yet"
            description="The society complaint registry is empty. New resident complaints will appear here automatically."
          />
        </div>
      ) : (
        <div className="dashboard-sections-wrapper">
          {/* 3. OVERDUE / NEEDS ATTENTION SECTION */}
          <div className="content-card overdue-section-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title text-danger">Overdue Complaints (Action Required)</h3>
                <p className="card-subtitle">
                  Issues unresolved beyond the society SLA threshold ({overdueThreshold} days)
                </p>
              </div>
              <span className="badge badge-overdue">
                {overdueComplaints.length} Action Needed
              </span>
            </div>

            <ComplaintTable
              complaints={overdueComplaints}
              mode="admin"
              emptyMessage="Zero Overdue Complaints"
              emptyDescription={`All active complaints are within normal SLA threshold (${overdueThreshold} days).`}
              onSelectComplaint={handleOpenDetail}
            />
          </div>

          {/* 4. PERFORMANCE & CATEGORIES GRID */}
          <div className="dashboard-secondary-grid">
            {/* Category Breakdown */}
            <div className="content-card">
              <div className="card-header-row">
                <h3 className="card-title">Category Distribution</h3>
              </div>
              <div className="category-bars-list">
                {byCategory.length === 0 ? (
                  <p className="text-muted text-sm">No category distribution data.</p>
                ) : (
                  byCategory.map((cat) => {
                    const count = Number(cat.count);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div className="cat-bar-item" key={cat.category}>
                        <div className="cat-bar-header">
                          <span className="cat-name">{cat.category}</span>
                          <span className="cat-count">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="cat-bar-track">
                          <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SLA Settings & Priorities */}
            <div className="content-card">
              <div className="card-header-row">
                <h3 className="card-title">SLA Threshold & Priority</h3>
              </div>

              <form onSubmit={handleSaveSettings} className="inline-settings-form">
                <div className="form-group">
                  <label htmlFor="overdueThresholdInput" className="form-label">
                    Overdue Threshold (Days)
                  </label>
                  <div className="inline-input-row">
                    <input
                      id="overdueThresholdInput"
                      type="number"
                      min="1"
                      className="form-control"
                      value={overdueThreshold}
                      onChange={(e) => setOverdueThreshold(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn btn-outline btn-sm"
                      disabled={savingSettings}
                    >
                      {savingSettings ? 'Saving...' : 'Update SLA'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="priority-summary-box" style={{ marginTop: 20 }}>
                <h4 className="priority-box-title">Active Priorities Breakdown</h4>
                <div className="priority-pills-row">
                  <span className="badge badge-priority-high">High: {highPriorityCount}</span>
                  <span className="badge badge-priority-medium">Medium: {mediumPriorityCount}</span>
                  <span className="badge badge-priority-low">Low: {lowPriorityCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE COMPLAINT DETAIL & ATOMIC TRIAGE MODAL */}
      <ComplaintDetailModal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        history={complaintHistory}
        loadingHistory={loadingHistory}
        mode="admin"
        onUpdateStatus={handleUpdateComplaintStatus}
      />
    </div>
  );
}
