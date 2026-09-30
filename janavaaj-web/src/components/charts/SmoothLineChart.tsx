import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
}

export interface SmoothLineChartProps {
  data: any[];
  xAxisKey?: string;
  series: LineSeries[];
  height?: number;
}

export function SmoothLineChart({
  data,
  xAxisKey = 'period',
  series,
  height = 240,
}: SmoothLineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" opacity={0.6} />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8E6E0" />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8E6E0" />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-surface p-2.5 shadow-lg text-xs">
                    <p className="font-semibold text-slate-800">{label}</p>
                    <div className="mt-1 space-y-1">
                      {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.stroke }}
                            />
                            {entry.name}
                          </span>
                          <span className="font-bold text-slate-900">
                            {Number(entry.value).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#grad-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
