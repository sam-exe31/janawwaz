import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, KeyRound, UserCheck, Building2, Landmark, CheckCircle2 } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/form';
import { useLogin } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/errors';

interface LocationState {
  from?: string;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your official municipal credentials.');
      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          toast.success(`Welcome to Command Center, ${data.user.name ?? 'Administrator'}!`);
          navigate(from ?? '/app/policy', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const fillDemoAdmin = () => {
    setEmail('admin@civic.gov.in');
    setPassword('Admin@123456');
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-10">
        {/* Portal Identifier Badge */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 shadow-xs">
            <Landmark className="h-3.5 w-3.5" /> Civic Intelligence Command Center
          </span>
        </div>

        <Card className="shadow-card border-amber-200/60">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Policymaker & Officer Sign In</h1>
            <p className="mt-1 text-xs text-slate-500">
              Authorized municipal administrators, verification supervisors, and urban planners.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="adminEmail"
              label="Official Staff Email or Username"
              type="text"
              placeholder="e.g. admin@civic.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <Input
              id="adminPassword"
              label="Security Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              loading={login.isPending}
              className="bg-amber-800 hover:bg-amber-900 text-white"
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              Sign In to Command Center
            </Button>

            <div className="flex items-center justify-end pt-1 text-xs">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="font-semibold text-amber-800 hover:underline"
              >
                ⚡ Quick Demo Fill (Platform Admin)
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Footer Note */}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-slate-700">
            <div className="flex items-center gap-1 font-bold text-amber-900">
              <CheckCircle2 className="h-3.5 w-3.5" /> Demo Admin Credentials:
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span>admin@civic.gov.in</span>
              <span>Admin@123456</span>
            </div>
          </div>
        </Card>

        {/* Portal Switcher Footer Links */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
          <span>Are you looking for another portal?</span>
          <div className="flex items-center gap-4">
            <Link to="/login/citizen" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <UserCheck className="h-3.5 w-3.5" /> Citizen Portal
            </Link>
            <span>•</span>
            <Link to="/login/ngo" className="inline-flex items-center gap-1 font-semibold text-partner hover:underline">
              <Building2 className="h-3.5 w-3.5" /> NGO / CSR Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
