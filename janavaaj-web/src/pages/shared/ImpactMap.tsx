import { useState } from 'react';
import { StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatPeople } from '../../lib/format';
import { useMapIssues } from '../../hooks/queries';
import { toast } from '../../lib/toast';

export default function ImpactMapPage() {
  const { data: issues } = useMapIssues();

  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  const sampleIssues = issues || [
    {
      id: 1,
      title: 'Hadapsar Arterial Road Failure',
      type: 'Roads',
      coordinates: [18.5089, 73.926],
      severity: 'CRITICAL',
      status: 'IN_PROGRESS',
      impactScore: 92,
      peopleAffected: 84000,
      evidenceConfidence: 96,
    },
    {
      id: 2,
      title: 'Kharadi Bypass Potable Water Pipeline Leak',
      type: 'Water',
      coordinates: [18.5514, 73.9348],
      severity: 'HIGH',
      status: 'RESOLVED',
      impactScore: 89,
      peopleAffected: 62000,
      evidenceConfidence: 98,
    },
    {
      id: 3,
      title: 'Baner-Balewadi Culvert Blockage',
      type: 'Drainage',
      coordinates: [18.559, 73.7868],
      severity: 'CRITICAL',
      status: 'OPEN',
      impactScore: 94,
      peopleAffected: 120000,
      evidenceConfidence: 95,
    },
    {
      id: 4,
      title: 'Kothrud Substation High Tension Cable',
      type: 'Electricity',
      coordinates: [18.5074, 73.8077],
      severity: 'MEDIUM',
      status: 'IN_PROGRESS',
      impactScore: 82,
      peopleAffected: 45000,
      evidenceConfidence: 91,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            District Civic Impact Map
          </h1>
          <p className="text-xs text-slate-500">
            Live geographic intelligence overlay for Pune Municipal Corporation & District Zilla Parishad
          </p>
        </div>

        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-border bg-surface p-1 shadow-xs">
          {['ALL', 'Roads', 'Water', 'Drainage', 'Electricity', 'Hotspots'].map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => setSelectedLayer(layer)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                selectedLayer === layer
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative h-[560px] w-full overflow-hidden rounded-card border border-border bg-slate-100 shadow-card">
        {/* Light map background tile simulation */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80')`,
            filter: 'grayscale(35%) contrast(90%) brightness(105%)',
          }}
        />

        {/* Legend */}
        <div className="absolute left-4 top-4 z-20 rounded-xl border border-border/80 bg-surface/95 p-3.5 shadow-lg backdrop-blur text-xs">
          <p className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[10px]">
            Semantic Impact Layers
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-danger animate-pulse" />
              <span>Critical Impact / Hotspot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-warning" />
              <span>Pending / Medium Urgency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-info" />
              <span>In Progress / Field Helper</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <span>Resolved & Verified ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-partner" />
              <span>NGO / CSR Sponsored</span>
            </div>
          </div>
        </div>

        {/* Interactive Hotspot Glow & Circular Markers */}
        {sampleIssues.map((issue, idx) => {
          // Positions calculated for visual distribution on canvas
          const topPositions = ['35%', '25%', '60%', '50%'];
          const leftPositions = ['65%', '75%', '30%', '40%'];

          const isCritical = issue.severity === 'CRITICAL';
          const isResolved = issue.status === 'RESOLVED';

          return (
            <div
              key={issue.id}
              className="absolute z-20 cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
              style={{ top: topPositions[idx % 4], left: leftPositions[idx % 4] }}
              onClick={() => setSelectedMarker(issue)}
            >
              {/* Hotspot Pulse Glow */}
              {isCritical && (
                <span className="absolute -inset-3 rounded-full bg-danger/30 animate-ping pointer-events-none" />
              )}

              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-extrabold text-xs shadow-xl transition-transform duration-200 group-hover:scale-125 ${
                  isResolved
                    ? 'bg-success ring-4 ring-success/20'
                    : isCritical
                    ? 'bg-danger ring-4 ring-danger/30'
                    : 'bg-primary ring-4 ring-primary/20'
                }`}
              >
                {issue.type === 'Water' ? '💧' : issue.type === 'Roads' ? '🚧' : '⚡'}
              </span>

              {/* Marker Label Hover Pill */}
              <div className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-[10px] font-bold text-white shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {issue.title}
              </div>
            </div>
          );
        })}

        {/* Selected Marker Detail Card / Drawer */}
        {selectedMarker && (
          <div className="absolute right-4 bottom-4 top-4 z-30 w-80 rounded-card border border-border bg-surface p-5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                {selectedMarker.type}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMarker(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <h3 className="mt-3 text-sm font-bold text-slate-900 leading-snug">
              {selectedMarker.title}
            </h3>

            <div className="mt-4 space-y-2.5 border-t border-border pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">People Impacted:</span>
                <strong className="text-slate-900">{formatPeople(selectedMarker.peopleAffected)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Impact Score:</span>
                <strong className="text-primary">{selectedMarker.impactScore} / 100</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evidence Confidence:</span>
                <strong className="text-success">{selectedMarker.evidenceConfidence}% Audited</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={selectedMarker.status} />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button
                fullWidth
                size="sm"
                variant="primary"
                onClick={() => {
                  toast.success(`Investigating ${selectedMarker.title}`);
                }}
              >
                Investigate Entity
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
