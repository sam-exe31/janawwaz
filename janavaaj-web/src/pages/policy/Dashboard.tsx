import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building,
  Clock,
  IndianRupee,
  Sparkles,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/data/KpiCard';
import { ChartCard } from '../../components/data/ChartCard';
import { DonutChart } from '../../components/charts/DonutChart';
import { RoundedBarChart } from '../../components/charts/RoundedBarChart';
import { SmoothLineChart } from '../../components/charts/SmoothLineChart';
import { ScatterChart } from '../../components/charts/ScatterChart';
import { FundingSegmentBar } from '../../components/charts/FundingSegmentBar';
import { MilestoneTracker } from '../../components/data/MilestoneTracker';
import { DemoBadge } from '../../components/data/DemoBadge';
import { formatPeople, formatINR } from '../../lib/format';
import {
  usePolicySummary,
  usePolicyPriorityIssues,
  usePolicyImpactVsComplaints,
  usePolicyCategories,
  usePolicyLocations,
  usePolicyTrend,
  usePolicyHotspots,
  usePolicyFunding,
  usePolicyNetwork,
  usePolicyResolutionFunnel,
  usePolicyOutcomes,
  usePolicyExecutiveSummary,
  useVerificationQueue,
  useMilestones,
} from '../../hooks/queries';
import { dashboardApi } from '../../api/endpoints';
import { toast } from '../../lib/toast';

