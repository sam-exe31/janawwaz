import type { AuthUser, UserRole, VerificationStatus } from '../lib/roles';
import type { ComplaintStatus } from '../lib/statusGroups';

/** Standard response envelope used by every endpoint. */
export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiErrorBody;
}

export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

/* ------------------------------- Auth ------------------------------- */

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
}

/* ------------------------------ Public ------------------------------ */

export interface Category {
  id: number;
  name: string;
  slug: string;
  basePriority: number;
  expectedResolutionHours: number;
  typicalBudgetMin: number;
  typicalBudgetMax: number;
}

export interface PublicStats {
  totalRequests: number;
  resolvedRequests: number;
  openRequests: number;
  inProgressRequests: number;
  activeNgos: number;
  avgResolutionHours: number;
  siteVisits: number;
  coverageCity: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  logoUrl: string | null;
  areaLabel: string | null;
  rankScore: number;
  totalCompleted: number;
  avgRating: number | null;
  avgResolutionHours: number | null;
}

export interface FeedPhoto {
  kind: string;
  url: string;
}

export interface FeedItem {
  id: number;
  categoryName: string;
  categorySlug: string;
  status: ComplaintStatus;
  description: string | null;
  aiSummary: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  finalPriority: number | null;
  reporterMaskedName: string | null;
  claimedNgoName: string | null;
  createdAt: string;
  closedAt: string | null;
  photos: FeedPhoto[];
}

export interface NgoPublicProfile {
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  areaLabel: string | null;
  avgRating: number | null;
  totalCompleted: number;
  avgResolutionHours: number | null;
  leaderboardPosition: number | null;
  recentCompletedWork: FeedItem[];
}

/* ------------------------------ Requests ---------------------------- */

export interface CreateRequestPayload {
  categoryId: number;
  description?: string;
  latitude: number;
  longitude: number;
  addressText?: string;
  photoUploadIds?: string[];
  voiceUploadId?: string;
  inputType: 'PHOTO' | 'GEOTAGGED_PHOTO' | 'VOICE';
}

export interface CreateRequestResult {
  id: number;
  status: ComplaintStatus;
  message: string;
}

export interface CitizenRequestListItem {
  id: number;
  categoryId: number;
  categoryName: string;
  status: ComplaintStatus;
  inputType: string;
  description: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  finalPriority: number | null;
  createdAt: string;
  closedAt: string | null;
}

export interface RequestPhoto {
  id: number;
  kind: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  exifLat: number | null;
  exifLng: number | null;
  exifTakenAt: string | null;
  createdAt: string;
}

export interface RequestDetail {
  id: number;
  citizenId: number;
  citizenName: string | null;
  citizenPhone: string | null;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  inputType: string;
  source: string;
  description: string | null;
  aiSummary: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  status: ComplaintStatus;
  clusterId: number | null;
  isClusterParent: boolean;
  finalPriority: number | null;
  aiBudgetMin: number | null;
  aiBudgetMax: number | null;
  approvedBudget: number | null;
  voiceUrl: string | null;
  escalatedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  photos: RequestPhoto[];
}

export interface StatusHistoryItem {
  id: number;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  actorRole: UserRole | null;
  note: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface Rating {
  id: number;
  stars: number;
  comment: string | null;
  createdAt: string;
  citizenName: string | null;
}

export interface SubmitRatingResult {
  ratingId: number;
  requestId: number;
  ngoId: number;
  stars: number;
  comment: string | null;
  newNgoAvgRating: number | null;
}

/* --------------------------- Notifications -------------------------- */

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  requestId: number | null;
  readAt: string | null;
  createdAt: string;
}

/* ----------------------------- Uploads ------------------------------ */

export interface UploadResult {
  uploadId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  exifLat: number | null;
  exifLng: number | null;
  exifTakenAt: string | null;
}

/* ------------------------------- NGO -------------------------------- */

export interface NgoOpenRequest {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  status: ComplaintStatus;
  description: string | null;
  aiSummary: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  finalPriority: number | null;
  aiBudgetMin: number | null;
  aiBudgetMax: number | null;
  distanceKm: number | null;
  clusterSize: number | null;
  createdAt: string;
}

