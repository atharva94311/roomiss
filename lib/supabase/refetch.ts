"use client";

import { supabase } from "./client";
import {
  rowToRequest, rowToGroup, rowToChat, rowToParticipant, rowToMessage,
  rowToNotification, rowToUser, rowToProfile, rowToBlock, rowToCooldown,
} from "./mappers";
import type { RoomissState } from "@/lib/store";

type Setter = (
  partial: Partial<RoomissState> | ((s: RoomissState) => Partial<RoomissState> | RoomissState),
) => void;

/** Refetch a single request + its acceptances and patch the local store. */
export async function refetchRequest(set: Setter, requestId: string): Promise<void> {
  const [{ data: row }, { data: accs }] = await Promise.all([
    supabase.from("requests").select("*").eq("id", requestId).maybeSingle(),
    supabase.from("request_acceptances").select("*").eq("request_id", requestId),
  ]);
  if (!row) {
    set((s) => {
      const { [requestId]: _, ...rest } = s.requests;
      return { ...s, requests: rest };
    });
    return;
  }
  const req = rowToRequest(row, accs ?? []);
  set((s) => ({ ...s, requests: { ...s.requests, [req.id]: req } }));
}

/** Refetch a group + its members and patch the store. */
export async function refetchGroup(set: Setter, groupId: string): Promise<void> {
  const [{ data: g }, { data: members }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase.from("group_members").select("user_id").eq("group_id", groupId).is("left_at", null),
  ]);
  if (!g) return;
  const memberIds = (members ?? []).map((m) => m.user_id);
  const group = rowToGroup(g, memberIds);
  set((s) => ({ ...s, groups: { ...s.groups, [group.id]: group } }));
}

/** Refetch a chat + its participants and patch the store. */
export async function refetchChat(set: Setter, chatId: string): Promise<void> {
  const [{ data: c }, { data: parts }] = await Promise.all([
    supabase.from("chats").select("*").eq("id", chatId).maybeSingle(),
    supabase.from("chat_participants").select("*").eq("chat_id", chatId),
  ]);
  if (!c) return;
  const activeIds = (parts ?? []).filter((p) => !p.left_at).map((p) => p.user_id);
  const chat = rowToChat(c, activeIds);
  set((s) => {
    const others = s.participants.filter((p) => p.chatId !== chatId);
    return {
      ...s,
      chats: { ...s.chats, [chat.id]: chat },
      participants: [...others, ...(parts ?? []).map(rowToParticipant)],
    };
  });
}

/** Pull the latest N messages for a chat (used after a JOIN to backfill). */
export async function refetchRecentMessages(set: Setter, chatId: string, limit = 50): Promise<void> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return;
  const msgs = data.map(rowToMessage).reverse();
  set((s) => {
    const others = s.messages.filter((m) => m.chatId !== chatId);
    return { ...s, messages: [...others, ...msgs] };
  });
}

/** Re-pull just the current user's row + profile. Cheap. */
export async function refetchMe(set: Setter, userId: string): Promise<void> {
  const [{ data: u }, { data: p }] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    supabase.from("profiles_safe").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  set((s) => ({
    ...s,
    users: u ? { ...s.users, [u.id]: rowToUser(u) } : s.users,
    profiles: p ? { ...s.profiles, [p.user_id]: rowToProfile(p) } : s.profiles,
  }));
}

/** Refresh notifications (top 100). */
export async function refetchNotifications(set: Setter, userId: string): Promise<void> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data) return;
  set((s) => ({ ...s, notifications: data.map(rowToNotification) }));
}

/** Refresh cooldowns and blocks for me. */
export async function refetchMyBlocksCooldowns(set: Setter, userId: string): Promise<void> {
  const [{ data: blocks }, { data: cds }] = await Promise.all([
    supabase.from("blocks").select("*").eq("blocker_id", userId),
    supabase.from("cooldowns").select("*").eq("user_id", userId).gt("expires_at", new Date().toISOString()),
  ]);
  set((s) => ({
    ...s,
    blocks: (blocks ?? []).map(rowToBlock),
    cooldowns: (cds ?? []).map(rowToCooldown),
  }));
}

/**
 * Retry an async operation with exponential backoff. Doesn't retry on auth or
 * RLS errors — those are intentional.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { tries?: number; baseMs?: number } = {},
): Promise<T> {
  const tries = opts.tries ?? 3;
  const base = opts.baseMs ?? 200;
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      // Don't retry validation / RLS / auth errors.
      if (
        msg.includes("not_authenticated") ||
        msg.includes("forbidden") ||
        msg.includes("rate_limited") ||
        msg.includes("duplicate") ||
        msg.includes("cooldown")
      ) throw e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, base * 2 ** i));
    }
  }
  throw lastErr;
}
