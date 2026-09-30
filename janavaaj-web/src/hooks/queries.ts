import { useQuery } from '@tanstack/react-query';
import {
  publicApi,
  requestApi,
  notificationApi,
  ngoApi,
  adminApi,
  volunteerApi,
} from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

/* ------------------------------ Public ------------------------------ */
export const useStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: publicApi.stats });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: publicApi.categories, staleTime: 5 * 60 * 1000 });

export const useLeaderboard = () =>
  useQuery({ queryKey: ['leaderboard'], queryFn: publicApi.leaderboard });

export const useFeed = (params?: {
  page?: number;
  size?: number;
  categorySlug?: string;
  status?: string;
}) => useQuery({ queryKey: ['feed', params], queryFn: () => publicApi.feed(params) });

export const useNgoPublicProfile = (id: number | null) =>
  useQuery({
    queryKey: ['ngoProfile', id],
    queryFn: () => publicApi.ngoProfile(id as number),
    enabled: id != null,
  });

/* ----------------------------- Requests ----------------------------- */
export const useMyRequests = (page = 0, size = 50) =>
  useQuery({ queryKey: ['myRequests', page, size], queryFn: () => requestApi.listOwn(page, size) });

export const useRequestDetail = (id: number | null) =>
  useQuery({
    queryKey: ['request', id],
    queryFn: () => requestApi.getById(id as number),
    enabled: id != null,
  });

export const useRequestHistory = (id: number | null) =>
  useQuery({
    queryKey: ['requestHistory', id],
    queryFn: () => requestApi.getHistory(id as number),
    enabled: id != null,
  });

export const useRequestRating = (id: number | null) =>
  useQuery({
    queryKey: ['requestRating', id],
    queryFn: () => requestApi.getRating(id as number),
    enabled: id != null,
  });

/* --------------------------- Notifications -------------------------- */
export const useNotifications = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.list,
    enabled: isAuth,
  });
};

export const useUnreadCount = () => {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: notificationApi.unreadCount,
    enabled: isAuth,
    refetchInterval: 60 * 1000,
  });
};

/* ------------------------------- NGO -------------------------------- */
export const useNgoMe = () => useQuery({ queryKey: ['ngo', 'me'], queryFn: ngoApi.me });
export const useNgoStats = () => useQuery({ queryKey: ['ngo', 'stats'], queryFn: ngoApi.stats });
export const useNgoOpenRequests = () =>
  useQuery({ queryKey: ['ngo', 'openRequests'], queryFn: ngoApi.openRequests });
export const useNgoClaims = () =>
  useQuery({ queryKey: ['ngo', 'claims'], queryFn: ngoApi.listClaims });
export const useNgoHistory = () =>
  useQuery({ queryKey: ['ngo', 'history'], queryFn: ngoApi.history });
export const useNgoHeatmap = () =>
  useQuery({ queryKey: ['ngo', 'heatmap'], queryFn: ngoApi.heatmap });
export const useHelpers = () => useQuery({ queryKey: ['ngo', 'helpers'], queryFn: ngoApi.listHelpers });
export const useHelperSuggestions = (claimId: number | null) =>
  useQuery({
    queryKey: ['ngo', 'helperSuggestions', claimId],
    queryFn: () => ngoApi.helperSuggestions(claimId as number),
    enabled: claimId != null,
  });

/* ------------------------------ Admin ------------------------------- */
export const useAdminDashboard = () =>
  useQuery({ queryKey: ['admin', 'dashboard'], queryFn: adminApi.dashboard });
export const useAdminProgress = () =>
  useQuery({ queryKey: ['admin', 'progress'], queryFn: adminApi.progress });
export const useAdminRequests = (params?: { status?: string; page?: number; size?: number }) =>
  useQuery({ queryKey: ['admin', 'requests', params], queryFn: () => adminApi.requests(params) });
export const useAdminNgos = () => useQuery({ queryKey: ['admin', 'ngos'], queryFn: adminApi.listNgos });
export const useAdminCitizens = () =>
  useQuery({ queryKey: ['admin', 'citizens'], queryFn: adminApi.listCitizens });

/* ---------------------------- Volunteer ----------------------------- */
export const useVolunteerRequests = () =>
  useQuery({ queryKey: ['volunteer', 'requests'], queryFn: volunteerApi.requests });
export const useVerificationStatus = () =>
  useQuery({ queryKey: ['volunteer', 'verification'], queryFn: volunteerApi.verificationStatus });

/* ------------------------ Citizen Dashboard ------------------------- */
export const useCitizenSummary = () =>
  useQuery({ queryKey: ['citizen', 'summary'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenSummary()) });
export const useCitizenCategories = () =>
  useQuery({ queryKey: ['citizen', 'categories'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenCategories()) });
export const useCitizenActivityTrend = (range = '30d') =>
  useQuery({ queryKey: ['citizen', 'activityTrend', range], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenActivityTrend(range)) });
