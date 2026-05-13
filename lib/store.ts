"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User, Profile, Group, RoomRequest, Chat, ChatParticipant, Message,
  Block, Report, Notification, AdminAuditEntry, Cooldown,
  Hall, FoodPref, ReportCategory,
  SwipeRecord, SwipeFilters, SwipeDecision, ViewMode,
} from "./types";
import { supabase, SEED_EMAIL, GUEST_PASSWORD } from "./supabase/client";
import { hydrateFromServer } from "./supabase/hydrate";
import { rowToUser, rowToProfile, rowToMessage } from "./supabase/mappers";
import {
  refetchRequest, refetchGroup, refetchChat, refetchRecentMessages,
  refetchMe, refetchMyBlocksCooldowns, refetchNotifications, withRetry,
} from "./supabase/refetch";
import { nanoid } from "nanoid";

interface PendingVerification {
  id: string;
  userId: string;
  name?: string;
  hallClaimed: Hall;
  status: "pending" | "in_review" | "approved" | "rejected" | "resubmit_requested";
  createdAt: string;
  flags: string[];
  slipUrl?: string;
  jeeRoll?: string;
  admissionRoll?: string;
}

export interface RoomissState {
  // ─── Auth + meta ────────────────────────────────────────────
  meId: string;
  asAdmin: boolean;
  hydrated: boolean;
  loading: boolean;
  lastError: string | null;
  lastSuccess: string | null;
  notice: (msg: string) => void;

  // ─── Live cache (server-backed) ─────────────────────────────
  users: Record<string, User>;
  profiles: Record<string, Profile>;
  groups: Record<string, Group>;
  requests: Record<string, RoomRequest>;
  chats: Record<string, Chat>;
  participants: ChatParticipant[];
  messages: Message[];
  blocks: Block[];
  reports: Record<string, Report>;
  notifications: Notification[];
  audit: AdminAuditEntry[];
  cooldowns: Cooldown[];
  pendingVerifications: PendingVerification[];
  platform: { closeT0: string; reviewSlaHours: number; demoMode: boolean };
  savePlatformSettings: (p: Partial<{ closeT0: string; reviewSlaHours: number; demoMode: boolean }>) => Promise<{ ok: boolean; error?: string }>;

  // ─── Swipe mode (lastSwipe is server-backed via swipe_seen) ──
  viewMode: ViewMode;
  swipeSeen: SwipeRecord[];
  swipeFilters: SwipeFilters;
  lastSwipe: SwipeRecord | null;
  setViewMode: (mode: ViewMode) => void;
  setSwipeFilter: (partial: Partial<SwipeFilters>) => void;
  swipeOnUser: (userId: string, decision: SwipeDecision) => Promise<SwipeRecord | null>;
  swipeOnGroup: (groupId: string, decision: SwipeDecision) => Promise<SwipeRecord | null>;
  undoLastSwipe: () => Promise<SwipeRecord | null>;
  clearSwipeHistory: () => Promise<void>;

  // ─── Auth + onboarding ──────────────────────────────────────
  signup: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAsGuestUser: () => Promise<{ ok: boolean; error?: string }>;
  loginAsGuestAdmin: () => Promise<{ ok: boolean; error?: string }>;
  loginAsSeedUser: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;

  // ─── Verification ───────────────────────────────────────────
  submitVerification: (data: {
    jeeRoll: string; admissionRoll: string; hallClaimed: Hall;
    slipName: string; legalName: string;
  }) => Promise<{ ok: boolean; error?: string; id?: string }>;
  approveVerification: (verificationId: string) => Promise<{ ok: boolean; error?: string }>;
  rejectVerification: (verificationId: string, reason: string, category: string) => Promise<{ ok: boolean; error?: string }>;

  // ─── Profile ────────────────────────────────────────────────
  saveProfile: (p: Partial<Profile>) => Promise<{ ok: boolean; error?: string }>;

  // ─── Discovery / safety ─────────────────────────────────────
  blockUser: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  unblockUser: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  reportUser: (userId: string, category: ReportCategory, details: string, messageId?: string) => Promise<{ ok: boolean; error?: string }>;

