/**
 * Tailwind-friendly className combiner.
 * Filters falsy values and joins with spaces. No external deps.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
