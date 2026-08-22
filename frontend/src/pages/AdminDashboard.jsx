import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { StatCard, Button } from '../components/UIComponents';

const CATEGORIES = [
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Security', icon: '🛡️' },
  { name: 'Lift', icon: '🛗' },
  { name: 'Parking', icon: '🚗' },
  { name: 'Other', icon: '📦' },
];

export default function AdminDashboard() {
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overdueThreshold, setOverdueThreshold] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Selected Detail & Update State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [note, setNote] = useState('');
  const [manualOverdue, setManualOverdue] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

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

  async function openComplaintDetail(c) {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setNewPriority(c.priority);
    setManualOverdue(!!c.is_overdue_flag);
    setNote('');
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

  async function handleUpdateStatus(e) {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      await client.patch(`/complaints/${selectedComplaint.id}`, {
        status: newStatus,
        priority: newPriority,
        is_overdue: manualOverdue,
        note: note.trim() || undefined,
      });

      addToast(`Complaint #${selectedComplaint.id} updated successfully!`, 'success');
      setSelectedComplaint(null);
      await loadDashboardData(false);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update complaint.', 'error');
    } finally {
      setUpdating(false);
    }
  }

  const getBackendOrigin = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return envUrl.replace(/\/api\/?$/, '');
  };

  const getCategoryIcon = (catName) => {
    const found = CATEGORIES.find((c) => c.name === catName);
    return found ? found.icon : '📦';
  };

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

  // Operational Datasets
  const overdueComplaints = complaints.filter((c) => c.is_overdue);
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

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
      <div className="dashboard-header-card">
        <div className="header-title-group">
          <div className="dashboard-badge-date">📅 {currentDateFormatted}</div>
          <h2 className="dashboard-main-title">Society Operations Overview</h2>
          <p className="dashboard-sub-title">
            Real-time complaint triage, overdue SLA monitoring & service performance
          </p>
        </div>
      </div>

      {/* 2. TOP PRIMARY KPIs ROW */}
      <div className="kpi-grid">
        <StatCard label="Total Complaints" value={total} icon="📊" variant="indigo" />
        <StatCard label="Open" value={openCount} icon="🔴" variant="red" />
        <StatCard label="In Progress" value={progressCount} icon="⏳" variant="amber" />
        <StatCard label="Resolved" value={resolvedCount} icon="🟢" variant="emerald" />
        <StatCard
          label="Overdue Alerts"
          value={overdueCount}
          icon="⚠️"
          variant="red"
          alert={overdueCount > 0}
        />
      </div>

      {total === 0 ? (
        <div className="content-card" style={{ marginTop: 20 }}>
          <EmptyState
            icon="🎉"
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
                <h3 className="card-title text-danger">⚠️ Overdue Complaints (Needs Immediate Attention)</h3>
                <p className="card-subtitle">
                  Issues unresolved beyond the society SLA threshold ({overdueThreshold} days)
                </p>
              </div>
              <span className="badge badge-overdue">
                {overdueComplaints.length} Action Needed
              </span>
            </div>

            {overdueComplaints.length === 0 ? (
              <EmptyState
                icon="✅"
                title="Zero Overdue Complaints"
                description={`All active maintenance complaints are currently within normal SLA threshold (${overdueThreshold} days).`}
              />
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Resident & Flat</th>
                      <th>Priority</th>
                      <th>Age</th>
                      <th>Days Overdue</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueComplaints.map((c) => (
                      <tr key={c.id} className="table-row table-row-overdue">
                        <td>
                          <span className="font-mono font-bold">#{c.id}</span>
                        </td>
                        <td>
                          <span className="table-cat-pill">
                            {getCategoryIcon(c.category)} {c.category}
                          </span>
                        </td>
                        <td>
                          <div className="table-user-cell">
                            <span className="table-user-name">{c.resident_name || 'Resident'}</span>
                            <span className="table-flat-badge">
                              {c.flat_number ? `Flat ${c.flat_number}` : 'Flat not specified'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <PriorityBadge priority={c.priority} />
                        </td>
                        <td>
                          <span className="text-muted">{c.age_days ?? 0}d ago</span>
                        </td>
                        <td>
                          <OverdueBadge ageDays={c.age_days} />
                        </td>
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openComplaintDetail(c)}
                          >
                            View Complaint ➔
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. RECENT COMPLAINTS SECTION */}
          <div className="content-card recent-complaints-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">📋 Recent Complaint Log</h3>
                <p className="card-subtitle">Latest maintenance requests submitted by residents</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Resident & Flat</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Logged Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td>
                        <span className="font-mono font-bold">#{c.id}</span>
                      </td>
                      <td>
                        <span className="table-cat-pill">
                          {getCategoryIcon(c.category)} {c.category}
                        </span>
                      </td>
                      <td>
                        <div className="table-user-cell">
                          <span className="table-user-name">{c.resident_name || 'Resident'}</span>
                          <span className="table-flat-badge">
                            {c.flat_number ? `Flat ${c.flat_number}` : 'Flat not specified'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td>
                        <span className="text-muted">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openComplaintDetail(c)}
                        >
                          View Complaint ➔
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. MAIN OPERATIONS AREA: STATUS BREAKDOWN & PRIORITY SUMMARY */}
          <div className="dashboard-two-col-grid">
            {/* Complaint Status Breakdown */}
            <div className="content-card">
              <h3 className="card-title">Complaint Status Breakdown</h3>
              <p className="card-subtitle">Distribution across active workflow stages</p>

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
                        <span className="progress-cat-name font-bold">{st.status}</span>
                        <span className="progress-cat-count font-bold">
                          {count} issue{count === 1 ? '' : 's'} ({percent}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${fillClass}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority & Urgency Summary & Threshold Settings */}
            <div className="dashboard-right-stack">
              <div className="content-card">
                <h3 className="card-title">Priority & Urgency Breakdown</h3>
                <p className="card-subtitle">Urgency level summary of active requests</p>

                <div className="priority-summary-grid">
                  <div className="priority-sum-box priority-box-high">
                    <span className="priority-sum-label">🔴 High Priority</span>
                    <span className="priority-sum-val">{highPriorityCount}</span>
                  </div>
                  <div className="priority-sum-box priority-box-medium">
                    <span className="priority-sum-label">🟡 Medium Priority</span>
                    <span className="priority-sum-val">{mediumPriorityCount}</span>
                  </div>
                  <div className="priority-sum-box priority-box-low">
                    <span className="priority-sum-label">🟢 Low Priority</span>
                    <span className="priority-sum-val">{lowPriorityCount}</span>
                  </div>
                  <div className="priority-sum-box priority-box-overdue">
                    <span className="priority-sum-label">⚠️ Overdue Flagged</span>
                    <span className="priority-sum-val">{overdueCount}</span>
                  </div>
                </div>
              </div>

              {/* SLA Overdue Threshold Configuration */}
              <div className="content-card settings-card">
                <h3 className="card-title">⚙️ SLA Policy Settings</h3>
                <p className="card-subtitle">
                  Configure number of days before unresolved complaints trigger SLA overdue alerts.
                </p>

                <form onSubmit={handleSaveSettings} className="settings-form-row">
                  <div className="form-group flex-1" style={{ marginBottom: 0 }}>
                    <label className="form-label">Overdue Threshold (Days)</label>
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

                  <Button
                    type="submit"
                    variant="primary"
                    style={{ alignSelf: 'flex-end' }}
                    isLoading={savingSettings}
                  >
                    {savingSettings ? 'Saving...' : 'Save SLA Threshold'}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* 6. CATEGORY BREAKDOWN (ACTUAL BACKEND DATA) */}
          <div className="content-card">
            <h3 className="card-title">📊 Category Breakdown</h3>
            <p className="card-subtitle">Distribution across maintenance service domains</p>

            {byCategory.length === 0 ? (
              <EmptyState icon="📊" title="No category statistics recorded" />
            ) : (
              <div className="progress-bars-list">
                {byCategory.map((cat) => {
                  const count = Number(cat.count);
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={cat.category} className="progress-item">
                      <div className="progress-label-row">
                        <span className="progress-cat-name font-bold">
                          {getCategoryIcon(cat.category)} {cat.category}
                        </span>
                        <span className="progress-cat-count font-bold">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill fill-indigo"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Complaint Detail & Triage Workspace Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Operational Triage — Complaint #${selectedComplaint.id}`}
          maxWidth="840px"
        >
          <div className="complaint-detail-two-col">
            <div className="detail-left-col">
              <div className="detail-section">
                <div className="resident-profile-box">
                  <div className="avatar-circle">
                    {selectedComplaint.resident_name
                      ? selectedComplaint.resident_name.charAt(0).toUpperCase()
                      : 'R'}
                  </div>
                  <div>
                    <div className="profile-name">
                      {selectedComplaint.resident_name || 'Resident'}
                    </div>
                    <div className="profile-sub">
                      {selectedComplaint.flat_number ? `Flat ${selectedComplaint.flat_number}` : 'Flat not specified'} • {selectedComplaint.resident_email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-subtitle">Category & Description</h4>
                <div className="table-cat-pill" style={{ marginBottom: 8, display: 'inline-block' }}>
                  {getCategoryIcon(selectedComplaint.category)} {selectedComplaint.category}
                </div>
                <p className="detail-description-text">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.photo_url && (
                <div className="detail-section">
                  <h4 className="section-subtitle">Attached Attachment</h4>
                  <div
                    className="detail-photo-wrapper"
                    onClick={() =>
                      setLightboxPhoto(`${getBackendOrigin()}${selectedComplaint.photo_url}`)
                    }
                  >
                    <img
                      src={`${getBackendOrigin()}${selectedComplaint.photo_url}`}
                      alt="Complaint Attachment"
                      className="detail-photo-img"
                    />
                    <div className="photo-hover-overlay">🔍 Click to enlarge photo</div>
                  </div>
                </div>
              )}
            </div>

            <div className="detail-right-col">
              <form onSubmit={handleUpdateStatus} className="admin-action-card">
                <h4 className="info-card-heading">Triage Controls</h4>

                <div className="form-group">
                  <label className="form-label">Workflow Status</label>
                  <select
                    className="form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="Open">🔴 Open</option>
                    <option value="In Progress">⏳ In Progress</option>
                    <option value="Resolved">🟢 Resolved</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Tier</label>
                  <select
                    className="form-control"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="Low">🟢 Low Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="High">🔴 High Priority</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-filter-label" style={{ marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={manualOverdue}
                      onChange={(e) => setManualOverdue(e.target.checked)}
                    />
                    <span>⚠️ Manual Overdue Override</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Audit Note</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add an administrative note or status update reason..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isFullWidth
                  isLoading={updating}
                >
                  {updating ? 'Saving...' : '💾 Save Status Updates'}
                </Button>
              </form>
            </div>
          </div>

          <hr className="divider" />

          {loadingHistory ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading history timeline...</p>
            </div>
          ) : (
            <Timeline history={complaintHistory} />
          )}
        </Modal>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div className="lightbox-backdrop" onClick={() => setLightboxPhoto(null)}>
          <div className="lightbox-content">
            <img src={lightboxPhoto} alt="Full screen preview" />
            <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
