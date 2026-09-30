import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { useNotifications } from '../../hooks/queries';
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../../hooks/mutations';
import { timeAgo } from '../../lib/format';
import { cn } from '../../lib/cn';

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const hasUnread = (data ?? []).some((n) => !n.readAt);

  const open = (id: number, requestId: number | null, unread: boolean) => {
    if (unread) markRead.mutate(id);
    if (requestId) navigate(`/app/citizen/complaint/${requestId}`);
  };

  return (
    <div>
      <PageHeader
        title={t('nav.notifications')}
        actions={
          hasUnread ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<CheckCheck className="h-4 w-4" />}
              onClick={() => markAll.mutate()}
              loading={markAll.isPending}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title="No notifications" description="You’re all caught up." />
      ) : (
        <div className="space-y-2">
          {data.map((n) => {
            const unread = !n.readAt;
            return (
              <Card
                key={n.id}
                hover
                onClick={() => open(n.id, n.requestId, unread)}
                className={cn('cursor-pointer', unread && 'border-primary/30 bg-primary-soft/30')}
              >
                <div className="flex items-start gap-3">
                  <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
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
