import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface LifecycleProgressProps {
  currentStage: number; // 1 to 8
  status?: string;
  className?: string;
}

const STAGES = [
  'Submitted',
  'AI Analyzed',
  'Evidence Verified',
  'Impact Calculated',
  'Prioritized',
  'Assigned',
  'Work Started',
  'Resolved',
];

export function LifecycleProgress({
  currentStage = 1,
  status,
  className,
}: LifecycleProgressProps) {
  const isRejected = status?.includes('REJECTED');

  return (
    <div className={cn('w-full py-2', className)}>
      <div className="relative flex items-center justify-between">
        {/* Progress connecting line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
        <div
          className={cn(
            'absolute left-0 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500',
            isRejected ? 'bg-danger' : 'bg-primary'
          )}
          style={{ width: `${((Math.max(1, currentStage) - 1) / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStage;
          const isCurrent = stepNum === currentStage;

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                  isDone
                    ? 'bg-success text-white'
                    : isCurrent
                    ? isRejected
                      ? 'bg-danger text-white'
                      : 'bg-primary text-white ring-4 ring-primary-soft'
                    : 'border-2 border-border bg-surface text-slate-400'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  isRejected ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )
                ) : (
                  stepNum
                )}
              </span>
              <span
                className={cn(
                  'mt-1.5 hidden text-center text-[10px] font-semibold sm:block',
                  isCurrent
                    ? 'text-slate-900'
                    : isDone
                    ? 'text-slate-600'
                    : 'text-slate-400'
                )}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
