import { useState } from 'react';
import { CheckCircle2, Clock, Users, IndianRupee } from 'lucide-react';
import { cn } from '../../lib/cn';
import { formatPeople, formatINR } from '../../lib/format';

export interface BeforeAfterCardProps {
  title: string;
  category: string;
  location: string;
  beforePhoto: string;
  afterPhoto: string;
  peopleBenefited: number;
  completionTime: string;
  projectCostINR?: number;
  partnerName?: string;
  verified?: boolean;
  className?: string;
}

export function BeforeAfterCard({
  title,
  category,
  location,
  beforePhoto,
  afterPhoto,
  peopleBenefited,
  completionTime,
  projectCostINR,
  partnerName,
  verified = true,
  className,
}: BeforeAfterCardProps) {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-border bg-surface shadow-card transition-shadow hover:shadow-hover',
        className
      )}
    >
      <div className="relative h-56 w-full overflow-hidden bg-slate-950 sm:h-64">
        <img
          src={showAfter ? afterPhoto : beforePhoto}
          alt={showAfter ? 'After repair photo' : 'Before repair photo'}
          className="h-full w-full object-cover transition-opacity duration-300"
        />

        {/* View toggle tabs */}
        <div className="absolute left-3 top-3 flex rounded-lg bg-slate-900/80 p-0.5 backdrop-blur">
          <button
            type="button"
            onClick={() => setShowAfter(false)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
              !showAfter ? 'bg-surface text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            )}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setShowAfter(true)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
              showAfter ? 'bg-surface text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            )}
          >
            After (Resolved)
          </button>
        </div>

        {/* Verification badge */}
        {verified && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Resolution
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {category}
          </span>
          <span className="text-xs text-slate-400">{location}</span>
        </div>
        <h4 className="mt-1 text-base font-bold text-slate-900">{title}</h4>

        {/* Metrics row */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <div>
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
              <Users className="h-3.5 w-3.5 text-slate-400" /> Benefited
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900">{formatPeople(peopleBenefited)}</p>
          </div>
          <div>
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> Turnaround
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900">{completionTime}</p>
          </div>
          <div>
            <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
              <IndianRupee className="h-3.5 w-3.5 text-slate-400" /> Cost
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {projectCostINR ? formatINR(projectCostINR) : 'Municipal'}
            </p>
          </div>
        </div>

        {partnerName && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Resolved by: <span className="font-semibold text-slate-700">{partnerName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
