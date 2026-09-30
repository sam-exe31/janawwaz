import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { useMyRequests } from '../../hooks/queries';
import { CategoryLabel } from '../../components/shared/complaint';
import { isRejected } from '../../lib/statusGroups';
import { timeAgo } from '../../lib/format';
import { cn } from '../../lib/cn';

type Filter = 'all' | 'active' | 'resolved' | 'rejected';

export default function MyComplaints() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, isError, refetch } = useMyRequests(0, 100);

  const items = (data?.items ?? []).filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'resolved') return r.status === 'CLOSED' || r.status === 'COMPLETED';
    if (filter === 'rejected') return isRejected(r.status);
    return !['CLOSED', 'COMPLETED'].includes(r.status) && !isRejected(r.status);
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'active', label: t('stats.inProgress') },
    { key: 'resolved', label: t('stats.resolved') },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.myReports')}
        actions={
          <Link to="/app/citizen/report">
            <Button leftIcon={<PlusCircle className="h-4 w-4" />}>{t('nav.report')}</Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              filter === f.key
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-slate-600 hover:bg-bg-alt'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No reports here" description="Try a different filter or report a new issue." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((r) => (
            <Link key={r.id} to={`/app/citizen/complaint/${r.id}`}>
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <CategoryLabel name={r.categoryName} />
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {r.description || r.addressText || '—'}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  #{r.id} · {timeAgo(r.createdAt)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
