import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import NoticeCard from '../components/NoticeCard';
import EmptyState from '../components/EmptyState';
import PhotoUpload from '../components/PhotoUpload';
import Modal from '../components/Modal';
import { Button } from '../components/UIComponents';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import { Plus, Megaphone, ClipboardList, ArrowRight } from 'lucide-react';
import emptyComplaintsIllustration from '../assets/empty-complaints-new.webp';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Raise Complaint Form Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [compRes, noticeRes] = await Promise.all([
        client.get('/complaints/mine'),
        client.get('/notices'),
      ]);
      setComplaints(compRes.data || []);
      setNotices(noticeRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load resident dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Dashboard — Angan';
    loadDashboardData();
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
      setFormError('Please select an issue category.');
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

      addToast(`Complaint #${res.data.id} submitted successfully!`, 'success');
      resetForm();
      setShowFormModal(false);
      await loadDashboardData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit complaint. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Statistics
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  // Important notices
  const importantNotices = notices.filter((n) => n.is_important);

  // Recent complaints (last 4)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* 1. HEADER */}
      <PageHeader
        title={`${getGreeting()}, ${user?.name || 'Resident'}`}
        subtitle="Here's what's happening around your society."
        actionText="Raise Complaint"
        onAction={() => {
          resetForm();
          setShowFormModal(true);
        }}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      {/* 2. STATS ROW */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Complaints"
            value={totalCount}
            icon="clipboard"
            variant="primary"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="Open"
            value={openCount}
            icon="clock"
            variant="danger"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="In Progress"
            value={progressCount}
            icon="rotate-cw"
            variant="warning"
            onClick={() => navigate('/complaints')}
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            icon="check-circle"
            variant="success"
            onClick={() => navigate('/complaints')}
          />
        </div>
      )}

      {/* 3. TWO COLUMN GRID: Important Announcements & Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* IMPORTANT ANNOUNCEMENTS SECTION (1 col) */}
        <div className="lg:col-span-1 bg-paper-card rounded-xl border border-line shadow-soft p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-olive-500" />
              <span>Important Notices</span>
            </h3>
            <Link to="/notices" className="text-xs font-semibold text-terracotta-400 hover:underline flex items-center gap-1">
              View all
            </Link>
          </div>

          {loading ? (
            <SkeletonCard count={1} />
          ) : importantNotices.length === 0 ? (
            <div className="py-6 flex items-center justify-center">
              <EmptyState
                variant="compact"
                icon="megaphone"
                title="No announcements yet"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {importantNotices.slice(0, 2).map((notice) => (
                <NoticeCard key={notice.id} notice={notice} isAdmin={false} />
              ))}
            </div>
          )}
        </div>

        {/* RECENT COMPLAINTS SECTION (2 cols) */}
        <div className="lg:col-span-2 bg-paper-card rounded-xl border border-line shadow-soft p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-terracotta-400" />
              <span>Recent Complaints</span>
            </h3>
            <Link to="/complaints" className="text-xs font-semibold text-terracotta-400 hover:underline flex items-center gap-1">
              View all complaints <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <SkeletonTable rows={3} cols={4} />
          ) : complaints.length === 0 ? (
            <EmptyState
              illustration={emptyComplaintsIllustration}
              icon="clipboard"
              title="No complaints yet"
              description="Raise a maintenance complaint to track an issue with your society."
              actionText="Raise Maintenance Complaint"
              onAction={() => {
                resetForm();
                setShowFormModal(true);
              }}
            />
          ) : (
            <ComplaintTable
              complaints={recentComplaints}
              loading={false}
              mode="resident"
              onSelectComplaint={handleOpenDetail}
            />
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTON ON MOBILE */}
      <div className="fixed bottom-6 right-6 z-30 md:hidden">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg p-4 flex items-center justify-center"
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
          aria-label="Raise Complaint"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* RAISE COMPLAINT MODAL FORM */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Raise Maintenance Complaint"
        maxWidth="560px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-clay-500/10 border border-clay-500/20 text-clay-500 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="dash-complaint-category" className="block text-xs font-semibold text-ink-muted">
              Category <span className="text-clay-500">*</span>
            </label>
            <select
              id="dash-complaint-category"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
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

          <div className="space-y-1">
            <label htmlFor="dash-complaint-description" className="block text-xs font-semibold text-ink-muted">
              Description <span className="text-clay-500">*</span>
            </label>
            <textarea
              id="dash-complaint-description"
              rows={4}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
              placeholder="Describe the maintenance issue, location details, or urgency..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-ink-muted">Photo Attachment (Optional)</label>
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

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="secondary" onClick={() => setShowFormModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </Modal>

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
