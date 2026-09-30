import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { useLeaderboard } from '../../hooks/queries';
import { cn } from '../../lib/cn';

const MEDAL = ['text-warning', 'text-slate-400', 'text-partner'];

export default function Leaderboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useLeaderboard();

  return (
    <div>
      <PageHeader title={t('nav.leaderboard')} subtitle="NGO partners ranked by verified impact" />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="No rankings yet" />
      ) : (
        <div className="space-y-3">
          {data.map((ngo) => (
            <Card key={ngo.id} className={cn(ngo.rank <= 3 && 'ring-1 ring-primary/20')}>
              <div className="flex items-center gap-4">
                <div className="flex w-10 flex-col items-center">
                  <Trophy className={cn('h-6 w-6', ngo.rank <= 3 ? MEDAL[ngo.rank - 1] : 'text-slate-300')} />
                  <span className="text-sm font-bold text-slate-700">#{ngo.rank}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-800">{ngo.name}</p>
                  {ngo.areaLabel && <p className="text-xs text-slate-500">{ngo.areaLabel}</p>}
                </div>
                <div className="hidden items-center gap-6 sm:flex">
                  <Metric icon={<CheckCircle2 className="h-4 w-4 text-success" />} value={ngo.totalCompleted} label="resolved" />
                  {ngo.avgRating != null && (
                    <Metric icon={<Star className="h-4 w-4 text-warning" />} value={ngo.avgRating.toFixed(1)} label="rating" />
                  )}
                  {ngo.avgResolutionHours != null && (
                    <Metric
                      icon={<Clock className="h-4 w-4 text-info" />}
                      value={`${Math.round(ngo.avgResolutionHours)}h`}
                      label="avg time"
                    />
                  )}
                </div>
                <div className="rounded-input bg-primary-soft px-3 py-1.5 text-center">
                  <p className="text-sm font-bold text-primary">{Math.round(ngo.rankScore)}</p>
                  <p className="text-[10px] uppercase tracking-wide text-primary/70">score</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
        {icon}
        {value}
      </div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
