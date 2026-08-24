import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import NoticeCard from '../components/NoticeCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Button } from '../components/UIComponents';
import { SkeletonCard } from '../components/Skeletons';
import { Plus, Pin } from 'lucide-react';
import emptyNoticesIllustration from '../assets/empty-notices-new.png';

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

  // Delete Notice State
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    document.title = 'Notice Board — Angan';
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

  function promptDeleteNotice(id) {
    setNoticeToDelete(id);
  }

  async function handleConfirmDeleteNotice() {
    if (!noticeToDelete) return;
    setDeleting(true);
    try {
      await client.delete(`/notices/${noticeToDelete}`);
      addToast('Notice deleted successfully.', 'success');
      setNoticeToDelete(null);
      await loadNotices();
    } catch (err) {
      console.error(err);
      addToast('Failed to delete notice.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  // Sort important notices to top, then chronological
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <PageHeader
        title="Notice Board"
        subtitle="Stay updated with society announcements and important information."
        actionText={user?.role === 'admin' ? 'Create Notice' : undefined}
        onAction={user?.role === 'admin' ? () => setShowCreateModal(true) : undefined}
        actionIcon={<Plus className="w-4 h-4" />}
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
        <div className="space-y-4">
          {sortedNotices.map((n) => (
            <NoticeCard
              key={n.id}
              notice={n}
              onDelete={promptDeleteNotice}
              isAdmin={user?.role === 'admin'}
            />
          ))}
        </div>
      )}

      {/* Create Notice Modal (Admin Only) */}
      <Modal
        isOpen={showCreateModal && user?.role === 'admin'}
        onClose={() => setShowCreateModal(false)}
        title="Create Notice"
        maxWidth="560px"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-500 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="notice-title" className="block text-xs font-semibold text-ink-muted">
              Notice Title <span className="text-clay-500">*</span>
            </label>
            <input
              id="notice-title"
              type="text"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors placeholder:text-ink-muted"
              placeholder="e.g. Scheduled Lift Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="notice-body" className="block text-xs font-semibold text-ink-muted">
              Announcement Content <span className="text-clay-500">*</span>
            </label>
            <textarea
              id="notice-body"
              rows={5}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors placeholder:text-ink-muted"
              placeholder="Provide full details regarding the society update..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-line text-terracotta-400 focus:ring-terracotta-400/40"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
              />
              <span className="text-xs text-ink font-medium flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-mustard-500" />
                <span>Mark as Important (Pins to top & highlights entry)</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {submitting ? 'Publishing...' : 'Create Notice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Notice Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(noticeToDelete)}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={handleConfirmDeleteNotice}
        title="Delete Announcement?"
        message="Are you sure you want to delete this notice? This action will remove it from the notice board for all residents."
        confirmText="Delete Notice"
        cancelText="Cancel"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}