export const useCitizenStatusBreakdown = () =>
  useQuery({ queryKey: ['citizen', 'statusBreakdown'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenStatusBreakdown()) });
export const useCitizenTopReports = () =>
  useQuery({ queryKey: ['citizen', 'topReports'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenTopReports()) });
export const useCitizenRecentActivity = () =>
  useQuery({ queryKey: ['citizen', 'recentActivity'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenRecentActivity()) });
export const useCitizenPeopleImpacted = () =>
  useQuery({ queryKey: ['citizen', 'peopleImpacted'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenPeopleImpacted()) });
export const useCitizenInsight = () =>
  useQuery({ queryKey: ['citizen', 'insight'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenInsight()) });
export const useCitizenOutcomes = () =>
  useQuery({ queryKey: ['citizen', 'outcomes'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.citizenOutcomes()) });

/* -------------------------- NGO Dashboard --------------------------- */
export const useNgoSummary = () =>
  useQuery({ queryKey: ['ngo', 'dashboardSummary'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoSummary()) });
export const useNgoContributionBreakdown = () =>
  useQuery({ queryKey: ['ngo', 'contributionBreakdown'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoContributionBreakdown()) });
export const useNgoContributionTrend = (metric = 'amount') =>
  useQuery({ queryKey: ['ngo', 'contributionTrend', metric], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoContributionTrend(metric)) });
export const useNgoPeopleBenefited = () =>
  useQuery({ queryKey: ['ngo', 'peopleBenefited'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoPeopleBenefited()) });
export const useNgoPortfolioStatus = () =>
  useQuery({ queryKey: ['ngo', 'portfolioStatus'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoPortfolioStatus()) });
export const useNgoFunding = () =>
  useQuery({ queryKey: ['ngo', 'funding'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoFunding()) });
export const useNgoTaxTracking = () =>
  useQuery({ queryKey: ['ngo', 'taxTracking'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoTaxTracking()) });
export const useNgoImpactRoi = () =>
  useQuery({ queryKey: ['ngo', 'impactRoi'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoImpactRoi()) });
export const useNgoInsights = () =>
  useQuery({ queryKey: ['ngo', 'insights'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.ngoInsights()) });
export const useDiscoverProjects = () =>
  useQuery({ queryKey: ['projects', 'discover'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.projects()) });

/* ------------------------ Policy Dashboard -------------------------- */
export const usePolicySummary = () =>
  useQuery({ queryKey: ['policy', 'summary'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policySummary()) });
export const usePolicyPriorityIssues = () =>
  useQuery({ queryKey: ['policy', 'priorityIssues'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyPriorityIssues()) });
export const usePolicyImpactVsComplaints = () =>
  useQuery({ queryKey: ['policy', 'impactVsComplaints'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyImpactVsComplaints()) });
export const usePolicyCategories = () =>
  useQuery({ queryKey: ['policy', 'categories'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyCategories()) });
export const usePolicyLocations = () =>
  useQuery({ queryKey: ['policy', 'locations'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyLocations()) });
export const usePolicyTrend = (range = '30d') =>
  useQuery({ queryKey: ['policy', 'trend', range], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyTrend(range)) });
export const usePolicyHotspots = () =>
  useQuery({ queryKey: ['policy', 'hotspots'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyHotspots()) });
export const usePolicyInsights = () =>
  useQuery({ queryKey: ['policy', 'insights'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyInsights()) });
export const usePolicyPipeline = () =>
  useQuery({ queryKey: ['policy', 'pipeline'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyPipeline()) });
export const usePolicyProjects = () =>
  useQuery({ queryKey: ['policy', 'projects'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyProjects()) });
export const usePolicyFunding = () =>
  useQuery({ queryKey: ['policy', 'funding'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyFunding()) });
export const usePolicyNetwork = () =>
  useQuery({ queryKey: ['policy', 'network'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyNetwork()) });
export const usePolicyResolutionFunnel = () =>
  useQuery({ queryKey: ['policy', 'resolutionFunnel'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyResolutionFunnel()) });
export const usePolicyOutcomes = () =>
  useQuery({ queryKey: ['policy', 'outcomes'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyOutcomes()) });
export const usePolicyExecutiveSummary = () =>
  useQuery({ queryKey: ['policy', 'executiveSummary'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.policyExecutiveSummary()) });

/* ------------------------------- Map -------------------------------- */
export const useMapIssues = () =>
  useQuery({ queryKey: ['map', 'issues'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.mapIssues()) });
export const useMapHotspots = () =>
  useQuery({ queryKey: ['map', 'hotspots'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.mapHotspots()) });
export const useMapProjects = () =>
  useQuery({ queryKey: ['map', 'projects'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.mapProjects()) });

/* ---------------------------- Verification -------------------------- */
export const useVerificationQueue = () =>
  useQuery({ queryKey: ['verification', 'queue'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.verificationQueue()) });
export const useMilestones = () =>
  useQuery({ queryKey: ['milestones'], queryFn: () => import('../api/endpoints').then(m => m.dashboardApi.milestones()) });

