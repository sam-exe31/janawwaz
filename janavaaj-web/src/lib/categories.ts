import type { LucideIcon } from 'lucide-react';
import {
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  Hammer,
  TreeDeciduous,
  PawPrint,
  Toilet,
  CircleAlert,
} from 'lucide-react';

/**
 * Category metadata comes from the backend: GET /api/v1/public/categories.
 * The frontend never hard-codes business data — this file only maps the REAL
 * category slugs (from V2__seed.sql) to icons, and provides a fallback list
 * used before the API responds.
 */
export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  basePriority?: number;
  expectedResolutionHours?: number;
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
}

/** slug -> lucide icon. Keys are the real seeded slugs. */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  pothole: Construction,
  'garbage-waste': Trash2,
  'streetlight-not-working': Lightbulb,
  'water-leakage-pipe-burst': Droplets,
  'drainage-sewage-blockage': Waves,
  'damaged-public-property': Hammer,
  'fallen-tree-road-obstruction': TreeDeciduous,
  'stray-animal-welfare': PawPrint,
  'public-toilet-sanitation': Toilet,
  other: CircleAlert,
};

export function getCategoryIcon(slug: string | undefined | null): LucideIcon {
  if (!slug) return CircleAlert;
  return CATEGORY_ICON_MAP[slug] ?? CircleAlert;
}

/** Fallback list mirroring the seed (IDs 1-10). Replaced at runtime by the API. */
export const FALLBACK_CATEGORIES: CategoryInfo[] = [
  { id: 1, name: 'Pothole', slug: 'pothole' },
  { id: 2, name: 'Garbage / Waste', slug: 'garbage-waste' },
  { id: 3, name: 'Streetlight Not Working', slug: 'streetlight-not-working' },
  { id: 4, name: 'Water Leakage / Pipe Burst', slug: 'water-leakage-pipe-burst' },
  { id: 5, name: 'Drainage / Sewage Blockage', slug: 'drainage-sewage-blockage' },
  { id: 6, name: 'Damaged Public Property', slug: 'damaged-public-property' },
  { id: 7, name: 'Fallen Tree / Road Obstruction', slug: 'fallen-tree-road-obstruction' },
  { id: 8, name: 'Stray Animal Welfare', slug: 'stray-animal-welfare' },
  { id: 9, name: 'Public Toilet / Sanitation', slug: 'public-toilet-sanitation' },
  { id: 10, name: 'Other', slug: 'other' },
];
