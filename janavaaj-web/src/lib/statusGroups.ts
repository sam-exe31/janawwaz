/**
 * Request status reconciled to the REAL backend 12-state lifecycle.
 * Source of truth: DB enum + adminRoutes override-status list.
 */
export type ComplaintStatus =
  | 'SUBMITTED'
  | 'SCREENING'
  | 'OPEN'
  | 'NEEDS_ADMIN_REVIEW'
  | 'REJECTED_FAKE'
  | 'CLAIMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REJECTED_BY_NGO'
  | 'ADMIN_IN_PROGRESS';

export const ALL_STATUSES: ComplaintStatus[] = [
  'SUBMITTED',
  'SCREENING',
  'OPEN',
  'NEEDS_ADMIN_REVIEW',
  'REJECTED_FAKE',
  'CLAIMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'ADMIN_IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'REJECTED_BY_NGO',
];

export interface LifecycleStep {
  key: string;
  label: string;
  statuses: ComplaintStatus[];
}

/** Citizen-facing happy-path timeline. Rejections are handled as terminal off-track states. */
export const LIFECYCLE_STEPS: LifecycleStep[] = [
  { key: 'submitted', label: 'Submitted', statuses: ['SUBMITTED'] },
  { key: 'screening', label: 'AI Screening', statuses: ['SCREENING', 'NEEDS_ADMIN_REVIEW'] },
  { key: 'open', label: 'Verified & Open', statuses: ['OPEN'] },
  { key: 'claimed', label: 'Claimed', statuses: ['CLAIMED'] },
  { key: 'assigned', label: 'Assigned', statuses: ['ASSIGNED'] },
  { key: 'in_progress', label: 'In Progress', statuses: ['IN_PROGRESS', 'ADMIN_IN_PROGRESS'] },
  { key: 'completed', label: 'Completed', statuses: ['COMPLETED'] },
  { key: 'closed', label: 'Closed', statuses: ['CLOSED'] },
];

export const TERMINAL_REJECTED: ComplaintStatus[] = ['REJECTED_FAKE', 'REJECTED_BY_NGO'];

export function isRejected(status: string): boolean {
  return TERMINAL_REJECTED.includes(status as ComplaintStatus);
}

export function getStatusStepIndex(status: string): number {
  const norm = String(status || '').toUpperCase() as ComplaintStatus;
  const index = LIFECYCLE_STEPS.findIndex((step) => step.statuses.includes(norm));
  return index !== -1 ? index : 0;
}

export type BadgeTone = 'neutral' | 'info' | 'primary' | 'success' | 'warning' | 'danger' | 'partner' | 'violet';

export interface StatusBadge {
  tone: BadgeTone;
  label: string;
}

/** Human-friendly label + tone for each status. */
export function getStatusBadge(status: string): StatusBadge {
  const norm = String(status || '').toUpperCase() as ComplaintStatus;
  switch (norm) {
    case 'SUBMITTED':
      return { tone: 'neutral', label: 'Submitted' };
    case 'SCREENING':
      return { tone: 'info', label: 'AI Screening' };
    case 'NEEDS_ADMIN_REVIEW':
      return { tone: 'warning', label: 'Under Review' };
    case 'OPEN':
      return { tone: 'primary', label: 'Verified & Open' };
    case 'CLAIMED':
      return { tone: 'info', label: 'Claimed by NGO' };
    case 'ASSIGNED':
      return { tone: 'info', label: 'Helper Assigned' };
    case 'IN_PROGRESS':
      return { tone: 'info', label: 'In Progress' };
    case 'ADMIN_IN_PROGRESS':
      return { tone: 'info', label: 'Admin Handling' };
    case 'COMPLETED':
      return { tone: 'success', label: 'Completed' };
    case 'CLOSED':
      return { tone: 'success', label: 'Resolved & Closed' };
    case 'REJECTED_FAKE':
      return { tone: 'danger', label: 'Rejected (Fake)' };
    case 'REJECTED_BY_NGO':
      return { tone: 'danger', label: 'Returned by NGO' };
    default:
      return { tone: 'neutral', label: status || 'Pending' };
  }
}

/** Tailwind class sets for each badge tone (light SaaS palette). */
export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  info: 'text-info bg-info-soft border-info/20',
  primary: 'text-primary bg-primary-soft border-primary/20',
  success: 'text-success bg-success-soft border-success/20',
  warning: 'text-warning bg-warning-soft border-warning/20',
  danger: 'text-danger bg-danger-soft border-danger/20',
  partner: 'text-partner bg-partner-soft border-partner/20',
  violet: 'text-violet bg-violet-soft border-violet/20',
};
