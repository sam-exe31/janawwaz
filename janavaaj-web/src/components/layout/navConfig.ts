import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Newspaper,
  Map,
  Trophy,
  Bell,
  User,
  Sparkles,
  ClipboardCheck,
  Building2,
  ShieldAlert,
  ListChecks,
  IndianRupee,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../lib/roles';

export interface NavItem {
  labelKey: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

const CITIZEN_NAV: NavItem[] = [
  { labelKey: 'dashboard', to: '/app/citizen', icon: LayoutDashboard, end: true },
  { labelKey: 'report', to: '/app/citizen/report', icon: PlusCircle },
  { labelKey: 'myReports', to: '/app/citizen/my-reports', icon: ClipboardList },
  { labelKey: 'map', to: '/app/map', icon: Map },
  { labelKey: 'feed', to: '/app/citizen/feed', icon: Newspaper },
  { labelKey: 'leaderboard', to: '/app/citizen/leaderboard', icon: Trophy },
  { labelKey: 'notifications', to: '/app/citizen/notifications', icon: Bell },
  { labelKey: 'profile', to: '/app/citizen/profile', icon: User },
];

const NGO_NAV: NavItem[] = [
  { labelKey: 'dashboard', to: '/app/ngo', icon: LayoutDashboard, end: true },
  { labelKey: 'discover', to: '/app/ngo/discover', icon: Sparkles },
  { labelKey: 'projects', to: '/app/ngo/projects', icon: ClipboardList },
  { labelKey: 'funding', to: '/app/ngo/funding', icon: IndianRupee },
  { labelKey: 'map', to: '/app/map', icon: Map },
  { labelKey: 'reports', to: '/app/ngo/reports', icon: FileText },
  { labelKey: 'notifications', to: '/app/citizen/notifications', icon: Bell },
];

const ADMIN_NAV: NavItem[] = [
  { labelKey: 'dashboard', to: '/app/policy', icon: LayoutDashboard, end: true },
  { labelKey: 'issues', to: '/app/policy/issues', icon: ShieldAlert },
  { labelKey: 'verification', to: '/app/policy/verification', icon: ClipboardCheck },
  { labelKey: 'projects', to: '/app/policy/projects', icon: ListChecks },
  { labelKey: 'funding', to: '/app/policy/funding', icon: IndianRupee },
  { labelKey: 'partners', to: '/app/policy/partners', icon: Building2 },
  { labelKey: 'map', to: '/app/map', icon: Map },
  { labelKey: 'reports', to: '/app/reports', icon: FileText },
];

export function navForRole(role: UserRole): NavItem[] {
  if (role === 'NGO') return NGO_NAV;
  if (role === 'ADMIN') return ADMIN_NAV;
  return CITIZEN_NAV;
}
