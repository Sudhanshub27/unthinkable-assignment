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
  const [expanded, setExpanded] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  async function loadComplaints() {
    setLoading(true);
    const params = {};
    if (category) params.category = category;
    if (status) params.status = status;
    const res = await client.get('/complaints', { params });
    setComplaints(res.data);
    setLoading(false);
  }

  useEffect(() => {
    loadComplaints();
  }, [category, status]);

  async function updateStatus(id, newStatus) {
    const note = noteDrafts[id] || '';
    await client.patch(`/complaints/${id}/status`, { status: newStatus, note });
    setNoteDrafts((d) => ({ ...d, [id]: '' }));
    await loadComplaints();
  }

  async function updatePriority(id, priority) {
    await client.patch(`/complaints/${id}/priority`, { priority });
    await loadComplaints();
  }

  return (
    <div className="container">
      <h2>All Complaints (Admin)</h2>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && complaints.length === 0 && <p className="empty-state">No complaints match these filters.</p>}

      {complaints.map((c) => (
        <div className="card" key={c.id}>
          <div className="complaint-row">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <strong>#{c.id} · {c.category}</strong>
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.is_overdue && <OverdueBadge />}
                <span style={{ color: '#667085', fontSize: '0.85rem' }}>
                  {c.resident_name} ({c.flat_number || 'no flat'})
                </span>
              </div>
              <p style={{ margin: '4px 0' }}>{c.description}</p>
              <small style={{ color: '#667085' }}>
                Raised {new Date(c.created_at).toLocaleString()} · {c.age_days} day(s) open
              </small>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={c.priority} onChange={(e) => updatePriority(c.id, e.target.value)}>
                  {['Low', 'Medium', 'High'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input
                  placeholder="Optional note for status change"
                  style={{ width: 220 }}
                  value={noteDrafts[c.id] || ''}
                  onChange={(e) => setNoteDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                />
                <button className="secondary" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  {expanded === c.id ? 'Hide history' : 'View history'}
                </button>
              </div>

              {expanded === c.id && (
                <HistoryPanel complaintId={c.id} />
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

function HistoryPanel({ complaintId }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    client.get(`/complaints/${complaintId}`).then((res) => setHistory(res.data.history));
  }, [complaintId]);

  if (!history) return <p>Loading history...</p>;

  return (
    <div style={{ marginTop: 12 }}>
      {history.map((h) => (
        <div className="history-item" key={h.id}>
          <strong>{h.change_type.replace('_', ' ')}</strong>
          {h.old_value && h.new_value && ` : ${h.old_value} → ${h.new_value}`}
          {h.note && <div>Note: {h.note}</div>}
          <div>{new Date(h.created_at).toLocaleString()} by {h.actor_name || 'system'} ({h.actor_role})</div>
        </div>
      ))}
    </div>
  );
}
