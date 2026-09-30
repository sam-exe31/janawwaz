import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700',
        className
      )}
      title="This metric includes simulated baseline demonstration data"
    >
      <Sparkles className="h-2.5 w-2.5" />
      Demo Data
    </span>
  );
}
