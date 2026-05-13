"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Wordmark } from "@/components/ui/Wordmark";
import { HallPill } from "@/components/ui/Pills";
import { SoloCard } from "@/components/cards/SoloCard";
import { JointCard } from "@/components/cards/JointCard";
import { ModeToggle } from "@/components/swipe/ModeToggle";
import { SwipeFilters } from "@/components/swipe/SwipeFilters";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { ProfileSheet } from "@/components/swipe/ProfileSheet";
import { FirstUseOverlay } from "@/components/swipe/FirstUseOverlay";
import { SoloCardSkeleton } from "@/components/ui/Skeleton";
import type { SwipeItem } from "@/components/swipe/SwipeCard";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { compatScore, avgCompatVsGroup, compatMany } from "@/lib/compat";
import { cmpIsoDesc } from "@/lib/format";
import { RM } from "@/lib/tokens";
import type { FoodPref, Hall, Profile, SleepSchedule, AcPref, SwipeDecision } from "@/lib/types";
import { useRouter } from "next/navigation";

interface Filters {
  branch?: string;
  state?: string;
  sleep?: SleepSchedule;
  food?: FoodPref;
  ac?: AcPref;
  groupStatus?: "solo" | "partial-2" | "partial-3";
  onlyWithPhoto?: boolean;
  sort?: "best" | "active" | "newest";
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function BrowsePage() {
  const hall = useRoomiss(selectMyHall);
  const myProfile = useRoomiss(selectMyProfile);
  const allProfiles = useRoomiss((s) => s.profiles);
  const allUsers = useRoomiss((s) => s.users);
  const groups = useRoomiss((s) => s.groups);
  const blocks = useRoomiss((s) => s.blocks);
  const meId = useRoomiss((s) => s.meId);
  const hydrated = useRoomiss((s) => s.hydrated);
  const myGroupId = useRoomiss((s) => s.myGroupId());
  const router = useRouter();
  // Filter chips persist across reloads — annoying to retune every visit.
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window === "undefined") return { sort: "best" };
    try {
      const raw = localStorage.getItem("roomiss-browse-filters");
      return raw ? (JSON.parse(raw) as Filters) : { sort: "best" };
    } catch {
      return { sort: "best" };
    }
  });
  // Persist on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("roomiss-browse-filters", JSON.stringify(filters));
    } catch {
      // ignore quota errors
    }
  }, [filters]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Swipe mode
  const viewMode = useRoomiss((s) => s.viewMode);
  const setViewMode = useRoomiss((s) => s.setViewMode);
  const swipeFilters = useRoomiss((s) => s.swipeFilters);
  const setSwipeFilter = useRoomiss((s) => s.setSwipeFilter);
  const swipeSeen = useRoomiss((s) => s.swipeSeen);
  const lastSwipe = useRoomiss((s) => s.lastSwipe);
  const swipeOnUser = useRoomiss((s) => s.swipeOnUser);
  const swipeOnGroup = useRoomiss((s) => s.swipeOnGroup);
  const undoLastSwipe = useRoomiss((s) => s.undoLastSwipe);
  const [sheetItem, setSheetItem] = useState<SwipeItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // If I'm in a locked group, redirect to /me
  useEffect(() => {
    if (myGroupId && groups[myGroupId]?.status === "locked") {
      router.replace("/me");
    }
  }, [groups, myGroupId, router]);

  // Clear transient toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const blockedSet = new Set(blocks.filter((b) => b.blockerId === meId).map((b) => b.blockedId));

  const groupedMemberIds = new Set<string>();
  Object.values(groups).forEach((g) => {
    if (g.status !== "dissolved") g.memberIds.forEach((m) => groupedMemberIds.add(m));
  });

  const fallbackMe: Profile = {
    userId: "me",
    legalName: "You",
    displayName: "You",
    branch: "CSE",
    languages: [],
    sleepSchedule: "flexible",
    studyHabits: "hybrid",
    cleanliness: "average",
    socialScore: 3,
    foodPref: "veg",
    smoking: "never",
    drinking: "never",
    noiseTolerance: "medium",
    acPref: "either",
    hobbies: [],
    bio: "",
    privacyHidePhoto: true,
    privacyHideInsta: true,
    privacyHideLastActive: false,
    completeness: 0,
    updatedAt: new Date().toISOString(),
  };
  const me = myProfile ?? fallbackMe;

  // Server-authoritative scores. Populated by a single compat_many round-trip
  // on profile-set changes; until they arrive, we paint with the local mirror.
  const [serverScores, setServerScores] = useState<Map<string, number>>(new Map());

  const solos = useMemo(() => {
    const list: { profile: Profile; score: number }[] = [];
    Object.values(allProfiles).forEach((p) => {
      const u = allUsers[p.userId];
      if (!u || u.id === meId) return;
      if (u.hall !== hall) return;
      if (groupedMemberIds.has(p.userId)) return;
      if (blockedSet.has(p.userId)) return;
      if (filters.branch && p.branch !== filters.branch) return;
      if (filters.state && p.hometownState !== filters.state) return;
      if (filters.sleep && p.sleepSchedule !== filters.sleep) return;
      if (filters.food && p.foodPref !== filters.food) return;
      if (filters.ac && p.acPref !== filters.ac) return;
      // Prefer the server score once available; fall back to local mirror.
      const score = serverScores.get(p.userId) ?? compatScore(me, p);
      list.push({ profile: p, score });
    });
    if (filters.sort === "active") {
      list.sort((a, b) =>
        cmpIsoDesc(allUsers[a.profile.userId]?.lastActiveAt, allUsers[b.profile.userId]?.lastActiveAt),
      );
    } else if (filters.sort === "newest") {
      list.sort((a, b) =>
        cmpIsoDesc(allUsers[a.profile.userId]?.createdAt, allUsers[b.profile.userId]?.createdAt),
      );
    } else {
      list.sort((a, b) => b.score - a.score);
    }
    return list;
  }, [allProfiles, allUsers, blockedSet, filters, groupedMemberIds, hall, me, meId, serverScores]);

  // Single batched compat fetch when the set of visible solo userIds changes.
  // The compat module caches per-pair, so re-mounting the page is a no-op after
  // the first call.
  useEffect(() => {
    if (!myProfile) return;
    const ids = Object.values(allProfiles)
      .filter((p) => allUsers[p.userId]?.hall === hall && p.userId !== meId)
      .map((p) => p.userId);
    if (ids.length === 0) return;
    let cancelled = false;
    compatMany(myProfile.userId, ids).then((m) => {
      if (!cancelled) setServerScores(new Map(m));
    });
    return () => { cancelled = true; };
  }, [allProfiles, allUsers, hall, meId, myProfile]);

  const partials = useMemo(() => {
    const list: { group: typeof groups[string]; members: Profile[]; score: number }[] = [];
    Object.values(groups).forEach((g) => {
      if (g.status !== "partial") return;
      if (g.hall !== hall) return;
      if (g.memberIds.includes(meId)) return;
      const members = g.memberIds.map((id) => allProfiles[id]).filter(Boolean);
      if (members.length === 0) return;
      if (filters.groupStatus === "partial-2" && members.length !== 2) return;
      if (filters.groupStatus === "partial-3" && members.length !== 3) return;
      list.push({ group: g, members, score: avgCompatVsGroup(me, members) });
    });
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [allProfiles, filters.groupStatus, groups, hall, me, meId]);

  // ─── Swipe deck items (filtered by swipeSeen + swipeFilters) ───────────
  const deckItems = useMemo<SwipeItem[]>(() => {
    const seenUsers = new Set(
      swipeSeen.filter((r) => r.targetType === "user").map((r) => r.targetId),
    );
    const seenGroups = new Set(
      swipeSeen.filter((r) => r.targetType === "group").map((r) => r.targetId),
    );
    const now = Date.now();
    const items: SwipeItem[] = [];

    // Visibility rules:
    //   onlySolos = true  → drop all group cards
    //   lookingForOne = true → drop all solo cards, and only show groups with 1 open seat
    //   neither → mix solos + all partial groups
    const showSolos = !swipeFilters.lookingForOne;
    const showGroups = !swipeFilters.onlySolos;

    if (showSolos) {
      solos.forEach((s) => {
        if (seenUsers.has(s.profile.userId)) return;
        if (swipeFilters.activeLast7d) {
          const lastAct = allUsers[s.profile.userId]?.lastActiveAt;
          if (!lastAct || now - new Date(lastAct).getTime() > SEVEN_DAYS_MS) return;
        }
        items.push({
          kind: "user",
          key: `u:${s.profile.userId}`,
          profile: s.profile,
          score: s.score,
          hall,
        });
      });
    }

    if (showGroups) {
      partials.forEach((p) => {
        if (seenGroups.has(p.group.id)) return;
        if (swipeFilters.lookingForOne) {
          const open = p.group.finalSize - p.members.length;
          if (open !== 1) return;
        }
        if (swipeFilters.activeLast7d) {
          const recent = Math.max(
            ...p.members.map((m) => new Date(allUsers[m.userId]?.lastActiveAt ?? 0).getTime()),
          );
          if (now - recent > SEVEN_DAYS_MS) return;
        }
        items.push({
          kind: "group",
          key: `g:${p.group.id}`,
          group: p.group,
          members: p.members,
          score: p.score,
          hall,
        });
      });
    }

    // Interleave: alternate solo/group when both present so the deck feels mixed
    if (
      items.some((i) => i.kind === "user") &&
      items.some((i) => i.kind === "group") &&
      !swipeFilters.onlySolos &&
      !swipeFilters.lookingForOne
    ) {
      const soloItems = items.filter((i) => i.kind === "user");
      const groupItems = items.filter((i) => i.kind === "group");
      const mixed: SwipeItem[] = [];
      const max = Math.max(soloItems.length, groupItems.length);
      for (let i = 0; i < max; i++) {
        // Show a group every 3 solos so solos still dominate
        if (i % 3 === 1 && groupItems[Math.floor(i / 3)]) {
          mixed.push(groupItems[Math.floor(i / 3)]);
        }
        if (soloItems[i]) mixed.push(soloItems[i]);
      }
      // Append remaining groups not yet placed
      groupItems.forEach((g) => {
        if (!mixed.includes(g)) mixed.push(g);
      });
      return mixed;
    }

    return items;
  }, [allUsers, hall, partials, solos, swipeFilters, swipeSeen]);

  const onDeckSwipe = (item: SwipeItem, decision: SwipeDecision) => {
    if (item.kind === "user") {
      swipeOnUser(item.profile.userId, decision);
    } else {
      swipeOnGroup(item.group.id, decision);
    }
    if (decision === "like") {
      const name =
        item.kind === "user"
          ? item.profile.displayName.split(" ")[0]
          : "the group";
      setToast(`Request sent to ${name}`);
    }
  };

  const onDeckUndo = async () => {
    const r = await undoLastSwipe();
    if (r) setToast(r.decision === "like" ? "Request withdrawn" : "Brought back");
  };

  const onSheetDecide = (decision: SwipeDecision) => {
    if (!sheetItem) return;
    onDeckSwipe(sheetItem, decision);
    setSheetItem(null);
  };

  const stats = `${solos.length} solo · ${partials.length} partial`;
  const hasExtra =
    !!filters.branch || !!filters.state || !!filters.sleep || !!filters.food || !!filters.ac;

  // ─── Render ─────────────────────────────────────────────────────────
  if (viewMode === "swipe") {
    return (
      <>
        <div
          className="px-5 pb-2 pt-2 flex items-center justify-between flex-shrink-0"
          style={{ background: RM.bg }}
        >
          <div className="flex items-center gap-2.5">
            <Wordmark size={18} />
            <HallPill hall={hall} />
          </div>
          <ModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        <SwipeFilters
          value={swipeFilters}
          onChange={setSwipeFilter}
          onOpenDrawer={() => setDrawerOpen(true)}
          hasExtraFilters={hasExtra}
        />

        <SwipeDeck
          items={deckItems}
          onSwipe={onDeckSwipe}
          onTap={(it) => setSheetItem(it)}
          onUndo={onDeckUndo}
          canUndo={!!lastSwipe}
          onEmptyAction={() => setViewMode("feed")}
          emptyActionLabel="Switch to Feed"
        />

        {toast && (
          <div
            className="fixed left-1/2 z-40"
            style={{
              bottom: 96,
              transform: "translateX(-50%)",
              background: RM.ink,
              color: RM.bg,
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontFamily: RM.mono,
              letterSpacing: 0.3,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              pointerEvents: "none",
            }}
          >
            {toast}
          </div>
        )}

        <ProfileSheet item={sheetItem} onClose={() => setSheetItem(null)} onDecide={onSheetDecide} />
        <FirstUseOverlay />

        {drawerOpen && (
          <FilterDrawer
            hall={hall}
            filters={filters}
            onChange={setFilters}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </>
    );
  }

  // Feed mode (default)
  return (
    <>
      <AppHeader
        hall={hall}
        title="Discover"
        sub={stats}
        right={
          <div className="mt-3">
            <ModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        }
      />

      {/* Filter chips */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scroll-row">
        <Chip
          on={filters.sort === "best"}
          onClick={() => setFilters((f) => ({ ...f, sort: "best" }))}
        >
          Sort: best match
        </Chip>
        <Chip
          on={filters.sort === "active"}
          onClick={() => setFilters((f) => ({ ...f, sort: "active" }))}
        >
          Most active
        </Chip>
        <Chip
          on={filters.sort === "newest"}
          onClick={() => setFilters((f) => ({ ...f, sort: "newest" }))}
        >
          Newest
        </Chip>
        <span style={{ color: RM.hairline2, alignSelf: "center", flexShrink: 0 }}>|</span>
        <Chip on={!!filters.sleep} onClick={() => setDrawerOpen(true)}>
          Sleep{filters.sleep ? `: ${filters.sleep}` : ""}
        </Chip>
        <Chip on={!!filters.food} onClick={() => setDrawerOpen(true)}>
          Food{filters.food ? `: ${filters.food}` : ""}
        </Chip>
        <Chip on={!!filters.ac} onClick={() => setDrawerOpen(true)}>
          AC{filters.ac ? `: ${filters.ac}` : ""}
        </Chip>
        <Chip on={!!filters.branch} onClick={() => setDrawerOpen(true)}>
          Branch{filters.branch ? `: ${filters.branch}` : ""}
        </Chip>
        <Chip on={drawerOpen} onClick={() => setDrawerOpen(true)}>
          + More
        </Chip>
        {hasExtra && (
          <button
            type="button"
            onClick={() => setFilters({ sort: filters.sort })}
            className="font-mono"
            style={{
              fontSize: 11.5,
              letterSpacing: 0.3,
              padding: "7px 12px",
              borderRadius: 999,
              background: "transparent",
              color: RM.ink3,
              border: `1px dashed ${RM.hairline2}`,
              whiteSpace: "nowrap",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            × clear filters
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {partials.length > 0 && (
          <div className="mb-3.5">
            <SectionLabel>Partial groups looking for you</SectionLabel>
            <div className="flex flex-col gap-3">
              {partials.slice(0, 3).map((p) => (
                <JointCard
                  key={p.group.id}
                  group={p.group}
                  members={p.members}
                  score={p.score}
                />
              ))}
            </div>
          </div>
        )}

        <SectionLabel>Solo · sorted by {filters.sort ?? "best"}</SectionLabel>
        {!hydrated ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <SoloCardSkeleton key={i} />
            ))}
          </div>
        ) : solos.length === 0 ? (
          <div
            className="text-center mt-6 p-6 rounded-2xl"
            style={{ background: RM.surface, color: RM.ink3, border: `1px dashed ${RM.hairline2}` }}
          >
            {hasExtra ? (
              <>No matches with these filters. <button onClick={() => setFilters({ sort: "best" })} className="underline" style={{ color: RM.ink2 }}>Clear filters</button> to see everyone.</>
            ) : (
              "You're early — no other verified freshers in your hall yet. Check back as more onboard."
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {solos.map(({ profile, score }) => (
              <SoloCard key={profile.userId} profile={profile} score={score} hall={hall} />
            ))}
          </div>
        )}
      </div>

      {drawerOpen && (
        <FilterDrawer
          hall={hall}
          filters={filters}
          onChange={setFilters}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}

function Chip({ children, on, onClick }: { children: React.ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!on}
      className="font-mono"
      style={{
        fontSize: 11.5,
        letterSpacing: 0.3,
        padding: "7px 12px",
        borderRadius: 999,
        background: on ? RM.ink : RM.surface,
        color: on ? RM.bg : RM.ink2,
        border: on ? "1px solid transparent" : `1px solid ${RM.hairline}`,
        whiteSpace: "nowrap",
        // flexShrink: 0 keeps chips at their content width inside the scroll-row.
        // Without this the default `flex-shrink: 1` crushes them into each other
        // when the row overflows the 480px shell, producing visual overlap.
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase"
      style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, margin: "4px 4px 8px" }}
    >
      {children}
    </div>
  );
}

function FilterDrawer({
  hall: _,
  filters,
  onChange,
  onClose,
}: {
  hall: Hall;
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-[480px] p-5 rounded-t-3xl"
        style={{ background: RM.bg, maxHeight: "80dvh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif" style={{ fontSize: 22, letterSpacing: -0.3 }}>
            Filters
          </h3>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            style={{ color: RM.ink3, fontSize: 22, background: "none", border: "none", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <FilterGroup
          label="Sleep"
          value={filters.sleep}
          options={[
            { value: "early", label: "Early bird" },
            { value: "flexible", label: "Flexible" },
            { value: "night", label: "Night owl" },
          ]}
          onChange={(v) => onChange({ ...filters, sleep: v as SleepSchedule | undefined })}
        />
        <FilterGroup
          label="Food"
          value={filters.food}
          options={[
            { value: "veg", label: "Veg" },
            { value: "non_veg", label: "Non-veg" },
            { value: "eggetarian", label: "Eggetarian" },
            { value: "jain", label: "Jain" },
          ]}
          onChange={(v) => onChange({ ...filters, food: v as FoodPref | undefined })}
        />
        <FilterGroup
          label="AC room"
          value={filters.ac}
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "either", label: "Either" },
          ]}
          onChange={(v) => onChange({ ...filters, ac: v as AcPref | undefined })}
        />
        <FilterGroup
          label="Group status"
          value={filters.groupStatus}
          options={[
            { value: "partial-2", label: "Partial · 2" },
            { value: "partial-3", label: "Partial · 3" },
          ]}
          onChange={(v) =>
            onChange({ ...filters, groupStatus: v as Filters["groupStatus"] })
          }
        />
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => onChange({ sort: filters.sort })}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              background: "transparent",
              border: `1.5px solid ${RM.ink}`,
              color: RM.ink,
              fontWeight: 500,
            }}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              background: RM.ink,
              color: RM.bg,
              fontWeight: 500,
              border: "none",
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="mb-4">
      <div
        className="font-mono uppercase mb-2"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onChange(sel ? undefined : o.value)}
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: sel ? RM.ink : RM.surface,
                color: sel ? RM.bg : RM.ink,
                border: `1.5px solid ${sel ? RM.ink : RM.hairline}`,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
