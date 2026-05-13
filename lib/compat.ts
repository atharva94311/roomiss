// Client-side compatibility scoring is now a thin wrapper around the SQL
// functions `public.compat(a, b)` and `public.compat_user_vs_group(uid, gid)`.
// The local fallback below matches the SQL formula so the browse list paints
// instantly while the real scores fetch in the background.
//
// Source of truth lives in `0017_compat_functions.sql`. Keep these in sync.

import type { Profile } from "./types";
import { supabase } from "./supabase/client";

const SLEEP_DIST: Record<string, Record<string, number>> = {
  early: { early: 1, flexible: 0.5, night: 0 },
  flexible: { early: 0.5, flexible: 1, night: 0.5 },
  night: { early: 0, flexible: 0.5, night: 1 },
};

function stepWithin(a: number, b: number) {
  const d = Math.abs(a - b);
  return d <= 1 ? 1 : d === 2 ? 0.5 : 0;
}

function cleanScore(a: Profile["cleanliness"], b: Profile["cleanliness"]) {
  const v = { tidy: 1, average: 2, messy: 3 } as const;
  return stepWithin(v[a], v[b]);
}
function noiseScore(a: Profile["noiseTolerance"], b: Profile["noiseTolerance"]) {
  const v = { low: 1, medium: 2, high: 3 } as const;
  return stepWithin(v[a], v[b]);
}
function habitScore(a: Profile["smoking"], b: Profile["smoking"]) {
  const v = { never: 1, rarely: 2, regularly: 3 } as const;
  return stepWithin(v[a], v[b]);
}
function foodScore(a: Profile["foodPref"], b: Profile["foodPref"]) {
  if (a === b) return 1;
  if ((a === "veg" && b === "non_veg") || (a === "non_veg" && b === "veg")) return 0;
  if (a === "eggetarian" || b === "eggetarian") return 0.5;
  if ((a === "jain" && b === "veg") || (a === "veg" && b === "jain")) return 0.5;
  return 0;
}

/**
 * Local mirror of `public.compat(a, b)` — used for instant paint. Authoritative
 * server value comes from {@link compatServer}.
 */
export function compatScore(me: Profile, them: Profile): number {
  if (me.userId === them.userId) return 100;
  const hard =
    (me.foodPref === "veg" && them.foodPref === "non_veg") ||
    (me.foodPref === "non_veg" && them.foodPref === "veg");
  const raw =
    25 * (SLEEP_DIST[me.sleepSchedule]?.[them.sleepSchedule] ?? 0) +
    20 * foodScore(me.foodPref, them.foodPref) +
    15 * cleanScore(me.cleanliness, them.cleanliness) +
    10 * habitScore(me.smoking, them.smoking) +
    10 * habitScore(me.drinking, them.drinking) +
    10 * noiseScore(me.noiseTolerance, them.noiseTolerance) +
    10 * stepWithin(me.socialScore, them.socialScore);
  const s = Math.round(raw);
  return hard ? Math.min(50, s) : s;
}

export function avgCompatVsGroup(me: Profile, group: Profile[]): number {
  if (group.length === 0) return 0;
  return Math.round(group.reduce((s, p) => s + compatScore(me, p), 0) / group.length);
}

// ─── Server-backed (authoritative) scoring ───────────────────────
// Cached per session so the browse list doesn't issue dozens of RPCs.
const scoreCache = new Map<string, number>();
const breakdownCache = new Map<string, CompatBreakdown>();
const groupScoreCache = new Map<string, number>();
const k2 = (a: string, b: string) => `${a}|${b}`;

export async function compatServer(a: string, b: string): Promise<number> {
  const key = k2(a, b);
  if (scoreCache.has(key)) return scoreCache.get(key)!;
  const { data, error } = await supabase.rpc("compat", { a, b });
  if (error || data == null) return -1;
  const v = Number(data);
  scoreCache.set(key, v);
  return v;
}

/**
 * Batch compat: one round-trip to score me vs every `targetId`. Results land
 * in the same per-pair cache that {@link compatServer} reads, so subsequent
 * single-pair lookups are instant.
 */
export async function compatMany(
  meUserId: string,
  targetIds: string[],
): Promise<Map<string, number>> {
  const need = targetIds.filter((id) => !scoreCache.has(k2(meUserId, id)));
  if (need.length === 0) {
    const out = new Map<string, number>();
    targetIds.forEach((id) => out.set(id, scoreCache.get(k2(meUserId, id))!));
    return out;
  }
  const { data, error } = await supabase.rpc("compat_many", { target_ids: need });
  const out = new Map<string, number>();
  if (!error && Array.isArray(data)) {
    for (const row of data) {
      const v = Number(row.score);
      scoreCache.set(k2(meUserId, row.target_id), v);
      out.set(row.target_id, v);
    }
  }
  // Backfill from cache for items we already had.
  targetIds.forEach((id) => {
    if (!out.has(id) && scoreCache.has(k2(meUserId, id))) {
      out.set(id, scoreCache.get(k2(meUserId, id))!);
    }
  });
  return out;
}

export interface CompatBreakdown {
  score: number;
  capped: boolean;
  axes: Record<
    "sleep" | "food" | "clean" | "smoke" | "drink" | "noise" | "social",
    { weight: number; earned: number }
  >;
}

export async function compatBreakdown(a: string, b: string): Promise<CompatBreakdown | null> {
  const key = k2(a, b);
  if (breakdownCache.has(key)) return breakdownCache.get(key)!;
  const { data, error } = await supabase.rpc("compat_breakdown", { a, b });
  if (error || !data) return null;
  const parsed = data as unknown as CompatBreakdown;
  breakdownCache.set(key, parsed);
  return parsed;
}

export async function compatVsGroup(uid: string, gid: string): Promise<number> {
  const key = k2(uid, gid);
  if (groupScoreCache.has(key)) return groupScoreCache.get(key)!;
  const { data, error } = await supabase.rpc("compat_user_vs_group", { uid, gid });
  if (error || data == null) return -1;
  const v = Number(data);
  groupScoreCache.set(key, v);
  return v;
}

export function clearCompatCache() {
  scoreCache.clear();
  breakdownCache.clear();
  groupScoreCache.clear();
}
