import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { PointsMap } from '../../components/map/maps';
import type { MapPoint } from '../../components/map/maps';
import { Loading, ErrorState } from '../../components/ui/feedback';
import { useFeed } from '../../hooks/queries';
import { statusColor } from '../../lib/mapColors';
import { getStatusBadge } from '../../lib/statusGroups';

export default function ImpactMap() {
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
    <div>
      <PageHeader
        title={t('nav.map')}
        subtitle="Where issues are being reported and resolved"
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">Open</Badge>
            <Badge tone="info">In progress</Badge>
            <Badge tone="success">Resolved</Badge>
          </div>
        }
      />
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <PointsMap points={points} height={600} />
      )}
    </div>
  );
}
