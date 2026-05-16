import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleGuard } from './components/RoleGuard';
import { AppShell } from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MarkAttendance from './pages/mentor/MarkAttendance';
import StudentHistory from './pages/mentor/StudentHistory';
import { ManageStudents } from './pages/mentor/ManageStudents';
import BulkAttendanceImport from './pages/mentor/BulkAttendanceImport';
import MaterialsLibrary from './pages/mentor/MaterialsLibrary';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import UpcomingSession from './pages/student/UpcomingSession';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import Messaging from './pages/Messaging';
import Announcements from './pages/Announcements';
import Forbidden from './pages/Forbidden';
import { Toaster } from 'react-hot-toast';
import './App.css';

function RouteFade({ children }) {
  const location = useLocation();
  return <div key={location.pathname} className="animate-fade-in">{children}</div>;
}

function RedirectByRole() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard'} replace />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-void text-fg-secondary font-display">Loading ForgeTrack...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/dashboard" element={<RedirectByRole />} />
      <Route path="/attendance" element={<RedirectByRole />} />
      <Route path="/history" element={<RedirectByRole />} />
      <Route path="/materials" element={<RedirectByRole />} />
      
      <Route element={<RoleGuard><AppShell /></RoleGuard>}>
        <Route path="/settings" element={<RouteFade><Settings /></RouteFade>} />
        <Route path="/change-password" element={<RouteFade><ChangePassword /></RouteFade>} />
        <Route path="/messages" element={<RouteFade><Messaging /></RouteFade>} />
        <Route path="/announcements" element={<RouteFade><Announcements /></RouteFade>} />
        
        {/* Mentor Routes */}
        <Route path="/mentor/dashboard" element={<RoleGuard role="mentor"><RouteFade><MentorDashboard /></RouteFade></RoleGuard>} />
        <Route path="/mentor/attendance" element={<RoleGuard role="mentor"><RouteFade><MarkAttendance /></RouteFade></RoleGuard>} />
        <Route path="/mentor/students" element={<RoleGuard role="mentor"><RouteFade><ManageStudents /></RouteFade></RoleGuard>} />
        <Route path="/mentor/students-history" element={<RoleGuard role="mentor"><RouteFade><StudentHistory /></RouteFade></RoleGuard>} />
        <Route path="/mentor/bulk-import" element={<RoleGuard role="mentor"><RouteFade><BulkAttendanceImport /></RouteFade></RoleGuard>} />
        <Route path="/mentor/materials" element={<RoleGuard role="mentor"><RouteFade><MaterialsLibrary role="mentor" /></RouteFade></RoleGuard>} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<RoleGuard role="student"><RouteFade><StudentDashboard /></RouteFade></RoleGuard>} />
        <Route path="/student/attendance" element={<RoleGuard role="student"><RouteFade><StudentAttendance /></RouteFade></RoleGuard>} />
        <Route path="/student/upcoming" element={<RoleGuard role="student"><RouteFade><UpcomingSession /></RouteFade></RoleGuard>} />
        <Route path="/student/materials" element={<RoleGuard role="student"><RouteFade><MaterialsLibrary role="student" /></RouteFade></RoleGuard>} />
        
        <Route path="/" element={<RedirectByRole />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#1A1A25',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif'
            }
          }} 
        />
      </AuthProvider>
    </Router>
  );
}
