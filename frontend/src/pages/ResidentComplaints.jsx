import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import PhotoUpload from '../components/PhotoUpload';
import Modal from '../components/Modal';
import { Button } from '../components/UIComponents';
import { SkeletonCard } from '../components/Skeletons';
import { Plus, Search, Filter, List, LayoutGrid } from 'lucide-react';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function ResidentComplaints() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Filters & View Layout State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewLayout, setViewLayout] = useState('list');

  async function loadData() {
    setLoading(true);
    try {
      const res = await client.get('/complaints/mine');
      setComplaints(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load resident maintenance data.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'My Complaints — Angan';
    loadData();
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
      setFormError('Please select a category.');
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

      const newId = res.data.id;
      addToast(`Complaint #${newId} submitted successfully!`, 'success');
      resetForm();
      setShowFormModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Failed to submit complaint. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Filters & Sorting
  const filteredComplaints = complaints
    .filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCategory && c.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = String(c.id).includes(q);
        const matchDesc = (c.description || '').toLowerCase().includes(q);
        const matchCat = (c.category || '').toLowerCase().includes(q);
        return matchId || matchDesc || matchCat;
      }
      return true;
    })
    .sort((a, b) => {
      const timeDiff = new Date(b.created_at || 0) - new Date(a.created_at || 0);
      const primaryDiff = timeDiff !== 0 ? timeDiff : Number(b.id) - Number(a.id);
      return sortOrder === 'oldest' ? -primaryDiff : primaryDiff;
    });

  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="My Complaints"
        subtitle="Track the status of your maintenance requests."
        actionText="Raise Complaint"
        onAction={() => {
          resetForm();
          setShowFormModal(true);
        }}
        actionIcon={<Plus className="w-4 h-4" />}
      />

      {/* 2. STAT CARDS */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Complaints" value={totalCount} icon="clipboard" variant="primary" />
          <StatCard label="Open" value={openCount} icon="clock" variant="danger" />
          <StatCard label="In Progress" value={progressCount} icon="rotate-cw" variant="warning" />
          <StatCard label="Resolved" value={resolvedCount} icon="check-circle" variant="success" />
        </div>
      )}

      {/* 3. SEARCH & FILTER BAR */}
      <div className="bg-paper-card rounded-xl shadow-soft p-3 flex flex-wrap gap-2.5 items-center border border-line">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full rounded-lg border border-line px-3 py-2 pl-9 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors placeholder:text-ink-muted"
            placeholder="Search by ID, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <select
            className="rounded-lg border border-line px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors w-full sm:w-auto font-medium"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>

          <select
            className="rounded-lg border border-line px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="rounded-lg border border-line px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors w-full sm:w-auto"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* View Mode Switcher (List vs Grid) */}
          <div className="flex items-center rounded-lg border border-line bg-paper p-0.5 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === 'list'
                  ? 'bg-paper-card text-terracotta-500 shadow-xs border border-line/60 font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="Single Column Stack (Clear Reading Order)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === 'grid'
                  ? 'bg-paper-card text-terracotta-500 shadow-xs border border-line/60 font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="2-Column Grid"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. COMPLAINT CARDS */}
      <ComplaintTable
        complaints={filteredComplaints}
        loading={loading}
        mode="resident"
        layout={viewLayout}
        emptyMessage="No complaints found"
        emptyDescription="You haven't submitted any complaints matching your filters yet. Click 'Raise Complaint' to submit a new request."
        emptyActionText="Raise Maintenance Complaint"
        onEmptyAction={() => {
          resetForm();
          setShowFormModal(true);
        }}
        onSelectComplaint={handleOpenDetail}
        onRetry={loadData}
      />

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
            <label htmlFor="complaint-category" className="block text-xs font-semibold text-ink-muted">
              Category <span className="text-clay-500">*</span>
            </label>
            <select
              id="complaint-category"
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
            <label htmlFor="complaint-description" className="block text-xs font-semibold text-ink-muted">
              Description <span className="text-clay-500">*</span>
            </label>
            <textarea
              id="complaint-description"
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
