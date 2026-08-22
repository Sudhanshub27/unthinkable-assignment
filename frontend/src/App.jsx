import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentComplaints from './pages/ResidentComplaints';
import AdminComplaints from './pages/AdminComplaints';
import AdminDashboard from './pages/AdminDashboard';
import NoticeBoard from './pages/NoticeBoard';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute><ResidentComplaints /></ProtectedRoute>
        } />
        <Route path="/notices" element={
          <ProtectedRoute><NoticeBoard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminComplaints /></ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </>
  );
}
