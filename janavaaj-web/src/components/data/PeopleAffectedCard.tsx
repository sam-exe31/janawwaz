import { Users } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatPeople } from '../../lib/format';
import { EstimateNote } from './EstimateNote';

export interface PeopleAffectedCardProps {
  count: number;
  label?: string;
  issueCount?: number;
  className?: string;
}

export function PeopleAffectedCard({
  count,
  label = 'Estimated Population Impacted',
  issueCount = 24,
  className,
}: PeopleAffectedCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-border bg-gradient-to-br from-surface to-primary-soft/30 p-6 shadow-card',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
          <Users className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {issueCount} Issues Mapped
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">
          {formatPeople(count)}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Your reported issues have surfaced community-level civic needs affecting an estimated{' '}
          <strong className="text-slate-900">{formatPeople(count)}</strong> citizens.
        </p>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3">
        <EstimateNote />
      </div>
    </div>
  );
}
