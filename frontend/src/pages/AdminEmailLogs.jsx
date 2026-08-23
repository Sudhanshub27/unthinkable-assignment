import { useState, useEffect } from 'react';
import client from '../api/client';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { Button } from '../components/UIComponents';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import { formatDateTime } from '../utils/formatters';
import { RotateCw, AlertCircle, Eye, Mail, CheckCircle2 } from 'lucide-react';

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

  const totalLogs = logs.length;
  const sentLogs = logs.filter((l) => l.status === 'Sent').length;
  const failedLogs = logs.filter((l) => l.status === 'Failed').length;
  const mockedLogs = logs.filter((l) => l.status === 'Mocked').length;

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Email Activity & Audit Logs"
        subtitle="Real-time transparency into transactional notification emails and delivery status."
        actionText="Refresh Activity"
        onAction={fetchEmailLogs}
        actionIcon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
      />

      {/* Audit Stats Grid */}
      {loading ? (
        <SkeletonCard count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Email Requests" value={totalLogs} icon="mail" color="blue" variant="primary" />
          <StatCard label="Successfully Sent" value={sentLogs} icon="check-circle" color="green" variant="success" />
          <StatCard label="Delivery Failures" value={failedLogs} icon="alert-triangle" color="red" variant="danger" alert={failedLogs > 0} />
          <StatCard label="Console Mock Mode" value={mockedLogs} icon="clock" color="orange" variant="warning" />
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
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-paper-hover border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="px-6 py-3">Recipient</th>
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Provider Msg ID</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((log) => {
                    let statusPill = null;
                    if (log.status === 'Sent') {
                      statusPill = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-olive-50 text-olive-600 border border-olive-100">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      );
                    } else if (log.status === 'Failed') {
                      statusPill = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-clay-500/10 text-clay-500 border border-clay-500/20">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      );
                    } else {
                      statusPill = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-mustard-50 text-mustard-500 border border-mustard-100">
                          Mocked
                        </span>
                      );
                    }

                    return (
                      <tr key={log.id} className="hover:bg-paper-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-ink">{log.recipient_name || 'Resident'}</div>
                          <div className="text-xs text-ink-muted">{log.recipient_email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-terracotta-400">{log.event_type}</span>
                        </td>

                        <td className="px-6 py-4 max-w-xs truncate">
                          <div className="text-ink truncate">{log.subject}</div>
                          {log.error_details && (
                            <div className="text-xs text-clay-500 truncate mt-0.5">
                              Error: {log.error_details}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs font-mono text-ink-muted">
                          {log.provider_msg_id || '—'}
                        </td>

                        <td className="px-6 py-4">{statusPill}</td>

                        <td className="px-6 py-4 text-xs text-ink-muted whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>

                        <td className="px-6 py-4 text-right">
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
              {logs.map((log) => (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-ink">{log.recipient_name || 'Resident'}</div>
                      <div className="text-xs text-ink-muted">{log.recipient_email}</div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        log.status === 'Sent'
                          ? 'bg-olive-50 text-olive-600'
                          : log.status === 'Failed'
                          ? 'bg-clay-500/10 text-clay-500'
                          : 'bg-mustard-50 text-mustard-500'
                      }`}
                    >
                      {log.status}
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
          title="Transactional Email Details"
          maxWidth="640px"
        >
          <div className="space-y-4">
            {/* Status Header */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedLog.status === 'Sent'
                  ? 'bg-olive-50/80 border-olive-100 text-olive-600'
                  : selectedLog.status === 'Failed'
                  ? 'bg-clay-500/10 border-clay-500/20 text-clay-500'
                  : 'bg-mustard-50/80 border-mustard-100 text-mustard-500'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Mail className="w-4 h-4" />
                <span>
                  Delivery Status: {selectedLog.status === 'Sent' ? '✓ Sent (Accepted by Provider)' : selectedLog.status === 'Failed' ? '✕ Failed' : 'ℹ Console Mocked'}
                </span>
              </div>
              <span className="text-xs text-ink-muted">{formatDateTime(selectedLog.created_at)}</span>
            </div>

            {/* Email Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 bg-paper p-4 rounded-xl border border-line text-xs">
              <div>
                <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-0.5">Recipient</span>
                <span className="font-semibold text-ink block">{selectedLog.recipient_name || 'Resident'}</span>
                <span className="text-ink-muted block">{selectedLog.recipient_email}</span>
              </div>

              <div>
                <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-0.5">Event Type</span>
                <span className="font-semibold text-terracotta-400 block">{selectedLog.event_type}</span>
              </div>

              {selectedLog.provider_msg_id && (
                <div className="col-span-2">
                  <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-0.5">Provider Message ID</span>
                  <code className="text-xs font-mono text-ink bg-paper-card px-2 py-1 rounded border border-line inline-block">
                    {selectedLog.provider_msg_id}
                  </code>
                </div>
              )}

              {selectedLog.error_details && (
                <div className="col-span-2 text-clay-500 space-y-1">
                  <span className="font-semibold uppercase tracking-wider block">Error Details</span>
                  <div className="p-2 rounded bg-clay-500/10 border border-clay-500/20 text-xs">
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
        </Modal>
      )}
    </div>
  );
}
