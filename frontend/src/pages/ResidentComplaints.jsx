import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import PhotoUpload from '../components/PhotoUpload';
import SVGIcon from '../components/SVGIcon';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function ResidentComplaints() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
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

  async function loadData() {
    setLoading(true);
    try {
      const res = await client.get('/complaints/mine');
      setComplaints(res.data || []);
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
      setFormError('Please select a category.');
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

      const newId = res.data.id;
      addToast(`Complaint #${newId} submitted successfully!`, 'success');
      resetForm();
      setShowFormModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit complaint. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Filters
  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      return matchId || matchDesc || matchCat;
    }
    return true;
  });

  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="page-container resident-complaints-container">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="My Complaints"
        subtitle="Track the status of your maintenance requests."
        actionText="Raise Complaint"
        onAction={() => {
          resetForm();
          setShowFormModal(true);
        }}
        actionIcon="plus"
      />

      {/* 2. STAT CARDS */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Complaints" value={totalCount} icon="clipboard" variant="primary" />
        <StatCard label="Open" value={openCount} icon="clock" variant="danger" />
        <StatCard label="In Progress" value={progressCount} icon="clock" variant="warning" />
        <StatCard label="Resolved" value={resolvedCount} icon="check-circle" variant="success" />
      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="content-card filter-card" style={{ marginBottom: 20 }}>
        <div className="filter-controls-grid">
          <div className="filter-search-box">
            <div className="input-relative-wrapper">
              <span className="input-icon-prefix">
                <SVGIcon name="search" size={16} />
              </span>
              <input
                type="text"
                className="form-control input-has-icon"
                placeholder="Search by ID, category, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-selects-row">
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
          </div>
        </div>
      </div>

      {/* 4. COMPLAINT TABLE / CARDS */}
      <div className="content-card">
        <ComplaintTable
          complaints={filteredComplaints}
          loading={loading}
          mode="resident"
          emptyMessage="No complaints found"
          emptyDescription="You haven't submitted any complaints matching your filters yet. Click 'Raise Complaint' to submit a new request."
          emptyActionText="Raise Maintenance Complaint"
          onEmptyAction={() => {
            resetForm();
            setShowFormModal(true);
          }}
          onSelectComplaint={handleOpenDetail}
          onRetry={loadData}
        />
      </div>

      {/* RAISE COMPLAINT MODAL FORM */}
      {showFormModal && (
        <div className="modal-backdrop" onClick={() => setShowFormModal(false)}>
          <div
            className="modal-dialog modal-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="raise-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="raise-modal-title" className="modal-title">
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
                  <label htmlFor="complaint-category" className="form-label">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    id="complaint-category"
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
                  <label htmlFor="complaint-description" className="form-label">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="complaint-description"
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
