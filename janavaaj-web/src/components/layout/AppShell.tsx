import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  MapPin,
  Sparkles,
  ChevronDown,
  UserCheck,
  Building,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/queries';
import { navForRole } from './navConfig';
import { ROLE_CONFIGS } from '../../lib/roles';
import { Avatar } from '../ui/Avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AiDock } from './AiDock';
import { cn } from '../../lib/cn';

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-black text-white shadow-sm">
        ज
      </span>
      <div className="flex flex-col">
        <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
          Janavaaj
        </span>
        <span className="text-[10px] font-semibold text-slate-400 leading-none">
          Civic Intelligence
        </span>
      </div>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  if (!user) return null;
  const items = navForRole(user.role);
  const roleCfg = ROLE_CONFIGS[user.role];

  return (
    <div className="flex h-full flex-col bg-surface border-r border-border">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-5">
        <BrandMark />
      </div>

      {/* Role Badge */}
      <div className="border-b border-border/60 px-4 py-3 bg-bg/40">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
              user.role === 'CITIZEN'
                ? 'bg-primary-soft text-primary'
                : user.role === 'NGO'
                ? 'bg-partner-soft text-partner'
                : 'bg-amber-100 text-amber-800'
            )}
          >
            {user.role === 'CITIZEN' ? (
              <UserCheck className="h-3 w-3" />
            ) : user.role === 'NGO' ? (
              <Building className="h-3 w-3" />
            ) : (
              <Shield className="h-3 w-3" />
            )}
            {roleCfg.badgeLabel}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Active
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                  isActive
                    ? 'border-l-4 border-primary bg-primary-soft text-primary font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-bg-alt hover:text-slate-900'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
              <span>{t(`nav.${item.labelKey}`)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-border p-3 bg-surface">
        <div className="flex items-center gap-3 rounded-input px-2 py-2">
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{user.name ?? 'User'}</p>
            <p className="truncate text-xs text-slate-500">{user.email ?? user.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout.mutate(undefined, { onSuccess: () => navigate('/') });
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-input px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
}

function Topbar({
  onMenu,
  onToggleAi,
}: {
  onMenu: () => void;
  onToggleAi: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const location = useLocation();
  const { data: unread } = useUnreadCount();
  const count = unread?.count ?? 0;
  const [profileOpen, setProfileOpen] = useState(false);

  // Compute breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const sectionTitle =
    pathParts.length > 1
      ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1)
      : 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-input p-2 text-slate-600 hover:bg-bg-alt lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb / Title */}
      <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
        <span className="font-medium text-slate-400">Janavaaj</span>
        <span>/</span>
        <span className="font-bold text-slate-900">{sectionTitle}</span>
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-md mx-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search Janavaaj (complaints, projects, zones)..."
          className="w-full rounded-full border border-border bg-bg/80 py-1.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Location Picker */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1 text-xs font-semibold text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>Pune, Maharashtra</span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher compact />

        {/* Ask Janavaaj AI sparkle button */}
        <button
          type="button"
          onClick={onToggleAi}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ask Janavaaj AI</span>
        </button>

        {/* Notifications */}
        <Link
          to="/app/citizen/notifications"
          className="relative rounded-full p-2 text-slate-600 hover:bg-bg-alt"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute 1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 rounded-full p-1 hover:bg-bg-alt transition-colors"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-card border border-border bg-surface p-2 shadow-hover">
              <div className="border-b border-border/80 px-3 py-2">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{user?.role} Access</p>
              </div>

              <div className="py-1 text-xs">
                <div className="px-3 py-1.5 text-slate-500">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Portal Access</span>
                  <span className="font-semibold text-slate-700">
                    {user?.role === 'CITIZEN'
                      ? 'Citizen Civic Portal'
                      : user?.role === 'NGO'
                      ? 'NGO / CSR Impact Portal'
                      : 'Command Center'}
                  </span>
                </div>

                <div className="border-t border-border/60 my-1" />

                <Link
                  to="/app/citizen/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded px-3 py-1.5 text-xs text-slate-700 hover:bg-bg"
                >
                  Profile & Settings
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold text-danger hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const location = useLocation();

  // Auto-open AI on the report page as specified in Section 6.3
  const isReportPage = location.pathname.includes('/report');

  return (
    <div className="min-h-screen bg-bg text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-surface shadow-hover">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 rounded-input p-2 text-slate-500 hover:bg-bg-alt"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className={cn('transition-all duration-300 lg:pl-64', aiOpen && 'xl:pr-[380px]')}>
        <Topbar onMenu={() => setDrawerOpen(true)} onToggleAi={() => setAiOpen(!aiOpen)} />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Janavaaj AI Right Dock */}
      <AiDock isOpen={aiOpen || isReportPage} onClose={() => setAiOpen(false)} />

      {/* Floating Ask Janavaaj AI Pill for mobile & tablet */}
      {!aiOpen && (
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-indigo-600 px-4 py-3 font-bold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask Janavaaj AI</span>
        </button>
      )}
    </div>
  );
}
