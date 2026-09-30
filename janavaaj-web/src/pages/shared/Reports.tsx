import { useState } from 'react';
import { FileText, Download, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { dashboardApi } from '../../api/endpoints';
import { toast } from '../../lib/toast';

export default function ReportsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('CIVIC_EXECUTIVE_SUMMARY');
  const [period, setPeriod] = useState('Last 30 Days');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await dashboardApi.createReport({
        type: reportType,
        scope: 'Pune District',
        period,
      });
      toast.success(`Report ${res.data.id} compiled successfully!`);
      setModalOpen(false);
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const sampleReports = [
    {
      id: 'RPT-8421',
      title: 'Executive Civic Intelligence & Hotspot Briefing',
      period: 'September 2026',
      type: 'Government Municipal Briefing',
      size: '2.4 MB',
      date: '2026-09-29',
    },
    {
      id: 'RPT-8104',
      title: 'CSR Social Impact Return & Tax Compliance Certificate',
      period: 'FY 2025-26 Q2',
      type: 'NGO & Corporate Audit',
      size: '4.8 MB',
      date: '2026-09-25',
    },
    {
      id: 'RPT-7890',
      title: 'Community Citizen Resolution & Before/After Proof Archive',
      period: 'August 2026',
      type: 'Citizen Public Transparency',
      size: '8.1 MB',
      date: '2026-09-01',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Civic & Impact Reports Center"
          subtitle="Generate, audit and export verified civic intelligence dossiers and certified CSR documentation"
        />
        <Button
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={() => setModalOpen(true)}
        >
          Generate New Report
        </Button>
      </div>

      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-4">Exportable Intelligence Reports</h3>

        <div className="divide-y divide-border">
          {sampleReports.map((rpt) => (
            <div
              key={rpt.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-xs">{rpt.id}</span>
                    <span className="text-xs text-slate-400">· {rpt.period}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{rpt.title}</h4>
                  <p className="text-xs text-slate-500">
                    {rpt.type} · {rpt.size}
                  </p>
                </div>
              </div>

              <div>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                  onClick={() => toast.success(`Downloading ${rpt.id} (PDF)...`)}
                >
                  Download PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Report Modal */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Civic Intelligence Report">
          <div className="space-y-4 text-xs text-slate-700">
            <div>
              <label className="block font-semibold mb-1">Report Category:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-input border border-border p-2 bg-bg text-xs"
              >
                <option value="CIVIC_EXECUTIVE_SUMMARY">Executive Municipal Briefing (SLA, Hotspots, Prioritization)</option>
                <option value="CSR_IMPACT_REPORT">CSR Social Impact Audit & Regulatory Certificate</option>
                <option value="CITIZEN_OUTCOMES_PROOF">Citizen Transparency & Resolution Dossier</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Audit Timeframe:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded-input border border-border p-2 bg-bg text-xs"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days (Standard Month)</option>
                <option value="Q2 FY2026">Quarterly (90 Days)</option>
                <option value="Year-to-Date">Year to Date (Annual Audit)</option>
              </select>
            </div>

            <div className="rounded-xl border border-border bg-bg p-3">
              <span className="font-bold text-slate-900">Included Sections:</span>
              <ul className="mt-2 space-y-1 text-slate-600 list-disc list-inside">
                <li>Geographic signal distribution & hotspot clustering</li>
                <li>Audited population impact (People Affected metric)</li>
                <li>Smart milestone completion & financial tranches</li>
                <li>Before & After ground photographic evidence</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button fullWidth variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                fullWidth
                variant="primary"
                loading={generating}
                onClick={handleGenerate}
              >
                Compile & Export (PDF)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
