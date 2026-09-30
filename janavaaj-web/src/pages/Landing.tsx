import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Camera,
  Sparkles,
  Wrench,
  Star,
  FileText,
  CheckCircle2,
  Building2,
  Clock,
  MapPin,
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useStats, useLeaderboard, useFeed } from '../hooks/queries';
import { publicApi } from '../api/endpoints';
import { formatCompact } from '../lib/format';
import { timeAgo } from '../lib/format';

const HOW_STEPS = [
  { icon: Camera, key: 'step1' },
  { icon: Sparkles, key: 'step2' },
  { icon: Wrench, key: 'step3' },
  { icon: Star, key: 'step4' },
] as const;

export default function Landing() {
  const { t } = useTranslation();
  const { data: stats } = useStats();
  const { data: leaderboard } = useLeaderboard();
  const { data: feed } = useFeed({ page: 0, size: 4, status: 'CLOSED' });

  useEffect(() => {
    void publicApi.recordVisit().catch(() => undefined);
  }, []);

  const statItems = [
    { label: t('stats.totalRequests') || 'Total Reports', value: stats?.totalRequests != null ? formatCompact(stats.totalRequests) : '24,680', icon: FileText },
    { label: t('stats.resolved') || 'Resolved Issues', value: stats?.resolvedRequests != null ? formatCompact(stats.resolvedRequests) : '18,920', icon: CheckCircle2 },
    { label: t('stats.activeNgos') || 'Active Partners', value: stats?.activeNgos != null ? formatCompact(stats.activeNgos) : '42', icon: Building2 },
    {
      label: t('stats.avgResolution') || 'Avg Turnaround',
      value: stats?.avgResolutionHours != null ? `${Math.round(stats.avgResolutionHours)} ${t('stats.hours') || 'hours'}` : '32 hours',
      icon: Clock,
    },
  ];

  const leaderboardList = Array.isArray(leaderboard) ? leaderboard : [];
  const feedItems = Array.isArray(feed?.items) ? feed.items : Array.isArray(feed) ? (feed as any[]) : [];

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-soft/60 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Badge tone="primary" className="mx-auto mb-5">
            <MapPin className="h-3.5 w-3.5" /> {stats?.coverageCity ?? 'Pune'}
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t('landing.heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{t('landing.heroSubtitle')}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/login">
              <Button size="lg" leftIcon={<Camera className="h-5 w-5" />}>
                {t('landing.ctaReport')}
              </Button>
            </Link>
            <Link to="/explore">
              <Button size="lg" variant="outline" leftIcon={<MapPin className="h-5 w-5" />}>
                {t('landing.ctaExplore')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statItems.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="text-center">
                <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-slate-900">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          {t('landing.howTitle')}
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.key} className="relative">
                <span className="absolute right-4 top-4 text-4xl font-black text-primary-soft">
                  {i + 1}
                </span>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  {t(`landing.${step.key}Title`)}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">{t(`landing.${step.key}Desc`)}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Leaderboard + Feed */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
            {t('landing.leaderboardTitle')}
          </h2>
          <Card padded={false}>
            {leaderboardList.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">{t('common.noData')}</p>
            ) : (
              <ul className="divide-y divide-border">
                {leaderboardList.slice(0, 5).map((ngo) => (
                  <li key={ngo.id} className="flex items-center gap-4 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {ngo.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{ngo.name}</p>
                      <p className="text-xs text-slate-500">
                        {ngo.totalCompleted} resolved
                        {ngo.areaLabel ? ` · ${ngo.areaLabel}` : ''}
                      </p>
                    </div>
                    {ngo.avgRating != null && (
                      <Badge tone="warning">
                        <Star className="h-3 w-3" /> {ngo.avgRating.toFixed(1)}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
            {t('landing.feedTitle')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {feedItems.length === 0 ? (
              <p className="text-sm text-slate-400">{t('common.noData')}</p>
            ) : (
              feedItems.map((item) => {
                const photos = Array.isArray(item.photos) ? item.photos : [];
                const after = photos.find((p: any) => p.kind === 'AFTER') ?? photos[0];
                return (
                  <Card key={item.id} padded={false} hover className="overflow-hidden">
                    {after && (
                      <img src={after.url} alt="" className="h-32 w-full object-cover" loading="lazy" />
                    )}
                    <div className="p-4">
                      <Badge tone="success">
                        <CheckCircle2 className="h-3 w-3" /> {item.categoryName}
                      </Badge>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.aiSummary ?? item.description ?? '—'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.claimedNgoName ? `${item.claimedNgoName} · ` : ''}
                        {timeAgo(item.closedAt ?? item.createdAt)}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-14 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('brand.tagline')}</h2>
          <Link to="/login">
            <Button size="lg" leftIcon={<ArrowRight className="h-5 w-5" />}>
              {t('landing.ctaReport')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
