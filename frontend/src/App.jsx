import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import ResidentComplaints from './pages/ResidentComplaints';
import AdminComplaints from './pages/AdminComplaints';
import AdminDashboard from './pages/AdminDashboard';
import AdminSettings from './pages/AdminSettings';
import AdminEmailLogs from './pages/AdminEmailLogs';
import AdminPendingRequests from './pages/AdminPendingRequests';
import NoticeBoard from './pages/NoticeBoard';
import Profile from './pages/Profile';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AppShell />
      </SettingsProvider>
    </ToastProvider>
  );
}

function AppLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Topbar />
      <main key={location.pathname} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 animate-page-in">
        {children}
      </main>
    </div>
  );
}

function AppShell() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ResidentDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ResidentComplaints />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NoticeBoard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminComplaints />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/complaints" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pending-admins"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminPendingRequests />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/emails"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout>
              <AdminEmailLogs />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
