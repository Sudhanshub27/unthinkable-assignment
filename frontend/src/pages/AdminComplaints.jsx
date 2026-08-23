import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import { Button } from '../components/UIComponents';
import { SkeletonCard } from '../components/Skeletons';
import { Search, Filter, AlertTriangle, X } from 'lucide-react';

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Security',
  'Lift',
  'Parking',
  'Other',
];

export default function AdminComplaints() {
  const { addToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Detail Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function loadComplaints() {
    setLoading(true);
    try {
      const res = await client.get('/complaints');
      setComplaints(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load complaints queue.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Complaints Management — Angan';
    loadComplaints();
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

  async function handleUpdateComplaintStatus(complaintId, patchPayload) {
    try {
      await client.patch(`/complaints/${complaintId}`, patchPayload);
      addToast(`Complaint #${complaintId} updated successfully!`, 'success');
      await loadComplaints();
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update complaint.', 'error');
      throw err;
    }
  }

  function handleClearFilters() {
    setSearchQuery('');
    setFilterCategory('');
    setFilterStatus('');
    setFilterPriority('');
    setOverdueOnly(false);
  }

  const isFilterActive =
    Boolean(searchQuery.trim()) ||
    Boolean(filterCategory) ||
    Boolean(filterStatus) ||
    Boolean(filterPriority) ||
    overdueOnly;

  // Filter Logic
  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterCategory && c.category !== filterCategory) return false;
    if (overdueOnly && !c.is_overdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(c.id).includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      const matchUser = (c.user_name || '').toLowerCase().includes(q);
      const matchFlat = (c.flat_number || '').toLowerCase().includes(q);
      return matchId || matchDesc || matchCat || matchUser || matchFlat;
    }

    return true;
  });

  // KPI Metrics
  const totalCount = complaints.length;
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const progressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const overdueCount = complaints.filter((c) => c.is_overdue).length;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Complaints Management"
        subtitle="Review, prioritize, and resolve resident maintenance requests."
      />

      {/* 2. STAT CARDS */}
      {loading ? (
        <SkeletonCard count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Queue" value={totalCount} icon="clipboard" color="orange" variant="primary" />
          <StatCard label="Open" value={openCount} icon="clock" color="blue" variant="danger" />
          <StatCard label="In Progress" value={progressCount} icon="rotate-cw" color="purple" variant="warning" />
          <StatCard label="Resolved" value={resolvedCount} icon="check-circle" color="green" variant="success" />
          <StatCard
            label="Overdue Alerts"
            value={overdueCount}
            icon="alert-triangle"
            color="red"
            variant="danger"
            alert={overdueCount > 0}
          />
        </div>
      )}

      {/* 3. FILTER BAR */}
      <div className="bg-paper-card rounded-xl shadow-soft p-3 flex flex-wrap gap-3 items-center border border-line">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full rounded-lg border border-line px-3 py-2 pl-9 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors placeholder:text-ink-muted"
            placeholder="Search by resident, flat, complaint ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Filter className="w-4 h-4 text-ink-muted hidden lg:block" />
          <select
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            className="rounded-lg border border-line px-3 py-2 text-sm text-ink bg-paper focus:ring-2 focus:ring-terracotta-400/40 focus:border-terracotta-400 outline-none transition-colors"
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

          <Button
            variant={overdueOnly ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setOverdueOnly(!overdueOnly)}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            Overdue Only
          </Button>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              icon={<X className="w-3.5 h-3.5" />}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 4. COMPLAINT CARDS GRID */}
      <ComplaintTable
        complaints={filteredComplaints}
        loading={loading}
        mode="admin"
        emptyMessage="No complaints match your filters"
        emptyDescription="Try clearing your search query or selecting different category and status filters."
        onSelectComplaint={handleOpenDetail}
        onRetry={loadComplaints}
      />

      {/* REUSABLE COMPLAINT DETAIL & TRIAGE MODAL */}
      <ComplaintDetailModal
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        complaint={selectedComplaint}
        history={complaintHistory}
        loadingHistory={loadingHistory}
        mode="admin"
        onUpdateStatus={handleUpdateComplaintStatus}
      />
    </div>
  );
}
