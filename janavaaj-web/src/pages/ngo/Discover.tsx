import { useState } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Loading, ErrorState, EmptyState } from '../../components/ui/feedback';
import { formatPeople, formatINR } from '../../lib/format';
import { useDiscoverProjects } from '../../hooks/queries';
import { dashboardApi } from '../../api/endpoints';
import { toast } from '../../lib/toast';

export default function Discover() {
  const { data: projects, isLoading, isError, refetch } = useDiscoverProjects();

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [adopting, setAdopting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = (projects || []).filter((p: any) => {
    if (categoryFilter === 'ALL') return true;
    return p.category?.toUpperCase() === categoryFilter;
  });

  const handleAdopt = async () => {
    if (!selectedProject) return;
    setAdopting(true);
    try {
      await dashboardApi.adoptProject(selectedProject.id);
      toast.success(`Project ${selectedProject.title} successfully adopted into your portfolio!`);
      setSelectedProject(null);
      void refetch();
    } catch {
      toast.error('Failed to adopt project.');
    } finally {
      setAdopting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover High-Impact Civic Projects"
        subtitle="AI-verified community infrastructure priorities awaiting NGO & CSR sponsorship"
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'ROADS', 'WATER', 'DRAINAGE'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              categoryFilter === cat
                ? 'bg-partner text-white'
                : 'border border-border bg-surface text-slate-600 hover:bg-bg'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No projects found" description="Check back soon for new screened civic projects." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prj: any) => (
            <Card key={prj.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-bold text-primary">
                    {prj.category}
                  </span>
                  <span className="font-extrabold text-partner">Impact {prj.impactScore} / 100</span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">{prj.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {prj.location}
                </p>

                <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">People Benefited:</span>
                    <strong className="text-slate-900">{formatPeople(prj.peopleAffected)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Required Sponsorship:</span>
                    <strong className="text-slate-900">{formatINR(prj.fundingRequiredINR)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evidence Confidence:</span>
                    <span className="font-bold text-success">{prj.evidenceConfidence}% Audited</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border">
                <Button
                  fullWidth
                  variant="primary"
                  className="bg-partner hover:bg-purple-700 text-white"
                  onClick={() => setSelectedProject(prj)}
                >
                  Adopt Project & Review Terms
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Adoption Confirmation Modal */}
      {selectedProject && (
        <Modal
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title="Adopt Civic Infrastructure Project"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              You are committing to adopt <strong className="text-slate-900">{selectedProject.title}</strong>{' '}
              under Janavaaj Smart Milestone contracts.
            </p>

            <div className="rounded-xl border border-border bg-bg p-3 space-y-2">
              <div className="flex justify-between">
                <span>Estimated Impact:</span>
                <strong>{formatPeople(selectedProject.peopleAffected)} residents</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Project Tranches:</span>
                <strong>{formatINR(selectedProject.fundingRequiredINR)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <strong>{selectedProject.location}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Funds will only be released following verified, geotagged photographic proof approved by municipal
                supervisors.
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <Button fullWidth variant="outline" onClick={() => setSelectedProject(null)}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="primary"
                loading={adopting}
                className="bg-partner hover:bg-purple-700 text-white"
                onClick={handleAdopt}
              >
                Confirm Adoption
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
