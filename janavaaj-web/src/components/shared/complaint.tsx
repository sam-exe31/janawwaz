import type { ReactNode } from 'react';
import { Check, AlertOctagon } from 'lucide-react';
import { LIFECYCLE_STEPS, getStatusStepIndex, isRejected, getStatusBadge } from '../../lib/statusGroups';
import type { StatusHistoryItem, RequestPhoto, FeedPhoto } from '../../api/types';
import { getCategoryIcon } from '../../lib/categories';
import { Badge } from '../ui/Badge';
import { timeAgo, formatDate } from '../../lib/format';
import { cn } from '../../lib/cn';

/* ------------------------------ Stepper ----------------------------- */
export function Stepper({ status }: { status: string }) {
  if (isRejected(status)) {
    const { label } = getStatusBadge(status);
    return (
      <div className="flex items-center gap-3 rounded-input border border-danger/20 bg-danger-soft px-4 py-3">
        <AlertOctagon className="h-5 w-5 text-danger" />
        <p className="text-sm font-medium text-danger">
          This report ended off-track — {label}.
        </p>
      </div>
    );
  }
  const current = getStatusStepIndex(status);
  return (
    <ol className="flex flex-wrap gap-y-4">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex min-w-[92px] flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done || active ? 'bg-primary' : 'bg-border')} />
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                  done && 'border-primary bg-primary text-white',
                  active && 'border-primary bg-primary-soft text-primary',
                  !done && !active && 'border-border bg-surface text-slate-400'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn('h-0.5 flex-1', i === LIFECYCLE_STEPS.length - 1 ? 'bg-transparent' : done ? 'bg-primary' : 'bg-border')} />
            </div>
            <span className={cn('mt-1.5 text-[11px] font-medium', active ? 'text-primary' : done ? 'text-slate-600' : 'text-slate-400')}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------ Timeline ---------------------------- */
export function Timeline({ items }: { items: StatusHistoryItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400">No history recorded yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {items.map((it, i) => {
        const { label, tone } = getStatusBadge(it.toStatus);
        return (
          <li key={it.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
              {i < items.length - 1 && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={tone}>{label}</Badge>
                {it.actorName && <span className="text-xs text-slate-500">by {it.actorName}</span>}
                {it.actorRole && <span className="text-[11px] uppercase tracking-wide text-slate-400">{it.actorRole}</span>}
              </div>
              {it.note && <p className="mt-1 text-sm text-slate-600">{it.note}</p>}
              <p className="mt-0.5 text-xs text-slate-400" title={formatDate(it.createdAt)}>
                {timeAgo(it.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------- PhotoGrid ---------------------------- */
export function PhotoGrid({ photos }: { photos: Array<RequestPhoto | FeedPhoto> }) {
  if (!photos.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p, i) => (
        <a
          key={'id' in p ? p.id : `feed-${i}`}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          className="group relative overflow-hidden rounded-input border border-border"
        >
          <img
            src={p.url}
            alt={p.kind}
            className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute left-1.5 top-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
            {p.kind}
          </span>
        </a>
      ))}
    </div>
  );
}

/* ---------------------------- PriorityPill -------------------------- */
export function PriorityPill({ value }: { value: number | null | undefined }) {
  if (value == null) return <Badge tone="neutral">Priority —</Badge>;
  // AI priority is a 0..1 confidence-style score.
  const tone = value >= 0.66 ? 'danger' : value >= 0.33 ? 'warning' : 'info';
  const label = value >= 0.66 ? 'High' : value >= 0.33 ? 'Medium' : 'Low';
  return (
    <Badge tone={tone}>
      {label} priority · {value.toFixed(2)}
    </Badge>
  );
}

/* --------------------------- CategoryLabel -------------------------- */
export function CategoryLabel({ name, slug }: { name: string; slug?: string }) {
  const Icon = getCategoryIcon(slug);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
      <Icon className="h-4 w-4 text-primary" />
      {name}
    </span>
  );
}

/* ------------------------------ DetailRow --------------------------- */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{children}</span>
    </div>
  );
}
