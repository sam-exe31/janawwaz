/**
 * Indian Number Formatting and Localization Utilities
 * Standards: 3.8 Lakh, ₹2.8 Cr, 18,420
 */

export function formatPeople(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1).replace(/\.0$/, '')} Lakh`;
  }
  if (num >= 1000) {
    return num.toLocaleString('en-IN');
  }
  return num.toString();
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')} Lakh`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatCompact(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
