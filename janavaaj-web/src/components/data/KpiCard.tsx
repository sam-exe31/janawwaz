import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn';
import { DemoBadge } from './DemoBadge';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'partner' | 'violet';
  isDemo?: boolean;
  sublabel?: string;
  className?: string;
}

const ACCENT_STYLES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  partner: 'bg-partner-soft text-partner',
  violet: 'bg-violet-soft text-violet',
};

export function KpiCard({
  label,
  value,
  icon,
  trend,
  accent = 'primary',
  isDemo = false,
  sublabel,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-card border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:shadow-hover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            ACCENT_STYLES[accent]
          )}
        >
          {icon}
        </span>
        <div className="flex items-center gap-1.5">
          {isDemo && <DemoBadge />}
          <button
            type="button"
            className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600"
            aria-label="Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>

      {(trend || sublabel) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend.value}
              {trend.label && <span className="ml-1 font-normal text-slate-500">{trend.label}</span>}
            </span>
          )}
          {sublabel && <span className="text-slate-500">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
