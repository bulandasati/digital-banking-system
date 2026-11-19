/**
 * Safely parse and format dates from the backend.
 * Backend timestamps (e.g., "2026-11-19T19:44:48.901919") are recorded in UTC by cloud databases/servers.
 * If the string lacks a timezone suffix, appending 'Z' ensures the browser treats it as UTC
 * and accurately formats it in Indian Standard Time (IST, UTC+05:30).
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Recent';
  try {
    const str = String(dateStr).trim();
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str);
    const normalized = hasTimezone ? str : `${str}Z`;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatDateOnly = (dateStr) => {
  if (!dateStr) return 'Recent';
  try {
    const str = String(dateStr).trim();
    const hasTimezone = str.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(str);
    const normalized = hasTimezone ? str : `${str}Z`;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};
