"use client";

import { supabase } from "./client";
import {
  rowToUser, rowToProfile, rowToGroup, rowToRequest, rowToChat,
  rowToParticipant, rowToMessage, rowToBlock, rowToNotification,
  rowToCooldown, rowToReport, rowToAudit,
} from "./mappers";
import type {
  User, Profile, Group, RoomRequest, Chat, ChatParticipant, Message,
  Block, Notification, Cooldown, Report, AdminAuditEntry,
} from "@/lib/types";

export interface HydrationSnapshot {
  meId: string;
  asAdmin: boolean;
  users: Record<string, User>;
  profiles: Record<string, Profile>;
  groups: Record<string, Group>;
  requests: Record<string, RoomRequest>;
  chats: Record<string, Chat>;
  participants: ChatParticipant[];
  messages: Message[];
  blocks: Block[];
  notifications: Notification[];
  cooldowns: Cooldown[];
  reports: Record<string, Report>;
  audit: AdminAuditEntry[];
  platform: { closeT0: string; reviewSlaHours: number; demoMode: boolean };
  swipeSeenIds: {
    users: Set<string>;
    groups: Set<string>;
  };
  pendingVerifications: {
    id: string;
    userId: string;
    name?: string;
    hallClaimed: "LBS" | "SNVH";
    status: "pending" | "in_review" | "approved" | "rejected" | "resubmit_requested";
    createdAt: string;
    flags: string[];
    slipUrl?: string;
    jeeRoll?: string;
    admissionRoll?: string;
  }[];
}

/**
 * Load every row the current user is allowed to see and assemble the local
 * cache. RLS does the filtering on the server — same-hall verified peers'
 * profiles, my own everything-else.
 */
export async function hydrateFromServer(): Promise<HydrationSnapshot | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Run all the reads in parallel
  const [
    me, peers, profilesRes, groupsRes, groupMembersRes, requestsRes,
    acceptancesRes, chatsRes, partsRes, messagesRes, blocksRes,
    notifsRes, cooldownsRes, swipeRes, verifsRes, platformRes,
    reportsRes, auditRes,
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("users").select("*"),
    // profiles_safe: redacts photo, secondary photos, instagram, legal_name
    // per the has_seen_photo / has_seen_insta gating helpers. Bypassing this
    // view leaks peer photos — see 0022_profiles_safe_view.
    supabase.from("profiles_safe").select("*"),
    supabase.from("groups").select("*"),
    supabase.from("group_members").select("*").is("left_at", null),
    supabase.from("requests").select("*"),
    supabase.from("request_acceptances").select("*"),
    supabase.from("chats").select("*"),
    supabase.from("chat_participants").select("*"),
    // Bounded paint budget: last 50 per chat. Chat-detail extends via
    // refetchRecentMessages() when the user scrolls / navigates in.
    supabase.rpc("recent_messages", { per_chat: 50 }),
    supabase.from("blocks").select("*"),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("cooldowns").select("*").gt("expires_at", new Date().toISOString()),
    supabase.from("swipe_seen").select("target_type, target_id").eq("swiper_id", user.id),
    supabase.from("verifications").select("*").order("created_at", { ascending: false }),
    supabase.from("platform_settings").select("*").eq("id", "singleton").maybeSingle(),
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const meRow = me.data;
  if (!meRow) return null;

  const users: Record<string, User> = {};
  (peers.data ?? []).forEach((u) => (users[u.id] = rowToUser(u)));
  users[meRow.id] = rowToUser(meRow);

  const profiles: Record<string, Profile> = {};
  (profilesRes.data ?? []).forEach((p) => (profiles[p.user_id] = rowToProfile(p)));

  // Build group → memberIds map
  const groupMembers = groupMembersRes.data ?? [];
  const membersByGroup: Record<string, string[]> = {};
  groupMembers.forEach((m) => {
    (membersByGroup[m.group_id] ??= []).push(m.user_id);
  });

  const groups: Record<string, Group> = {};
  (groupsRes.data ?? []).forEach((g) => {
    groups[g.id] = rowToGroup(g, membersByGroup[g.id] ?? []);
  });

  // Build request → acceptances map
  const accs = acceptancesRes.data ?? [];
  const accsByRequest: Record<string, typeof accs> = {};
  accs.forEach((a) => {
    (accsByRequest[a.request_id] ??= []).push(a);
  });

  const requests: Record<string, RoomRequest> = {};
  (requestsRes.data ?? []).forEach((r) => {
    requests[r.id] = rowToRequest(r, accsByRequest[r.id] ?? []);
  });

  // Build chat → participantIds
  const partRows = partsRes.data ?? [];
  const partsByChat: Record<string, string[]> = {};
  partRows.forEach((p) => {
    if (!p.left_at) (partsByChat[p.chat_id] ??= []).push(p.user_id);
  });

  const chats: Record<string, Chat> = {};
  (chatsRes.data ?? []).forEach((c) => {
    chats[c.id] = rowToChat(c, partsByChat[c.id] ?? []);
  });

  const participants = partRows.map(rowToParticipant);
  const messages = (messagesRes.data ?? []).map(rowToMessage);
  const blocks = (blocksRes.data ?? []).map(rowToBlock);
  const notifications = (notifsRes.data ?? []).map(rowToNotification);
  const cooldowns = (cooldownsRes.data ?? []).map(rowToCooldown);

  const swipeSeenIds = { users: new Set<string>(), groups: new Set<string>() };
  (swipeRes.data ?? []).forEach((s) => {
    (s.target_type === "user" ? swipeSeenIds.users : swipeSeenIds.groups).add(s.target_id);
  });

  const pendingVerifications = (verifsRes.data ?? []).map((v) => ({
    id: v.id, userId: v.user_id, name: v.legal_name ?? undefined,
    hallClaimed: v.hall_claimed,
    status: v.status, createdAt: v.created_at, flags: v.flags ?? [],
    slipUrl: v.slip_url, jeeRoll: v.jee_roll, admissionRoll: v.admission_roll,
  }));

  const platform = platformRes.data
    ? {
        closeT0: platformRes.data.close_t0,
        reviewSlaHours: platformRes.data.review_sla_hours,
        demoMode: platformRes.data.demo_mode,
      }
    : { closeT0: new Date(Date.now() + 45 * 86400_000).toISOString(), reviewSlaHours: 24, demoMode: true };

  const reports: Record<string, Report> = {};
  (reportsRes.data ?? []).forEach((r) => (reports[r.id] = rowToReport(r)));
  const audit = (auditRes.data ?? []).map(rowToAudit);

  return {
    meId: meRow.id,
    asAdmin: meRow.role === "admin" || meRow.role === "verifier",
    users, profiles, groups, requests, chats, participants, messages,
    blocks, notifications, cooldowns, swipeSeenIds, pendingVerifications,
    reports, audit, platform,
  };
}
