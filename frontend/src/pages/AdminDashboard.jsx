import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ComplaintTable from '../components/ComplaintTable';
import ComplaintDetailModal from '../components/ComplaintDetailModal';
import EmptyState from '../components/EmptyState';
import SVGIcon from '../components/SVGIcon';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import emptyComplaintsIllustration from '../assets/empty-complaints.png';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

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

  return (
    <div className="page-container admin-dashboard-container">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Society Overview"
        subtitle="Monitor complaints, notices and activity across your society."
      />

      {/* 2. PRIMARY KPI ROW */}
      {loading ? (
        <div style={{ marginBottom: 24 }}>
          <SkeletonCard count={5} />
        </div>
      ) : (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <StatCard
            label="Total Queue"
            value={total}
            icon="clipboard"
            color="cyan"
            variant="primary"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Open"
            value={openCount}
            icon="clock"
            color="blue"
            variant="danger"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="In Progress"
            value={progressCount}
            icon="rotate-cw"
            color="purple"
            variant="warning"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Resolved"
            value={resolvedCount}
            icon="check-circle"
            color="green"
            variant="success"
            onClick={() => navigate('/admin')}
          />
          <StatCard
            label="Overdue"
            value={overdueCount}
            icon="alert-triangle"
            color="red"
            variant="danger"
            alert={overdueCount > 0}
            onClick={() => navigate('/admin')}
          />
        </div>
      )}

      {/* 2.5. DASHBOARD STATUS CHART */}
      <div className="content-card dashboard-chart-card" style={{ marginBottom: 24 }}>
        <div className="card-header-row" style={{ marginBottom: 16 }}>
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SVGIcon name="layout-dashboard" size={18} color="var(--primary)" />
            <span>Complaint Status Breakdown</span>
          </h3>
        </div>

        {loading ? (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-muted">Loading chart data...</span>
          </div>
        ) : (
          <div className="chart-container" style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Open', value: openCount, color: '#2563EB' },
                    { name: 'In Progress', value: progressCount, color: '#7C3AED' },
                    { name: 'Resolved', value: resolvedCount, color: '#16A34A' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {[
                    { name: 'Open', value: openCount, color: '#2563EB' },
                    { name: 'In Progress', value: progressCount, color: '#7C3AED' },
                    { name: 'Resolved', value: resolvedCount, color: '#16A34A' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '0.875rem',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. OVERDUE / ACTION REQUIRED SECTION */}
      <div className="content-card overdue-section-card" style={{ marginBottom: 24 }}>
        <div className="card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 className="card-title text-danger" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SVGIcon name="alert-triangle" size={18} color="#DC2626" />
              <span>Overdue Complaints</span>
            </h3>
            <p className="card-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Complaints that have exceeded the configured SLA.
            </p>
          </div>
          {overdueComplaints.length > 0 && (
            <button className="btn btn-outline btn-xs" onClick={() => navigate('/admin')}>
              <span>Manage Complaints →</span>
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonTable rows={2} cols={8} />
        ) : overdueComplaints.length === 0 ? (
          <EmptyState
            illustration={emptyComplaintsIllustration}
            icon="check-circle"
            title="No overdue complaints"
            description="All complaints are currently within the configured SLA."
            actionText="Manage Complaints →"
            onAction={() => navigate('/admin')}
          />
        ) : (
          <ComplaintTable
            complaints={overdueComplaints}
            mode="admin"
            onSelectComplaint={handleOpenDetail}
          />
        )}
      </div>

      {/* TWO-COLUMN LAYOUT: Recent Activity & Visual Analytics */}
      <div className="dashboard-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
        {/* RECENT COMPLAINTS */}
        <div className="content-card">
          <div className="card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SVGIcon name="clipboard" size={18} color="#2563EB" />
              <span>Recent Complaints</span>
            </h3>
            <button className="btn btn-outline btn-xs" onClick={() => navigate('/admin')}>
              <span>View Queue →</span>
            </button>
          </div>

          {loading ? (
            <SkeletonTable rows={3} cols={8} />
          ) : recentComplaints.length === 0 ? (
            <EmptyState
              illustration={emptyComplaintsIllustration}
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

        {/* STATUS & CATEGORY BREAKDOWN ANALYTICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Status Breakdown */}
          <div className="content-card">
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
              Status Breakdown
            </h3>

            {loading ? (
              <SkeletonCard count={1} />
            ) : (
              <div className="status-bars-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Open', count: openCount, color: '#DC2626' },
                  { label: 'In Progress', count: progressCount, color: '#D97706' },
                  { label: 'Resolved', count: resolvedCount, color: '#16A34A' },
                ].map((st) => {
                  const pct = total > 0 ? Math.round((st.count / total) * 100) : 0;
                  return (
                    <div key={st.label} className="status-bar-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-main)' }}>{st.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{st.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-page)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: st.color, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="content-card">
            <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
              Category Breakdown
            </h3>

            {loading ? (
              <SkeletonCard count={1} />
            ) : byCategory.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>No category breakdown data available.</p>
            ) : (
              <div className="category-bars-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {byCategory.map((cat) => {
                  const count = Number(cat.count);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={cat.category} className="cat-bar-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-main)' }}>{cat.category}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-page)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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
