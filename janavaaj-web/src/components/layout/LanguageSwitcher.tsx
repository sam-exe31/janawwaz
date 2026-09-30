import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '../../i18n';
import type { LanguageCode } from '../../i18n';
import { cn } from '../../lib/cn';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (i18n.language as LanguageCode) || 'en';
  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? 'English';

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-bg-alt"
      >
        <Globe className="h-4 w-4" />
        {!compact && <span>{currentLabel}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-input border border-border bg-surface py-1 shadow-hover">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-bg-alt',
                lang.code === current ? 'font-semibold text-primary' : 'text-slate-600'
              )}
            >
              {lang.label}
              {lang.code === current && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
