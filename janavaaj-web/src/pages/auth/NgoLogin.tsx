import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Sparkles, KeyRound, UserCheck, ShieldAlert } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/form';
import { useLogin, useRegisterNgo } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface LocationState {
  from?: string;
}

export default function NgoLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from;

  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [ngoName, setNgoName] = useState('');
  const [contactName, setContactName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [description, setDescription] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const login = useLogin();
  const registerNgo = useRegisterNgo();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your official email and password.');
      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (data) => {
          toast.success(`Welcome back, ${data.user.name ?? 'NGO Partner'}!`);
          navigate(from ?? '/app/ngo', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoName.trim() || !officialEmail.trim() || !regNumber.trim() || !regPassword) {
      toast.error('Please fill in organization name, official email, registration number, and password.');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    registerNgo.mutate(
      {
        name: ngoName.trim(),
        email: officialEmail.trim(),
        phone: phone.trim() || undefined,
        registrationNumber: regNumber.trim(),
        description: description.trim() || undefined,
        password: regPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(`Organization registered! Welcome, ${data.user.name}.`);
          navigate('/app/ngo', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const fillDemoNgo = () => {
    setActiveTab('login');
    setEmail('kothrud.ngo@civic.gov.in');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-10">
        {/* Portal Identifier Badge */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-partner/20 bg-partner-soft px-3 py-1 text-xs font-bold text-partner">
            <Building2 className="h-3.5 w-3.5" /> NGO & CSR Impact Portal
          </span>
        </div>

        <Card className="shadow-card">
          {/* Sign In vs Register Tabs */}
          <div className="mb-6 flex rounded-xl border border-border bg-bg p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={cn(
                'flex-1 rounded-lg py-2 transition-all',
                activeTab === 'login' ? 'bg-surface text-partner shadow-xs' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={cn(
                'flex-1 rounded-lg py-2 transition-all',
                activeTab === 'register' ? 'bg-surface text-partner shadow-xs' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Register Organization
            </button>
          </div>

          {activeTab === 'login' ? (
            <div>
              <div className="mb-5 text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">NGO Partner Sign In</h1>
                <p className="mt-1 text-xs text-slate-500">
                  Deploy CSR capital, adopt verified civic projects, and track milestone disbursements.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  id="email"
                  label="Official Organization Email"
                  type="email"
                  placeholder="e.g. kothrud.ngo@civic.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={login.isPending}
                  className="bg-partner hover:bg-purple-700 text-white"
                  leftIcon={<KeyRound className="h-4 w-4" />}
                >
                  Sign In to Impact Dashboard
                </Button>

                <div className="flex items-center justify-end pt-1 text-xs">
                  <button
                    type="button"
                    onClick={fillDemoNgo}
                    className="font-semibold text-partner hover:underline"
                  >
                    ⚡ Quick Demo Fill (Pune Seva Foundation)
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-5 text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Register NGO / CSR Foundation</h1>
                <p className="mt-1 text-xs text-slate-500">
                  Join Pune's verified civic action network for audited infrastructure renovation and social impact.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <Input
                  id="ngoName"
                  label="Organization Name"
                  placeholder="e.g. Pune Seva Foundation"
                  value={ngoName}
                  onChange={(e) => setNgoName(e.target.value)}
                  autoFocus
                />
                <Input
                  id="contactName"
                  label="Contact Person Name"
                  placeholder="e.g. Rajesh Sharma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="officialEmail"
                    label="Official Email"
                    type="email"
                    placeholder="contact@ngo.org"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                  />
                  <Input
                    id="phone"
                    label="Contact Phone"
                    placeholder="+919800000001"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Input
                  id="regNumber"
                  label="Registration / 12A / 80G No."
                  placeholder="e.g. MH/PUNE/2021/0014"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                />
                <Textarea
                  id="description"
                  label="Focus Area / Description"
                  rows={2}
                  placeholder="e.g. Waste management, road safety, and civic repairs in western Pune"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                  id="regPassword"
                  label="Create Password (min 6 chars)"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  loading={registerNgo.isPending}
                  className="bg-partner hover:bg-purple-700 text-white"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Register Organization & Open Dashboard
                </Button>
              </form>
            </div>
          )}

          {/* Quick Demo Credentials Footer Note */}
          <div className="mt-5 rounded-xl border border-partner/20 bg-partner-soft/40 p-3 text-xs text-slate-600">
            <span className="font-bold text-partner">Demo NGO Credentials:</span>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span>kothrud.ngo@civic.gov.in</span>
              <span>password123</span>
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
            <Link to="/login/admin" className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:underline">
              <ShieldAlert className="h-3.5 w-3.5" /> Policymaker Command Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
