import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import SVGIcon from '../components/SVGIcon';

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
    <div className="page-container admin-complaints-container">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Complaints"
        subtitle="Review, prioritize, and resolve resident maintenance requests."
      />

      {/* 2. STAT CARDS */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Queue" value={totalCount} icon="clipboard" variant="primary" />
        <StatCard label="Open" value={openCount} icon="clock" variant="danger" />
        <StatCard label="In Progress" value={progressCount} icon="clock" variant="warning" />
        <StatCard label="Resolved" value={resolvedCount} icon="check-circle" variant="success" />
        <StatCard
          label="Overdue Alerts"
          value={overdueCount}
          icon="alert-triangle"
          variant="danger"
          alert={overdueCount > 0}
        />
      </div>

      {/* 3. FILTER BAR */}
      <div className="content-card filter-card" style={{ marginBottom: 20 }}>
        <div className="filter-controls-grid">
          <div className="filter-search-box">
            <div className="input-relative-wrapper">
              <span className="input-icon-prefix">
                <SVGIcon name="search" size={16} />
              </span>
              <input
                type="text"
                className="form-control input-has-icon"
                placeholder="Search by resident, flat, complaint ID, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-selects-row">
            <select
              className="form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="form-control"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              className="form-control"
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

            <button
              className={`btn ${overdueOnly ? 'btn-danger' : 'btn-outline'} btn-sm`}
              onClick={() => setOverdueOnly(!overdueOnly)}
            >
              <SVGIcon name="alert-triangle" size={14} className="btn-icon-left" />
              <span>Overdue Only</span>
            </button>

            {isFilterActive && (
              <button
                className="btn btn-ghost btn-sm text-muted"
                onClick={handleClearFilters}
              >
                <SVGIcon name="x" size={14} className="btn-icon-left" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. COMPLAINT TABLE */}
      <div className="content-card">
        <ComplaintTable
          complaints={filteredComplaints}
          loading={loading}
          mode="admin"
          emptyMessage="No complaints match your filters"
          emptyDescription="Try clearing your search query or selecting different category and status filters."
          onSelectComplaint={handleOpenDetail}
          onRetry={loadComplaints}
        />
      </div>

      {/* REUSABLE COMPLAINT DETAIL & ATOMIC TRIAGE MODAL */}
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
