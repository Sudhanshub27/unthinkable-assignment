import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import NoticeCard from '../components/NoticeCard';
import EmptyState from '../components/EmptyState';
import SVGIcon from '../components/SVGIcon';
import { SkeletonCard } from '../components/Skeletons';
import emptyNoticesIllustration from '../assets/empty-notices.png';

export default function NoticeBoard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notice Form State (Admin Only)
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
      setNotices(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Unable to load notices.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  // Keyboard Escape listener for modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal]);

  async function handleCreateNotice(e) {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a notice title.');
      return;
    }
    if (!body.trim()) {
      setFormError('Please enter announcement details.');
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
        isImportant ? 'Important notice published' : 'Notice published successfully',
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

  // Sort important notices to top, then chronological
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="page-container notice-board-container">
      {/* Page Header */}
      <PageHeader
        title="Notice Board"
        subtitle="Stay updated with society announcements and important information."
        actionText={user?.role === 'admin' ? 'Create Notice' : undefined}
        onAction={user?.role === 'admin' ? () => setShowCreateModal(true) : undefined}
        actionIcon="plus"
      />

      {/* Notices Feed */}
      {loading ? (
        <SkeletonCard count={3} />
      ) : sortedNotices.length === 0 ? (
        <EmptyState
          illustration={emptyNoticesIllustration}
          icon="megaphone"
          title="No notices yet"
          description="Society announcements will appear here."
          actionText={user?.role === 'admin' ? 'Create Notice' : undefined}
          onAction={user?.role === 'admin' ? () => setShowCreateModal(true) : undefined}
        />
      ) : (
        <div className="notices-grid">
          {sortedNotices.map((n) => (
            <NoticeCard
              key={n.id}
              notice={n}
              onDelete={handleDeleteNotice}
              isAdmin={user?.role === 'admin'}
            />
          ))}
        </div>
      )}

      {/* Create Notice Modal (Admin Only) */}
      {showCreateModal && user?.role === 'admin' && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="modal-dialog modal-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-notice-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="create-notice-title" className="modal-title">
                Create Notice
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <SVGIcon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice}>
              <div className="modal-body">
                {formError && <div className="field-error-box mb-4">{formError}</div>}

                <div className="form-group">
                  <label htmlFor="notice-title" className="form-label">
                    Notice Title <span className="text-danger">*</span>
                  </label>
                  <input
                    id="notice-title"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Scheduled Lift Maintenance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notice-body" className="form-label">
                    Announcement Content <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="notice-body"
                    className="form-control"
                    rows={5}
                    placeholder="Provide full details regarding the society update..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                    />
                    <span>Mark as Important (Pins to top & broadcasts email update)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Create Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
