import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RequireRole } from './routes/guards';

// Public pages
import Landing from './pages/Landing';
import PortalLogin from './pages/auth/PortalLogin';
import CitizenLogin from './pages/auth/CitizenLogin';
import NgoLogin from './pages/auth/NgoLogin';
import AdminLogin from './pages/auth/AdminLogin';
import Explore from './pages/Explore';
import NotFound from './pages/NotFound';

// Citizen pages
import CitizenDashboard from './pages/citizen/Dashboard';
import Report from './pages/citizen/Report';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Feed from './pages/citizen/Feed';
import Leaderboard from './pages/citizen/Leaderboard';
import Notifications from './pages/citizen/Notifications';
import Profile from './pages/citizen/Profile';

// NGO pages
import NgoDashboard from './pages/ngo/Dashboard';
import Discover from './pages/ngo/Discover';

// Policy pages
import PolicyDashboard from './pages/policy/Dashboard';
import VerificationCenter from './pages/policy/VerificationCenter';

// Shared pages
import ImpactMapPage from './pages/shared/ImpactMap';
import ReportsPage from './pages/shared/Reports';

function AppRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'NGO') return <Navigate to="/app/ngo" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/app/policy" replace />;
  return <Navigate to="/app/citizen" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/explore" element={<Explore />} />

      {/* Role-Specific Login Portals */}
      <Route path="/login" element={<PortalLogin />} />
      <Route path="/login/citizen" element={<CitizenLogin />} />
      <Route path="/login/ngo" element={<NgoLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/login/policy" element={<AdminLogin />} />
      <Route path="/login/staff" element={<AdminLogin />} />
      <Route path="/staff-login" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Navigate to="/login/admin" replace />} />

      {/* Registration paths */}
      <Route path="/register" element={<CitizenLogin />} />
      <Route path="/register/citizen" element={<CitizenLogin />} />
      <Route path="/register/ngo" element={<NgoLogin />} />

      {/* Protected App Routes */}
      <Route element={<RequireAuth />}>
        {/* Automatic role dashboard redirect */}
        <Route path="/app" element={<AppRedirect />} />

        {/* Unified App Shell Layout */}
        <Route path="/app" element={<AppShell />}>
          {/* Strict Citizen Access Only */}
          <Route element={<RequireRole roles={['CITIZEN']} />}>
            <Route path="citizen" element={<CitizenDashboard />} />
            <Route path="citizen/report" element={<Report />} />
            <Route path="citizen/my-reports" element={<MyComplaints />} />
            <Route path="citizen/complaints" element={<MyComplaints />} />
            <Route path="citizen/complaints/:id" element={<ComplaintDetail />} />
            <Route path="citizen/complaint/:id" element={<ComplaintDetail />} />
            <Route path="citizen/feed" element={<Feed />} />
            <Route path="citizen/leaderboard" element={<Leaderboard />} />
            <Route path="citizen/notifications" element={<Notifications />} />
            <Route path="citizen/profile" element={<Profile />} />
          </Route>

          {/* Strict NGO / CSR Access Only */}
          <Route element={<RequireRole roles={['NGO']} />}>
            <Route path="ngo" element={<NgoDashboard />} />
            <Route path="ngo/discover" element={<Discover />} />
            <Route path="ngo/projects" element={<Discover />} />
            <Route path="ngo/funding" element={<NgoDashboard />} />
            <Route path="ngo/reports" element={<ReportsPage />} />
          </Route>

          {/* Strict Policy / Admin Command Center Access Only */}
          <Route element={<RequireRole roles={['ADMIN']} />}>
            <Route path="policy" element={<PolicyDashboard />} />
            <Route path="policy/issues" element={<PolicyDashboard />} />
            <Route path="policy/verification" element={<VerificationCenter />} />
            <Route path="policy/projects" element={<PolicyDashboard />} />
            <Route path="policy/funding" element={<PolicyDashboard />} />
            <Route path="policy/partners" element={<PolicyDashboard />} />
          </Route>

          {/* Shared Authenticated Features */}
          <Route path="map" element={<ImpactMapPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
