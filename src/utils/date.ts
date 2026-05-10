/**
 * Returns today's date as YYYY-MM-DD in the device's local timezone.
 * Use this instead of new Date().toISOString().split('T')[0] which uses UTC.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
