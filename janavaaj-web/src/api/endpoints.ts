import { apiGet, apiGetPaged, apiPost, apiPut, apiDelete, http } from './client';
import type { ApiEnvelope } from './types';
import type { AuthUser } from '../lib/roles';
import type {
  AuthResponse,
  RefreshResponse,
  OtpRequestResponse,
  Category,
  PublicStats,
  LeaderboardEntry,
  FeedItem,
  NgoPublicProfile,
  CreateRequestPayload,
  CreateRequestResult,
  CitizenRequestListItem,
  RequestDetail,
  StatusHistoryItem,
  Rating,
  SubmitRatingResult,
  NotificationItem,
  UploadResult,
  NgoOpenRequest,
  NgoClaim,
  ClaimResult,
  HelperSuggestion,
  Helper,
  HeatMapPoint,
  NgoProfile,
  NgoStats,
  AdminDashboard,
  AdminProgress,
  AdminRequestListItem,
  CreateNgoResult,
  AdminNgoListItem,
  CitizenListItem,
  VolunteerRequest,
  VerificationStatusResponse,
  PaginationMeta,
} from './types';

/* ------------------------------- Auth ------------------------------- */
export const authApi = {
  requestOtp: (phone: string) => apiPost<OtpRequestResponse>('/auth/otp/request', { phone }),
  verifyOtp: (phone: string, code: string) =>
    apiPost<AuthResponse>('/auth/otp/verify', { phone, code }),
  login: (email: string, password: string) =>
    apiPost<AuthResponse>('/auth/login', { email, password }),
  registerCitizen: (data: { name: string; email?: string; phone?: string; password?: string }) =>
    apiPost<AuthResponse>('/auth/register/citizen', data),
  registerNgo: (data: { name: string; email: string; phone?: string; registrationNumber: string; description?: string; password?: string }) =>
    apiPost<AuthResponse>('/auth/register/ngo', data),
  refresh: (refreshToken: string) => apiPost<RefreshResponse>('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string | null) => apiPost<unknown>('/auth/logout', { refreshToken }),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiPost<unknown>('/auth/change-password', { oldPassword, newPassword }),
};

/* ------------------------------- User ------------------------------- */
export const userApi = {
  me: () => apiGet<AuthUser>('/me'),
  updateMe: (body: { name?: string; bio?: string; avatarUrl?: string }) =>
    apiPut<AuthUser>('/me', body),
};

/* ------------------------------ Public ------------------------------ */
export const publicApi = {
  stats: () => apiGet<PublicStats>('/public/stats'),
  recordVisit: () => apiPost<unknown>('/public/visit', {}),
  feed: (params?: { page?: number; size?: number; categorySlug?: string; status?: string }) =>
    apiGetPaged<FeedItem[]>('/public/feed', { params }),
  categories: () => apiGet<Category[]>('/public/categories'),
  leaderboard: () => apiGet<LeaderboardEntry[]>('/public/leaderboard'),
  ngoProfile: (id: number) => apiGet<NgoPublicProfile>(`/public/ngos/${id}/profile`),
};

/* ------------------------------ Uploads ----------------------------- */
export async function uploadFiles(files: File[]): Promise<UploadResult[]> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await http.post<ApiEnvelope<UploadResult[]>>('/uploads', form);
  return (res.data.data ?? []) as UploadResult[];
}

/* ----------------------------- Requests ----------------------------- */
export const requestApi = {
  create: (payload: CreateRequestPayload) =>
    apiPost<CreateRequestResult>('/requests', payload),
  listOwn: (page = 0, size = 20) =>
    apiGetPaged<CitizenRequestListItem[]>('/requests', { params: { page, size } }),
  getById: (id: number) => apiGet<RequestDetail>(`/requests/${id}`),
  getHistory: (id: number) => apiGet<StatusHistoryItem[]>(`/requests/${id}/history`),
  getRating: (id: number) => apiGet<Rating | null>(`/requests/${id}/rating`),
  submitRating: (id: number, stars: number, comment?: string) =>
    apiPost<SubmitRatingResult>(`/requests/${id}/rating`, { stars, comment }),
};

/* --------------------------- Notifications -------------------------- */
export const notificationApi = {
  list: () => apiGet<NotificationItem[]>('/notifications'),
  unreadCount: () => apiGet<{ count: number }>('/notifications/unread-count'),
  markRead: (id: number) => apiPost<unknown>(`/notifications/${id}/read`, {}),
  markAllRead: () => apiPost<unknown>('/notifications/read-all', {}),
};

