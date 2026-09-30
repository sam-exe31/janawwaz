import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/form';
import { useLogin } from '../../hooks/useAuth';
import { dashboardPathForRole } from '../../lib/roles';
import { toast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/errors';

interface LocationState {
  from?: string;
}

export default function StaffLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const submit = () => {
    if (!email.trim() || !password) return;
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          toast.success(`Welcome, ${data.user.name ?? data.user.email}!`);
          navigate(from ?? dashboardPathForRole(data.user.role), { replace: true });
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      }
    );
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-12">
        <Card>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-partner-soft text-partner">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('auth.staffTitle')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('auth.staffSubtitle')}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            <Input
              id="email"
              label={t('auth.email')}
              type="email"
              placeholder="ngo@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Input
              id="password"
              label={t('auth.password')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth loading={login.isPending}>
              {t('common.signIn')}
            </Button>
          </form>

          <p className="mt-5 rounded-input bg-bg-alt px-3 py-2 text-center text-xs text-slate-500">
            Demo admin: admin@civic.gov.in · Admin@123456
          </p>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.citizenLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
