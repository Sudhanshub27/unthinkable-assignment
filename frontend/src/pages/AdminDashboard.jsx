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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle,
  ClipboardList,
  PieChart as PieIcon,
  BarChart3,
  UserCheck,
  TrendingUp,
  Activity,
  ShieldCheck,
  Timer,
  Flame,
  Layers,
} from 'lucide-react';

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

  const [pendingAdminsCount, setPendingAdminsCount] = useState(0);

  async function loadDashboardData(showSpinner = true) {
    if (showSpinner) setLoading(true);
    try {
      const [dashRes, complaintsRes, pendingRes] = await Promise.all([
        client.get('/dashboard'),
        client.get('/complaints'),
        client.get('/admin/pending-admins').catch(() => ({ data: [] })),
      ]);
      setStats(dashRes.data);
      setComplaints(complaintsRes.data || []);
      setPendingAdminsCount((pendingRes.data || []).length);
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

  // Recent Complaints list (last 4)
  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  const statusPieData = [
    { name: 'Open', value: openCount, color: '#C1502E' },
    { name: 'In Progress', value: progressCount, color: '#D99A2B' },
    { name: 'Resolved', value: resolvedCount, color: '#4B6B3E' },
  ];

  // Warm Angan Editorial Theme Palette
  const CATEGORY_COLOR_MAP = {
    Plumbing: '#2F6E6A',   // Warm Earthy Teal
    Electrical: '#8A5F10', // Warm Golden Ochre
    Cleaning: '#7A4A5C',   // Vintage Dusty Plum
    Security: '#A8563F',   // Deep Clay Earth
    Lift: '#37502D',       // Deep Forest Olive
    Parking: '#9B3D22',    // Deep Terracotta
    Other: '#5B5346',      // Warm Taupe Ink
  };

  const categoryBarData = byCategory.map((c, i) => {
    const catColor = CATEGORY_COLOR_MAP[c.category] || ['#2F6E6A', '#8A5F10', '#7A4A5C', '#A8563F', '#37502D', '#9B3D22', '#5B5346'][i % 7];
    return {
      category: c.category,
      name: c.category,
      count: Number(c.count),
      fill: catColor,
      color: catColor,
    };
  });

  // Calculate Daily Trend Data for Line/Area Chart directly from real DB complaints
  const trendMap = {};
  complaints.forEach((c) => {
    if (!c.created_at) return;
    const d = new Date(c.created_at);
    const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { date: dateKey, total: 0, resolved: 0, inProgress: 0, rawDate: d };
    }
    trendMap[dateKey].total += 1;
    if (c.status === 'Resolved') trendMap[dateKey].resolved += 1;
    if (c.status === 'In Progress') trendMap[dateKey].inProgress += 1;
  });

  const trendChartData = Object.values(trendMap).sort((a, b) => a.rawDate - b.rawDate);

  // Priority Stats Breakdown
  const highPriorityCount = complaints.filter((c) => c.priority === 'High').length;
  const medPriorityCount = complaints.filter((c) => c.priority === 'Medium').length;
  const lowPriorityCount = complaints.filter((c) => c.priority === 'Low').length;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;
  const slaHealthRate = total > 0 ? Math.round(((total - overdueCount) / total) * 100) : 100;

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
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Open"
            value={openCount}
            icon="clock"
            variant="danger"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="In Progress"
            value={progressCount}
            icon="rotate-cw"
            variant="warning"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            icon="check-circle"
            variant="success"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            icon="alert-triangle"
            variant="danger"
            alert={overdueCount > 0}
            onClick={() => navigate('/admin')}
          />
        </div>
      )}

      {/* PENDING ADMIN REQUESTS CARD */}
      <div className="bg-paper-card rounded-2xl border border-line p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
            pendingAdminsCount > 0
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
              : 'bg-olive-500/10 border-olive-500/20 text-olive-600'
          }`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink">Pending Admin Requests</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {pendingAdminsCount === 0
                ? 'No pending admin requests.'
                : `${pendingAdminsCount} request${pendingAdminsCount > 1 ? 's' : ''} awaiting approval`}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/pending-admins')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all shrink-0 ${
            pendingAdminsCount > 0
              ? 'bg-terracotta-400 text-white border-terracotta-500 shadow-xs hover:bg-terracotta-500'
              : 'bg-paper text-ink-secondary border-line hover:text-ink hover:border-ink-muted'
          }`}
        >
          Review Requests
        </button>
      </div>

      {/* 3. NEW FEATURE: COMPLAINT TREND LINE CHART + SLA METRICS WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Spans 2 Columns) */}
        <div className="lg:col-span-2 bg-paper-card rounded-xl shadow-card p-5 border border-line space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-terracotta-400" />
                <span>Complaint & Resolution Volume Trend</span>
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Timeline tracking of incoming complaints vs. resolution speed over time
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-paper-hover border border-line text-ink-secondary hidden sm:inline-block">
              Daily Activity
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-ink-muted">
              Loading trend graph...
            </div>
          ) : complaints.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-ink-muted space-y-2">
              <TrendingUp className="w-8 h-8 text-line-dark" />
              <p className="text-xs font-semibold text-ink">No complaint trend activity recorded yet</p>
              <p className="text-[11px] text-ink-muted">When residents log complaints, resolution trend curves will plot here automatically.</p>
            </div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C1502E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C1502E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4B6B3E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#4B6B3E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DCC6" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#635A4D' }} stroke="#D2C4A3" />
                  <YAxis tick={{ fontSize: 11, fill: '#635A4D' }} stroke="#D2C4A3" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7DCC6',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      boxShadow: '0 4px 12px rgba(43,38,32,0.08)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Logged Complaints"
                    stroke="#C1502E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved Complaints"
                    stroke="#4B6B3E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#gradientResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Operational Health & Triage Breakdown Card (1 Column) */}
        <div className="bg-paper-card rounded-xl shadow-card p-5 border border-line flex flex-col justify-between space-y-4">
          <div className="border-b border-line pb-3">
            <h3 className="font-display font-semibold text-base text-ink flex items-center gap-2">
              <Activity className="w-4 h-4 text-olive-500" />
              <span>SLA & Priority Performance</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">Real-time operational health gauges</p>
          </div>

          {/* Resolution Rate Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-olive-500" />
                Resolution Rate
              </span>
              <span className="text-olive-600 font-bold">{resolutionRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-paper-hover rounded-full overflow-hidden border border-line">
              <div
                className="h-full bg-gradient-to-r from-olive-400 to-olive-500 transition-all duration-500"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
          </div>

          {/* SLA Compliance Health */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-terracotta-400" />
                SLA Compliance Health
              </span>
              <span className={slaHealthRate >= 90 ? 'text-olive-600 font-bold' : 'text-clay-500 font-bold'}>
                {slaHealthRate}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-paper-hover rounded-full overflow-hidden border border-line">
              <div
                className={`h-full transition-all duration-500 ${
                  slaHealthRate >= 90
                    ? 'bg-gradient-to-r from-olive-400 to-olive-500'
                    : 'bg-gradient-to-r from-terracotta-400 to-clay-500'
                }`}
                style={{ width: `${slaHealthRate}%` }}
              />
            </div>
          </div>

          {/* Priority Distribution Breakdown */}
          <div className="pt-3 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-terracotta-400" />
                Priority Triage Breakdown
              </span>
              <span className="text-[11px] font-medium text-ink-muted">
                {total} Total Active
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* High Priority */}
              <div className="p-2.5 rounded-xl bg-terracotta-50/60 border border-terracotta-200/60 flex flex-col justify-between space-y-1 hover:border-terracotta-400 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-terracotta-600 uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3 h-3 text-terracotta-500" />
                    High
                  </span>
                  <span className="text-[10px] font-semibold text-terracotta-500">
                    {total > 0 ? Math.round((highPriorityCount / total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-lg font-bold text-terracotta-600 font-display">
                  {highPriorityCount}
                </div>
              </div>

              {/* Medium Priority */}
              <div className="p-2.5 rounded-xl bg-mustard-50/60 border border-mustard-200/60 flex flex-col justify-between space-y-1 hover:border-mustard-400 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-mustard-600 uppercase tracking-wider">
                    Medium
                  </span>
                  <span className="text-[10px] font-semibold text-mustard-600">
                    {total > 0 ? Math.round((medPriorityCount / total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-lg font-bold text-mustard-600 font-display">
                  {medPriorityCount}
                </div>
              </div>

              {/* Low Priority */}
              <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/60 flex flex-col justify-between space-y-1 hover:border-teal-400 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                    Low
                  </span>
                  <span className="text-[10px] font-semibold text-teal-600">
                    {total > 0 ? Math.round((lowPriorityCount / total) * 100) : 0}%
                  </span>
                </div>
                <div className="text-lg font-bold text-teal-600 font-display">
                  {lowPriorityCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TWO CHARTS SIDE BY SIDE (STATUS DONUT + CATEGORY BARS) */}
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

      {/* 5. OVERDUE COMPLAINTS SECTION */}
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
            paginate={false}
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
            onClick={() => navigate('/admin')}
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
            paginate={false}
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
