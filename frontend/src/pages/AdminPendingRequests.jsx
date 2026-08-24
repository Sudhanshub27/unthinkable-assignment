import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/UIComponents';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ArrowRight, User } from 'lucide-react';

export default function AdminPendingRequests() {
  const [allAdmins, setAllAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'
  const [loading, setLoading] = useState(true);

  // Modal / Dialog States
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Success Switcher State after approval
  const [approvedSuccessUser, setApprovedSuccessUser] = useState(null);

  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await client.get('/admin/all-admins');
      setAllAdmins(res.data || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load admin accounts.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Admin Access & Management — Angan';
    fetchAdmins();
  }, []);

  const filteredAdmins = allAdmins.filter((a) => {
    if (activeTab === 'all') return true;
    return (a.admin_status || 'pending') === activeTab;
  });

  const pendingCount = allAdmins.filter((a) => a.admin_status === 'pending').length;
  const approvedCount = allAdmins.filter((a) => a.admin_status === 'approved').length;
  const rejectedCount = allAdmins.filter((a) => a.admin_status === 'rejected').length;

  async function handleConfirmApprove() {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      await client.patch(`/admin/pending-admins/${approveTarget.id}/approve`);
      addToast('Admin access approved successfully.', 'success');
      
      // Update state
      setAllAdmins((prev) =>
        prev.map((item) => (item.id === approveTarget.id ? { ...item, admin_status: 'approved' } : item))
      );
      
      setApprovedSuccessUser(approveTarget);
      setApproveTarget(null);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to approve admin request.', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await client.patch(`/admin/pending-admins/${rejectTarget.id}/reject`);
      addToast('Admin request rejected.', 'info');
      
      // Update state
      setAllAdmins((prev) =>
        prev.map((item) => (item.id === rejectTarget.id ? { ...item, admin_status: 'rejected' } : item))
      );
      setRejectTarget(null);
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.error || 'Failed to reject admin request.', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  function handleSwitchAccount(emailToSwitch) {
    logout();
    navigate(`/login?role=admin&email=${encodeURIComponent(emailToSwitch)}`);
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Admin Access Management"
        subtitle="Review, approve, and manage administrator access requests across your society."
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-paper-hover'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 font-bold">{pendingCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'approved'
              ? 'bg-olive-500/10 text-olive-700 border border-olive-500/30 shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-paper-hover'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-olive-600" />
          <span>Approved Admins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-olive-500/20 text-olive-700 font-bold">{approvedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'rejected'
              ? 'bg-clay-500/10 text-clay-700 border border-clay-500/30 shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-paper-hover'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-clay-600" />
          <span>Rejected Requests</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-clay-500/20 text-clay-700 font-bold">{rejectedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-terracotta-500/10 text-terracotta-700 border border-terracotta-500/30 shadow-xs'
              : 'text-ink-muted hover:text-ink hover:bg-paper-hover'
          }`}
        >
          <User className="w-3.5 h-3.5 text-terracotta-500" />
          <span>All Admins</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-terracotta-500/20 text-terracotta-700 font-bold">{allAdmins.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-paper-card rounded-2xl border border-line p-8 text-center text-ink-muted text-sm animate-pulse">
          Loading admin accounts from database...
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="bg-paper-card rounded-2xl border border-line p-8 sm:p-12 text-center space-y-3 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-olive-500/10 border border-olive-500/20 text-olive-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-lg text-ink">No Accounts Found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
            There are no admin accounts in the database under the "{activeTab}" filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdmins.map((reqItem) => {
            const status = reqItem.admin_status || 'pending';
            return (
              <div
                key={reqItem.id}
                className="bg-paper-card rounded-2xl border border-line p-5 shadow-card space-y-4 hover:border-terracotta-400/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-terracotta-500/10 border border-terracotta-500/20 text-terracotta-500 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-base text-ink truncate">{reqItem.name}</h4>
                      <p className="text-xs font-mono text-ink-muted truncate">{reqItem.email}</p>
                    </div>
                  </div>

                  {status === 'pending' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  )}

                  {status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-olive-500/10 text-olive-600 border border-olive-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approved</span>
                    </span>
                  )}

                  {status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-clay-500/10 text-clay-600 border border-clay-500/20 shrink-0">
                      <XCircle className="w-3 h-3" />
                      <span>Rejected</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-paper p-3 rounded-xl border border-line">
                  <div>
                    <span className="text-ink-muted text-[11px] block">Flat / Unit</span>
                    <span className="font-medium text-ink truncate block">
                      {reqItem.flat_number || 'N/A (Admin)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-[11px] block">Requested On</span>
                    <span className="font-medium text-ink truncate block">
                      {new Date(reqItem.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setApproveTarget(reqItem)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => setRejectTarget(reqItem)}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-2xl border border-line max-w-md w-full p-6 shadow-card space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-olive-500/10 border border-olive-500/20 text-olive-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Approve Admin Access?</h3>
                <p className="text-xs text-ink-muted">Target Account: {approveTarget.email}</p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed bg-paper-card p-3 rounded-xl border border-line">
              This will allow <strong className="text-ink">{approveTarget.name}</strong> to sign in and access the society administration portal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApproveTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={handleConfirmApprove}
              >
                Approve Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-2xl border border-line max-w-md w-full p-6 shadow-card space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-clay-500/10 border border-clay-500/20 text-clay-500 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Reject Admin Request?</h3>
                <p className="text-xs text-ink-muted">Target Account: {rejectTarget.email}</p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed bg-paper-card p-3 rounded-xl border border-line">
              This user will not be able to access the administration portal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading}
                onClick={handleConfirmReject}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS APPROVAL DIALOG (REMAINS ON ADMIN DASHBOARD WITH OPTIONAL SWITCHER) */}
      {approvedSuccessUser && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper rounded-2xl border border-line max-w-md w-full p-6 shadow-card space-y-5 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-olive-500/10 border border-olive-500/20 text-olive-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-ink">Admin Access Approved Successfully</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                The account <strong className="text-ink">{approvedSuccessUser.email}</strong> can now sign in to the administration portal.
              </p>
            </div>

            <div className="p-3 bg-paper-card rounded-xl border border-line text-left text-xs space-y-1">
              <div className="font-semibold text-ink">{approvedSuccessUser.name}</div>
              <div className="font-mono text-ink-muted text-[11px]">{approvedSuccessUser.email}</div>
              <div className="text-[10px] text-olive-600 font-semibold uppercase tracking-wider pt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Approved & Enabled
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                isFullWidth
                size="md"
                onClick={() => setApprovedSuccessUser(null)}
              >
                Continue to Dashboard
              </Button>
              <Button
                variant="outline"
                isFullWidth
                size="md"
                onClick={() => handleSwitchAccount(approvedSuccessUser.email)}
              >
                <ArrowRight className="w-4 h-4 mr-1.5" />
                Switch to Approved Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
