import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PageHeader from '../components/PageHeader';
import SVGIcon from '../components/SVGIcon';
import { formatFlatNumber } from '../utils/formatters';

export default function Profile() {
  const { user } = useAuth();
  const { settings } = useSettings();

  if (!user) return null;

  const flatDisplay = user.role === 'resident'
    ? (user.flat_number ? formatFlatNumber(user.flat_number) : 'Flat not specified')
    : (user.flat_number ? formatFlatNumber(user.flat_number) : 'N/A (Admin)');

  return (
    <div className="page-container profile-page-container">
      <PageHeader
        title="Profile"
        subtitle="Manage your account parameters and view profile information."
      />

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, maxWidth: 800 }}>
        {/* Profile Card Header */}
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#ffffff',
                fontSize: '1.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {user.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: user.role === 'admin' ? '#FEF2F2' : '#EFF6FF',
                    color: user.role === 'admin' ? '#DC2626' : '#2563EB',
                    border: `1px solid ${user.role === 'admin' ? '#FCA5A5' : '#BFDBFE'}`,
                  }}
                >
                  {user.role}
                </span>

                {user.role === 'resident' && (
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {flatDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Account Attributes Card */}
        <div className="content-card">
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
            Account Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="user" size={14} />
                <span>Full Name</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.name}
              </div>
            </div>

            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="file-text" size={14} />
                <span>Email Address</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user.email}
              </div>
            </div>

            {user.role === 'resident' && (
              <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                  <SVGIcon name="clipboard" size={14} />
                  <span>Flat Number</span>
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {flatDisplay}
                </div>
              </div>
            )}

            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="shield" size={14} />
                <span>Role Designation</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Society Helplines & Office Contact Info */}
        <div className="content-card">
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SVGIcon name="shield" size={18} color="#2563EB" />
            <span>Society Office & Emergency Helplines</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="file-text" size={14} color="#2563EB" />
                <span>Society Association</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {settings.society_name || 'Unthinkable Sudhanshu Society'}
              </div>
            </div>

            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="mail" size={14} color="#059669" />
                <span>Management Office Email</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
                <a href={`mailto:${settings.support_email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                  {settings.support_email || 'office@sudhanshubatraunthinkable.com'}
                </a>
              </div>
            </div>

            <div className="profile-item" style={{ background: 'var(--bg-page)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                <SVGIcon name="alert-triangle" size={14} color="#DC2626" />
                <span>24/7 Security Helpline</span>
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#DC2626' }}>
                {settings.emergency_phone || '+91 98765 43210'}
              </div>
            </div>
          </div>
        </div>

        {/* Account Security Card */}
        <div className="content-card">
          <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SVGIcon name="lock" size={16} color="#2563EB" />
            <span>Account Security & Session</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your account is authenticated via encrypted JSON Web Tokens (JWT) with RBAC access control.
          </p>
        </div>
      </div>
    </div>
  );
}
