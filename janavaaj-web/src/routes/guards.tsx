import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { dashboardPathForRole } from '../lib/roles';
import type { UserRole } from '../lib/roles';

interface RequireRoleProps {
  roles: UserRole[];
}

export function RequireAuth() {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function RequireRole({ roles }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuth || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!roles.includes(user.role)) {
    // Redirect strictly to the user's assigned dashboard
    const target = dashboardPathForRole(user.role);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
