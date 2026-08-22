import { useEffect, useState } from 'react';
import client from '../api/client';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../components/Badges';

const CATEGORIES = ['Plumbing', 'Electrical', 'Cleaning', 'Security', 'Lift', 'Parking', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Resolved'];

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  async function loadComplaints() {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      const res = await client.get('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, [category, status]);

  async function updateStatus(id, newStatus) {
    const note = noteDrafts[id] || '';
    try {
      await client.patch(`/complaints/${id}/status`, { status: newStatus, note });
      setNoteDrafts((d) => ({ ...d, [id]: '' }));
      await loadComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  }

  async function updatePriority(id, priority) {
    try {
      await client.patch(`/complaints/${id}/priority`, { priority });
      await loadComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update priority');
    }
  }

  async function toggleOverdueFlag(id, currentFlag) {
    try {
      await client.patch(`/complaints/${id}/overdue-flag`, { flag: !currentFlag });
      await loadComplaints();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle overdue flag');
    }
  }

  const getBackendOrigin = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    return envUrl.replace(/\/api\/?$/, '');
  };

  const filteredComplaints = complaints.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.description.toLowerCase().includes(q) ||
      (c.resident_name && c.resident_name.toLowerCase().includes(q)) ||
      (c.flat_number && c.flat_number.toLowerCase().includes(q)) ||
      c.id.toString().includes(q)
    );
  });

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Maintenance Queue</h1>
          <p className="page-subtitle">Manage resident complaints, update workflow status, set priorities, and flag overdue issues.</p>
        </div>
      </div>

      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="🔍 Search resident, flat, or complaint..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading queue...</p>}

      {!loading && filteredComplaints.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No complaints match your filters or search query.</p>
        </div>
      )}

      {filteredComplaints.map((c) => (
        <div className="card complaint-card" key={c.id}>
          <div className="complaint-header">
            <div>
              <div className="complaint-meta">
                <span className="complaint-id">#{c.id}</span>
                <span className="complaint-category">{c.category}</span>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.is_overdue && <OverdueBadge />}

                <span style={{ color: '#a5b4fc', fontSize: '0.88rem', fontWeight: 600 }}>
                  👤 {c.resident_name} {c.flat_number ? `(Flat ${c.flat_number})` : ''}
                </span>
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

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 14, borderRadius: 10, margin: '12px 0' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
              Workflow Management Controls
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Status</label>
                <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)} style={{ padding: '8px 12px' }}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Priority</label>
                <select value={c.priority} onChange={(e) => updatePriority(c.id, e.target.value)} style={{ padding: '8px 12px' }}>
                  {['Low', 'Medium', 'High'].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Status Change Note</label>
                <input
                  placeholder="Note for resident (sent via email)..."
                  value={noteDrafts[c.id] || ''}
                  onChange={(e) => setNoteDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                  style={{ padding: '8px 12px' }}
                />
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  className={c.is_overdue_flag ? 'danger' : 'secondary'}
                  onClick={() => toggleOverdueFlag(c.id, c.is_overdue_flag)}
                >
                  {c.is_overdue_flag ? '🚩 Override Active' : '🏳️ Flag Overdue'}
                </button>
              </div>
            </div>
          </div>

          <div className="complaint-footer">
            <div className="complaint-date">
              Raised {new Date(c.created_at).toLocaleString()} • {c.age_days} day(s) open
            </div>

            <button className="secondary" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
              {expandedId === c.id ? 'Hide Audit History' : '📜 View History Log'}
            </button>
          </div>

          {expandedId === c.id && <AdminHistoryPanel complaintId={c.id} />}
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

function AdminHistoryPanel({ complaintId }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    client.get(`/complaints/${complaintId}`).then((res) => setHistory(res.data.history));
  }, [complaintId]);

  if (!history) return <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading audit log...</p>;

  return (
    <div className="timeline">
      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Audit Trail ({history.length} record{history.length === 1 ? '' : 's'})
      </h4>
      {history.map((h) => (
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
  );
}
