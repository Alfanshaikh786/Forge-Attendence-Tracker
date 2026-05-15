import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RoleGuard({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <p className="text-fg-secondary">Loading ForgeTrack...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard'} replace />;
  }

  if (children) {
    return children;
  }

  return <Outlet />;
}
