/** "YYYY-MM-DD" for a Date in the browser's local time zone. */
export function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "09:00" from "2026-10-24T09:00:00". */
export function timeOf(localDateTime: string): string {
  return localDateTime.substring(11, 16);
}

/** "2026-10-24T09:00" — the format a native <input type="datetime-local"> needs. */
export function toDateTimeLocal(localDateTime: string): string {
  return localDateTime.substring(0, 16);
}

/** "Sat, 24 Oct 2026" from "2026-10-24T09:00:00". */
export function prettyDate(localDateTime: string): string {
  const [y, m, d] = localDateTime.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
