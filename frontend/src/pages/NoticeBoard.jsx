import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadNotices() {
    setLoading(true);
    try {
      const res = await client.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  async function handlePost(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await client.post('/notices', { title, body, isImportant });
      setTitle('');
      setBody('');
      setIsImportant(false);
      await loadNotices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post notice');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await client.delete(`/notices/${id}`);
      await loadNotices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete notice');
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Notice Board</h1>
          <p className="page-subtitle">Official announcements, updates, and important society notices.</p>
        </div>
      </div>

      {user.role === 'admin' && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Post an Official Notice</h3>
          <form onSubmit={handlePost}>
            <div className="form-group">
              <label>Notice Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Water Tank Cleaning Schedule"
                required
              />
            </div>
            <div className="form-group">
              <label>Notice Details</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Provide complete information for residents..."
                required
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="isImportant"
                style={{ width: 'auto', cursor: 'pointer' }}
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <label htmlFor="isImportant" style={{ margin: 0, cursor: 'pointer', color: 'var(--text-main)' }}>
                ⭐ Mark as Important (Pins to top of notice board & broadcasts email to all residents)
              </label>
            </div>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? 'Publishing Announcement...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading notice board...</p>}

      {!loading && notices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📌</div>
          <p>No notices have been posted yet.</p>
        </div>
      )}

      {notices.map((n) => (
        <div
          className="card"
          key={n.id}
          style={{
            borderLeft: n.is_important ? '4px solid #f59e0b' : '1px solid var(--bg-card-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{n.title}</h3>
                {n.is_important && <span className="badge badge-important">📌 PINNED & IMPORTANT</span>}
              </div>

              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', margin: '8px 0 12px 0', whiteSpace: 'pre-wrap' }}>{n.body}</p>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Posted on {new Date(n.created_at).toLocaleString()} by {n.posted_by_name || 'Society Admin'}
              </div>
            </div>

            {user.role === 'admin' && (
              <button className="danger" onClick={() => handleDelete(n.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
