/** Map a request status to a marker colour (matches the Tailwind palette). */
export function statusColor(status: string): string {
  const s = String(status || '').toUpperCase();
  if (s === 'CLOSED' || s === 'COMPLETED') return '#16A34A'; // success
  if (s === 'REJECTED_FAKE' || s === 'REJECTED_BY_NGO') return '#DC2626'; // danger
  if (s === 'OPEN') return '#3346B8'; // primary
  if (s === 'NEEDS_ADMIN_REVIEW') return '#D97706'; // warning
  return '#2563EB'; // info — claimed / assigned / in-progress
}

/** Marker radius from a heat-map bucket count. */
export function countRadius(count: number): number {
  if (count >= 20) return 22;
  if (count >= 10) return 17;
  if (count >= 5) return 13;
  if (count >= 2) return 10;
  return 8;
}
