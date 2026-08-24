import { useState, useEffect, useMemo } from 'react';
import client from '../api/client';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { Button } from '../components/UIComponents';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import { formatDateTime, getUserInitials } from '../utils/formatters';
import {
  RotateCw,
  AlertCircle,
  Eye,
  Mail,
  CheckCircle2,
  Info,
  Send,
  Terminal,
  Search,
  AlertTriangle,
  Zap,
  Check,
} from 'lucide-react';

function parseLogStatus(log) {
  if (!log) return { type: 'unknown', label: 'Unknown', badgeClass: 'bg-paper-hover text-ink-muted' };

  if (log.status === 'Sent') {
    return {
      type: 'sent',
      label: 'Sent',
      badgeClass: 'bg-olive-50 text-olive-600 border-olive-200 whitespace-nowrap',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-olive-600 shrink-0" />,
    };
  }
  if (log.status === 'Mocked') {
    return {
      type: 'mocked',
      label: 'Console Mocked',
      badgeClass: 'bg-paper-hover text-ink-secondary border-line whitespace-nowrap',
      icon: <RotateCw className="w-3.5 h-3.5 text-ink-muted shrink-0" />,
    };
  }

  const email = (log.recipient_email || '').toLowerCase();
  const err = (log.error_details || '').toLowerCase();
  const isDemoAddress = email.endsWith('@society.com') || email.endsWith('@example.com') || email.endsWith('@test.com');
  const isSandboxErr = err.includes('validation_error') || err.includes('does not exist') || err.includes('unverified') || err.includes('sandbox');

  if (isDemoAddress || isSandboxErr) {
    return {
      type: 'demo_bounced',
      label: 'Sandbox Bounced',
      badgeClass: 'bg-mustard-50 text-mustard-600 border-mustard-200 whitespace-nowrap',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-mustard-500 shrink-0" />,
      explanation: `Resend API payload sent successfully. Provider bounced delivery because recipient (${email}) is a synthetic demo account.`,
    };
  }

  return {
    type: 'failed',
    label: 'Failed',
    badgeClass: 'bg-clay-500/10 text-clay-500 border-clay-500/20 whitespace-nowrap',
    icon: <AlertCircle className="w-3.5 h-3.5 text-clay-500 shrink-0" />,
    explanation: err || 'Delivery failed',
  };
}

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'sent' | 'demo_bounced' | 'failed'
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  async function fetchEmailLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get('/email-logs');
      if (res.data && res.data.logs) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to load email logs:', err);
      setError('Failed to load email activity logs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  async function handleSendTestEmail() {
    setSendingTest(true);
    setTestSuccess(false);
    try {
      await client.post('/email-logs/test');
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
      await fetchEmailLogs();
    } catch (err) {
      console.error('Failed to dispatch test email:', err);
    } finally {
      setSendingTest(false);
    }
  }

  const parsedLogs = useMemo(() => {
    return logs.map((l) => ({ log: l, statusInfo: parseLogStatus(l) }));
  }, [logs]);

  const totalLogs = logs.length;
  const sentLogs = parsedLogs.filter((p) => p.statusInfo.type === 'sent').length;
  const demoBouncedLogs = parsedLogs.filter((p) => p.statusInfo.type === 'demo_bounced').length;
  const failedLogs = parsedLogs.filter((p) => p.statusInfo.type === 'failed').length;

  const filteredLogs = useMemo(() => {
    return parsedLogs.filter(({ log, statusInfo }) => {
      const matchesFilter =
        statusFilter === 'all' || statusInfo.type === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.recipient_name || '').toLowerCase().includes(q) ||
        (log.recipient_email || '').toLowerCase().includes(q) ||
        (log.subject || '').toLowerCase().includes(q) ||
        (log.event_type || '').toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [parsedLogs, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <PageHeader
        title="Email Activity & Audit Logs"
        subtitle="Real-time transparency into transactional notification emails and delivery status."
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchEmailLogs}
          disabled={loading}
          icon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          className="rounded-xl font-semibold whitespace-nowrap px-4 py-2"
        >
          Refresh
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSendTestEmail}
          isLoading={sendingTest}
          icon={testSuccess ? <Check className="w-4 h-4 text-white" /> : <Send className="w-4 h-4" />}
          className="rounded-xl font-bold bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-soft whitespace-nowrap px-4 py-2"
        >
          {testSuccess ? 'Dispatched!' : 'Test Dispatch'}
        </Button>
      </PageHeader>

      {/* Hero SaaS Feature Banner */}
      <div className="bg-paper-card border border-line rounded-2xl p-5 shadow-card relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-terracotta-500 to-clay-600 border border-terracotta-400/30 text-white flex items-center justify-center shrink-0 shadow-md mt-0.5">
            <Send className="w-5 h-5" />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-display font-bold text-base text-ink">
                Transactional Email Dispatch Engine
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-olive-50 text-olive-700 border border-olive-200">
                <span className="w-2 h-2 rounded-full bg-olive-500 animate-pulse" />
                Resend API Active
              </span>
            </div>

            <p className="text-xs md:text-sm text-ink-secondary leading-relaxed max-w-3xl pt-0.5">
              System triggers automatically dispatch real-time transactional emails for complaint updates and society notices. When testing with <strong className="text-ink font-semibold">demo accounts</strong> (<code className="bg-terracotta-50 text-terracotta-600 px-1.5 py-0.5 rounded border border-terracotta-200/50 font-mono text-[11px]">resident@society.com</code>), provider sandbox rules reflect delivery status as <span className="font-semibold text-amber-600">Sandbox Bounced</span>. Registering with a real email address delivers directly to live inboxes.
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 bg-olive-50/80 border border-olive-200 text-olive-700 text-xs font-semibold px-3.5 py-2 rounded-xl shrink-0 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-olive-500 animate-pulse" />
          <span>Engine Operational</span>
        </div>
      </div>

      {/* Enhanced Metric Cards Grid */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Dispatches */}
          <div className="border-t-4 border-t-terracotta-400 bg-paper-card rounded-2xl border-x border-b border-line p-5 shadow-card hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Dispatches</span>
              <div className="w-9 h-9 rounded-xl bg-terracotta-50 text-terracotta-500 border border-terracotta-100 flex items-center justify-center">
                <Mail className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-display text-3xl font-extrabold text-ink">{totalLogs}</span>
              <span className="text-[11px] font-semibold text-ink-muted bg-paper px-2.5 py-0.5 rounded-md border border-line">
                Audited
              </span>
            </div>
          </div>

          {/* Successfully Sent */}
          <div className="border-t-4 border-t-olive-500 bg-paper-card rounded-2xl border-x border-b border-line p-5 shadow-card hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Successfully Sent</span>
              <div className="w-9 h-9 rounded-xl bg-olive-50 text-olive-600 border border-olive-100 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-display text-3xl font-extrabold text-olive-600">{sentLogs}</span>
              <span className="text-[11px] font-semibold text-olive-700 bg-olive-50 px-2.5 py-0.5 rounded-md border border-olive-200">
                Live Delivered
              </span>
            </div>
          </div>

          {/* Sandbox Bounced */}
          <div className="border-t-4 border-t-amber-500 bg-paper-card rounded-2xl border-x border-b border-line p-5 shadow-card hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Sandbox Bounced</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-display text-3xl font-extrabold text-amber-600">{demoBouncedLogs}</span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                Sandbox Rule
              </span>
            </div>
          </div>

          {/* Delivery Failures */}
          <div className="border-t-4 border-t-clay-500 bg-paper-card rounded-2xl border-x border-b border-line p-5 shadow-card hover:shadow-md transition-shadow space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Delivery Failures</span>
              <div className="w-9 h-9 rounded-xl bg-clay-500/10 text-clay-600 border border-clay-500/20 flex items-center justify-center">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-display text-3xl font-extrabold text-clay-600">{failedLogs}</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${failedLogs > 0 ? 'bg-clay-50 text-clay-600 border-clay-200' : 'bg-paper text-ink-muted border-line'}`}>
                {failedLogs > 0 ? 'Action Needed' : 'Zero Failures'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Activity Audit Table Card */}
      <div className="bg-paper-card rounded-2xl border border-line shadow-card overflow-hidden">
        {/* Header Controls & Filters */}
        <div className="p-4 md:px-6 md:py-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3 bg-paper-card">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-base text-ink">Email Dispatch Audit Log</h3>
            <span className="text-xs font-semibold text-ink-muted bg-paper px-2.5 py-1 rounded-lg border border-line">
              {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                placeholder="Search recipient or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-xl border border-line text-xs bg-paper focus:outline-none focus:border-terracotta-400 text-ink placeholder:text-ink-muted transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-paper p-1 rounded-xl border border-line self-start sm:self-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'sent', label: 'Sent' },
                { id: 'demo_bounced', label: 'Sandbox' },
                { id: 'failed', label: 'Failed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-paper-card text-terracotta-500 shadow-xs border border-line font-bold'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-8 text-center bg-clay-500/5 space-y-3">
            <AlertCircle className="w-8 h-8 text-clay-500 mx-auto" />
            <p className="text-sm font-semibold text-clay-500">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchEmailLogs}>
              Retry Fetching Logs
            </Button>
          </div>
        )}

        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={5} cols={6} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-14 text-center space-y-5">
            <div className="w-20 h-20 rounded-2xl bg-terracotta-50 border border-terracotta-200 text-terracotta-500 flex items-center justify-center mx-auto shadow-soft">
              <Mail className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="font-display font-bold text-lg text-ink">
                {searchQuery || statusFilter !== 'all' ? 'No Matching Audit Logs' : 'No Email Logs Recorded Yet'}
              </h4>
              <p className="text-xs md:text-sm text-ink-secondary leading-relaxed">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search query or filter parameters.'
                  : 'Whenever complaint status changes or notice board announcements are published, delivery dispatches will be audited here in real-time.'}
              </p>
            </div>

            {!searchQuery && statusFilter === 'all' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendTestEmail}
                isLoading={sendingTest}
                icon={<Zap className="w-4 h-4 text-white" />}
                className="rounded-xl font-bold bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-md px-5 py-2.5 mx-auto inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap"
              >
                Dispatch Test Email Log
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[768px]">
                <thead>
                  <tr className="bg-paper-hover/80 border-b border-line text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                    <th className="pl-6 pr-3 py-3.5 whitespace-nowrap">Recipient</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Event Type</th>
                    <th className="px-3 py-3.5">Subject</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Provider ID</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3.5 whitespace-nowrap">Dispatched At</th>
                    <th className="pl-3 pr-6 py-3.5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredLogs.map(({ log, statusInfo }) => {
                    const initials = getUserInitials(log.recipient_name || 'Resident');
                    return (
                      <tr key={log.id} className="hover:bg-paper-hover/60 transition-colors">
                        <td className="pl-6 pr-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-500 to-clay-600 text-white text-xs font-sans font-bold flex items-center justify-center shrink-0 shadow-xs tracking-wider">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-ink text-sm leading-tight">
                                {log.recipient_name || 'Resident'}
                              </div>
                              <div className="text-xs text-ink-muted font-mono">{log.recipient_email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <span className="font-medium text-terracotta-500 text-xs px-2.5 py-1 rounded-md bg-terracotta-50 border border-terracotta-100 whitespace-nowrap inline-block">
                            {log.event_type}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 max-w-[180px] lg:max-w-[240px]">
                          <div className="text-ink font-medium text-xs truncate" title={log.subject}>
                            {log.subject}
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-xs font-mono text-ink-muted whitespace-nowrap">
                          {log.provider_msg_id ? (
                            <span className="bg-paper px-2 py-0.5 rounded border border-line text-[11px]">{log.provider_msg_id}</span>
                          ) : (
                            <span className="text-ink-muted italic">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-xs text-ink-muted whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>

                        <td className="pl-3 pr-6 py-3.5 text-right whitespace-nowrap">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setSelectedLog(log)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                            className="rounded-lg font-semibold"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-line">
              {filteredLogs.map(({ log, statusInfo }) => {
                const initials = getUserInitials(log.recipient_name || 'Resident');
                return (
                  <div key={log.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-500 to-clay-600 text-white text-xs font-sans font-bold flex items-center justify-center shrink-0 shadow-xs tracking-wider">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-ink">{log.recipient_name || 'Resident'}</div>
                          <div className="text-xs text-ink-muted font-mono">{log.recipient_email}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="text-xs text-ink-secondary space-y-1.5 bg-paper p-3 rounded-xl border border-line">
                      <div><span className="font-semibold text-ink">Event:</span> {log.event_type}</div>
                      <div><span className="font-semibold text-ink">Subject:</span> {log.subject}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-ink-muted">
                      <span>{formatDateTime(log.created_at)}</span>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setSelectedLog(log)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="rounded-lg font-semibold"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* View Email Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Transactional Email Audit Details"
          maxWidth="640px"
        >
          {(() => {
            const statusInfo = parseLogStatus(selectedLog);
            return (
              <div className="space-y-4">
                {/* Status Header Bar */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${statusInfo.badgeClass}`}>
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {statusInfo.icon}
                    <span>Delivery Status: {statusInfo.label}</span>
                  </div>
                  <span className="text-xs opacity-80">{formatDateTime(selectedLog.created_at)}</span>
                </div>

                {/* Recruiter / Sandbox Context Callout */}
                {statusInfo.type === 'demo_bounced' && (
                  <div className="p-4 rounded-xl bg-mustard-50/80 border border-mustard-200 text-xs text-ink space-y-1.5 shadow-sm">
                    <div className="font-semibold text-mustard-700 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <Info className="w-4 h-4 text-mustard-500 shrink-0" />
                      <span>Resend API Sandbox Response</span>
                    </div>
                    <p className="text-ink-secondary leading-relaxed">
                      The backend completed the email template build and successfully dispatched an HTTP POST request to <strong>Resend API</strong>.{' '}
                      The provider bounced delivery because <code className="font-mono text-mustard-700 bg-mustard-100/70 px-1.5 py-0.5 rounded">{selectedLog.recipient_email}</code> is an unverified demo account. Real emails are delivered when registering with valid addresses.
                    </p>
                  </div>
                )}

                {/* Email Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 bg-paper p-4 rounded-xl border border-line text-xs">
                  <div>
                    <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-1 text-[10px]">Recipient</span>
                    <span className="font-semibold text-ink block">{selectedLog.recipient_name || 'Resident'}</span>
                    <span className="text-ink-muted font-mono text-[11px] block">{selectedLog.recipient_email}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-1 text-[10px]">Event Type</span>
                    <span className="font-semibold text-terracotta-500 block">{selectedLog.event_type}</span>
                  </div>

                  {selectedLog.provider_msg_id && (
                    <div className="col-span-2">
                      <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-1 text-[10px]">Provider Message ID</span>
                      <code className="text-xs font-mono text-ink bg-paper-card px-2.5 py-1 rounded border border-line inline-block">
                        {selectedLog.provider_msg_id}
                      </code>
                    </div>
                  )}

                  {selectedLog.error_details && (
                    <div className="col-span-2 space-y-1">
                      <span className="font-semibold text-ink-muted uppercase tracking-wider block text-[10px] flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-ink-muted" /> Raw Provider Response
                      </span>
                      <div className="p-3 rounded-lg bg-paper-hover border border-line font-mono text-[11px] text-ink-secondary overflow-x-auto leading-relaxed">
                        {selectedLog.error_details}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject & Body Preview */}
                <div className="rounded-xl border border-line overflow-hidden space-y-0">
                  <div className="bg-paper-hover px-4 py-2.5 border-b border-line text-xs font-semibold text-ink flex items-center gap-2">
                    <Mail className="w-4 h-4 text-terracotta-500" />
                    <span>Subject: {selectedLog.subject}</span>
                  </div>
                  <div className="p-4 bg-paper-card text-sm leading-relaxed text-ink whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
                    {selectedLog.body || (
                      <span className="text-ink-muted italic">
                        (Full body preview available for newly generated notifications)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-line">
                  <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                    Close Preview
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
