import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export interface DonutDataItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDataItem[];
  centerLabel?: string;
  centerValue?: string | number;
  height?: number;
}

const DEFAULT_PALETTE = [
  '#3346B8', // primary indigo
  '#2563EB', // info blue
  '#16A34A', // success green
  '#D97706', // warning amber
  '#9333EA', // partner purple
  '#7C3AED', // violet
  '#DC2626', // danger red
  '#64748B', // slate
];

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 240,
}: DonutChartProps) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
  }));

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="relative w-full max-w-[240px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutDataItem & { fill: string };
                  return (
                    <div className="rounded-lg border border-border bg-surface p-2 shadow-lg text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <p className="mt-1 font-bold text-slate-900">
                        {item.value.toLocaleString('en-IN')}{' '}
                        {item.percentage != null
                          ? `(${item.percentage}%)`
                          : total > 0
                          ? `(${Math.round((item.value / total) * 100)}%)`
                          : ''}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-full sm:flex-1 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="truncate text-slate-600 font-medium">{item.name}</span>
            </div>
            <span className="ml-2 font-bold text-slate-900">
              {item.percentage != null
                ? `${item.percentage}%`
                : total > 0
                ? `${Math.round((item.value / total) * 100)}%`
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
