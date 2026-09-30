/**
 * Roles reconciled to the REAL backend (DB enum): CITIZEN | NGO | ADMIN.
 * (The original spec's CITIZEN / NGO_CSR / POLICYMAKER model was mapped:
 *  NGO_CSR -> NGO, POLICYMAKER -> ADMIN.)
 */
export type UserRole = 'CITIZEN' | 'NGO' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Shape returned by the backend in the auth response `user` object and GET /me. */
export interface AuthUser {
  id: number;
  phone: string | null;
  email: string | null;
  role: UserRole;
  name: string | null;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  avatarUrl?: string | null;
  bio?: string | null;
  rewardsBalance?: number;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface RoleConfig {
  name: string;
  description: string;
  dashboardPath: string;
  badgeLabel: string;
  /** Tailwind text color token used for accenting the role. */
  accent: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  CITIZEN: {
    name: 'Citizen',
    description: 'Report civic issues, track resolutions and earn impact rewards',
    dashboardPath: '/app/citizen',
    badgeLabel: 'Citizen Voice',
    accent: 'text-primary',
  },
  NGO: {
    name: 'NGO Partner',
    description: 'Claim verified requests, dispatch helpers and resolve on the ground',
    dashboardPath: '/app/ngo',
    badgeLabel: 'Impact Partner',
    accent: 'text-partner',
  },
  ADMIN: {
    name: 'Administrator',
    description: 'Review flagged reports, oversee SLAs and manage the network',
    dashboardPath: '/app/admin',
    badgeLabel: 'Civic Command',
    accent: 'text-warning',
  },
};

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_CONFIGS[role].dashboardPath;
}