export default function PolicyDashboard() {
  const [geography, setGeography] = useState('Pune District');
  const [dateRange, setDateRange] = useState('30d');

  // Queries
  const { data: summary } = usePolicySummary();
  const { data: priorityIssues } = usePolicyPriorityIssues();
  const { data: scatterData } = usePolicyImpactVsComplaints();
  const { data: categories } = usePolicyCategories();
  const { data: locations } = usePolicyLocations();
  const { data: trendData } = usePolicyTrend(dateRange);
  const { data: hotspots } = usePolicyHotspots();
  const { data: funding } = usePolicyFunding();
  const { data: network } = usePolicyNetwork();
  const { data: funnel } = usePolicyResolutionFunnel();
  const { data: outcomes } = usePolicyOutcomes();
  const { data: execSummary } = usePolicyExecutiveSummary();
  const { data: verificationQueue, refetch: refetchVerification } = useVerificationQueue();
  const { data: milestones, refetch: refetchMilestones } = useMilestones();

  const handleVerificationDecision = async (id: number, decision: 'APPROVE' | 'REJECT') => {
    try {
      await dashboardApi.verificationDecision(id, decision, 'Supervisory verification passed');
      toast.success(`Complaint ${id} verified and queued for project pipeline.`);
      void refetchVerification();
    } catch {
      toast.error('Action failed.');
    }
  };

  const handleApproveMilestone = async (id: number | string) => {
    try {
      await dashboardApi.approveMilestone(id);
      toast.success(`Milestone ${id} approved! Capital release authorized.`);
      void refetchMilestones();
    } catch {
      toast.error('Milestone approval failed.');
    }
  };

  // Format data
  const donutData =
    categories?.map((c: any) => ({
      name: c.category,
      value: c.count,
      percentage: c.percentage,
    })) || [
      { name: 'Roads & Infrastructure', value: 9850, percentage: 40 },
      { name: 'Water Supply', value: 6170, percentage: 25 },
      { name: 'Drainage & Stormwater', value: 3700, percentage: 15 },
      { name: 'Solid Waste', value: 2468, percentage: 10 },
      { name: 'Electricity', value: 2492, percentage: 10 },
    ];

  const locationBarData =
    locations?.map((l: any) => ({
      label: l.location,
      value: l.peopleAffected,
    })) || [
      { label: 'Hadapsar (Zone 4)', value: 142000 },
      { label: 'Baner/Kharadi (Zone 2)', value: 118000 },
      { label: 'Sinhagad (Zone 3)', value: 86000 },
      { label: 'Kothrud (Zone 1)', value: 74000 },
    ];

  const trendLineData =
    trendData || [
      { period: 'Day 1', complaints: 820, verified: 740, resolved: 680 },
      { period: 'Day 5', complaints: 950, verified: 880, resolved: 790 },
      { period: 'Day 10', complaints: 1120, verified: 1040, resolved: 950 },
      { period: 'Day 15', complaints: 1240, verified: 1180, resolved: 1080 },
      { period: 'Day 20', complaints: 1410, verified: 1320, resolved: 1210 },
      { period: 'Day 30', complaints: 1280, verified: 1220, resolved: 1190 },
    ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              Government & Municipal Authority
            </span>
            <DemoBadge />
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Civic Intelligence Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            AI-assisted intelligence for evidence-based civic prioritization and impact monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Geography Selector */}
          <select
            value={geography}
            onChange={(e) => setGeography(e.target.value)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-primary focus:outline-none shadow-xs"
          >
            <option value="Pune District">Pune District (Municipal & ZP)</option>
            <option value="Maharashtra">Maharashtra State</option>
            <option value="India">National Overview</option>
          </select>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-primary focus:outline-none shadow-xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Quarterly (90D)</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => toast.success('Executive Intelligence Briefing PDF generated.')}
          >
            Export Report (PDF)
          </Button>
        </div>
      </div>

      {/* 8 KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <KpiCard
          label="Total Complaints"
          value={formatPeople(summary?.totalComplaints ?? 24680)}
          icon={<FileText className="h-5 w-5" />}
          accent="primary"
          isDemo
        />
        <KpiCard
          label="Verified"
          value={formatPeople(summary?.verifiedComplaints ?? 21420)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
          isDemo
        />
        <KpiCard
          label="Pending Review"
          value={formatPeople(summary?.pendingVerification ?? 1840)}
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
          isDemo
        />
        <KpiCard
          label="High-Impact Issues"
          value={summary?.highImpactIssues ?? 38}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="danger"
          isDemo
        />
        <KpiCard
          label="People Affected"
          value={formatPeople(summary?.peopleAffected ?? 380000)}
          icon={<Users className="h-5 w-5" />}
          accent="violet"
          isDemo
        />
        <KpiCard
          label="Active Projects"
          value={summary?.activeProjects ?? 42}
          icon={<Building className="h-5 w-5" />}
          accent="info"
          isDemo
        />
        <KpiCard
          label="Resolved"
          value={formatPeople(summary?.resolvedComplaints ?? 18920)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
          isDemo
        />
        <KpiCard
          label="Funding Committed"
          value={formatINR(summary?.totalFundingINR ?? 48000000)}
          icon={<IndianRupee className="h-5 w-5" />}
          accent="partner"
          isDemo
        />
      </div>

      {/* Priority Issues & Emerging Hotspot Alert */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Emerging Hotspot Alert Card */}
        <div className="rounded-card border-l-4 border-l-danger border border-border bg-gradient-to-br from-red-50/40 via-surface to-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-black text-danger">
              <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
              EMERGING HOTSPOT ALERT
            </span>
            <span className="text-xs font-black text-danger">+240% Surge</span>
          </div>

          <h3 className="mt-3 text-base font-bold text-slate-900">
            {hotspots?.[0]?.title || 'Road Damage Surge in Hadapsar (Zone 4)'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{hotspots?.[0]?.zone || 'Zone 4 Arterial'}</p>
          <p className="mt-3 text-xs text-slate-700 leading-relaxed">
            {hotspots?.[0]?.explanation ||
              'Heavy monsoon runoff combined with metro route detours degraded 2.4 km of dual carriageway. Estimated affected population: 1.8 Lakh citizens.'}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-slate-500">Est. Affected: <strong>1.8 Lakh</strong></span>
            <Link to="/app/map?hotspot=hadapsar">
              <Button size="sm" variant="primary" className="bg-danger hover:bg-red-700 text-white">
                Investigate Hotspot →
              </Button>
            </Link>
          </div>
        </div>

        {/* Predictive AI Insight */}
        <div className="rounded-card border border-primary/20 bg-gradient-to-br from-primary-soft/30 to-surface p-6 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" /> Predictive Infrastructure Model
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">
            Water Pressure Discrepancy (Ward 14)
          </h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Machine learning signal analysis predicts an underground water burst between Ward 14 and Ward 16 based
            on 28 sudden localized water complaints. Early intervention recommended before surface road subsidence.
          </p>
          <div className="mt-4 border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              fullWidth
              onClick={() => toast.success('Inspection team dispatched to Ward 14.')}
            >
              Dispatch Ward 14 Inspection Team
            </Button>
          </div>
        </div>

        {/* Priority Issue Highlight */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-card flex flex-col justify-between">
          <div>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              Top Priority Civic Need
            </span>
            <h3 className="mt-3 text-base font-bold text-slate-900">
              Baner-Balewadi High Street Storm Drain Collapse
            </h3>
            <p className="mt-1 text-xs text-slate-500">Zone 2 (Baner), Pune · 142 Complaints Filed</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-2">
              <div>
                <span className="text-slate-500">People Impacted:</span>
                <p className="font-bold text-slate-900">1.2 Lakh</p>
              </div>
              <div>
                <span className="text-slate-500">Impact Score:</span>
                <p className="font-extrabold text-danger">94 / 100</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/app/policy/issues">
              <Button fullWidth size="sm" variant="outline">
                Assign Execution Partner →
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Highest-Impact Civic Issues Table (People Affected & Impact Score Dominant) */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Highest-Impact Civic Issues</h3>
            <p className="text-xs text-slate-500">
              Prioritized by analytical population impact & infrastructure criticality, not raw complaint volume
            </p>
          </div>
          <Link to="/app/policy/issues" className="text-xs font-bold text-primary hover:underline">
            View All Priority Issues →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Civic Issue</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">Complaints</th>
                <th className="py-2.5 px-3 font-extrabold text-slate-900">People Affected</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold">Infrastructure</th>
                <th className="py-2.5 px-3 font-semibold">Evidence</th>
                <th className="py-2.5 px-3 font-extrabold text-primary">Impact Score</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(priorityIssues || []).map((issue: any) => (
                <tr key={issue.id} className="hover:bg-bg/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{issue.issue}</td>
                  <td className="py-3 px-3 text-slate-600">{issue.location}</td>
                  <td className="py-3 px-3 font-semibold text-slate-500">{issue.complaintCount}</td>
                  <td className="py-3 px-3 text-sm font-black text-slate-900">
                    {formatPeople(issue.peopleAffected)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-danger-soft text-danger'
                          : 'bg-warning-soft text-warning'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{issue.infrastructureImportance}</td>
                  <td className="py-3 px-3 font-bold text-success">{issue.evidenceConfidence}% ✓</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 font-black text-primary text-xs">
                      {issue.impactScore} / 100
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(`Issue ${issue.id} prioritized for tender.`)}
                      className="font-bold text-primary hover:underline"
                    >
                      Prioritize & Assign →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impact vs Complaints Scatter Chart & Categories Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Impact Score vs Complaint Signal Count"
            subtitle="Quadrant analysis surfacing high-impact civic issues with low signal reporting volume"
          >
            <ScatterChart data={scatterData || []} />
          </ChartCard>
        </div>

        <ChartCard
          title="Issues by Civic Domain"
          subtitle="Classification across municipal departments"
        >
          <DonutChart data={donutData} centerValue={summary?.totalComplaints ?? 24680} centerLabel="Signals" />
        </ChartCard>
      </div>

      {/* High-Impact by Location & Issue Trend Line */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Population Impact by Municipal Zone"
          subtitle="Total citizens affected per urban administrative zone"
        >
          <RoundedBarChart data={locationBarData} horizontal accentColor="#3346B8" />
        </ChartCard>

        <ChartCard
          title="Civic Issue Ingestion & Resolution Trend"
          subtitle="Daily trend: Complaints filed vs verified vs resolved"
        >
          <SmoothLineChart
            data={trendLineData}
            xAxisKey="period"
            series={[
              { key: 'complaints', label: 'Signals', color: '#3346B8' },
              { key: 'verified', label: 'Verified', color: '#D97706' },
              { key: 'resolved', label: 'Resolved', color: '#16A34A' },
            ]}
          />
        </ChartCard>
      </div>

      {/* Verification Center Review Queue */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Verification Center Queue</h3>
            <p className="text-xs text-slate-500">
              Audit photographic evidence, GPS geofencing, and duplicate candidate alerts
            </p>
          </div>
          <Link to="/app/policy/verification" className="text-xs font-bold text-primary hover:underline">
            Open Full Verification Center →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 text-slate-500">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Complaint ID & Title</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">GPS</th>
                <th className="py-2.5 px-3 font-semibold">Image AI</th>
                <th className="py-2.5 px-3 font-semibold">GIS Map</th>
                <th className="py-2.5 px-3 font-semibold">Confidence</th>
                <th className="py-2.5 px-3 font-semibold text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(verificationQueue || []).map((q: any) => (
                <tr key={q.id} className="hover:bg-bg/40">
                  <td className="py-3 px-3 font-bold text-slate-900">{q.title}</td>
                  <td className="py-3 px-3 text-slate-600">{q.location}</td>
                  <td className="py-3 px-3 font-bold text-success">{q.gpsVerified ? '✓ Matched' : '—'}</td>
                  <td className="py-3 px-3 font-bold text-success">{q.imageVerified ? '✓ Genuine' : '—'}</td>
                  <td className="py-3 px-3 font-bold text-success">{q.gisVerified ? '✓ Zone Ward' : '—'}</td>
                  <td className="py-3 px-3 font-black text-primary">{q.evidenceConfidence}%</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                        onClick={() => handleVerificationDecision(q.id, 'APPROVE')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2.5 py-1 text-danger hover:bg-red-50"
                        onClick={() => handleVerificationDecision(q.id, 'REJECT')}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Funding Command Center & Milestone Releases */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Municipal & CSR Funding Command Center
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Capital allocation and milestone release authorizations
        </p>

        <FundingSegmentBar
          approvedINR={funding?.approvedINR ?? 48000000}
          releasedINR={funding?.releasedINR ?? 36000000}
          utilizedINR={funding?.utilizedINR ?? 32000000}
          pendingINR={funding?.pendingINR ?? 12000000}
        />

        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-sm font-bold text-slate-900 mb-2">Milestones Awaiting Approval</h4>
          <MilestoneTracker
            milestones={milestones || []}
            canApprove={true}
            onApprove={handleApproveMilestone}
          />
        </div>
      </div>

      {/* Civic Action Network & Partner Performance Table (Factual only, no medals) */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Civic Action Network & Execution Partners</h3>
            <p className="text-xs text-slate-500">
              Objective SLA performance and verified beneficiary counts (factual metrics only)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600">16 Active Registered Partners</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 text-slate-500">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Partner Organization</th>
                <th className="py-2.5 px-3 font-semibold">Active Projects</th>
                <th className="py-2.5 px-3 font-semibold">Completed Works</th>
                <th className="py-2.5 px-3 font-semibold">Avg Turnaround</th>
                <th className="py-2.5 px-3 font-semibold">People Benefited</th>
                <th className="py-2.5 px-3 font-semibold text-right">Audit Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(network?.partners || []).map((partner: any) => (
                <tr key={partner.name} className="hover:bg-bg/40">
                  <td className="py-3 px-3 font-bold text-slate-900">{partner.name}</td>
                  <td className="py-3 px-3 text-slate-600">{partner.activeProjects}</td>
                  <td className="py-3 px-3 text-slate-600">{partner.completedProjects}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{partner.avgResolutionHours} Hours</td>
                  <td className="py-3 px-3 font-bold text-primary">{formatPeople(partner.peopleBenefited)}</td>
                  <td className="py-3 px-3 text-right font-black text-success">{partner.complianceRate}% Verified</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Funnel: From Signal to Resolution */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Resolution Funnel: From Signal to Resolution
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Pipeline stage counts from raw citizen voice to final verified ground close
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 text-center text-xs">
          {(funnel || []).map((step: any, index: number) => (
            <div key={step.stage} className="rounded-xl border border-border bg-bg/50 p-3">
              <span className="text-[10px] font-bold text-primary uppercase">Stage {index + 1}</span>
              <p className="mt-1 font-bold text-slate-800">{step.stage}</p>
              <p className="mt-2 text-xl font-black text-slate-900">
                {step.count.toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Real-World Outcomes */}
      <div className="rounded-card border border-border bg-gradient-to-r from-surface via-primary-soft/20 to-surface p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-1">Real-World Outcomes Achieved</h3>
        <p className="text-xs text-slate-500 mb-4">Audited metrics in the past 30 days across Pune</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center">
          <div>
            <span className="text-xs text-slate-500">Issues Resolved</span>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {formatPeople(outcomes?.issuesResolved ?? 18920)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">People Benefited</span>
            <p className="mt-1 text-2xl font-black text-primary">
              {formatPeople(outcomes?.peopleBenefited ?? 240000)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Infra Improved</span>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {outcomes?.infrastructureUnitsImproved ?? 340} Units
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Avg Resolution</span>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {outcomes?.avgResolutionHours ?? 32} Hours
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Funding Utilized</span>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {formatINR(outcomes?.fundingUtilizedINR ?? 32000000)}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Cost / Beneficiary</span>
            <p className="mt-1 text-2xl font-black text-emerald-700">
              ₹{outcomes?.costPerPersonBenefitedINR ?? 133}
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary Bottom Section */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-slate-900">AI Executive Summary</h3>
          </div>
          <span className="text-xs text-slate-400">{execSummary?.date || 'September 2026'}</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {execSummary?.narrative ||
            'In the past 30 days, Janavaaj processed 24,680 citizen signals across Pune District with 89.4% evidence confidence. Municipal intervention combined with CSR capital enabled the resolution of 18,920 issues benefiting 2.4 Lakh residents. Two emerging hotspots in Zone 4 (Roads) and Zone 2 (Drainage) were mitigated within 48 hours of automated detection, reducing public dissatisfaction by an estimated 68%.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
            onClick={() => toast.success('Janavaaj AI command briefing opened.')}
          >
            Ask Janavaaj AI Detailed Queries
          </Button>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<FileText className="h-4 w-4" />}
            onClick={() => toast.success('Executive Report download initiated.')}
          >
            Generate Executive Briefing (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}
