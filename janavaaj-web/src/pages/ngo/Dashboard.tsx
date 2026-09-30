import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KpiCard } from '../../components/data/KpiCard';
import { ChartCard } from '../../components/data/ChartCard';
import { DonutChart } from '../../components/charts/DonutChart';
import { RoundedBarChart } from '../../components/charts/RoundedBarChart';
import { SmoothLineChart } from '../../components/charts/SmoothLineChart';
import { FundingSegmentBar } from '../../components/charts/FundingSegmentBar';
import { MilestoneTracker } from '../../components/data/MilestoneTracker';
import { DemoBadge } from '../../components/data/DemoBadge';
import { formatPeople, formatINR } from '../../lib/format';
import {
  useNgoSummary,
  useNgoContributionBreakdown,
  useNgoContributionTrend,
  useNgoPeopleBenefited,
  useNgoPortfolioStatus,
  useNgoFunding,
  useNgoTaxTracking,
  useNgoImpactRoi,
  useDiscoverProjects,
  useMilestones,
} from '../../hooks/queries';

export default function NgoDashboard() {
  const [trendMetric, setTrendMetric] = useState<'amount' | 'projects'>('amount');

  // Queries
  const { data: summary } = useNgoSummary();
  const { data: breakdown, isLoading: breakLoading } = useNgoContributionBreakdown();
  const { data: trendData, isLoading: trendLoading } = useNgoContributionTrend(trendMetric);
  const { data: peopleBenefited, isLoading: peopleLoading } = useNgoPeopleBenefited();
  const { data: portfolioStatus, isLoading: statusLoading } = useNgoPortfolioStatus();
  const { data: fundingData } = useNgoFunding();
  const { data: taxData } = useNgoTaxTracking();
  const { data: impactRoi } = useNgoImpactRoi();
  const { data: discoverProjects } = useDiscoverProjects();
  const { data: milestones } = useMilestones();

  // Format charts
  const donutData =
    breakdown?.map((b: any) => ({
      name: b.category,
      value: b.amountINR,
      percentage: b.percentage,
    })) || [
      { name: 'Roads & Infrastructure', value: 9800000, percentage: 35 },
      { name: 'Water & Sanitation', value: 7000000, percentage: 25 },
      { name: 'Healthcare Facilities', value: 4200000, percentage: 15 },
      { name: 'Solid Waste Management', value: 2800000, percentage: 10 },
      { name: 'Education & Digital', value: 2800000, percentage: 10 },
      { name: 'Public Lighting', value: 1400000, percentage: 5 },
    ];

  const peopleBarData =
    peopleBenefited?.map((p: any) => ({
      label: p.category,
      value: p.peopleBenefited,
    })) || [
      { label: 'Roads', value: 96000 },
      { label: 'Water', value: 74000 },
      { label: 'Healthcare', value: 38000 },
      { label: 'Sanitation', value: 22000 },
      { label: 'Lighting', value: 10000 },
    ];

  const statusDonutData =
    portfolioStatus?.map((s: any) => ({
      name: s.status,
      value: s.count,
      percentage: s.percentage,
    })) || [
      { name: 'Completed', value: 18, percentage: 75 },
      { name: 'Active In Progress', value: 4, percentage: 17 },
      { name: 'Awaiting Milestone', value: 2, percentage: 8 },
    ];

  const trendLineData =
    trendData || [
      { month: 'Apr', amountINR: 1800000, projects: 2 },
      { month: 'May', amountINR: 3200000, projects: 3 },
      { month: 'Jun', amountINR: 4500000, projects: 4 },
      { month: 'Jul', amountINR: 6200000, projects: 5 },
      { month: 'Aug', amountINR: 5800000, projects: 4 },
      { month: 'Sep', amountINR: 6500000, projects: 6 },
    ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-partner-soft px-3 py-1 text-xs font-bold text-partner">
              NGO & CSR Impact Partner
            </span>
            <DemoBadge />
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Social Impact Portfolio Dashboard 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Turn verified citizen signals into audited, measurable community infrastructure improvements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/app/ngo/reports">
            <Button variant="outline" leftIcon={<FileText className="h-4 w-4 text-partner" />}>
              Generate CSR Report
            </Button>
          </Link>
          <Link to="/app/ngo/discover">
            <Button
              className="bg-partner hover:bg-purple-700 text-white"
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Discover Projects to Support
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Enterprise KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Projects Supported"
          value={summary?.projectsSupported ?? 24}
          icon={<Building2 className="h-5 w-5" />}
          accent="partner"
          sublabel="All active & closed"
          isDemo
        />
        <KpiCard
          label="People Benefited"
          value={formatPeople(summary?.peopleBenefited ?? 240000)}
          icon={<Users className="h-5 w-5" />}
          accent="primary"
          trend={{ value: '↑ 24%', isPositive: true }}
          isDemo
        />
        <KpiCard
          label="Contribution"
          value={formatINR(summary?.totalContributionINR ?? 28000000)}
          icon={<IndianRupee className="h-5 w-5" />}
          accent="violet"
          sublabel="Documented CSR"
          isDemo
        />
        <KpiCard
          label="Completed"
          value={summary?.projectsCompleted ?? 18}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
          sublabel="100% verified"
          isDemo
        />
        <KpiCard
          label="Active Projects"
          value={summary?.activeProjects ?? 6}
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
          sublabel="Field execution"
          isDemo
        />
        <KpiCard
          label="Impact Score"
          value={`${summary?.impactScoreGenerated ?? 94} / 100`}
          icon={<Sparkles className="h-5 w-5" />}
          accent="info"
          sublabel="High ROI index"
          isDemo
        />
      </div>

      {/* Impact Portfolio Summary Strip */}
      <div className="rounded-card border border-border bg-gradient-to-r from-surface via-partner-soft/20 to-surface p-6 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          CSR & NGO Verified Social Impact Return
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Audited metrics per ₹1 Lakh contributed through Janavaaj Smart Milestone contracts
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
          <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Benefited / ₹1L</span>
            <p className="mt-1 text-2xl font-black text-partner">
              {impactRoi?.perLakhINR?.peopleBenefited ?? 857}
            </p>
            <span className="text-[11px] text-slate-400">Citizens positively impacted</span>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Infrastructure / ₹1L</span>
            <p className="mt-1 text-2xl font-black text-primary">
              {impactRoi?.perLakhINR?.infrastructureUnits ?? 1.7}
            </p>
            <span className="text-[11px] text-slate-400">Physical units renovated</span>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Issues Resolved / ₹1L</span>
            <p className="mt-1 text-2xl font-black text-success">
              {impactRoi?.perLakhINR?.issuesResolved ?? 2.1}
            </p>
            <span className="text-[11px] text-slate-400">Citizen complaints closed</span>
          </div>

          <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Avg Completion</span>
            <p className="mt-1 text-2xl font-black text-slate-900">4.2 Days</p>
            <span className="text-[11px] text-slate-400">SLA performance</span>
          </div>
        </div>
      </div>

      {/* Where your contribution goes & Trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Where Your Contribution Goes"
          subtitle="Categorical breakdown of CSR & NGO allocation"
          isLoading={breakLoading}
        >
          <DonutChart
            data={donutData}
            centerValue={formatINR(summary?.totalContributionINR ?? 28000000)}
            centerLabel="Total Invested"
          />
        </ChartCard>

        <ChartCard
          title="Contribution Over Time"
          subtitle="Quarterly capital deployment & project count"
          rangeTabs={[
            { key: 'amount', label: 'Amount (₹)' },
            { key: 'projects', label: 'Projects' },
          ]}
          activeRange={trendMetric}
          onRangeChange={(k) => setTrendMetric(k as any)}
          isLoading={trendLoading}
        >
          <SmoothLineChart
            data={trendLineData}
            xAxisKey="month"
            series={[
              {
                key: trendMetric === 'amount' ? 'amountINR' : 'projects',
                label: trendMetric === 'amount' ? 'Amount (₹)' : 'Projects',
                color: '#9333EA',
              },
            ]}
          />
        </ChartCard>
      </div>

      {/* People Benefited by Category & Portfolio Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="People Benefited by Project Category"
          subtitle="Total citizens served per civic domain"
          isLoading={peopleLoading}
        >
          <RoundedBarChart data={peopleBarData} accentColor="#9333EA" />
        </ChartCard>

        <ChartCard
          title="Portfolio Execution Status"
          subtitle="Project pipeline health & completion ratio"
          isLoading={statusLoading}
        >
          <DonutChart data={statusDonutData} centerValue={summary?.projectsSupported ?? 24} centerLabel="Projects" />
        </ChartCard>
      </div>

      {/* Funding Tracker (Committed, Released, Pending, Utilized) */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Capital & Tranche Funding Tracker</h3>
            <p className="text-xs text-slate-500">
              Payments are released strictly upon verified geotagged milestone completion
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            Smart Milestone Enforced
          </span>
        </div>

        <FundingSegmentBar
          approvedINR={fundingData?.committedINR ?? 28000000}
          releasedINR={fundingData?.releasedINR ?? 21500000}
          utilizedINR={fundingData?.utilizedINR ?? 20000000}
          pendingINR={fundingData?.pendingINR ?? 4500000}
        />
      </div>

      {/* Milestone Tracker Section */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Project Milestones</h3>
            <p className="text-xs text-slate-500">
              Hadapsar Arterial Road Reconstruction (Tata Tech CSR Tranche 2)
            </p>
          </div>
          <span className="text-xs text-slate-500">Progress: 65% Completed</span>
        </div>

        <MilestoneTracker
          milestones={
            milestones || [
              {
                id: 1,
                title: 'Milestone 1: Surface Milling & Debris Removal',
                progress: 100,
                amountINR: 600000,
                status: 'RELEASED',
                evidenceUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80',
              },
              {
                id: 2,
                title: 'Milestone 2: Sub-base Compaction & Asphalt Laying',
                progress: 75,
                amountINR: 800000,
                status: 'AWAITING_VERIFICATION',
                evidenceUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
              },
              {
                id: 3,
                title: 'Milestone 3: Final Sealing, Lane Marking & Testing',
                progress: 0,
                amountINR: 400000,
                status: 'NOT_STARTED',
              },
            ]
          }
        />
      </div>

      {/* Regulatory & Tax Tracking Card (WITH MANDATORY DISCLAIMER) */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">Regulatory & Tax Tracking</h3>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Illustrative / Demo Value
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-bg/50 p-3">
            <span className="text-xs text-slate-500">Documented Contribution</span>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatINR(taxData?.documentedContributionINR ?? 28000000)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg/50 p-3">
            <span className="text-xs text-slate-500">Eligible Benefit (Est.)</span>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {formatINR(taxData?.eligibleBenefitINR ?? 14000000)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-bg/50 p-3">
            <span className="text-xs text-slate-500">Documentation Audited</span>
            <p className="mt-1 text-xl font-bold text-primary">100% Verified</p>
          </div>
          <div className="rounded-xl border border-border bg-bg/50 p-3">
            <span className="text-xs text-slate-500">Completion Certificates</span>
            <p className="mt-1 text-xl font-bold text-slate-900">24 Exportable</p>
          </div>
        </div>

        {/* Required Mandatory Regulatory Disclaimer Note */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-800 mb-1">Regulatory & Compliance Disclosure:</p>
          <p>
            {taxData?.fixedDisclaimer ||
              "Tax treatment and applicable benefits depend on the organization's jurisdiction, eligibility, approved project structure and applicable regulations. Janavaaj tracks documented contributions and eligible benefits; it does not determine tax liability."}
          </p>
        </div>
      </div>

      {/* Discover Projects You Can Support */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">High-Impact Projects Awaiting Support</h3>
            <p className="text-xs text-slate-500">
              Screened and verified by AI and municipal engineers in Pune District
            </p>
          </div>
          <Link to="/app/ngo/discover" className="text-xs font-bold text-partner hover:underline">
            View All Verified Projects →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(discoverProjects || []).slice(0, 3).map((prj: any) => (
            <div
              key={prj.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-partner transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-primary-soft px-2 py-0.5 font-bold text-primary">
                    {prj.category}
                  </span>
                  <span className="font-extrabold text-partner">{prj.impactScore} / 100</span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-900">{prj.title}</h4>
                <p className="text-xs text-slate-500">{prj.location}</p>

                <div className="mt-3 flex items-center justify-between text-xs border-t border-border/60 pt-2">
                  <span className="text-slate-500">People Impacted:</span>
                  <strong className="text-slate-800">{formatPeople(prj.peopleAffected)}</strong>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Required:</span>
                  <strong className="text-slate-900">{formatINR(prj.fundingRequiredINR)}</strong>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/app/ngo/discover">
                  <Button fullWidth size="sm" variant="outline" className="text-xs font-bold">
                    View & Adopt Project
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
