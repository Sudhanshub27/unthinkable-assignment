import { useState, useEffect } from 'react';
import client from '../api/client';
import PageHeader from '../components/PageHeader';
import SVGIcon from '../components/SVGIcon';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import { formatDateTime } from '../utils/formatters';

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
    <div className="page-container admin-email-logs-container">
      <PageHeader
        title="Email Activity & Audit Logs"
        subtitle="Real-time transparency into transactional notification emails and delivery status"
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchEmailLogs}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <SVGIcon name="rotate-cw" size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Activity</span>
          </button>
        }
      />

      {/* Audit Stats Grid */}
      {loading ? (
        <div style={{ marginBottom: 24 }}>
          <SkeletonCard count={4} />
        </div>
      ) : (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <StatCard label="Total Email Requests" value={totalLogs} icon="mail" color="blue" variant="primary" />
          <StatCard label="Successfully Sent" value={sentLogs} icon="check-circle" color="green" variant="success" />
          <StatCard label="Delivery Failures" value={failedLogs} icon="alert-triangle" color="red" variant="danger" alert={failedLogs > 0} />
          <StatCard label="Console Mock Mode" value={mockedLogs} icon="clock" color="orange" variant="warning" />
        </div>
      )}

      {/* Main Activity Table Card */}
      <div className="content-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Email Dispatch Audit Table</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing last 100 entries</span>
        </div>

        {error && (
          <div style={{ padding: 16, background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonTable rows={5} cols={7} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No Email Logs Recorded Yet"
            description="Whenever complaint status changes or important notices are created, delivery attempts will be audited here."
            icon="mail"
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Recipient</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Event</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Subject</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Provider Msg ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  let statusBadge = null;
                  if (log.status === 'Sent') {
                    statusBadge = (
                      <span className="badge badge-success" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', padding: '4px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✓ Sent
                      </span>
                    );
                  } else if (log.status === 'Failed') {
                    statusBadge = (
                      <span className="badge badge-danger" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', padding: '4px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✕ Failed
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="badge badge-info" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', padding: '4px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ℹ Mocked
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.recipient_name || 'Resident'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.recipient_email}</div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{log.event_type}</span>
                      </td>

                      <td style={{ padding: '12px 16px', maxWidth: 240 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                          {log.subject}
                        </div>
                        {log.error_details && (
                          <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: 2, wordBreak: 'break-all' }}>
                            Error: {log.error_details}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {log.provider_msg_id || '—'}
                      </td>

                      <td style={{ padding: '12px 16px' }}>{statusBadge}</td>

                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.created_at)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedLog(log)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <SVGIcon name="eye" size={14} />
                          <span>View Email</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Email Modal */}
      {selectedLog && (
        <Modal isOpen={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} title="Transactional Email Details">
          <div className="email-preview-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status Header */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background:
                  selectedLog.status === 'Sent'
                    ? 'rgba(5, 150, 105, 0.1)'
                    : selectedLog.status === 'Failed'
                    ? 'rgba(220, 38, 38, 0.1)'
                    : 'rgba(37, 99, 235, 0.1)',
                border: `1px solid ${
                  selectedLog.status === 'Sent'
                    ? 'rgba(5, 150, 105, 0.2)'
                    : selectedLog.status === 'Failed'
                    ? 'rgba(220, 38, 38, 0.2)'
                    : 'rgba(37, 99, 235, 0.2)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SVGIcon
                  name={selectedLog.status === 'Sent' ? 'check-circle' : selectedLog.status === 'Failed' ? 'alert-circle' : 'info'}
                  size={20}
                  color={selectedLog.status === 'Sent' ? '#059669' : selectedLog.status === 'Failed' ? '#DC2626' : '#2563EB'}
                />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: selectedLog.status === 'Sent' ? '#059669' : selectedLog.status === 'Failed' ? '#DC2626' : '#2563EB' }}>
                  Delivery Status: {selectedLog.status === 'Sent' ? '✓ Sent (Accepted by Provider)' : selectedLog.status === 'Failed' ? '✕ Failed (Provider Error)' : 'ℹ Mocked (Console Mode)'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {formatDateTime(selectedLog.created_at)}
              </span>
            </div>

            {/* Email Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8125rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>RECIPIENT</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>{selectedLog.recipient_name || 'Resident'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{selectedLog.recipient_email}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>EVENT TYPE</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>{selectedLog.event_type}</div>
              </div>

              {selectedLog.provider_msg_id && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>PROVIDER MESSAGE ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-main)', marginTop: 2, background: 'var(--bg-card)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', border: '1px solid var(--border-color)' }}>
                    {selectedLog.provider_msg_id}
                  </div>
                </div>
              )}

              {selectedLog.error_details && (
                <div style={{ gridColumn: 'span 2', color: '#DC2626' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>PROVIDER ERROR DETAILS</div>
                  <div style={{ fontSize: '0.8125rem', marginTop: 2, background: 'rgba(220, 38, 38, 0.05)', padding: 8, borderRadius: 4, border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                    {selectedLog.error_details}
                  </div>
                </div>
              )}
            </div>

            {/* Email Subject & Body Preview Window */}
            <div className="email-body-preview-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-page)', padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SVGIcon name="mail" size={16} color="var(--primary)" />
                <span>Subject: {selectedLog.subject}</span>
              </div>
              <div style={{ padding: 16, background: 'var(--bg-card)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>
                {selectedLog.body || (
                  <span style={{ color: 'var(--text-muted)', italic: true }}>
                    (Full body preview available for newly generated notifications)
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
