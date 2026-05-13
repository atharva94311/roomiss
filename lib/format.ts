/**
 * Shared date/time formatting + comparator helpers.
 *
 * Every page that displays "X minutes ago" or sorts by createdAt used to
 * inline its own copy of this logic, which meant every page was its own
 * crash surface when a database row arrived with a null timestamp. (`new
 * Date(undefined).getTime()` → NaN; `null.localeCompare(...)` → TypeError.)
 *
 * The helpers below all accept `string | null | undefined` and degrade to a
 * stable fallback ("—") for missing data, so a single bad row never takes
 * the whole page down.
 */

/** Short relative form: `now / 3m / 4h / 2d`. Returns "—" for null/invalid. */
export function fmtAgo(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const ms = Date.now() - t;
  const m = Math.round(ms / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

/**
 * Long relative form for chat/request lists. Same `now/Xm/Xh/Xd` for the
 * first week, then falls back to a locale date string ("Jan 4"). Used where
 * we want a date for older items rather than "47d ago".
 */
export function fmtAgoLong(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const ms = Date.now() - t;
  const days = ms / 86_400_000;
  if (days < 7) return fmtAgo(iso);
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Day-only form used by /blocked: `today / Xd ago / locale date past 7d`.
 * The locale-date tail keeps long-gone blocks readable ("Apr 12") instead of
 * piling up indefinitely as "47d ago".
 */
export function fmtDaysAgo(iso?: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const d = Math.round((Date.now() - t) / 86_400_000);
  if (d < 1) return "today";
  if (d < 7) return `${d}d ago`;
  return new Date(t).toLocaleDateString();
}

/**
 * Descending ISO-timestamp comparator that null-coerces both sides to `""`,
 * which sorts before any real ISO string lexicographically — so missing
 * dates sink to the bottom of a newest-first list. The point is to never
 * call `.localeCompare` on a possibly-null value.
 */
export function cmpIsoDesc(a?: string | null, b?: string | null): number {
  return (b ?? "").localeCompare(a ?? "");
}

/** Ascending counterpart of `cmpIsoDesc`. */
export function cmpIsoAsc(a?: string | null, b?: string | null): number {
  return (a ?? "").localeCompare(b ?? "");
}