/* ------------------------------- NGO -------------------------------- */
export const ngoApi = {
  me: () => apiGet<NgoProfile>('/ngo/me'),
  updateMe: (body: Partial<NgoProfile>) => apiPut<NgoProfile>('/ngo/me', body),
  openRequests: () => apiGet<NgoOpenRequest[]>('/ngo/requests'),
  requestById: (id: number) => apiGet<RequestDetail>(`/ngo/requests/${id}`),
  claim: (id: number) => apiPost<ClaimResult>(`/ngo/requests/${id}/claim`, {}),
  reject: (id: number, reason: string) =>
    apiPost<unknown>(`/ngo/requests/${id}/reject`, { reason }),
  listClaims: () => apiGet<NgoClaim[]>('/ngo/claims'),
  helperSuggestions: (claimId: number) =>
    apiGet<HelperSuggestion[]>(`/ngo/claims/${claimId}/helper-suggestions`),
  assignHelper: (claimId: number, helperId: number, note?: string) =>
    apiPost<unknown>(`/ngo/claims/${claimId}/assign`, { helperId, note }),
  startWork: (claimId: number) => apiPost<unknown>(`/ngo/claims/${claimId}/start`, {}),
  attachPhoto: (claimId: number, kind: 'BEFORE' | 'AFTER', uploadId: string) =>
    apiPost<unknown>(`/ngo/claims/${claimId}/photos`, { kind, uploadId }),
  completeWork: (claimId: number) => apiPost<unknown>(`/ngo/claims/${claimId}/complete`, {}),
  abandonClaim: (claimId: number, reason: string) =>
    apiPost<unknown>(`/ngo/claims/${claimId}/abandon`, { reason }),
  heatmap: () => apiGet<HeatMapPoint[]>('/ngo/heatmap'),
  history: () => apiGet<NgoClaim[]>('/ngo/history'),
  stats: () => apiGet<NgoStats>('/ngo/stats'),
  listHelpers: () => apiGet<Helper[]>('/ngo/helpers'),
  createHelper: (body: {
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    areaLabel?: string;
    photoUrl?: string;
  }) => apiPost<Helper>('/ngo/helpers', body),
  updateHelper: (id: number, body: Partial<Helper>) => apiPut<Helper>(`/ngo/helpers/${id}`, body),
  deleteHelper: (id: number) => apiDelete<unknown>(`/ngo/helpers/${id}`),
};

