/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date for datetime-local input fields.
 */
export function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

/**
 * Get CSS class for a status badge.
 */
export function getStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase().replace(/[_\s]/g, '');
  switch (normalized) {
    case 'active':
    case 'completed':
      return 'badge-green';
    case 'inactive':
    case 'cancelled':
    case 'expired':
      return 'badge-red';
    case 'inprogress':
    case 'created':
      return 'badge-yellow';
    default:
      return 'badge-gray';
  }
}

/**
 * Format a status string for display.
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract error message from an API error.
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response: { data?: { message?: string }; status: number } }).response;
    if (response.data?.message) return response.data.message;
    if (response.status === 404) return 'Resource not found.';
    if (response.status === 403) return 'You do not have permission for this action.';
    if (response.status === 409) return 'This operation conflicts with existing data.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

/**
 * Format a number with thousand separators.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US');
}
