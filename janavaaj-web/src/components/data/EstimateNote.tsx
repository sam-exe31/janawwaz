import { Info } from 'lucide-react';
import { cn } from '../../lib/cn';

export function EstimateNote({
  className,
  customText,
}: {
  className?: string;
  customText?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs text-slate-500', className)}
      title="Analytical model estimate"
    >
      <Info className="h-3.5 w-3.5 text-slate-400" />
      <span>
        {customText ||
          'Estimated affected population associated with reported issues, not necessarily unique individuals.'}
      </span>
    </span>
  );
}
