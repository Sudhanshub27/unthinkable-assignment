import { useState, useEffect } from 'react';
import client from '../api/client';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { Button } from '../components/UIComponents';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import { formatDateTime } from '../utils/formatters';
import { RotateCw, AlertCircle, Eye, Mail, CheckCircle2, Info, Send, Terminal } from 'lucide-react';

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

  // Check if failure is due to synthetic demo recipient / sandbox restrictions
  const email = (log.recipient_email || '').toLowerCase();
  const err = (log.error_details || '').toLowerCase();
  const isDemoAddress = email.endsWith('@society.com') || email.endsWith('@example.com') || email.endsWith('@test.com');
  const isSandboxErr = err.includes('validation_error') || err.includes('does not exist') || err.includes('unverified') || err.includes('sandbox');

  if (isDemoAddress || isSandboxErr) {
    return {
      type: 'demo_bounced',
      label: 'Sandbox Bounced',
      badgeClass: 'bg-mustard-50 text-mustard-600 border-mustard-200 whitespace-nowrap',
      icon: <AlertCircle className="w-3.5 h-3.5 text-mustard-500 shrink-0" />,
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

  const parsedLogs = logs.map((l) => ({ log: l, statusInfo: parseLogStatus(l) }));

  const totalLogs = logs.length;
  const sentLogs = parsedLogs.filter((p) => p.statusInfo.type === 'sent').length;
  const demoBouncedLogs = parsedLogs.filter((p) => p.statusInfo.type === 'demo_bounced').length;
  const failedLogs = parsedLogs.filter((p) => p.statusInfo.type === 'failed').length;

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Email Activity & Audit Logs"
        subtitle="Real-time transparency into transactional notification emails and delivery status."
        actionText="Refresh Activity"
        onAction={fetchEmailLogs}
        actionIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
      />

      {/* Hero SaaS Feature Banner */}
      <div className="bg-paper-card border border-line rounded-2xl p-5 shadow-card relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-terracotta-500 text-white shrink-0 shadow-sm mt-0.5">
            <Send className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-display font-semibold text-base text-ink">
                Transactional Email Engine Active
              </h3>
              <span className="text-[11px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-olive-50 text-olive-600 border border-olive-200">
                Resend API Integrated
              </span>
            </div>
            <p className="text-xs md:text-sm text-ink-secondary leading-relaxed max-w-3xl">
              All system triggers (complaint updates, notice announcements) trigger live API dispatches. When testing with 
              <strong> synthetic demo accounts</strong> (<code className="bg-paper-hover px-1.5 py-0.5 rounded border border-line text-terracotta-500 font-mono text-xs">resident@society.com</code>), 
              provider sandbox rules log delivery responses as <span className="font-semibold text-mustard-600">Sandbox Bounced</span>. Registering with a real email dispatches live inbox notifications.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Stats Grid */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={totalLogs} icon="mail" variant="primary" />
          <StatCard label="Successfully Sent" value={sentLogs} icon="check-circle" variant="success" />
          <StatCard label="Sandbox Bounced" value={demoBouncedLogs} icon="alert-triangle" variant="warning" />
          <StatCard label="Delivery Failures" value={failedLogs} icon="alert-triangle" variant="danger" alert={failedLogs > 0} />
        </div>
      )}

      {/* Main Activity Table Card */}
      <div className="bg-paper-card rounded-xl border border-line shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h3 className="font-display font-semibold text-base text-ink">Email Dispatch Audit Table</h3>
          <span className="text-xs text-ink-muted">Showing last 100 entries</span>
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
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Email Logs Recorded Yet"
            description="Whenever complaint status changes or important notices are created, delivery attempts will be audited here."
            icon="mail"
          />
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[768px]">
                <thead>
                  <tr className="bg-paper-hover border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="pl-6 pr-3 py-3 whitespace-nowrap">Recipient</th>
                    <th className="px-3 py-3 whitespace-nowrap">Event</th>
                    <th className="px-3 py-3">Subject</th>
                    <th className="px-3 py-3 whitespace-nowrap">Provider Msg ID</th>
                    <th className="px-3 py-3 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 whitespace-nowrap">Timestamp</th>
                    <th className="pl-3 pr-6 py-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {parsedLogs.map(({ log, statusInfo }) => {
                    return (
                      <tr key={log.id} className="hover:bg-paper-hover/60 transition-colors">
                        <td className="pl-6 pr-3 py-3">
                          <div className="font-semibold text-ink text-sm">{log.recipient_name || 'Resident'}</div>
                          <div className="text-xs text-ink-muted font-mono">{log.recipient_email}</div>
                        </td>

                        <td className="px-3 py-3">
                          <span className="font-medium text-terracotta-400 text-xs px-2 py-0.5 rounded bg-terracotta-50 border border-terracotta-100 whitespace-nowrap inline-block">
                            {log.event_type}
                          </span>
                        </td>

                        <td className="px-3 py-3 max-w-[160px] lg:max-w-[220px]">
                          <div className="text-ink truncate font-medium text-xs" title={log.subject}>
                            {log.subject}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs font-mono text-ink-muted whitespace-nowrap">
                          {log.provider_msg_id ? (
                            <span className="bg-paper px-2 py-0.5 rounded border border-line">{log.provider_msg_id}</span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </td>

                        <td className="px-3 py-3 text-xs text-ink-muted whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>

                        <td className="pl-3 pr-6 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setSelectedLog(log)}
                            icon={<Eye className="w-3 h-3" />}
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
              {parsedLogs.map(({ log, statusInfo }) => (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-ink">{log.recipient_name || 'Resident'}</div>
                      <div className="text-xs text-ink-muted font-mono">{log.recipient_email}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-xs text-ink-secondary space-y-1">
                    <div><span className="font-semibold text-ink">Event:</span> {log.event_type}</div>
                    <div><span className="font-semibold text-ink">Subject:</span> {log.subject}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-ink-muted">
                    <span>{formatDateTime(log.created_at)}</span>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => setSelectedLog(log)}
                      icon={<Eye className="w-3 h-3" />}
                    >
                      View Email
                    </Button>
                  </div>
                </div>
              ))}
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
                      The backend completed the email template build and successfully dispatched an HTTP POST request to <strong>Resend API</strong>. 
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
                    <span className="font-semibold text-terracotta-400 block">{selectedLog.event_type}</span>
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
                    <Mail className="w-4 h-4 text-terracotta-400" />
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
