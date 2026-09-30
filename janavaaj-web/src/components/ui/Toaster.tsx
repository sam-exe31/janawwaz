import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../lib/toast';
import type { ToastKind } from '../../lib/toast';
import { cn } from '../../lib/cn';

const CONFIG: Record<ToastKind, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'border-success/30 bg-success-soft text-success' },
  error: { icon: XCircle, classes: 'border-danger/30 bg-danger-soft text-danger' },
  info: { icon: Info, classes: 'border-info/30 bg-info-soft text-info' },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const { icon: Icon, classes } = CONFIG[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-input border bg-surface px-4 py-3 shadow-hover',
              classes
            )}
            role="status"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-slate-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
