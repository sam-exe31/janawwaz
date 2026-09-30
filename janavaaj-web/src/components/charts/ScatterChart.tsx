import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatPeople } from '../../lib/format';

export interface ScatterPoint {
  name: string;
  complaints: number;
  peopleAffected: number;
  score: number;
  category: string;
  outlier?: boolean;
}

export interface ScatterChartProps {
  data: ScatterPoint[];
  height?: number;
}

export function ScatterChart({ data, height = 280 }: ScatterChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E6E0" opacity={0.6} />
          <XAxis
            type="number"
            dataKey="complaints"
            name="Complaints Count"
            tick={{ fontSize: 11, fill: '#64748B' }}
            stroke="#E8E6E0"
            label={{ value: 'Number of Complaints', position: 'bottom', offset: 0, fontSize: 11, fill: '#94A3B8' }}
          />
          <YAxis
            type="number"
            dataKey="peopleAffected"
            name="People Affected"
            tick={{ fontSize: 11, fill: '#64748B' }}
            stroke="#E8E6E0"
            tickFormatter={(val) => formatPeople(val)}
            label={{ value: 'Population Impacted', angle: -90, position: 'left', offset: 0, fontSize: 11, fill: '#94A3B8' }}
          />
          <ZAxis type="number" dataKey="score" range={[60, 400]} name="Impact Score" />
          <ReferenceLine x={60} stroke="#CBD5E1" strokeDasharray="3 3" />
          <ReferenceLine y={50000} stroke="#CBD5E1" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ScatterPoint;
                return (
                  <div className="rounded-lg border border-border bg-surface p-3 shadow-xl text-xs max-w-xs">
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-slate-500">{item.category}</p>
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">People Affected:</span>
                        <strong className="text-slate-900">{formatPeople(item.peopleAffected)}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Complaints Filed:</span>
                        <strong className="text-slate-900">{item.complaints}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Impact Score:</span>
                        <strong className="text-primary">{item.score} / 100</strong>
                      </div>
                    </div>
                    {item.outlier && (
                      <p className="mt-2 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        ⚡ High Impact — Low Signal Outlier
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell
                key={`scatter-${index}`}
                fill={entry.outlier ? '#DC2626' : entry.score >= 85 ? '#3346B8' : '#2563EB'}
                stroke={entry.outlier ? '#991B1B' : '#1E293B'}
                strokeWidth={entry.outlier ? 2 : 1}
              />
            ))}
          </Scatter>
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
