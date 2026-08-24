import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import EmptyState from '../components/EmptyState';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import emptyComplaintsIllustration from '../assets/empty-complaints-new.webp';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ClipboardList, PieChart as PieIcon, BarChart3 } from 'lucide-react';

const ANGAN_PALETTE = ['#C1502E', '#4B6B3E', '#D99A2B', '#2F6E6A', '#A8563F', '#7A4A5C'];

export default function AdminDashboard() {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail / Triage Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function loadDashboardData(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const [dashRes, complaintsRes] = await Promise.all([
        client.get('/dashboard'),
        client.get('/complaints'),
      ]);
      setStats(dashRes.data);
      setComplaints(complaintsRes.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load operational analytics.', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Admin Analytics — Angan';
    loadDashboardData(true);
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
      await loadDashboardData(false);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to update complaint.', 'error');
      throw err;
    }
  }

  const { totalComplaints = 0, byCategory = [], byStatus = [], overdueCount = 0 } = stats || {};
  const total = Number(totalComplaints || 0);

  const getStatusCount = (stName) => {
    const found = byStatus.find((s) => s.status === stName);
    return found ? Number(found.count) : 0;
  };

  const openCount = getStatusCount('Open');
  const progressCount = getStatusCount('In Progress');
  const resolvedCount = getStatusCount('Resolved');

  // Overdue Complaints list
  const overdueComplaints = complaints.filter((c) => c.is_overdue);

  // Recent Complaints list (last 5)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const statusPieData = [
    { name: 'Open', value: openCount, color: '#C1502E' },
    { name: 'In Progress', value: progressCount, color: '#D99A2B' },
    { name: 'Resolved', value: resolvedCount, color: '#4B6B3E' },
  ];

  const categoryBarData = byCategory.map((c, i) => ({
    category: c.category,
    count: Number(c.count),
    fill: ANGAN_PALETTE[i % ANGAN_PALETTE.length],
  }));

  return (
    <div className="space-y-6 pb-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor complaints, notices, SLAs and operational analytics across your society."
      />

      {/* 2. PRIMARY KPI ROW */}
      {loading ? (
        <SkeletonCard count={5} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Queue"
            value={total}
            icon="clipboard"
            variant="primary"
            onClick={() => navigate('/admin/complaints')}
          />
          <StatCard
            label="Open"
            value={openCount}
            icon="clock"
            variant="danger"
            onClick={() => navigate('/admin/complaints')}
          />
          <StatCard
            label="In Progress"
            value={progressCount}
            icon="rotate-cw"
            variant="warning"
            onClick={() => navigate('/admin/complaints')}
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            icon="check-circle"
            variant="success"
            onClick={() => navigate('/admin/complaints')}
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            icon="alert-triangle"
            variant="danger"
            alert={overdueCount > 0}
            onClick={() => navigate('/admin/complaints')}
          />
        </div>
      )}

      {/* 3. TWO CHARTS SIDE BY SIDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown Donut */}
        <div className="bg-paper-card rounded-xl shadow-card p-5 border border-line space-y-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-terracotta-400" />
              <span>Status Breakdown</span>
            </h3>
            <span className="text-xs text-ink-muted">{total} total</span>
          </div>

          {loading ? (
            <div className="h-60 flex items-center justify-center text-xs text-ink-muted">
              Loading chart...
            </div>
          ) : (
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Breakdown Horizontal Bars */}
        <div className="bg-paper-card rounded-xl shadow-card p-5 border border-line space-y-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-olive-500" />
              <span>Category Breakdown</span>
            </h3>
            <span className="text-xs text-ink-muted">{byCategory.length} categories</span>
          </div>

          {loading ? (
            <div className="h-60 flex-1 flex items-center justify-center text-xs text-ink-muted">
              Loading chart...
            </div>
          ) : byCategory.length === 0 ? (
            <div className="h-60 flex-1 flex items-center justify-center text-xs text-ink-muted">
              No category data available
            </div>
          ) : (
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} layout="vertical" margin={{ left: 0, right: 15, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 4. OVERDUE COMPLAINTS SECTION */}
      <div className="bg-paper-card rounded-xl shadow-card p-5 border border-clay-500/20 space-y-4 bg-clay-500/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-base text-clay-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Overdue Complaints</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Complaints that have exceeded the configured SLA limits.
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={2} cols={6} />
        ) : overdueComplaints.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title="No overdue complaints"
            description="All complaints are currently within configured SLA limits."
          />
        ) : (
          <ComplaintTable
            complaints={overdueComplaints}
            mode="admin"
            onSelectComplaint={handleOpenDetail}
          />
        )}
      </div>

      {/* RECENT COMPLAINTS QUEUE */}
      <div className="bg-paper-card rounded-xl shadow-card p-5 border border-line space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-terracotta-400" />
            <span>Recent Complaints Queue</span>
          </h3>
          <button
            onClick={() => navigate('/admin/complaints')}
            className="text-xs font-semibold text-terracotta-400 hover:underline"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <SkeletonTable rows={3} cols={6} />
        ) : recentComplaints.length === 0 ? (
          <EmptyState
            icon="clipboard"
            title="No complaints recorded yet"
            description="New resident complaints will appear here automatically."
          />
        ) : (
          <ComplaintTable
            complaints={recentComplaints}
            mode="admin"
            onSelectComplaint={handleOpenDetail}
          />
        )}
      </div>

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
