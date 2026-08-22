import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function AdminComplaints() {
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

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

  async function loadComplaints() {
    setLoading(true);
    try {
      const res = await client.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load complaints queue.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function openComplaintDetail(c) {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setNewPriority(c.priority);
    setManualOverdue(!!c.is_overdue_flag);
    setNote('');
    setLoadingHistory(true);

    try {
      const res = await client.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data);
      setComplaintHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch complaint history timeline.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleUpdateStatus(e) {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      // Status update
      if (newStatus !== selectedComplaint.status || note.trim()) {
        await client.patch(`/complaints/${selectedComplaint.id}/status`, {
          status: newStatus,
          note: note.trim() || undefined,
        });
      }

      // Priority update
      if (newPriority !== selectedComplaint.priority) {
        await client.patch(`/complaints/${selectedComplaint.id}/priority`, {
          priority: newPriority,
          note: note.trim() || undefined,
        });
      }

      // Overdue flag toggle
      if (manualOverdue !== !!selectedComplaint.is_overdue_flag) {
        await client.patch(`/complaints/${selectedComplaint.id}/overdue-flag`, {
          flag: manualOverdue,
        });
      }

      addToast(`Complaint #${selectedComplaint.id} updated successfully!`, 'success');
      setSelectedComplaint(null);
      await loadComplaints();
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

  const getAgeDays = (createdAt) => {
    const diffTime = Math.abs(new Date() - new Date(createdAt));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const totalCount = complaints.length;
  const overdueCount = complaints.filter((c) => c.is_overdue).length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  // Sorting: Overdue + High Priority first
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    if (a.priority === 'High' && b.priority !== 'High') return -1;
    if (a.priority !== 'High' && b.priority === 'High') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filteredComplaints = sortedComplaints.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (overdueOnly && !c.is_overdue) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchResident = c.resident_name?.toLowerCase().includes(q);
      const matchFlat = c.flat_number?.toLowerCase().includes(q);
      const matchId = c.id?.toString().includes(q);
      if (!matchDesc && !matchResident && !matchFlat && !matchId) return false;
    }
    return true;
  });

  const hasActiveFilters =
    searchQuery || filterCategory || filterStatus || filterPriority || overdueOnly;

  return (
    <div className="page-container">
      {/* Top Operations KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-indigo">⚙️</div>
          <div className="kpi-data">
            <div className="kpi-label">Total Queue</div>
            <div className="kpi-value">{totalCount}</div>
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

      {/* Main Operations Console Table Card */}
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Maintenance Complaint Queue</h3>
            <p className="card-subtitle">
              Prioritized operational console. Overdue & high priority issues appear at the top.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm text-danger"
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('');
                setFilterStatus('');
                setFilterPriority('');
                setOverdueOnly(false);
              }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="admin-filter-bar">
          <div className="search-field-box">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search ID, Resident, Flat, or Keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="select-filters-row">
            <select
              className="form-control"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="form-control"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <label className="checkbox-filter-label">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
              />
              <span>⚠️ Overdue Only</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading complaints queue...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="No complaints match filters"
            description="Great! There are no complaints matching your specified filter criteria."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resident & Flat</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Age</th>
                  <th>Overdue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className={`table-row ${c.is_overdue ? 'table-row-overdue' : ''}`}
                  >
                    <td>
                      <span className="font-mono font-bold">#{c.id}</span>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span className="table-user-name">{c.resident_name || 'Resident'}</span>
                        <span className="table-flat-badge">
                          Flat {c.flat_number || 'A-301'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="table-cat-pill">{c.category}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td>
                      <span className="text-muted">{getAgeDays(c.created_at)}d ago</span>
                    </td>
                    <td>
                      {c.is_overdue ? (
                        <OverdueBadge ageDays={getAgeDays(c.created_at)} />
                      ) : (
                        <span className="text-emerald text-sm">On Schedule</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => openComplaintDetail(c)}
                      >
                        Manage ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Complaint Detail & Action Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Manage Complaint #${selectedComplaint.id}`}
          maxWidth="840px"
        >
          <div className="complaint-detail-two-col">
            {/* Left Column: Complaint & Resident Info */}
            <div className="detail-left-col">
              <div className="detail-section">
                <div className="resident-profile-box">
                  <div className="avatar-circle">
                    {selectedComplaint.resident_name
                      ? selectedComplaint.resident_name.charAt(0).toUpperCase()
                      : 'R'}
                  </div>
                  <div>
                    <div className="profile-name">{selectedComplaint.resident_name || 'Resident'}</div>
                    <div className="profile-sub">
                      Flat {selectedComplaint.flat_number || 'A-301'} • {selectedComplaint.resident_email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-subtitle">Category & Description</h4>
                <div className="table-cat-pill" style={{ marginBottom: 8, display: 'inline-block' }}>
                  {selectedComplaint.category}
                </div>
                <p className="detail-description-text">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.photo_url && (
                <div className="detail-section">
                  <h4 className="section-subtitle">Attached Photo</h4>
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
                    <div className="photo-hover-overlay">🔍 Click to enlarge</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Admin Actions & Status Form */}
            <div className="detail-right-col">
              <form onSubmit={handleUpdateStatus} className="admin-action-card">
                <h4 className="info-card-heading">Admin Triage Actions</h4>

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
                  <label className="form-label">Set Priority Level</label>
                  <select
                    className="form-control"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-filter-label" style={{ marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={manualOverdue}
                      onChange={(e) => setManualOverdue(e.target.checked)}
                    />
                    <span>⚠️ Manually Flag as Overdue/Urgent</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Note / Status Update Reason</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add an optional note (e.g. Technician dispatched to Flat A-301...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={updating}
                >
                  {updating ? 'Saving Updates...' : '💾 Save Status Updates'}
                </button>
              </form>
            </div>
          </div>

          <hr className="divider" />

          {/* Audit History Timeline */}
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
