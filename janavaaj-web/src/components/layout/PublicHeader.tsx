import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { dashboardPathForRole } from '../../lib/roles';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '../ui/Button';

export function PublicHeader() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-black text-white">
            ज
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">Janavaaj</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher compact />
          <Link to="/explore" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              {t('nav.map')}
            </Button>
          </Link>
          {isAuth && user ? (
            <Link to={dashboardPathForRole(user.role)}>
              <Button size="sm">{t('nav.dashboard')}</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login/admin" className="hidden md:block">
                <Button variant="outline" size="sm">
                  🏛️ Admin Login
                </Button>
              </Link>
              <Link to="/login/ngo" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  🏢 NGO Portal
                </Button>
              </Link>
              <Link to="/login/citizen">
                <Button size="sm">👤 Citizen Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
