import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { useVerificationQueue } from '../../hooks/queries';
import { dashboardApi } from '../../api/endpoints';
import { toast } from '../../lib/toast';

export default function VerificationCenter() {
  const { data: queue, isLoading, isError, refetch } = useVerificationQueue();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleDecision = async (id: number, decision: 'APPROVE' | 'REJECT', reason?: string) => {
    setProcessing(true);
    try {
      await dashboardApi.verificationDecision(id, decision, reason || 'Supervisory audit complete');
      toast.success(`Complaint ${id} decision '${decision}' successfully recorded.`);
      setSelectedItem(null);
      void refetch();
    } catch {
      toast.error('Action failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Civic Verification Center"
        subtitle="Multi-factor evidentiary verification: GPS geofencing, photographic genuineness, and duplicate detection"
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (queue || []).length === 0 ? (
        <EmptyState
          title="Verification Queue Clear"
          description="All incoming civic complaints have been audited."
        />
      ) : (
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-bg/60 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Complaint</th>
                  <th className="py-2.5 px-3 font-semibold">Location</th>
                  <th className="py-2.5 px-3 font-semibold">GPS Geofence</th>
                  <th className="py-2.5 px-3 font-semibold">Image AI Audit</th>
                  <th className="py-2.5 px-3 font-semibold">GIS Boundary</th>
                  <th className="py-2.5 px-3 font-semibold">Duplicate Check</th>
                  <th className="py-2.5 px-3 font-semibold">Confidence</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(queue || []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-bg/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-primary">{item.complaintId}</span>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.location}</td>
                    <td className="py-3 px-3 font-bold text-success">
                      {item.gpsVerified ? '✓ Validated' : '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-success">
                      {item.imageVerified ? '✓ High Genuineness' : '—'}
                    </td>
                    <td className="py-3 px-3 font-bold text-success">
                      {item.gisVerified ? '✓ PMC Ward' : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.duplicateCandidate ? (
                        <span className="font-bold text-warning">Nearby Match</span>
                      ) : (
                        <span className="text-success font-semibold">✓ Unique</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 font-bold text-primary">
                        {item.evidenceConfidence}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                          onClick={() => handleDecision(item.id, 'APPROVE')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2.5 py-1 text-slate-600"
                          onClick={() => setSelectedItem(item)}
                        >
                          Inspect Evidence
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evidence Inspection Modal */}
      {selectedItem && (
        <Modal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Evidence Audit: ${selectedItem.complaintId}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
              <img
                src={selectedItem.photoUrl}
                alt="Inspection Evidence"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="rounded-xl border border-border bg-bg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <strong>{selectedItem.location}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evidence Confidence:</span>
                <strong className="text-success">{selectedItem.evidenceConfidence}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted Timestamp:</span>
                <span>{selectedItem.submittedAt}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Audit Notes / Rejection Reason (if applicable):
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide feedback if rejecting or requesting additional evidence..."
                className="w-full rounded-input border border-border p-2 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                fullWidth
                variant="outline"
                className="text-danger hover:bg-red-50"
                disabled={processing}
                onClick={() => handleDecision(selectedItem.id, 'REJECT', rejectReason)}
              >
                Reject / Fake Evidence
              </Button>
              <Button
                fullWidth
                variant="primary"
                loading={processing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision(selectedItem.id, 'APPROVE')}
              >
                Approve Evidence & Proceed
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
