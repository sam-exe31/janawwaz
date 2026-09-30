import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, ShieldCheck, ArrowLeft, KeyRound, Sparkles, Phone, Building2, ShieldAlert } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/form';
import { useLogin, useRegisterCitizen, useRequestOtp, useVerifyOtp } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/errors';
import { cn } from '../../lib/cn';

interface LocationState {
  from?: string;
}

export default function CitizenLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from;

  // URL search params for tab switching
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Password Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // OTP state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const login = useLogin();
  const register = useRegisterCitizen();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Please enter your username, email or phone, and password.');
      return;
    }

    login.mutate(
      { email: identifier.trim(), password },
      {
        onSuccess: (data) => {
          toast.success(`Welcome back, ${data.user.name ?? 'Citizen'}!`);
          navigate(from ?? '/app/citizen', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regContact.trim() || !regPassword) {
      toast.error('Please fill in your name, contact, and password.');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    const isEmail = regContact.includes('@');
    register.mutate(
      {
        name: regName.trim(),
        email: isEmail ? regContact.trim() : undefined,
        phone: !isEmail ? regContact.trim() : undefined,
        password: regPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(`Account created! Welcome, ${data.user.name}.`);
          navigate('/app/citizen', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone.trim()) return;
    requestOtp.mutate(otpPhone.trim(), {
      onSuccess: () => {
        toast.success('OTP sent. Enter 123456 for the demo whitelist.');
        setOtpSent(true);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    verifyOtp.mutate(
      { phone: otpPhone.trim(), code: otpCode.trim() },
      {
        onSuccess: (data) => {
          toast.success(`Welcome, ${data.user.name ?? 'Citizen'}!`);
          navigate(from ?? '/app/citizen', { replace: true });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const fillDemoCitizen = () => {
    setActiveTab('login');
    setLoginMode('password');
    setIdentifier('citizen@janavaaj.org');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-10">
        {/* Portal Identifier Badge */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            <UserCheck className="h-3.5 w-3.5" /> Citizen Civic Portal
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
                activeTab === 'login' ? 'bg-surface text-primary shadow-xs' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={cn(
                'flex-1 rounded-lg py-2 transition-all',
                activeTab === 'register' ? 'bg-surface text-primary shadow-xs' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              Register New Citizen
            </button>
          </div>

          {activeTab === 'login' ? (
            <div>
              <div className="mb-5 text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {loginMode === 'password' ? 'Citizen Sign In' : 'Sign In via SMS OTP'}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Access your civic reports, track resolution progress, and verify ground impact.
                </p>
              </div>

              {loginMode === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <Input
                    id="identifier"
                    label="Username, Email or Phone"
                    placeholder="e.g. citizen@janavaaj.org or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
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

                  <Button type="submit" fullWidth loading={login.isPending} leftIcon={<KeyRound className="h-4 w-4" />}>
                    Sign In to Citizen Dashboard
                  </Button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setLoginMode('otp')}
                      className="text-slate-500 hover:text-primary transition-colors"
                    >
                      Prefer phone OTP? Sign in via SMS
                    </button>
                    <button
                      type="button"
                      onClick={fillDemoCitizen}
                      className="font-semibold text-primary hover:underline"
                    >
                      ⚡ Quick Demo Fill
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <Input
                        id="otpPhone"
                        label="Mobile Phone Number"
                        type="tel"
                        placeholder="+919876543210"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" fullWidth loading={requestOtp.isPending} leftIcon={<Phone className="h-4 w-4" />}>
                        Send SMS OTP
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <Input
                        id="otpCode"
                        label="6-Digit OTP Code"
                        inputMode="numeric"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        autoFocus
                      />
                      <Button type="submit" fullWidth loading={verifyOtp.isPending} leftIcon={<ShieldCheck className="h-4 w-4" />}>
                        Verify & Sign In
                      </Button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Change phone number
                      </button>
                    </form>
                  )}

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginMode('password')}
                      className="text-xs text-primary hover:underline"
                    >
                      ← Back to Password Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-5 text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Create Citizen Account</h1>
                <p className="mt-1 text-xs text-slate-500">
                  Join thousands of citizens making Pune and Maharashtra infrastructure cleaner and safer.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  id="regName"
                  label="Full Name"
                  placeholder="e.g. Pooja Deshmukh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoFocus
                />
                <Input
                  id="regContact"
                  label="Email or Mobile Number"
                  placeholder="e.g. pooja@example.com or 9876543210"
                  value={regContact}
                  onChange={(e) => setRegContact(e.target.value)}
                />
                <Input
                  id="regPassword"
                  label="Create Password (min 6 characters)"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />

                <Button type="submit" fullWidth loading={register.isPending} leftIcon={<Sparkles className="h-4 w-4" />}>
                  Register & Open Citizen Dashboard
                </Button>
              </form>
            </div>
          )}

          {/* Quick Demo Credentials Footer Note */}
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary-soft/40 p-3 text-xs text-slate-600">
            <span className="font-bold text-primary">Demo Citizen Credentials:</span>
            <div className="mt-1 flex items-center justify-between font-mono text-[11px]">
              <span>citizen@janavaaj.org</span>
              <span>password123</span>
            </div>
          </div>
        </Card>

        {/* Portal Switcher Footer Links */}
        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
          <span>Are you looking for another portal?</span>
          <div className="flex items-center gap-4">
            <Link to="/login/ngo" className="inline-flex items-center gap-1 font-semibold text-partner hover:underline">
              <Building2 className="h-3.5 w-3.5" /> NGO / CSR Portal
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
