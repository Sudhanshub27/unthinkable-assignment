import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import NoticeCard from '../components/NoticeCard';
import EmptyState from '../components/EmptyState';
import PhotoUpload from '../components/PhotoUpload';
import SVGIcon from '../components/SVGIcon';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import emptyComplaintsIllustration from '../assets/empty-complaints.png';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Raise Complaint Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Get greeting based on time of day
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  async function loadDashboardData() {
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
      addToast('Failed to load resident dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  function resetForm() {
    setCategory('');
    setDescription('');
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(null);
    setPhotoPreview(null);
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!category) {
      setFormError('Please select an issue category.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a description of the issue.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description.trim());
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await client.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`Complaint #${res.data.id} submitted successfully!`, 'success');
      resetForm();
      setShowFormModal(false);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit complaint. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Statistics
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  // Important announcements
  const importantNotices = notices.filter((n) => n.is_important);

  // Recent complaints (last 4)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="page-container resident-dashboard-container">
      {/* 1. HEADER */}
      <PageHeader
        title={`${getGreeting()}, ${user?.name || 'Resident'} 👋`}
        subtitle="Here's what's happening around your society."
        actionText="Raise Complaint"
        onAction={() => {
          resetForm();
          setShowFormModal(true);
        }}
        actionIcon="plus"
      />

      {/* QUICK ACTIONS BAR */}
      <div className="resident-quick-actions-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <button
          type="button"
          className="quick-action-btn action-blue"
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
        >
          <div className="action-icon-chip chip-blue">
            <SVGIcon name="plus" size={18} />
          </div>
          <span>Raise Complaint</span>
        </button>

        <button
          type="button"
          className="quick-action-btn action-purple"
          onClick={() => navigate('/complaints')}
        >
          <div className="action-icon-chip chip-purple">
            <SVGIcon name="clipboard" size={18} />
          </div>
          <span>My Complaints</span>
        </button>

        <button
          type="button"
          className="quick-action-btn action-amber"
          onClick={() => navigate('/notices')}
        >
          <div className="action-icon-chip chip-amber">
            <SVGIcon name="megaphone" size={18} />
          </div>
          <span>Society Notices</span>
        </button>

        <button
          type="button"
          className="quick-action-btn action-green"
          onClick={() => navigate('/profile')}
        >
          <div className="action-icon-chip chip-green">
            <SVGIcon name="user" size={18} />
          </div>
          <span>My Profile</span>
        </button>
      </div>

      {/* 2. SUMMARY KPI STAT CARDS */}
      {loading ? (
        <div style={{ marginBottom: 24 }}>
          <SkeletonCard count={4} />
        </div>
      ) : (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <StatCard
            label="Total Complaints"
            value={totalCount}
            icon="clipboard"
            color="orange"
            variant="primary"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="Open"
            value={openCount}
            icon="clock"
            color="blue"
            variant="danger"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="In Progress"
            value={progressCount}
            icon="rotate-cw"
            color="purple"
            variant="warning"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            icon="check-circle"
            color="green"
            variant="success"
            onClick={() => navigate('/complaints')}
          />
        </div>
      )}

      {/* TWO COLUMN GRID: Important Announcements & Recent Complaints */}
      <div className="dashboard-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* IMPORTANT ANNOUNCEMENTS SECTION */}
        <div className="content-card">
          <div className="card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SVGIcon name="megaphone" size={18} color="#2563EB" />
              <span>Important Announcements</span>
            </h3>
            <button
              className="btn btn-outline btn-xs"
              onClick={() => navigate('/notices')}
            >
              <span>View all notices</span>
              <SVGIcon name="file-text" size={12} className="btn-icon-right" />
            </button>
          </div>

          {loading ? (
            <SkeletonCard count={1} />
          ) : importantNotices.length === 0 ? (
            <div className="empty-subtext-box" style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                No important announcements
              </p>
            </div>
          ) : (
            <div className="notices-grid" style={{ gridTemplateColumns: '1fr' }}>
              {importantNotices.slice(0, 2).map((notice) => (
                <NoticeCard key={notice.id} notice={notice} isAdmin={false} />
              ))}
            </div>
          )}
        </div>

        {/* RECENT COMPLAINTS SECTION */}
        <div className="content-card">
          <div className="card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SVGIcon name="clipboard" size={18} color="#2563EB" />
              <span>Recent Complaints</span>
            </h3>
            <button
              className="btn btn-outline btn-xs"
              onClick={() => navigate('/complaints')}
            >
              <span>View all complaints</span>
              <SVGIcon name="file-text" size={12} className="btn-icon-right" />
            </button>
          </div>

          {loading ? (
            <SkeletonTable rows={3} cols={6} />
          ) : complaints.length === 0 ? (
            <EmptyState
              illustration={emptyComplaintsIllustration}
              icon="clipboard"
              title="No complaints yet"
              description="Raise a maintenance complaint to track an issue with your society."
              actionText="Raise Maintenance Complaint"
              onAction={() => {
                resetForm();
                setShowFormModal(true);
              }}
            />
          ) : (
            <ComplaintTable
              complaints={recentComplaints}
              loading={false}
              mode="resident"
              onSelectComplaint={handleOpenDetail}
            />
          )}
        </div>
      </div>

      {/* RAISE COMPLAINT MODAL FORM */}
      {showFormModal && (
        <div className="modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div
            className="modal-dialog modal-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-raise-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="dashboard-raise-modal-title" className="modal-title">
                Raise Maintenance Complaint
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowFormModal(false)}
                aria-label="Close form"
              >
                <SVGIcon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="field-error-box mb-4">{formError}</div>}

                <div className="form-group">
                  <label htmlFor="dash-complaint-category" className="form-label">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    id="dash-complaint-category"
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select issue category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dash-complaint-description" className="form-label">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="dash-complaint-description"
                    className="form-control"
                    rows={4}
                    placeholder="Describe the maintenance issue, location details, or urgency..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Photo Attachment (Optional)</label>
                  <PhotoUpload
                    file={photo}
                    preview={photoPreview}
                    onChange={(file, previewUrl) => {
                      setPhoto(file);
                      setPhotoPreview(previewUrl);
                    }}
                    onRemove={() => {
                      if (photoPreview && photoPreview.startsWith('blob:')) {
                        URL.revokeObjectURL(photoPreview);
                      }
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    error={formError && formError.includes('image') ? formError : ''}
                    setError={setFormError}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAIL MODAL */}
      <ComplaintDetailModal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        history={complaintHistory}
        loadingHistory={loadingHistory}
        mode="resident"
      />
    </div>
  );
}
