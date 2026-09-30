import { cn } from '../../lib/cn';

export interface ImpactScoreDialProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ImpactScoreDial({
  score,
  size = 110,
  strokeWidth = 10,
  label,
  className,
}: ImpactScoreDialProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  let color = '#16A34A'; // success
  let band = 'Low Urgency';
  if (clamped >= 85) {
    color = '#DC2626'; // critical red
    band = 'High Impact / Critical';
  } else if (clamped >= 70) {
    color = '#D97706'; // warning amber
    band = 'Moderate Impact';
  } else if (clamped >= 50) {
    color = '#2563EB'; // info blue
    band = 'Standard Civic Priority';
  }

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E8E6E0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold tracking-tight text-slate-900">{clamped}</span>
          <span className="text-[10px] font-semibold uppercase text-slate-400">/ 100</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-700">{label || band}</p>
    </div>
  );
}
