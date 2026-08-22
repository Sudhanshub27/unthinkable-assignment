import { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Security', 'Lift', 'Parking', 'Other'];

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadComplaints() {
    setLoading(true);
    const res = await client.get('/complaints/mine');
    setComplaints(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!description.trim()) {
      setError('Please describe the issue');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);
      await client.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDescription('');
      setPhoto(null);
      e.target.reset?.();
      await loadComplaints();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Raise a Complaint</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." />
          </div>
          <div className="form-group">
            <label>Photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      <h2>My Complaints</h2>
      {loading && <p>Loading...</p>}
      {!loading && complaints.length === 0 && <p className="empty-state">No complaints raised yet.</p>}
      {complaints.map((c) => (
        <div className="card" key={c.id}>
          <div className="complaint-row">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <strong>#{c.id} · {c.category}</strong>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.is_overdue && <OverdueBadge />}
              </div>
              <p style={{ margin: '4px 0' }}>{c.description}</p>
              <small style={{ color: '#667085' }}>Raised on {new Date(c.created_at).toLocaleString()}</small>
              <div style={{ marginTop: 8 }}>
                <button className="secondary" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {expanded === c.id ? 'Hide history' : 'View history'}
                </button>
              </div>
              {expanded === c.id && (
                <div style={{ marginTop: 12 }}>
                  {c.history.map((h) => (
                    <div className="history-item" key={h.id}>
                      <strong>{h.change_type.replace('_', ' ')}</strong>
                      {h.old_value && h.new_value && ` : ${h.old_value} → ${h.new_value}`}
                      {h.note && <div>Note: {h.note}</div>}
                      <div>{new Date(h.created_at).toLocaleString()} by {h.actor_name || 'system'} ({h.actor_role})</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {c.photo_url && (
              <img className="complaint-photo" src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${c.photo_url}`} alt="complaint" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
