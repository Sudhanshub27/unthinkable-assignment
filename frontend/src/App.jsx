import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentComplaints from './pages/ResidentComplaints';
import AdminComplaints from './pages/AdminComplaints';
import AdminDashboard from './pages/AdminDashboard';
import NoticeBoard from './pages/NoticeBoard';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <AppShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </ToastProvider>
  );
}

function AppLayout({ sidebarOpen, setSidebarOpen, children }) {
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="app-main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="content-viewport">{children}</main>
      </div>
    </div>
  );
}

function AppShell({ sidebarOpen, setSidebarOpen }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="auth-standalone-wrapper">
            <Login />
          </div>
        }
      />
      <Route
        path="/login"
        element={
          <div className="auth-standalone-wrapper">
            <Login />
          </div>
        }
      />
      <Route
        path="/register"
        element={
          <div className="auth-standalone-wrapper">
            <Register />
          </div>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <ResidentComplaints />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <NoticeBoard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <AdminComplaints />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
