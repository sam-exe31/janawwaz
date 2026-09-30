import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Accent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'partner';

const ACCENTS: Record<Accent, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  partner: 'bg-partner-soft text-partner',
};

export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'primary',
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: Accent;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 card-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', ACCENTS[accent])}>
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
