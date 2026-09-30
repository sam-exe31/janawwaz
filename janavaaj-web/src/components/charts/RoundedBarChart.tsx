import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export interface BarDataItem {
  label: string;
  value: number;
  color?: string;
  secondaryValue?: number;
}

export interface RoundedBarChartProps {
  data: BarDataItem[];
  dataKey?: string;
  xAxisKey?: string;
  height?: number;
  accentColor?: string;
  horizontal?: boolean;
}

export function RoundedBarChart({
  data,
  dataKey = 'value',
  xAxisKey = 'label',
  height = 240,
  accentColor = '#3346B8',
  horizontal = false,
}: RoundedBarChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" opacity={0.6} />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8E6E0" />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                tick={{ fontSize: 11, fill: '#64748B' }}
                stroke="#E8E6E0"
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 11, fill: '#64748B' }}
                stroke="#E8E6E0"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E8E6E0" />
            </>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as BarDataItem;
                return (
                  <div className="rounded-lg border border-border bg-surface p-2 shadow-lg text-xs">
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="mt-1 font-bold text-primary">
                      {item.value.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey={dataKey}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            fill={accentColor}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || accentColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
