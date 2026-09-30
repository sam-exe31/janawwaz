import { CheckCircle2, Clock, Lock, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatINR } from '../../lib/format';
import { Button } from '../ui/Button';

export interface MilestoneItemData {
  id: number | string;
  projectId?: string;
  title: string;
  progress: number;
  amountINR: number;
  status: 'RELEASED' | 'AWAITING_VERIFICATION' | 'NOT_STARTED';
  evidenceUrl?: string;
}

export interface MilestoneTrackerProps {
  milestones: MilestoneItemData[];
  onApprove?: (id: number | string) => void;
  canApprove?: boolean;
  className?: string;
}

export function MilestoneTracker({
  milestones,
  onApprove,
  canApprove = false,
  className,
}: MilestoneTrackerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {milestones.map((m, index) => {
        const isDone = m.status === 'RELEASED';
        const isAwaiting = m.status === 'AWAITING_VERIFICATION';

        return (
          <div
            key={m.id}
            className={cn(
              'flex flex-col gap-3 rounded-card border p-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between',
              isDone
                ? 'border-success/30 bg-success-soft/20'
                : isAwaiting
                ? 'border-warning/40 bg-warning-soft/25'
                : 'border-border bg-surface opacity-80'
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isDone
                    ? 'bg-success text-white'
                    : isAwaiting
                    ? 'bg-warning text-white'
                    : 'border border-border bg-slate-100 text-slate-400'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isAwaiting ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Milestone {index + 1}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      isDone
                        ? 'bg-success-soft text-success'
                        : isAwaiting
                        ? 'bg-warning-soft text-warning'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {isDone
                      ? 'Payment Released ✓'
                      : isAwaiting
                      ? 'Awaiting Verification'
                      : 'Locked'}
                  </span>
                </div>
                <h5 className="mt-0.5 text-sm font-bold text-slate-900">{m.title}</h5>
                {m.evidenceUrl && (
                  <a
                    href={m.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Geotagged Completion Evidence <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border/50 pt-2 sm:border-0 sm:pt-0">
              <div className="text-right">
                <span className="text-xs text-slate-500">Tranche Allocation</span>
                <p className="text-sm font-black text-slate-900">{formatINR(m.amountINR)}</p>
              </div>

              {canApprove && isAwaiting && onApprove && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onApprove(m.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Approve & Release Tranche
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
