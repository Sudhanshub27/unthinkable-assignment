import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge, OverdueBadge, ImportantBadge } from '../components/Badges';
import PhotoUpload from '../components/PhotoUpload';
import Timeline from '../components/Timeline';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Security', icon: '🛡️' },
  { name: 'Lift', icon: '🛗' },
  { name: 'Parking', icon: '🚗' },
  { name: 'Other', icon: '📦' },
];

export default function ResidentComplaints() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [compRes, noticeRes] = await Promise.all([
        client.get('/complaints/mine'),
        client.get('/notices'),
      ]);
      setComplaints(compRes.data);
      setNotices(noticeRes.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load resident data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function openComplaintDetail(c) {
    setSelectedComplaint(c);
    setLoadingHistory(true);
    try {
      const res = await client.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data.complaint);
      setComplaintHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch complaint timeline history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!category) {
      setFormError('Please select a valid issue category.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a detailed description of the maintenance issue.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      const res = await client.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`Complaint #${res.data.id} raised successfully!`, 'success');

      setCategory('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      setShowFormModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit complaint');
      addToast('Failed to raise complaint. Please try again.', 'error');
    } finally {
      setSubmitting(false);
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

  const getAgeDays = (createdAt) => {
    const diffTime = Math.abs(new Date() - new Date(createdAt));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Metrics
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const importantNotices = notices.filter((n) => n.is_important);

  const filteredComplaints = complaints.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchCat = c.category?.toLowerCase().includes(q);
      const matchId = c.id?.toString().includes(q);
      if (!matchDesc && !matchCat && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Greeting & Action Header */}
      <div className="resident-welcome-card">
        <div className="welcome-left">
          <h2 className="welcome-greeting">
            Welcome back, <span className="highlight-name">{user.name}</span> 👋
          </h2>
          <p className="welcome-sub">
            Resident of <span className="highlight-flat">Flat {user.flat_number || 'A-301'}</span> • Maintain your society seamlessly
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg shadow-sm"
          onClick={() => setShowFormModal(true)}
        >
          ➕ Raise New Complaint
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-indigo">📋</div>
          <div className="kpi-data">
            <div className="kpi-label">Total Raised</div>
            <div className="kpi-value">{totalCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-red">🔴</div>
          <div className="kpi-data">
            <div className="kpi-label">Pending / Open</div>
            <div className="kpi-value">{openCount}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-amber">⏳</div>
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

      {/* Important Notices Banner */}
      {importantNotices.length > 0 && (
        <div className="important-notices-banner">
          <div className="banner-header">
            <span className="banner-title-text">📌 Important Community Announcements</span>
          </div>
          <div className="banner-notice-list">
            {importantNotices.slice(0, 2).map((n) => (
              <div key={n.id} className="banner-notice-item">
                <div className="banner-notice-head">
                  <span className="banner-notice-title">{n.title}</span>
                  <span className="banner-notice-date">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="banner-notice-body">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complaints List Section */}
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">My Maintenance Requests</h3>
            <p className="card-subtitle">Track real-time status and audit timeline of your requests</p>
          </div>

          <div className="filter-controls-group">
            <input
              type="text"
              className="form-control search-input"
              placeholder="🔍 Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="form-control filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            <select
              className="form-control filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon="🛠️"
            title="No complaints found"
            description={
              searchQuery || filterCategory || filterStatus
                ? 'No maintenance complaints match your current search filters.'
                : "You haven't logged any maintenance complaints yet."
            }
            actionText="+ Raise Your First Complaint"
            onAction={() => setShowFormModal(true)}
          />
        ) : (
          <div className="complaint-cards-grid">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className={`complaint-card ${c.is_overdue ? 'overdue-card-border' : ''}`}
                onClick={() => openComplaintDetail(c)}
              >
                <div className="complaint-card-header">
                  <div className="category-tag">
                    <span className="cat-icon">{getCategoryIcon(c.category)}</span>
                    <span className="cat-name">{c.category}</span>
                    <span className="complaint-id-pill">#{c.id}</span>
                  </div>
                  <div className="badges-group">
                    {c.is_overdue && <OverdueBadge ageDays={getAgeDays(c.created_at)} />}
                    <StatusBadge status={c.status} />
                  </div>
                </div>

                <p className="complaint-card-desc">{c.description}</p>

                <div className="complaint-card-footer">
                  <div className="meta-left">
                    <PriorityBadge priority={c.priority} />
                    <span className="meta-date">
                      📅 {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="btn btn-ghost btn-xs">View Timeline ➔</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raise Complaint Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="➕ Raise Maintenance Complaint"
        maxWidth="620px"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          {formError && <div className="alert alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Issue Category <span className="req">*</span></label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                -- Select Issue Category --
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Description <span className="req">*</span></label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe the issue in detail (e.g. Water leak under kitchen sink since morning...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attach Supporting Photo (Optional)</label>
            <PhotoUpload
              file={photo}
              preview={photoPreview}
              onChange={(f, p) => {
                setPhoto(f);
                setPhotoPreview(p);
              }}
              onRemove={() => {
                setPhoto(null);
                setPhotoPreview(null);
              }}
              error={formError}
              setError={setFormError}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowFormModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complaint Detail & History Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Complaint #${selectedComplaint.id} Details`}
          maxWidth="820px"
        >
          <div className="complaint-detail-two-col">
            <div className="detail-left-col">
              <div className="detail-section">
                <div className="detail-category-header">
                  <span className="cat-icon-lg">{getCategoryIcon(selectedComplaint.category)}</span>
                  <div>
                    <h3 className="detail-cat-name">{selectedComplaint.category} Issue</h3>
                    <div className="detail-meta-line">
                      Raised on {new Date(selectedComplaint.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4 className="section-subtitle">Issue Description</h4>
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

            <div className="detail-right-col">
              <div className="detail-info-card">
                <h4 className="info-card-heading">Operational Status</h4>

                <div className="info-row">
                  <span className="info-label">Status</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>

                <div className="info-row">
                  <span className="info-label">Priority</span>
                  <PriorityBadge priority={selectedComplaint.priority} />
                </div>

                <div className="info-row">
                  <span className="info-label">Overdue</span>
                  {selectedComplaint.is_overdue ? (
                    <OverdueBadge ageDays={getAgeDays(selectedComplaint.created_at)} />
                  ) : (
                    <span className="badge badge-status-resolved">On Schedule</span>
                  )}
                </div>

                <div className="info-row">
                  <span className="info-label">Resident</span>
                  <span className="info-val">{user.name}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Flat Number</span>
                  <span className="info-val">Flat {user.flat_number || 'A-301'}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Audit History Timeline */}
          {loadingHistory ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Fetching history timeline...</p>
            </div>
          ) : (
            <Timeline history={complaintHistory} />
          )}
        </Modal>
      )}

      {/* Lightbox Overlay */}
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
