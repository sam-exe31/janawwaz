import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { getStatusBadge, BADGE_TONE_CLASSES } from '../../lib/statusGroups';
import type { BadgeTone } from '../../lib/statusGroups';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { tone, label } = getStatusBadge(status);
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}
