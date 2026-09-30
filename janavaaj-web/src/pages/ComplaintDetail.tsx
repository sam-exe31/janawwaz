import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, Sparkles, MapPin, IndianRupee } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { requestApi, ngoApi } from '../api/endpoints';
import { useRequestHistory, useRequestRating } from '../hooks/queries';
import { useSubmitRating } from '../hooks/mutations';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/form';
import { Loading, ErrorState } from '../components/ui/feedback';
import { Stepper, Timeline, PhotoGrid, PriorityPill, CategoryLabel, DetailRow } from '../components/shared/complaint';
import { PointsMap } from '../components/map/maps';
import { formatINR, formatDate } from '../lib/format';
import { statusColor } from '../lib/mapColors';
import { getErrorMessage } from '../lib/errors';
import { toast } from '../lib/toast';
import { cn } from '../lib/cn';

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              (hover || value) >= n ? 'fill-warning text-warning' : 'text-slate-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const requestId = id ? Number(id) : null;
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);

  const detailQ = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => (role === 'NGO' ? ngoApi.requestById(requestId as number) : requestApi.getById(requestId as number)),
    enabled: requestId != null,
  });

  const historyQ = useRequestHistory(requestId);
  const ratingQ = useRequestRating(role === 'CITIZEN' ? requestId : null);
  const submitRating = useSubmitRating();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  if (detailQ.isLoading) return <Loading />;
  if (detailQ.isError || !detailQ.data)
    return <ErrorState message={getErrorMessage(detailQ.error)} onRetry={() => void detailQ.refetch()} />;

  const r = detailQ.data;
  const canRate =
    role === 'CITIZEN' &&
    (r.status === 'COMPLETED' || r.status === 'CLOSED') &&
    !ratingQ.data;

  const submit = () => {
    if (!requestId || stars < 1) {
      toast.error('Please select a star rating.');
      return;
    }
    submitRating.mutate(
      { id: requestId, stars, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Thanks for rating the resolution!');
          setStars(0);
          setComment('');
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      }
    );
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Report #{r.id}</h1>
            <StatusBadge status={r.status} />
            <PriorityPill value={r.finalPriority} />
          </div>
          <div className="mt-2">
            <CategoryLabel name={r.categoryName} slug={r.categorySlug} />
          </div>
        </div>
        <span className="text-sm text-slate-400">{formatDate(r.createdAt)}</span>
      </div>

      {/* Lifecycle */}
      <Card>
        <CardTitle title="Progress" />
        <Stepper status={r.status} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {r.aiSummary && (
            <Card>
              <CardTitle title={<span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Summary</span>} />
              <p className="text-sm leading-relaxed text-slate-600">{r.aiSummary}</p>
            </Card>
          )}

          <Card>
            <CardTitle title="Description" />
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {r.description || 'No description provided.'}
            </p>
            {r.voiceUrl && (
              <audio controls src={r.voiceUrl} className="mt-4 w-full">
                Your browser does not support audio playback.
              </audio>
            )}
          </Card>

          {r.photos.length > 0 && (
            <Card>
              <CardTitle title="Photos" />
              <PhotoGrid photos={r.photos} />
            </Card>
          )}

          {/* Rating */}
          {ratingQ.data && (
            <Card>
              <CardTitle title="Your rating" />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn('h-5 w-5', ratingQ.data!.stars >= n ? 'fill-warning text-warning' : 'text-slate-300')}
                  />
                ))}
              </div>
              {ratingQ.data.comment && <p className="mt-2 text-sm text-slate-600">{ratingQ.data.comment}</p>}
            </Card>
          )}

          {canRate && (
            <Card>
              <CardTitle title="Rate the resolution" subtitle="How well was this issue resolved?" />
              <StarInput value={stars} onChange={setStars} />
              <Textarea
                className="mt-4"
                rows={3}
                placeholder="Share any feedback (optional)…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button className="mt-4" onClick={submit} loading={submitRating.isPending} leftIcon={<Star className="h-4 w-4" />}>
                Submit rating
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle title={<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Location</span>} />
            <PointsMap
              points={[{ id: r.id, lat: r.latitude, lng: r.longitude, color: statusColor(r.status) }]}
              center={[r.latitude, r.longitude]}
              zoom={15}
              height={200}
            />
            {r.addressText && <p className="mt-3 text-sm text-slate-600">{r.addressText}</p>}
          </Card>

          <Card>
            <CardTitle title={<span className="inline-flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary" /> Details</span>} />
            <div className="divide-y divide-border">
              <DetailRow label="Input type">{r.inputType}</DetailRow>
              {(r.aiBudgetMin != null || r.aiBudgetMax != null) && (
                <DetailRow label="AI budget est.">
                  {formatINR(r.aiBudgetMin)}–{formatINR(r.aiBudgetMax)}
                </DetailRow>
              )}
              {r.approvedBudget != null && (
                <DetailRow label="Approved budget">{formatINR(r.approvedBudget)}</DetailRow>
              )}
              {role === 'ADMIN' && r.citizenName && (
                <DetailRow label="Reporter">{r.citizenName}</DetailRow>
              )}
              {role === 'ADMIN' && r.citizenPhone && (
                <DetailRow label="Phone">{r.citizenPhone}</DetailRow>
              )}
              {r.closedAt && <DetailRow label="Closed">{formatDate(r.closedAt)}</DetailRow>}
            </div>
          </Card>

          {!historyQ.isError && historyQ.data && historyQ.data.length > 0 && (
            <Card>
              <CardTitle title="Timeline" />
              <Timeline items={historyQ.data} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