export interface NgoClaim {
  claimId: number;
  requestId: number;
  status: ComplaintStatus;
  categoryName?: string;
  description?: string | null;
  addressText?: string | null;
  latitude?: number;
  longitude?: number;
  finalPriority?: number | null;
  assignedHelperId?: number | null;
  assignedHelperName?: string | null;
  claimedAt?: string;
  createdAt?: string;
}

export interface ClaimResult {
  claimId: number;
  requestId: number;
  status: ComplaintStatus;
  message: string;
}

export interface HelperSuggestion {
  id: number;
  name: string;
  phone: string;
  areaLabel: string | null;
  distanceKm: number | null;
  activeAssignments: number;
  photoUrl: string | null;
}

export interface Helper {
  id: number;
  name: string;
  phone: string;
  areaLabel: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  activeAssignments?: number;
  createdAt?: string;
}

export interface HeatMapPoint {
  lat: number;
  lng: number;
  count: number;
  avgPriority: number | null;
  topCategory: string | null;
}

export interface NgoProfile {
  id: number;
  name: string;
  email: string | null;
  logoUrl: string | null;
  description: string | null;
  areaLabel: string | null;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  avgRating: number | null;
  rankScore: number | null;
  totalCompleted: number;
}

export interface NgoStats {
  activeClaims: number;
  completed: number;
  avgRating: number | null;
  rankScore: number | null;
  claimsToday: number;
  maxClaimsPerDay: number;
  maxConcurrentClaims: number;
}

/* ------------------------------ Admin ------------------------------- */

export interface AdminDashboard {
  citizens: {
    total: number;
    verified: number;
    suspended: number;
    currentlyLoggedIn: number;
  };
  ngos: {
    total: number;
    verified: number;
  };
  requestsByStatus: Record<string, number>;
  requestsByCategory: Array<{ categoryName: string; slug: string; count: number }>;
  visitorHistory: Array<{ visitDate: string; count: number }>;
}

export interface AdminProgress {
  completed: { count: number };
  pending: { count: number; escalatedCount: number };
  inProcess: { count: number };
  rejectedByNgo: { count: number };
}

export interface AdminRequestListItem {
  id: number;
  categoryName: string;
  categorySlug?: string;
  status: ComplaintStatus;
  description: string | null;
  aiSummary?: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  finalPriority: number | null;
  escalatedAt?: string | null;
  createdAt: string;
}

export interface CreateNgoResult {
  ngoId: number;
  userId: number;
  email: string;
  temporaryPassword: string;
  message: string;
}

export interface AdminNgoListItem {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  areaLabel: string | null;
  serviceRadiusKm: number;
  avgRating: number | null;
  rankScore: number | null;
  totalCompleted: number;
  deactivatedAt: string | null;
}

export interface CitizenListItem {
  id: number;
  name: string | null;
  phone: string | null;
  status: string;
  verificationStatus: VerificationStatus;
  totalRequests?: number;
  createdAt: string;
  lastLoginAt: string | null;
}

/* ---------------------------- Volunteer ----------------------------- */

export interface VolunteerRequest {
  id: number;
  categoryName: string;
  categorySlug: string;
  status: ComplaintStatus;
  description: string | null;
  aiSummary: string | null;
  latitude: number;
  longitude: number;
  addressText: string | null;
  finalPriority: number | null;
  aiBudgetMin: number | null;
  aiBudgetMax: number | null;
  citizenPhoneMasked: string | null;
  escalatedAt: string | null;
  createdAt: string;
}

export interface VerificationStatusResponse {
  verificationStatus: VerificationStatus;
  canApply: boolean;
}

/* =========================================================================
   Intelligence Dashboard, Map, and AI Assistant Types
   ========================================================================= */

export interface CitizenDashboardSummary {
  myComplaints: number;
  verified: number;
  inProgress: number;
  resolved: number;
  peopleImpacted: number;
  impactCreatedLabel: string;
}

