import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Loading, EmptyState, ErrorState } from '../ui/feedback';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rangeTabs?: Array<{ key: string; label: string }>;
  activeRange?: string;
  onRangeChange?: (key: string) => void;
  action?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  rangeTabs,
  activeRange,
  onRangeChange,
  action,
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-card border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-hover',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {rangeTabs && rangeTabs.length > 0 && (
            <div className="flex rounded-lg border border-border bg-bg p-0.5">
              {rangeTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onRangeChange?.(tab.key)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    activeRange === tab.key
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          {action}
        </div>
      </div>

      <div className="mt-6 flex-1 min-h-[220px]">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loading />
          </div>
        ) : isError ? (
          <div className="flex h-56 items-center justify-center">
            <ErrorState onRetry={onRetry} />
          </div>
        ) : isEmpty ? (
          <div className="flex h-56 items-center justify-center">
            <EmptyState title="No data available" description="There is currently no trend data recorded for this period." />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
