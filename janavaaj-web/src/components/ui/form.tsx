import { forwardRef } from 'react';
import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react';
import { cn } from '../../lib/cn';

const baseField =
  'w-full rounded-input border border-border bg-surface px-3.5 text-sm text-slate-800 placeholder:text-slate-400 ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:bg-bg-alt';

export function FieldShell({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <input
        id={id}
        ref={ref}
        className={cn(baseField, 'h-11', error && 'border-danger focus:ring-danger/20', className)}
        {...rest}
      />
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <textarea
        id={id}
        ref={ref}
        className={cn(baseField, 'py-2.5', error && 'border-danger focus:ring-danger/20', className)}
        {...rest}
      />
    </FieldShell>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...rest },
  ref
) {
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={id}>
      <select
        id={id}
        ref={ref}
        className={cn(baseField, 'h-11 pr-8', error && 'border-danger focus:ring-danger/20', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});