export interface CategoryDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface ActivityTrendItem {
  period: string;
  reports: number;
  resolved: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface TopReportItem {
  id: string;
  title: string;
  location: string;
  peopleAffected: number;
  impactScore: number;
  status: string;
  category: string;
  date: string;
}

export interface RecentActivityItem {
  id: number;
  complaintId: string;
  title: string;
  description: string;
  timeAgo: string;
  type: string;
}

export interface ResolvedOutcomeItem {
  id: string;
  title: string;
  category: string;
  location: string;
  beforePhoto: string;
  afterPhoto: string;
  peopleBenefited: number;
  completionTime: string;
  projectCostINR: number;
  partnerName: string;
  verified: boolean;
  closedAt: string;
}

export interface NgoDashboardSummary {
  projectsSupported: number;
  peopleBenefited: number;
  totalContributionINR: number;
  projectsCompleted: number;
  activeProjects: number;
  impactScoreGenerated: number;
  portfolio: {
    totalContributionINR: number;
    projects: number;
    peopleAffected: number;
    peopleBenefited: number;
    infrastructureImproved: number;
    projectsCompleted: number;
    avgCompletionTimeDays: number;
  };
}

export interface NgoContributionItem {
  category: string;
  amountINR: number;
  percentage: number;
}

export interface NgoFundingTracker {
  committedINR: number;
  releasedINR: number;
  pendingINR: number;
  utilizedINR: number;
  timeline: Array<{
    date: string;
    title: string;
    amountINR: number;
    status: string;
  }>;
}

export interface NgoTaxTracking {
  documentedContributionINR: number;
  eligibleBenefitINR: number;
  documentationPercentage: number;
  certificatesCount: number;
  isIllustrative: boolean;
  fixedDisclaimer: string;
}

export interface PolicyDashboardSummary {
  totalComplaints: number;
  verifiedComplaints: number;
  pendingVerification: number;
  highImpactIssues: number;
  peopleAffected: number;
  activeProjects: number;
  resolvedComplaints: number;
  totalFundingINR: number;
}

export interface PriorityIssueItem {
  id: string;
  issue: string;
  location: string;
  complaintCount: number;
  peopleAffected: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  infrastructureImportance: string;
  evidenceConfidence: number;
  impactScore: number;
  status: string;
}

export interface ImpactScatterPoint {
  name: string;
  complaints: number;
  peopleAffected: number;
  score: number;
  category: string;
  outlier?: boolean;
}

export interface EmergingHotspotItem {
  id: string;
  title: string;
  surgeRate: string;
  zone: string;
  estimatedAffected: number;
  explanation: string;
  severity: string;
}

export interface VerificationQueueItem {
  id: number;
  complaintId: string;
  title: string;
  location: string;
  gpsVerified: boolean;
  imageVerified: boolean;
  gisVerified: boolean;
  duplicateCandidate: boolean;
  evidenceConfidence: number;
  status: string;
  photoUrl: string;
  submittedAt: string;
}

export interface MilestoneItem {
  id: number;
  projectId: string;
  title: string;
  progress: number;
  amountINR: number;
  status: 'RELEASED' | 'AWAITING_VERIFICATION' | 'NOT_STARTED';
  evidenceUrl?: string;
}

export interface DiscoverProjectItem {
  id: string;
  title: string;
  location: string;
  peopleAffected: number;
  impactScore: number;
  fundingRequiredINR: number;
  evidenceConfidence: number;
  category: string;
  status: string;
}

export interface AiChatMessage {
  id?: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  actions?: Array<{ type: string; label: string; payload?: any; to?: string }>;
}

export interface AiComplaintAnalysisResult {
  category: string;
  department: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impactScore: number;
  estimatedPeopleAffected: number;
  confidence: number;
  duplicateWarning: {
    isDuplicateCandidate: boolean;
    existingComplaintId: string;
    title: string;
    distanceMeters: number;
    reportedHoursAgo: number;
    supportCount: number;
  } | null;
  smartFeatures: Array<{ name: string; status: string; note?: string }>;
}

