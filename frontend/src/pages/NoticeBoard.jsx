import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ImportantBadge } from '../components/Badges';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

export default function NoticeBoard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notice Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadNotices() {
    setLoading(true);
    try {
      const res = await client.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load society notices.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  async function handleCreateNotice(e) {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a notice title.');
      return;
    }
    if (!body.trim()) {
      setFormError('Please enter the notice details/content.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/notices', {
        title: title.trim(),
        body: body.trim(),
        is_important: isImportant,
      });

      addToast(
        isImportant
          ? '⭐ Important notice published and broadcasted to residents!'
          : 'Notice published successfully!',
        'success'
      );

      setTitle('');
      setBody('');
      setIsImportant(false);
      setShowCreateModal(false);
      await loadNotices();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Failed to post notice.');
      addToast('Failed to post notice.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNotice(id) {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;

    try {
      await client.delete(`/notices/${id}`);
      addToast('Notice deleted successfully.', 'success');
      await loadNotices();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete notice.', 'error');
    }
  }

  // Sort important notices to top
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="content-card shadow-sm" style={{ marginBottom: 24 }}>
        <div className="card-header-row">
          <div>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>
              📢 Society Digital Bulletin Board
            </h2>
            <p className="card-subtitle">
              Official announcements, maintenance schedules & emergency broadcasts
            </p>
          </div>

          {user.role === 'admin' && (
            <button
              className="btn btn-primary shadow-sm"
              onClick={() => setShowCreateModal(true)}
            >
              ➕ Publish Announcement
            </button>
          )}
        </div>
      </div>

      {/* Notices Feed */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading notices...</p>
        </div>
      ) : sortedNotices.length === 0 ? (
        <EmptyState
          icon="📢"
          title="No notices published yet"
          description="You're all caught up! There are currently no active society announcements."
          actionText={user.role === 'admin' ? '+ Publish First Notice' : undefined}
          onAction={user.role === 'admin' ? () => setShowCreateModal(true) : undefined}
        />
      ) : (
        <div className="notices-grid">
          {sortedNotices.map((n) => (
            <div
              key={n.id}
              className={`notice-card ${n.is_important ? 'notice-card-important' : ''}`}
            >
              <div className="notice-card-header">
                <div className="notice-title-group">
                  {n.is_important && <ImportantBadge />}
                  <h3 className="notice-title">{n.title}</h3>
                </div>

                {user.role === 'admin' && (
                  <button
                    className="btn-icon-danger"
                    onClick={() => handleDeleteNotice(n.id)}
                    title="Delete Notice"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <p className="notice-body-text">{n.body}</p>

              <div className="notice-card-footer">
                <span className="notice-author">
                  Posted by <span className="font-bold">{n.posted_by_name || 'Society Office'}</span>
                </span>
                <span className="notice-date">
                  📅 {new Date(n.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Notice Modal (Admin Only) */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="📢 Publish Society Announcement"
        maxWidth="600px"
      >
        <form onSubmit={handleCreateNotice} className="modal-form">
          {formError && <div className="alert alert-danger">{formError}</div>}

          <div className="form-group">
            <label className="form-label">Notice Title <span className="req">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Scheduled Lift Maintenance & Power Outage"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Details <span className="req">*</span></label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Provide full details regarding the maintenance schedule or policy update..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-filter-label">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <span>⭐ Mark as Important (Pins to top & broadcasts email update)</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