  // ─── Requests ───────────────────────────────────────────────
  sendSoloSoloRequest: (targetUserId: string, note?: string) => Promise<string | null>;
  sendSoloGroupRequest: (targetGroupId: string, note?: string) => Promise<string | null>;
  acceptRequest: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  declineRequest: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  withdrawRequest: (requestId: string) => Promise<{ ok: boolean; error?: string }>;

  // ─── Groups ─────────────────────────────────────────────────
  myGroupId: () => string | null;
  leaveGroup: (reason?: string) => Promise<{ ok: boolean; error?: string }>;
  initiateMerge: (otherGroupId: string) => Promise<string | null>;

  // ─── Chat ───────────────────────────────────────────────────
  sendMessage: (chatId: string, body: string, kind?: "text" | "image", attachmentUrl?: string, replyToMessageId?: string) => Promise<{ ok: boolean; error?: string }>;
  markChatRead: (chatId: string) => Promise<void>;
  toggleMute: (chatId: string) => Promise<void>;

  // ─── Settings ───────────────────────────────────────────────
  setHall: (hall: Hall) => Promise<{ ok: boolean; error?: string }>;
  togglePrivacy: (key: "privacyHidePhoto" | "privacyHideInsta" | "privacyHideLastActive") => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; scheduledAt?: string; error?: string }>;
  cancelAccountDeletion: () => Promise<{ ok: boolean; error?: string }>;

  // ─── Notifications ──────────────────────────────────────────
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<number>;

  // ─── Hydration + lifecycle ──────────────────────────────────
  hydrate: () => Promise<void>;
  resetCache: () => void;
}

const emptyCache = () => ({
  users: {} as Record<string, User>,
  profiles: {} as Record<string, Profile>,
  groups: {} as Record<string, Group>,
  requests: {} as Record<string, RoomRequest>,
  chats: {} as Record<string, Chat>,
  participants: [] as ChatParticipant[],
  messages: [] as Message[],
  blocks: [] as Block[],
  reports: {} as Record<string, Report>,
  notifications: [] as Notification[],
  audit: [] as AdminAuditEntry[],
  cooldowns: [] as Cooldown[],
  pendingVerifications: [] as PendingVerification[],
  platform: {
    closeT0: new Date(Date.now() + 45 * 86400_000).toISOString(),
    reviewSlaHours: 24,
    demoMode: true,
  },
  swipeSeen: [] as SwipeRecord[],
  lastSwipe: null as SwipeRecord | null,
});

const handle = async <T,>(p: Promise<T>) => {
  try { return { ok: true as const, data: await p }; }
  catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { ok: false as const, error };
  }
};

/**
 * Run an async auth call once; if it rejects (or returns a network-shaped
 * error) retry once after 500ms. This converts Safari's flaky "Load failed"
 * fetch rejections into successful logins maybe ~70% of the time without
 * any other change. Network-shaped errors are detected by string match; we
 * never retry credential / permission errors with explicit codes.
 */
const TRANSIENT_RE = /load failed|failed to fetch|networkerror|network request failed|fetch ?error/i;

async function withTransientRetry<T extends { error?: { message: string } | null }>(
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const first = await fn();
    if (first.error && TRANSIENT_RE.test(first.error.message)) {
      await new Promise((r) => setTimeout(r, 500));
      return await fn();
    }
    return first;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (TRANSIENT_RE.test(msg)) {
      await new Promise((r) => setTimeout(r, 500));
      return await fn();
    }
    throw e;
  }
}

/**
 * Map the raw auth-error string to something a human can read. Falls back to
 * the original message so unmapped errors still surface (just less polished).
 */
function humanizeAuthError(raw: string): string {
  const s = raw.toLowerCase();
  if (TRANSIENT_RE.test(s))
    return "We couldn't reach the sign-in server. Check your connection and try again.";
  if (s.includes("invalid login credentials") || s.includes("invalid_grant"))
    return "Email or password didn't match.";
  if (s.includes("email not confirmed"))
    return "Confirm your email first, then try again.";
  if (s.includes("user already registered"))
    return "That email is already registered — try signing in instead.";
  if (s.includes("password should be") || s.includes("weak_password"))
    return "Password is too weak — use 8+ characters with a mix.";
  if (s === "demo_mode_disabled")
    return "Demo guest sign-in is disabled in this environment.";
  if (s === "login_failed")
    return "Sign-in failed. Try again in a moment.";
  return raw;
}

