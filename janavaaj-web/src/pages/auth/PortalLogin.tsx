import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CitizenLogin from './CitizenLogin';
import NgoLogin from './NgoLogin';
import AdminLogin from './AdminLogin';

export default function PortalLogin() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('portal') || searchParams.get('role');

  const [activePortal, setActivePortal] = useState<'citizen' | 'ngo' | 'admin'>(
    initialRole === 'ngo' ? 'ngo' : initialRole === 'admin' || initialRole === 'policy' ? 'admin' : 'citizen'
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Portal Switcher Bar */}
      <div className="sticky top-16 z-20 border-b border-border bg-surface/90 backdrop-blur px-4 py-2.5">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-xl border border-border bg-bg p-1 text-xs font-bold sm:max-w-lg">
          <button
            type="button"
            onClick={() => setActivePortal('citizen')}
            className={`flex-1 rounded-lg py-2 transition-all ${
              activePortal === 'citizen'
                ? 'bg-surface text-primary shadow-xs border border-primary/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👤 Citizen Portal
          </button>
          <button
            type="button"
            onClick={() => setActivePortal('ngo')}
            className={`flex-1 rounded-lg py-2 transition-all ${
              activePortal === 'ngo'
                ? 'bg-surface text-partner shadow-xs border border-partner/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🏢 NGO / CSR Portal
          </button>
          <button
            type="button"
            onClick={() => setActivePortal('admin')}
            className={`flex-1 rounded-lg py-2 transition-all ${
              activePortal === 'admin'
                ? 'bg-surface text-amber-900 shadow-xs border border-amber-300'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🏛️ Command Center
          </button>
        </div>
      </div>

      {/* Render the Active Portal */}
      {activePortal === 'citizen' && <CitizenLogin />}
      {activePortal === 'ngo' && <NgoLogin />}
      {activePortal === 'admin' && <AdminLogin />}
    </div>
  );
}
