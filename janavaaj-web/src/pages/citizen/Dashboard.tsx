import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  MapPin,
  Mic,
  FileText,
  Camera,
  Compass,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  Footprints,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { KpiCard } from '../../components/data/KpiCard';
import { ChartCard } from '../../components/data/ChartCard';
import { DonutChart } from '../../components/charts/DonutChart';
import { RoundedBarChart } from '../../components/charts/RoundedBarChart';
import { SmoothLineChart } from '../../components/charts/SmoothLineChart';
import { LifecycleProgress } from '../../components/data/LifecycleProgress';
import { PeopleAffectedCard } from '../../components/data/PeopleAffectedCard';
import { BeforeAfterCard } from '../../components/data/BeforeAfterCard';
import { useAuthStore } from '../../store/authStore';
import { formatPeople } from '../../lib/format';
import {
  useCitizenSummary,
  useCitizenCategories,
  useCitizenActivityTrend,
  useCitizenStatusBreakdown,
  useCitizenTopReports,
  useCitizenRecentActivity,
  useCitizenPeopleImpacted,
  useCitizenInsight,
  useCitizenOutcomes,
} from '../../hooks/queries';

const QUICK_SERVICE_CHIPS = [
  { label: 'Pothole', slug: 'pothole', icon: Construction },
  { label: 'Road Damage', slug: 'pothole', icon: Construction },
  { label: 'Garbage', slug: 'garbage-waste', icon: Trash2 },
  { label: 'Streetlight', slug: 'streetlight-not-working', icon: Lightbulb },
  { label: 'Water', slug: 'water-leakage-pipe-burst', icon: Droplets },
  { label: 'Drainage', slug: 'drainage-sewage-blockage', icon: Waves },
  { label: 'Footpath', slug: 'pothole', icon: Footprints },
  { label: 'Other', slug: 'other', icon: Compass },
];

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [trendRange, setTrendRange] = useState('30d');

  // Queries
  const { data: summary } = useCitizenSummary();
  const { data: categories, isLoading: catLoading } = useCitizenCategories();
  const { data: trendData, isLoading: trendLoading } = useCitizenActivityTrend(trendRange);
  const { data: statusBreakdown, isLoading: statusLoading } = useCitizenStatusBreakdown();
  const { data: topReports } = useCitizenTopReports();
  const { data: recentActivity } = useCitizenRecentActivity();
  const { data: peopleImpacted } = useCitizenPeopleImpacted();
  const { data: insight } = useCitizenInsight();
  const { data: outcomes } = useCitizenOutcomes();

  // Greeting time calculation
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Format data for charts
  const donutData =
    categories?.map((c: any) => ({
      name: c.name,
      value: c.count,
      percentage: c.percentage,
    })) || [
      { name: 'Roads & Potholes', value: 11, percentage: 46 },
      { name: 'Water Supply', value: 5, percentage: 21 },
      { name: 'Streetlights', value: 4, percentage: 17 },
      { name: 'Drainage & Waste', value: 4, percentage: 16 },
    ];

  const barData =
    statusBreakdown?.map((s: any) => ({
      label: s.status,
      value: s.count,
    })) || [
      { label: 'Submitted', value: 2 },
      { label: 'Under Review', value: 1 },
      { label: 'Verified', value: 4 },
      { label: 'In Progress', value: 5 },
      { label: 'Resolved', value: 12 },
    ];

  const lineData =
    trendData || [
      { period: 'Week 1', reports: 3, resolved: 2 },
      { period: 'Week 2', reports: 7, resolved: 4 },
      { period: 'Week 3', reports: 6, resolved: 5 },
      { period: 'Week 4', reports: 8, resolved: 5 },
    ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {user?.name || 'Citizen'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Your voice can help create measurable, verified change in your community.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/app/map">
            <Button variant="outline" leftIcon={<MapPin className="h-4 w-4 text-primary" />}>
              View Impact Map
            </Button>
          </Link>
          <Link to="/app/citizen/report">
            <Button leftIcon={<PlusCircle className="h-4 w-4" />}>
              + Raise a Civic Issue
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards (6) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="My Complaints"
          value={summary?.myComplaints ?? 24}
          icon={<FileText className="h-5 w-5" />}
          accent="primary"
          trend={{ value: '↑ 14%', isPositive: true }}
          isDemo
        />
        <KpiCard
          label="Verified"
          value={summary?.verified ?? 21}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="info"
          sublabel="87.5% rate"
          isDemo
        />
        <KpiCard
          label="In Progress"
          value={summary?.inProgress ?? 5}
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
          sublabel="Active field work"
          isDemo
        />
        <KpiCard
          label="Resolved"
          value={summary?.resolved ?? 16}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
          trend={{ value: '↑ 18%', isPositive: true }}
          isDemo
        />
        <KpiCard
          label="People Impacted"
          value={formatPeople(summary?.peopleImpacted ?? 380000)}
          icon={<Users className="h-5 w-5" />}
          accent="violet"
          sublabel="Community total"
          isDemo
        />
        <KpiCard
          label="Impact Created"
          value={summary?.impactCreatedLabel ?? '92 / 100'}
          icon={<Sparkles className="h-5 w-5" />}
          accent="partner"
          sublabel="High Civic Index"
          isDemo
        />
      </div>

      {/* 3. Quick Actions Strip (4) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => navigate('/app/citizen/report', { state: { initialMode: 'voice' } })}
          className="group flex flex-col items-center justify-center rounded-card border border-border bg-gradient-to-br from-surface to-primary-soft/20 p-4 text-center shadow-card transition-all duration-200 hover:shadow-hover hover:border-primary/40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
            <Mic className="h-6 w-6" />
          </span>
          <span className="mt-3 text-xs font-bold text-slate-900">🎙 Report by Voice</span>
          <span className="text-[11px] text-slate-500">EN / हिंदी / मराठी</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/citizen/report')}
          className="group flex flex-col items-center justify-center rounded-card border border-border bg-gradient-to-br from-surface to-bg p-4 text-center shadow-card transition-all duration-200 hover:shadow-hover hover:border-primary/40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
            <FileText className="h-6 w-6" />
          </span>
          <span className="mt-3 text-xs font-bold text-slate-900">📝 Report by Text</span>
          <span className="text-[11px] text-slate-500">Structured form</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/citizen/report')}
          className="group flex flex-col items-center justify-center rounded-card border border-border bg-gradient-to-br from-surface to-emerald-50 p-4 text-center shadow-card transition-all duration-200 hover:shadow-hover hover:border-success/40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
            <Camera className="h-6 w-6" />
          </span>
          <span className="mt-3 text-xs font-bold text-slate-900">📷 Submit Evidence</span>
          <span className="text-[11px] text-slate-500">Geotagged photo</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/map')}
          className="group flex flex-col items-center justify-center rounded-card border border-border bg-gradient-to-br from-surface to-violet-50 p-4 text-center shadow-card transition-all duration-200 hover:shadow-hover hover:border-violet/40"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
            <Compass className="h-6 w-6" />
          </span>
          <span className="mt-3 text-xs font-bold text-slate-900">🗺 Explore Impact</span>
          <span className="text-[11px] text-slate-500">Live Pune map</span>
        </button>
      </div>

      {/* 4. Quick Services Strip (CivicSetu Category Chips) */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Services · Instant Department Routing
          </span>
          <span className="text-[11px] text-slate-400">Select to file report</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_SERVICE_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() =>
                  navigate('/app/citizen/report', { state: { prefillCategory: chip.label } })
                }
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-primary hover:bg-primary-soft hover:text-primary hover:shadow-xs"
              >
                <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-primary" />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. My Complaint Status (with LifecycleProgress Stepper) */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Complaint Lifecycle Tracker</h3>
            <p className="text-xs text-slate-500">Tracking live end-to-end resolution stages</p>
          </div>
          <Link
            to="/app/citizen/my-reports"
            className="text-xs font-bold text-primary hover:underline"
          >
            View All Complaints →
          </Link>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-bg/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-primary">JNV-1042</span>
                <h4 className="text-sm font-bold text-slate-900">
                  Hadapsar Flyover Pothole Cluster & Asphalt Failure
                </h4>
                <p className="text-xs text-slate-500">Hadapsar Arterial Road · Reported 6h ago</p>
              </div>
              <StatusBadge status="IN_PROGRESS" />
            </div>

            <LifecycleProgress currentStage={6} status="IN_PROGRESS" />
          </div>

          <div className="rounded-xl border border-border bg-bg/50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-primary">JNV-1029</span>
                <h4 className="text-sm font-bold text-slate-900">
                  Kharadi Bypass Potable Water Pipeline Overhaul
                </h4>
                <p className="text-xs text-slate-500">Kharadi Bypass · Resolved 2d ago</p>
              </div>
              <StatusBadge status="CLOSED" />
            </div>

            <LifecycleProgress currentStage={8} status="CLOSED" />
          </div>
        </div>
      </div>

      {/* 6, 7, 8. Charts Row: What are you reporting? & Activity & Resolution */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 6. What Are You Reporting? Donut */}
        <ChartCard
          title="What Are You Reporting?"
          subtitle="Distribution of your filed civic issues"
          isLoading={catLoading}
        >
          <DonutChart data={donutData} centerValue={summary?.myComplaints ?? 24} centerLabel="Reports" />
        </ChartCard>

        {/* 7. Reporting Activity Line Chart */}
        <ChartCard
          title="My Reporting Activity"
          subtitle="Weekly civic signals & resolutions"
          rangeTabs={[
            { key: '7d', label: '7D' },
            { key: '30d', label: '30D' },
            { key: '6m', label: '6M' },
            { key: '1y', label: '1Y' },
          ]}
          activeRange={trendRange}
          onRangeChange={setTrendRange}
          isLoading={trendLoading}
        >
          <SmoothLineChart
            data={lineData}
            series={[
              { key: 'reports', label: 'Filed', color: '#3346B8' },
              { key: 'resolved', label: 'Resolved', color: '#16A34A' },
            ]}
          />
        </ChartCard>

        {/* 8. Complaint Resolution Bar Chart */}
        <ChartCard
          title="Complaint Resolution Pipeline"
          subtitle="Breakdown by lifecycle status"
          isLoading={statusLoading}
        >
          <RoundedBarChart data={barData} accentColor="#2563EB" />
        </ChartCard>
      </div>

      {/* 10. My Top Impactful Reports Table */}
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Top Impactful Reports</h3>
            <p className="text-xs text-slate-500">
              Ranked by analytical Impact Score and population affected
            </p>
          </div>
          <Link
            to="/app/citizen/my-reports"
            className="text-xs font-bold text-primary hover:underline"
          >
            Export List →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-bg/60 text-slate-500">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Complaint ID & Title</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">People Affected</th>
                <th className="py-2.5 px-3 font-semibold">Impact Score</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(topReports || []).map((rep: any) => (
                <tr key={rep.id} className="hover:bg-bg/40 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-primary">{rep.id}</span>
                    <p className="font-semibold text-slate-800">{rep.title}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{rep.location}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {formatPeople(rep.peopleAffected)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex rounded-full bg-primary-soft px-2 py-0.5 font-extrabold text-primary">
                      {rep.impactScore} / 100
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={rep.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/app/citizen/complaints/${rep.id.replace('JNV-', '')}`}
                      className="font-bold text-primary hover:underline"
                    >
                      Track Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11 & 12 & 13. Recent Activity & People Impacted & AI Insight */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 11. Recent Activity Timeline */}
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h3 className="text-base font-bold text-slate-900">Recent Lifecycle Activity</h3>
          <p className="text-xs text-slate-500 mb-4">Milestone and status updates</p>

          <div className="space-y-4">
            {(recentActivity || []).map((act: any) => (
              <div key={act.id} className="relative flex items-start gap-3 border-l-2 border-primary/30 pl-4 py-1">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{act.complaintId}</span>
                    <span className="text-[10px] text-slate-400">{act.timeAgo}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{act.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 12. People Impacted Large Card */}
        <PeopleAffectedCard count={peopleImpacted?.totalPeopleAffected ?? 380000} issueCount={24} />

        {/* 13. AI Insight Card */}
        <div className="flex flex-col justify-between rounded-card border border-primary/20 bg-gradient-to-br from-primary-soft/40 to-surface p-6 shadow-card">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Janavaaj Civic AI Insight
            </div>
            <h4 className="mt-2 text-base font-bold text-slate-900">
              {insight?.title || 'Emerging Road Hazard Detected in Hadapsar'}
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {insight?.message ||
                'Your report JNV-1042 combined with 14 nearby reports triggered an automated civic hotspot. The municipal road authority has scheduled expedited asphalt repaving.'}
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <Link to={insight?.actionTo || '/app/map'}>
              <Button fullWidth size="sm" variant="outline" leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                {insight?.actionText || 'Explore Hotspot on Map'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 14. Before/After for Resolved Complaints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Verified Ground Resolutions</h3>
            <p className="text-xs text-slate-500">
              Before and after photographic evidence of completed civic works
            </p>
          </div>
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">
            100% Verified by Citizens
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {(outcomes || []).map((out: any) => (
            <BeforeAfterCard
              key={out.id}
              title={out.title}
              category={out.category}
              location={out.location}
              beforePhoto={out.beforePhoto}
              afterPhoto={out.afterPhoto}
              peopleBenefited={out.peopleBenefited}
              completionTime={out.completionTime}
              projectCostINR={out.projectCostINR}
              partnerName={out.partnerName}
            />
          ))}
        </div>
      </div>

      {/* 15. Closing Inspirational Civic Note */}
      <div className="rounded-card border border-border bg-gradient-to-r from-bg to-primary-soft/30 p-8 text-center shadow-card">
        <blockquote className="italic font-medium text-slate-700 sm:text-base">
          “Your voice started the journey. Evidence made it visible. Impact made it actionable. Action created change.”
        </blockquote>
        <p className="mt-2 text-xs font-bold text-primary tracking-widest uppercase">
          Janavaaj · Civic Intelligence Network
        </p>
      </div>
    </div>
  );
}
