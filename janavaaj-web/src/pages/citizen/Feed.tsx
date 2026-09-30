import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { useFeed, useCategories } from '../../hooks/queries';
import { CategoryLabel } from '../../components/shared/complaint';
import { timeAgo } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function Feed() {
  const { t } = useTranslation();
  const [slug, setSlug] = useState<string>('');
  const { data: categories } = useCategories();
  const { data, isLoading, isError, refetch } = useFeed({
    page: 0,
    size: 60,
    categorySlug: slug || undefined,
  });

  return (
    <div>
      <PageHeader title={t('nav.feed')} subtitle="Recently reported and resolved issues across the city" />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSlug('')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            slug === '' ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-slate-600 hover:bg-bg-alt'
          )}
        >
          {t('common.all')}
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSlug(c.slug)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              slug === c.slug ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-slate-600 hover:bg-bg-alt'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Be the first to report an issue in this category." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => {
            const photo = item.photos.find((p) => p.kind === 'AFTER') ?? item.photos[0];
            return (
              <Card key={item.id} padded={false} hover className="overflow-hidden">
                {photo ? (
                  <img src={photo.url} alt="" className="h-40 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-bg-alt">
                    <CategoryLabel name={item.categoryName} slug={item.categorySlug} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <CategoryLabel name={item.categoryName} slug={item.categorySlug} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {item.aiSummary ?? item.description ?? '—'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                    {item.claimedNgoName && <Badge tone="partner">{item.claimedNgoName}</Badge>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
