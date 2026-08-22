import { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges';

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
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  async function loadComplaints() {
    setLoading(true);
    try {
      const res = await client.get('/complaints/mine');
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhoto(null);
      setPhotoPreview(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!description.trim()) {
      setError('Please provide a detailed description of the maintenance issue.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      await client.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDescription('');
      setPhoto(null);
      setPhotoPreview(null);
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  const getCategoryIcon = (catName) => {
    const found = CATEGORIES.find((c) => c.name === catName);
    return found ? found.icon : '📦';
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filterCategory && c.category !== filterCategory) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const getBackendOrigin = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return envUrl.replace(/\/api\/?$/, '');
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resident Portal</h1>
          <p className="page-subtitle">Raise new complaints and track status history in real time.</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>Raise a Maintenance Complaint</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Issue Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, location in society, and any relevant details..."
            />
          </div>

          <div className="form-group">
            <label>Attach Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoPreview && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #334155' }}
                />
              </div>
            )}
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting Issue...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 36, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>My Complaint Records</h2>

        <div className="filters" style={{ margin: 0, padding: '8px 12px' }}>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading your complaints...</p>}

      {!loading && filteredComplaints.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>No complaints found matching your selection.</p>
        </div>
      )}

      {filteredComplaints.map((c) => (
        <div className="card complaint-card" key={c.id}>
          <div className="complaint-header">
            <div>
              <div className="complaint-meta">
                <span className="complaint-id">#{c.id}</span>
                <span className="complaint-category">
                  {getCategoryIcon(c.category)} {c.category}
                </span>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.is_overdue && <OverdueBadge />}
              </div>
              <div className="complaint-description">{c.description}</div>
            </div>

            {c.photo_url && (
              <img
                className="complaint-photo-thumb"
                src={`${getBackendOrigin()}${c.photo_url}`}
                alt="complaint photo"
                onClick={() => setSelectedPhoto(`${getBackendOrigin()}${c.photo_url}`)}
              />
            )}
          </div>

          <div className="complaint-footer">
            <div className="complaint-date">
              Raised on {new Date(c.created_at).toLocaleString()}
              {c.resolved_at && ` • Resolved on ${new Date(c.resolved_at).toLocaleString()}`}
            </div>

            <button
              className="secondary"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              {expandedId === c.id ? 'Hide Audit History' : '📜 View Status Timeline'}
            </button>
          </div>

          {expandedId === c.id && (
            <div className="timeline">
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Complete Status History ({c.history.length} event{c.history.length === 1 ? '' : 's'})
              </h4>
              {c.history.map((h) => (
                <div className="timeline-item" key={h.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-type">
                      {h.change_type.replace('_', ' ')}
                      {h.old_value && h.new_value && `: ${h.old_value} ➔ ${h.new_value}`}
                    </div>
                    {h.note && <div className="timeline-note">Note: {h.note}</div>}
                    <div className="timeline-meta">
                      {new Date(h.created_at).toLocaleString()} by {h.actor_name || 'System'} ({h.actor_role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>
              ✖
            </button>
            <img className="modal-img" src={selectedPhoto} alt="Full view" />
          </div>
        </div>
      )}
    </div>
  );
}