/* ------------------------------ Admin ------------------------------- */
export const adminApi = {
  dashboard: () => apiGet<AdminDashboard>('/admin/dashboard'),
  progress: () => apiGet<AdminProgress>('/admin/progress'),
  auditLog: () => apiGetPaged<unknown[]>('/admin/audit-log'),
  requests: (params?: { status?: string; page?: number; size?: number }) =>
    apiGetPaged<AdminRequestListItem[]>('/admin/requests', { params }),
  requestDetails: (id: number) => apiGet<Record<string, unknown>>(`/admin/requests/${id}`),
  approve: (id: number, note: string) => apiPost<unknown>(`/admin/requests/${id}/approve`, { note }),
  markFake: (id: number, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/mark-fake`, { note }),
  setCategory: (id: number, categoryId: number, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/set-category`, { categoryId, note }),
  setBudget: (id: number, approvedBudget: number, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/set-budget`, { approvedBudget, note }),
  close: (id: number, note: string) => apiPost<unknown>(`/admin/requests/${id}/close`, { note }),
  release: (id: number, note: string) => apiPost<unknown>(`/admin/requests/${id}/release`, { note }),
  takeOver: (id: number, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/take-over`, { note }),
  rejectProof: (id: number, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/reject-proof`, { note }),
  overrideStatus: (id: number, status: string, note: string) =>
    apiPost<unknown>(`/admin/requests/${id}/override-status`, { status, note }),
  listNgos: () => apiGet<AdminNgoListItem[]>('/admin/ngos'),
  createNgo: (body: {
    name: string;
    email: string;
    registrationNumber: string;
    latitude: number;
    longitude: number;
    contactPhone?: string;
    description?: string;
    serviceRadiusKm?: number;
    areaLabel?: string;
  }) => apiPost<CreateNgoResult>('/admin/ngos', body),
  deleteNgo: (id: number) => apiDelete<unknown>(`/admin/ngos/${id}`),
  listCitizens: () => apiGet<CitizenListItem[]>('/admin/citizens'),
  verifyCitizen: (id: number) => apiPost<unknown>(`/admin/citizens/${id}/verify`, {}),
  suspendCitizen: (id: number) => apiPost<unknown>(`/admin/citizens/${id}/suspend`, {}),
  reactivateCitizen: (id: number) => apiPost<unknown>(`/admin/citizens/${id}/reactivate`, {}),
  grantReward: (body: { userId: number; points: number; reason: string; requestId?: number }) =>
    apiPost<unknown>('/admin/rewards/grant', body),
};

/* ---------------------------- Volunteer ----------------------------- */
export const volunteerApi = {
  requests: () => apiGet<VolunteerRequest[]>('/volunteer/requests'),
  recordAction: (
    id: number,
    body: { outcome: string; note?: string; proofPhotoUrl?: string }
  ) => apiPost<unknown>(`/volunteer/requests/${id}/actions`, body),
  applyVerification: (body?: { note?: string }) =>
    apiPost<unknown>('/volunteer/verification', body ?? {}),
  verificationStatus: () => apiGet<VerificationStatusResponse>('/volunteer/verification'),
};

/* ---------------------------- Dashboard ----------------------------- */
export const dashboardApi = {
  // Citizen
  citizenSummary: () => apiGet<any>('/dashboard/citizen/summary'),
  citizenCategories: () => apiGet<any[]>('/dashboard/citizen/categories'),
  citizenActivityTrend: (range = '30d') =>
    apiGet<any[]>(`/dashboard/citizen/activity-trend?range=${range}`),
  citizenStatusBreakdown: () => apiGet<any[]>('/dashboard/citizen/status-breakdown'),
  citizenTopReports: () => apiGet<any[]>('/dashboard/citizen/top-reports'),
  citizenRecentActivity: () => apiGet<any[]>('/dashboard/citizen/recent-activity'),
  citizenPeopleImpacted: () => apiGet<any>('/dashboard/citizen/people-impacted'),
  citizenInsight: () => apiGet<any>('/dashboard/citizen/insight'),
  citizenOutcomes: () => apiGet<any[]>('/dashboard/citizen/outcomes'),

  // NGO / CSR
  ngoSummary: () => apiGet<any>('/dashboard/ngo/summary'),
  ngoContributionBreakdown: () => apiGet<any[]>('/dashboard/ngo/contribution-breakdown'),
  ngoContributionTrend: (metric = 'amount') =>
    apiGet<any[]>(`/dashboard/ngo/contribution-trend?metric=${metric}`),
  ngoPeopleBenefited: () => apiGet<any[]>('/dashboard/ngo/people-benefited'),
  ngoPortfolioStatus: () => apiGet<any[]>('/dashboard/ngo/portfolio-status'),
  ngoFunding: () => apiGet<any>('/dashboard/ngo/funding'),
  ngoTaxTracking: () => apiGet<any>('/dashboard/ngo/tax-tracking'),
  ngoImpactRoi: () => apiGet<any>('/dashboard/ngo/impact-roi'),
  ngoInsights: () => apiGet<any[]>('/dashboard/ngo/insights'),
  projects: () => apiGet<any[]>('/projects'),
  adoptProject: (id: string | number) => apiPost<any>(`/projects/${id}/adopt`, {}),
  commitContribution: (body: { amountINR: number; projectId?: string }) =>
    apiPost<any>('/funding/contributions', body),

  // Policy / Command Center
  policySummary: () => apiGet<any>('/dashboard/policy/summary'),
  policyPriorityIssues: () => apiGet<any[]>('/dashboard/policy/priority-issues'),
  policyImpactVsComplaints: () => apiGet<any[]>('/dashboard/policy/impact-vs-complaints'),
  policyCategories: () => apiGet<any[]>('/dashboard/policy/categories'),
  policyLocations: () => apiGet<any[]>('/dashboard/policy/locations'),
  policyTrend: (range = '30d') => apiGet<any[]>(`/dashboard/policy/trend?range=${range}`),
  policyHotspots: () => apiGet<any[]>('/dashboard/policy/hotspots'),
  policyInsights: () => apiGet<any[]>('/dashboard/policy/insights'),
  policyPipeline: () => apiGet<any[]>('/dashboard/policy/pipeline'),
  policyProjects: () => apiGet<any[]>('/dashboard/policy/projects'),
  policyFunding: () => apiGet<any>('/dashboard/policy/funding'),
  policyNetwork: () => apiGet<any>('/dashboard/policy/network'),
  policyResolutionFunnel: () => apiGet<any[]>('/dashboard/policy/resolution-funnel'),
  policyOutcomes: () => apiGet<any>('/dashboard/policy/outcomes'),
  policyExecutiveSummary: () => apiGet<any>('/dashboard/policy/executive-summary'),

  // Map
  mapIssues: () => apiGet<any[]>('/map/issues'),
  mapHotspots: () => apiGet<any[]>('/map/hotspots'),
  mapProjects: () => apiGet<any[]>('/map/projects'),

  // Verification & Milestones
  verificationQueue: () => apiGet<any[]>('/verification/queue'),
  verificationDecision: (id: number | string, decision: string, reason?: string) =>
    apiPost<any>(`/verification/${id}/decision`, { decision, reason }),
  milestones: () => apiGet<any[]>('/milestones'),
  approveMilestone: (id: number | string) => apiPost<any>(`/milestones/${id}/approve`, {}),

  // Reports
  createReport: (body: { type: string; scope: string; period: string }) =>
    apiPost<any>('/reports', body),
};

/* ------------------------------- AI --------------------------------- */
export const aiApi = {
  chat: (body: { message: string; context?: any; language?: string }) =>
    apiPost<any>('/ai/chat', body),
  analyzeComplaint: (body: {
    description: string;
    categoryId?: number;
    latitude?: number;
    longitude?: number;
    addressText?: string;
    language?: string;
  }) => apiPost<any>('/complaints/analyze', body),
  analyzeImage: (formData: FormData) => apiPost<any>('/ai/image-analyze', formData),
  transcribeSpeech: (language = 'en') => apiPost<any>('/speech/transcribe', { language }),
};

export type { PaginationMeta };

