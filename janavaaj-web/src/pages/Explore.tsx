import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PointsMap } from '../components/map/maps';
import type { MapPoint } from '../components/map/maps';
import { Loading, ErrorState } from '../components/ui/feedback';
import { Badge } from '../components/ui/Badge';
import { useFeed } from '../hooks/queries';
import { statusColor } from '../lib/mapColors';
import { getStatusBadge } from '../lib/statusGroups';

export default function Explore() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useFeed({ page: 0, size: 200 });

  const points = useMemo<MapPoint[]>(() => {
    if (!data) return [];
    return data.items
      .filter((f) => f.latitude != null && f.longitude != null)
      .map((f) => ({
        id: f.id,
        lat: f.latitude,
        lng: f.longitude,
        color: statusColor(f.status),
        label: (
          <div className="space-y-1">
            <p className="font-semibold">{f.categoryName}</p>
            <p className="text-xs">{getStatusBadge(f.status).label}</p>
            {f.addressText && <p className="text-xs text-slate-500">{f.addressText}</p>}
          </div>
        ),
      }));
  }, [data]);

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('nav.map')}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live civic reports across the city, coloured by status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Open</Badge>
            <Badge tone="info">In progress</Badge>
            <Badge tone="success">Resolved</Badge>
            <Badge tone="warning">Under review</Badge>
          </div>
        </div>

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <PointsMap points={points} height={560} />
        )}
      </div>
    </div>
  );
}
