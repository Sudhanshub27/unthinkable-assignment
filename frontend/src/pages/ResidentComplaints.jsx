import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, PriorityBadge, OverdueBadge, ImportantBadge } from '../components/Badges';
import PhotoUpload from '../components/PhotoUpload';
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
  const [successComplaintId, setSuccessComplaintId] = useState(null);

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
      setComplaints(compRes.data || []);
      setNotices(noticeRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load resident maintenance data.', 'error');
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
      setSelectedComplaint(res.data.complaint || res.data);
      setComplaintHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch complaint history timeline.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!category) {
      setFormError('Please select a maintenance issue category.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please describe the issue in detail.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description.trim());
      if (photo) formData.append('photo', photo);

      const res = await client.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newId = res.data.id;
      setSuccessComplaintId(newId);
      addToast(`Complaint #${newId} submitted successfully!`, 'success');

      setCategory('');
      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit complaint');
      addToast('Failed to raise complaint. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setSuccessComplaintId(null);
    setFormError('');
  };

  const handleViewSubmittedComplaint = (id) => {
    handleCloseFormModal();
    const found = complaints.find((c) => c.id === id);
    if (found) {
      openComplaintDetail(found);
    } else {
      loadData().then(() => {
        const newlyCreated = complaints.find((c) => c.id === id);
        if (newlyCreated) openComplaintDetail(newlyCreated);
      });
    }
  };

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

  // Summary Metrics (Resident Specific)
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
    <div className="page-container resident-dashboard-container">
      {/* 1. GREETING & PRIMARY ACTION */}
      <div className="resident-welcome-card">
        <div className="welcome-left">
          <div className="welcome-profile-badge">
            🏢 Flat {user?.flat_number || 'A-301'} • Resident Portal
          </div>
          <h2 className="welcome-greeting">
            Welcome back, <span className="highlight-name">{user?.name}</span> 👋
          </h2>
          <p className="welcome-sub">
            Track maintenance requests, raise new issues & view community updates
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon="➕"
          onClick={() => {
            setSuccessComplaintId(null);
            setShowFormModal(true);
          }}
        >
          Raise New Complaint
        </Button>
      </div>

      {/* 2. COMPLAINT SUMMARY KPIs (RESIDENT ONLY) */}
      <div className="kpi-grid">
        <StatCard label="Total Requests" value={totalCount} icon="📋" variant="indigo" />
        <StatCard label="Pending / Open" value={openCount} icon="🔴" variant="red" />
        <StatCard label="In Progress" value={progressCount} icon="⏳" variant="amber" />
        <StatCard label="Resolved" value={resolvedCount} icon="🟢" variant="emerald" />
      </div>

      {/* 3. IMPORTANT NOTICES BANNER */}
      {importantNotices.length > 0 && (
        <div className="important-notices-banner">
          <div className="banner-header">
            <span className="banner-title-text">📌 Important Community Notice</span>
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

      {/* 4. MY COMPLAINTS LIST */}
      <div className="content-card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">My Maintenance Requests</h3>
            <p className="card-subtitle">Complete history and live status tracking</p>
          </div>

          <div className="filter-controls-group">
            <input
              type="text"
              className="form-control search-input"
              placeholder="🔍 Search requests..."
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
            <p>Loading maintenance records...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState
            icon="🛠️"
            title="No complaints logged"
            description={
              searchQuery || filterCategory || filterStatus
                ? 'No maintenance complaints match your current search criteria.'
                : "You haven't submitted any maintenance requests yet."
            }
            actionText="+ Raise Your First Complaint"
            onAction={() => {
              setSuccessComplaintId(null);
              setShowFormModal(true);
            }}
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

                {c.photo_url && (
                  <div className="complaint-card-photo-tag">
                    📷 Photo attachment attached
                  </div>
                )}

                <div className="complaint-card-footer">
                  <div className="meta-left">
                    <PriorityBadge priority={c.priority} />
                    <span className="meta-date">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button className="btn btn-ghost btn-xs">View Timeline ➔</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RAISE COMPLAINT MODAL */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={successComplaintId ? '🎉 Complaint Submitted' : '➕ Raise Maintenance Complaint'}
        maxWidth="580px"
      >
        {successComplaintId ? (
          <div className="empty-state-box" style={{ padding: '24px 10px' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem' }}>🎉</div>
            <h3 className="empty-state-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>
              Complaint #{successComplaintId} Created!
            </h3>
            <p className="empty-state-desc" style={{ marginBottom: 20 }}>
              Your maintenance request has been registered and routed to the society administrative team.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: 12 }}>
              <Button
                variant="secondary"
                onClick={handleCloseFormModal}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => handleViewSubmittedComplaint(successComplaintId)}
              >
                View Complaint Timeline ➔
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {formError && <div className="alert alert-danger">{formError}</div>}

            <div className="form-group">
              <label className="form-label">Issue Category <span className="req">*</span></label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
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
                placeholder="Describe the maintenance issue in detail (e.g. Low water pressure in master bathroom...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attach Photo (Optional)</label>
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
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseFormModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
              >
                {submitting ? 'Uploading & Saving...' : 'Submit Complaint'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* COMPLAINT DETAIL MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Complaint #${selectedComplaint.id} Timeline & Status`}
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
              <div className="detail-info-card">
                <h4 className="info-card-heading">Current Status Details</h4>

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
                    <span className="badge badge-status-resolved">Within SLA</span>
                  )}
                </div>

                <div className="info-row">
                  <span className="info-label">Resident Name</span>
                  <span className="info-val">{user?.name}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Flat Number</span>
                  <span className="info-val">Flat {user?.flat_number || 'A-301'}</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Chronological Audit Timeline */}
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
