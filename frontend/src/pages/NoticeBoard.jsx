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

  async function load() {
    setLoading(true);
    const res = await client.get('/notices');
    setNotices(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
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
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await client.delete(`/notices/${id}`);
    await load();
  }

  return (
    <div className="container">
      <h2>Notice Board</h2>

      {user.role === 'admin' && (
        <div className="card">
          <h3>Post a Notice</h3>
          <form onSubmit={handlePost}>
            <div className="form-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} />
              <label style={{ margin: 0 }}>Mark as important (pins to top + emails all residents)</label>
            </div>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {!loading && notices.length === 0 && <p className="empty-state">No notices yet.</p>}
      {notices.map((n) => (
        <div className="card" key={n.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <strong>{n.title}</strong>
                {n.is_important && <span className="badge badge-important">IMPORTANT</span>}
              </div>
              <p style={{ margin: '6px 0' }}>{n.body}</p>
              <small style={{ color: '#667085' }}>
                Posted {new Date(n.created_at).toLocaleString()} by {n.posted_by_name || 'Admin'}
              </small>
            </div>
            {user.role === 'admin' && (
              <button className="secondary" onClick={() => handleDelete(n.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