export const useRoomiss = create<RoomissState>()(
  persist(
    (set, get) => ({
      meId: "guest",
      asAdmin: false,
      hydrated: false,
      loading: false,
      lastError: null,
      lastSuccess: null,
      notice: (msg: string) => set({ lastSuccess: msg }),
      ...emptyCache(),
      viewMode: "feed",
      swipeFilters: { onlySolos: false, lookingForOne: false, activeLast7d: false },

      // ─── Auth ─────────────────────────────────────────────────
      signup: async (email, password) => {
        set({ loading: true, lastError: null });
        try {
          const exec = () => supabase.auth.signUp({ email, password });
          const { data, error } = await withTransientRetry(exec);
          set({ loading: false });
          if (error) {
            const msg = humanizeAuthError(error.message);
            set({ lastError: msg });
            return { ok: false, error: msg };
          }
          if (!data.user && !data.session) {
            // Email confirmation enabled in Supabase project → success but no
            // session yet. Caller should route to a "check your email" state.
            return { ok: true };
          }
          return { ok: true };
        } catch (e) {
          // Network-level throw (Safari "Load failed", Chrome "Failed to fetch").
          // Log the raw error so a developer can triage; surface a friendly string.
          // eslint-disable-next-line no-console
          console.error("[auth] signup threw", e);
          set({ loading: false });
          const msg = humanizeAuthError(e instanceof Error ? e.message : String(e));
          set({ lastError: msg });
          return { ok: false, error: msg };
        }
      },

      login: async (email, password) => {
        set({ loading: true, lastError: null });
        try {
          // Clear any stale local session before re-attempting. Idempotent and
          // cheap. Without this, a corrupted token in localStorage can make
          // signInWithPassword fail in confusing ways on Safari.
          try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }

          const exec = () => supabase.auth.signInWithPassword({ email, password });
          const { data, error } = await withTransientRetry(exec);
          if (error || !data.user) {
            const raw = error?.message ?? "login_failed";
            const msg = humanizeAuthError(raw);
            // eslint-disable-next-line no-console
            console.error("[auth] login returned error", { raw, error });
            set({ loading: false, lastError: msg });
            return { ok: false, error: msg };
          }
          await get().hydrate();
          set({ loading: false });
          return { ok: true };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("[auth] login threw", e);
          const msg = humanizeAuthError(e instanceof Error ? e.message : String(e));
          set({ loading: false, lastError: msg });
          return { ok: false, error: msg };
        }
      },

      loginAsGuestUser: async () => {
        if (!GUEST_PASSWORD) return { ok: false, error: humanizeAuthError("demo_mode_disabled") };
        return get().login(SEED_EMAIL.guestUser, GUEST_PASSWORD);
      },
      loginAsGuestAdmin: async () => {
        if (!GUEST_PASSWORD) return { ok: false, error: humanizeAuthError("demo_mode_disabled") };
        return get().login(SEED_EMAIL.guestAdmin, GUEST_PASSWORD);
      },
      loginAsSeedUser: async (email) => {
        if (!GUEST_PASSWORD) return { ok: false, error: humanizeAuthError("demo_mode_disabled") };
        return get().login(email, GUEST_PASSWORD);
      },

      logout: async () => {
        await supabase.auth.signOut({ scope: "global" });
        get().resetCache();
      },

      // ─── Verification ────────────────────────────────────────
      submitVerification: async (data) => {
        // `data.slipName` is the bucket-relative storage path returned by uploadSlip().
        const { data: vid, error } = await supabase.rpc("submit_verification", {
          p_jee_roll: data.jeeRoll,
          p_admission_roll: data.admissionRoll,
          p_hall_claimed: data.hallClaimed,
          p_slip_url: data.slipName,
          p_legal_name: data.legalName,
        });
        if (error) return { ok: false, error: error.message };
        // Patch me + push the new verification row into local cache.
        await refetchMe(set, get().meId);
        const { data: vrows } = await supabase
          .from("verifications").select("*")
          .order("created_at", { ascending: false }).limit(30);
        if (vrows) {
          set((s) => ({
            ...s,
            pendingVerifications: vrows.map((v) => ({
              id: v.id, userId: v.user_id, name: v.legal_name ?? undefined,
              hallClaimed: v.hall_claimed, status: v.status,
              createdAt: v.created_at, flags: v.flags ?? [],
              slipUrl: v.slip_url, jeeRoll: v.jee_roll, admissionRoll: v.admission_roll,
            })),
          }));
        }
        return { ok: true, id: vid ?? undefined };
      },

      approveVerification: async (verificationId) => {
        const { error } = await supabase.rpc("admin_approve_verification", {
          p_verification_id: verificationId,
        });
        if (error) return { ok: false, error: error.message };
        // Realtime will deliver the user/profile/verification updates.
        // Patch the verification status locally so the admin queue updates instantly.
        set((s) => ({
          ...s,
          pendingVerifications: s.pendingVerifications.map((v) =>
            v.id === verificationId ? { ...v, status: "approved" } : v,
          ),
        }));
        return { ok: true };
      },

      rejectVerification: async (verificationId, reason, category) => {
        const { error } = await supabase.rpc("admin_reject_verification", {
          p_verification_id: verificationId, p_reason: reason, p_category: category,
        });
        if (error) return { ok: false, error: error.message };
        set((s) => ({
          ...s,
          pendingVerifications: s.pendingVerifications.map((v) =>
            v.id === verificationId ? { ...v, status: "rejected" } : v,
          ),
        }));
        return { ok: true };
      },

      // ─── Profile ──────────────────────────────────────────────
      saveProfile: async (p) => {
        const { error } = await supabase.rpc("upsert_profile", {
          p_legal_name: p.legalName ?? undefined,
          p_display_name: p.displayName ?? undefined,
          p_branch: p.branch ?? undefined,
          p_hometown_city: p.hometownCity ?? undefined,
          p_hometown_state: p.hometownState ?? undefined,
          p_languages: p.languages ?? undefined,
          p_sleep_schedule: p.sleepSchedule ?? undefined,
          p_study_habits: p.studyHabits ?? undefined,
          p_cleanliness: p.cleanliness ?? undefined,
          p_social_score: p.socialScore ?? undefined,
          p_food_pref: p.foodPref ?? undefined,
          p_smoking: p.smoking ?? undefined,
          p_drinking: p.drinking ?? undefined,
          p_noise_tolerance: p.noiseTolerance ?? undefined,
          p_ac_pref: p.acPref ?? undefined,
          p_hobbies: p.hobbies ?? undefined,
          p_bio: p.bio ?? undefined,
          p_instagram_handle: p.instagramHandle ?? undefined,
          p_primary_photo_url: p.primaryPhotoUrl ?? undefined,
          p_secondary_photo_urls: p.secondaryPhotoUrls ?? undefined,
          p_privacy_hide_photo: p.privacyHidePhoto ?? undefined,
          p_privacy_hide_insta: p.privacyHideInsta ?? undefined,
          p_privacy_hide_last_active: p.privacyHideLastActive ?? undefined,
          p_completeness: p.completeness ?? undefined,
        });
        if (error) return { ok: false, error: error.message };
        // realtime will catch the profiles row update
        return { ok: true };
      },

      // ─── Safety ───────────────────────────────────────────────
      blockUser: async (userId) => {
        const { error } = await supabase.rpc("block_user", { p_blocked_id: userId });
        if (error) return { ok: false, error: error.message };
        await refetchMyBlocksCooldowns(set, get().meId);
        return { ok: true };
      },
      unblockUser: async (userId) => {
        const { error } = await supabase.rpc("unblock_user", { p_blocked_id: userId });
        if (error) return { ok: false, error: error.message };
        await refetchMyBlocksCooldowns(set, get().meId);
        return { ok: true };
      },
      reportUser: async (userId, category, details, messageId) => {
        const { error } = await supabase.rpc("report_user", {
          p_target_user_id: userId,
          p_category: category,
          p_details: details,
          p_target_message_id: messageId,
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },

      // ─── Requests ─────────────────────────────────────────────
      sendSoloSoloRequest: async (targetUserId, note) => {
        const { data, error } = await supabase.rpc("send_solo_solo_request", {
          p_target_user_id: targetUserId, p_note: note,
        });
        if (error) { set({ lastError: error.message }); return null; }
        if (data) await refetchRequest(set, data);
        return data ?? null;
      },
      sendSoloGroupRequest: async (targetGroupId, note) => {
        const { data, error } = await supabase.rpc("send_solo_group_request", {
          p_target_group_id: targetGroupId, p_note: note,
        });
        if (error) { set({ lastError: error.message }); return null; }
        if (data) await refetchRequest(set, data);
        return data ?? null;
      },
      acceptRequest: async (requestId) => {
        const { error } = await supabase.rpc("accept_request", { p_request_id: requestId });
        if (error) return { ok: false, error: error.message };
        // Patch the request + maybe a new chat/group landed. Realtime delivers
        // the rest; we eagerly refetch the request and any related entities.
        await refetchRequest(set, requestId);
        const r = get().requests[requestId];
        if (r) {
          if (r.targetGroupId) await refetchGroup(set, r.targetGroupId);
          if (r.initiatorGroupId) await refetchGroup(set, r.initiatorGroupId);
        }
        return { ok: true };
      },
      declineRequest: async (requestId) => {
        const { error } = await supabase.rpc("decline_request", { p_request_id: requestId });
        if (error) return { ok: false, error: error.message };
        await refetchRequest(set, requestId);
        await refetchMyBlocksCooldowns(set, get().meId);
        return { ok: true };
      },
      withdrawRequest: async (requestId) => {
        const { error } = await supabase.rpc("withdraw_request", { p_request_id: requestId });
        if (error) return { ok: false, error: error.message };
        await refetchRequest(set, requestId);
        return { ok: true };
      },

      // ─── Groups ──────────────────────────────────────────────
      myGroupId: () => {
        const s = get();
        const g = Object.values(s.groups).find(
          (gg) => gg.memberIds.includes(s.meId) && gg.status !== "dissolved",
        );
        return g?.id ?? null;
      },
      leaveGroup: async (reason) => {
        // Capture which group I was in before we lose the reference.
        const myGid = get().myGroupId();
        const { error } = await supabase.rpc("leave_group", { p_reason: reason });
        if (error) return { ok: false, error: error.message };
        if (myGid) {
          await refetchGroup(set, myGid);
          // Find the related group chat and refresh participants/messages.
          const chat = Object.values(get().chats).find((c) => c.groupId === myGid);
          if (chat) {
            await refetchChat(set, chat.id);
            await refetchRecentMessages(set, chat.id, 30);
          }
        }
        await refetchMyBlocksCooldowns(set, get().meId);
        return { ok: true };
      },
      initiateMerge: async (otherGroupId) => {
        const { data, error } = await supabase.rpc("initiate_merge", { p_other_group_id: otherGroupId });
        if (error) { set({ lastError: error.message }); return null; }
        if (data) await refetchRequest(set, data);
        return data ?? null;
      },

      // ─── Chat ────────────────────────────────────────────────
      sendMessage: async (chatId, body, kind = "text", attachmentUrl, replyToMessageId) => {
        const trimmed = body.trim();
        if (!trimmed && kind === "text") return { ok: false, error: "empty" };
        const meId = get().meId;
        if (meId === "guest") return { ok: false, error: "not_authenticated" };

        // Optimistic insert: temp_id replaced when realtime delivers the real row.
        const tempId = `temp-${nanoid()}`;
        const tempMessage = {
          id: tempId, chatId, senderId: meId, body: trimmed,
          kind, attachmentUrl,
          replyToMessageId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ ...s, messages: [...s.messages, tempMessage] }));

        const { data, error } = await withRetry(async () => {
          const r = await supabase
            .from("messages")
            .insert({
              chat_id: chatId, sender_id: meId, body: trimmed, kind,
              attachment_url: attachmentUrl,
              reply_to_message_id: replyToMessageId,
            })
            .select("*").single();
          if (r.error) throw new Error(r.error.message);
          return r;
        }).then((r) => r).catch((e) => ({ data: null, error: e as Error }));

        if (error || !data) {
          // Roll back optimistic insert
          set((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== tempId) }));
          return { ok: false, error: (error as Error)?.message ?? "send_failed" };
        }

        // Replace temp with real row (realtime might also deliver — dedupe by id).
        const real = rowToMessage(data);
        set((s) => {
          const without = s.messages.filter((m) => m.id !== tempId && m.id !== real.id);
          return { ...s, messages: [...without, real] };
        });
        return { ok: true };
      },
      markChatRead: async (chatId) => {
        await supabase.rpc("mark_chat_read", { p_chat_id: chatId });
      },
      toggleMute: async (chatId) => {
        await supabase.rpc("toggle_chat_mute", { p_chat_id: chatId });
      },

      // ─── Settings ────────────────────────────────────────────
      setHall: async (hall) => {
        const { error } = await supabase.rpc("change_hall", { p_new_hall: hall });
        if (error) return { ok: false, error: error.message };
        // Hall change resets verification + leaves my group → full reload is OK
        // since same-hall RLS scope changes anyway.
        await get().hydrate();
        return { ok: true };
      },
      togglePrivacy: async (key) => {
        const map = {
          privacyHidePhoto: "privacy_hide_photo",
          privacyHideInsta: "privacy_hide_insta",
          privacyHideLastActive: "privacy_hide_last_active",
        } as const;
        await supabase.rpc("toggle_privacy", { p_key: map[key] });
      },
      deleteAccount: async () => {
        const { data, error } = await supabase.rpc("delete_account");
        if (error) return { ok: false, error: error.message };
        await refetchMe(set, get().meId);
        return { ok: true, scheduledAt: data ?? undefined };
      },

      cancelAccountDeletion: async () => {
        const { error } = await supabase.rpc("cancel_account_deletion");
        if (error) return { ok: false, error: error.message };
        await refetchMe(set, get().meId);
        return { ok: true };
      },

      savePlatformSettings: async (p) => {
        const patch: { close_t0?: string; review_sla_hours?: number; demo_mode?: boolean } = {};
        if (p.closeT0 !== undefined) patch.close_t0 = p.closeT0;
        if (p.reviewSlaHours !== undefined) patch.review_sla_hours = p.reviewSlaHours;
        if (p.demoMode !== undefined) patch.demo_mode = p.demoMode;
        const { error } = await supabase
          .from("platform_settings").update(patch).eq("id", "singleton");
        if (error) return { ok: false, error: error.message };
        // Patch local immediately so the UI reflects the change before the
        // realtime UPDATE event lands.
        set((s) => ({ ...s, platform: { ...s.platform, ...p } }));
        return { ok: true };
      },

      // ─── Notifications ───────────────────────────────────────
      markNotificationRead: async (id) => {
        await supabase.rpc("mark_notification_read", { p_id: id });
      },

      markAllNotificationsRead: async () => {
        const { data } = await supabase.rpc("mark_all_notifications_read");
        const now = new Date().toISOString();
        // Patch local cache immediately — the realtime UPDATE event will arrive
        // moments later and dedupe.
        set((s) => ({
          ...s,
          notifications: s.notifications.map((n) =>
            n.readAt ? n : { ...n, readAt: now },
          ),
        }));
        return data ?? 0;
      },

      // ─── Swipe ───────────────────────────────────────────────
      setViewMode: (mode) => set({ viewMode: mode }),
      setSwipeFilter: (partial) =>
        set((s) => ({ ...s, swipeFilters: { ...s.swipeFilters, ...partial } })),

      swipeOnUser: async (userId, decision) => {
        const { data, error } = await supabase.rpc("swipe", {
          p_target_type: "user", p_target_id: userId, p_decision: decision,
        });
        if (error) { set({ lastError: error.message }); return null; }
        const requestId = (data as { request_id?: string } | null)?.request_id;
        const record: SwipeRecord = {
          targetType: "user", targetId: userId, decision,
          at: new Date().toISOString(), requestId,
        };
        set((s) => ({ ...s, swipeSeen: [...s.swipeSeen, record], lastSwipe: record }));
        if (requestId) await refetchRequest(set, requestId);
        return record;
      },

      swipeOnGroup: async (groupId, decision) => {
        const { data, error } = await supabase.rpc("swipe", {
          p_target_type: "group", p_target_id: groupId, p_decision: decision,
        });
        if (error) { set({ lastError: error.message }); return null; }
        const requestId = (data as { request_id?: string } | null)?.request_id;
        const record: SwipeRecord = {
          targetType: "group", targetId: groupId, decision,
          at: new Date().toISOString(), requestId,
        };
        set((s) => ({ ...s, swipeSeen: [...s.swipeSeen, record], lastSwipe: record }));
        if (requestId) await refetchRequest(set, requestId);
        return record;
      },

      undoLastSwipe: async () => {
        const last = get().lastSwipe;
        if (!last) return null;
        const { error } = await supabase.rpc("undo_last_swipe");
        if (error) { set({ lastError: error.message }); return null; }
        set((s) => ({
          ...s,
          swipeSeen: s.swipeSeen.filter(
            (r) => !(r.targetType === last.targetType && r.targetId === last.targetId && r.at === last.at),
          ),
          lastSwipe: null,
        }));
        if (last.requestId) await refetchRequest(set, last.requestId);
        return last;
      },

      clearSwipeHistory: async () => {
        await supabase.rpc("clear_swipe_history");
        set((s) => ({ ...s, swipeSeen: [], lastSwipe: null }));
      },

      // ─── Hydration ───────────────────────────────────────────
      hydrate: async () => {
        set({ loading: true });
        const snap = await hydrateFromServer();
        if (!snap) {
          set({ loading: false, hydrated: true, meId: "guest", asAdmin: false });
          return;
        }
        // Re-build swipeSeen records from the server-side IDs we have.
        const seenAsRecords: SwipeRecord[] = [];
        snap.swipeSeenIds.users.forEach((id) =>
          seenAsRecords.push({
            targetType: "user", targetId: id, decision: "like", at: "", requestId: undefined,
          }),
        );
        snap.swipeSeenIds.groups.forEach((id) =>
          seenAsRecords.push({
            targetType: "group", targetId: id, decision: "like", at: "", requestId: undefined,
          }),
        );
        set({
          meId: snap.meId,
          asAdmin: snap.asAdmin,
          users: snap.users,
          profiles: snap.profiles,
          groups: snap.groups,
          requests: snap.requests,
          chats: snap.chats,
          participants: snap.participants,
          messages: snap.messages,
          blocks: snap.blocks,
          notifications: snap.notifications,
          cooldowns: snap.cooldowns,
          pendingVerifications: snap.pendingVerifications,
          reports: snap.reports,
          audit: snap.audit,
          platform: snap.platform,
          swipeSeen: seenAsRecords,
          loading: false,
          hydrated: true,
          lastError: null,
        });
      },

      resetCache: () =>
        set({
          meId: "guest",
          asAdmin: false,
          hydrated: false,
          ...emptyCache(),
        }),
    }),
    {
      name: "roomiss-ui-prefs",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never),
      ),
      // Persist ONLY UI prefs across reloads — data comes from Supabase.
      partialize: (state) => ({
        viewMode: state.viewMode,
        swipeFilters: state.swipeFilters,
      }) as Partial<RoomissState>,
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────
export const selectMe = (s: RoomissState) => s.users[s.meId];
export const selectMyProfile = (s: RoomissState) => s.profiles[s.meId];
export const selectMyHall = (s: RoomissState): Hall => s.users[s.meId]?.hall ?? "LBS";
