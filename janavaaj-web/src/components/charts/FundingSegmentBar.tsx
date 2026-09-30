import { formatINR } from '../../lib/format';

export interface FundingSegmentBarProps {
  approvedINR: number;
  releasedINR: number;
  utilizedINR: number;
  pendingINR: number;
  className?: string;
}

export function FundingSegmentBar({
  approvedINR,
  releasedINR,
  utilizedINR,
  pendingINR,
  className,
}: FundingSegmentBarProps) {
  const total = approvedINR || 1;
  const utilizedPct = Math.round((utilizedINR / total) * 100);
  const releasedRemainingPct = Math.max(0, Math.round(((releasedINR - utilizedINR) / total) * 100));
  const pendingPct = Math.max(0, 100 - utilizedPct - releasedRemainingPct);

  return (
    <div className={className}>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          style={{ width: `${utilizedPct}%` }}
          className="bg-success transition-all duration-500"
          title={`Utilized: ${formatINR(utilizedINR)} (${utilizedPct}%)`}
        />
        <div
          style={{ width: `${releasedRemainingPct}%` }}
          className="bg-info transition-all duration-500"
          title={`Released (In Work): ${formatINR(releasedINR - utilizedINR)} (${releasedRemainingPct}%)`}
        />
        <div
          style={{ width: `${pendingPct}%` }}
          className="bg-amber-400 transition-all duration-500"
          title={`Pending Verification: ${formatINR(pendingINR)} (${pendingPct}%)`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
        <div>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Approved Budget
          </span>
          <p className="mt-1 font-bold text-slate-900">{formatINR(approvedINR)}</p>
        </div>
        <div>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-info" />
            Released Tranches
          </span>
          <p className="mt-1 font-bold text-info">{formatINR(releasedINR)}</p>
        </div>
        <div>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            Utilized on Ground
          </span>
          <p className="mt-1 font-bold text-success">{formatINR(utilizedINR)}</p>
        </div>
        <div>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pending Milestone
          </span>
          <p className="mt-1 font-bold text-amber-700">{formatINR(pendingINR)}</p>
        </div>
      </div>
    </div>
  );
}
