"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./client";
import {
  rowToUser, rowToProfile, rowToGroup, rowToRequest, rowToChat,
  rowToParticipant, rowToMessage, rowToNotification,
} from "./mappers";
import type { Database } from "@/lib/database.types";
import type { RoomissState } from "@/lib/store";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

interface StoreApi {
  getState: () => RoomissState;
  setState: (
    partial: Partial<RoomissState> | ((s: RoomissState) => Partial<RoomissState> | RoomissState),
  ) => void;
}

/**
 * Subscribe to live updates from Supabase. RLS gates the rows we receive,
 * but per-row dispatches still cost transport — we scope filters where
 * possible (notifications by user_id; chats/messages stay unfiltered because
 * RLS is the gate). The handlers are idempotent so realtime echo of an
 * already-cached row is a no-op.
 */
export function subscribeRealtime(api: StoreApi): RealtimeChannel {
  const meId = api.getState().meId;
  const channel = supabase
    .channel("roomiss-live")
    // ─── messages ──────────────────────────────────────────────
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const r = payload.new as Row<"messages">;
        const msg = rowToMessage(r);
        api.setState((s) => {
          // Already in cache (e.g. optimistic insert already reconciled) → no-op.
          if (s.messages.some((m) => m.id === msg.id)) return s;
          // Replace any optimistic temp with this real row.
          const next = s.messages.filter(
            (m) =>
              !(
                m.id.startsWith("temp-") &&
                m.chatId === msg.chatId &&
                m.senderId === msg.senderId &&
                m.body === msg.body
              ),
          );
          return { ...s, messages: [...next, msg] };
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages" },
      (payload) => {
        const r = payload.new as Row<"messages">;
        const msg = rowToMessage(r);
        api.setState((s) => ({
          ...s,
          messages: s.messages.map((m) => (m.id === msg.id ? msg : m)),
        }));
      },
    )
    // ─── requests ──────────────────────────────────────────────
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "requests" },
      async (payload) => {
        const r = payload.new as Row<"requests"> | undefined;
        if (!r) return;
        // Refetch the acceptances for the request to keep them in sync.
        const { data: accs } = await supabase
          .from("request_acceptances")
          .select("*")
          .eq("request_id", r.id);
        const req = rowToRequest(r, accs ?? []);
        api.setState((s) => ({
          ...s,
          requests: { ...s.requests, [req.id]: req },
        }));
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "request_acceptances" },
      async (payload) => {
        const acc = (payload.new ?? payload.old) as Row<"request_acceptances">;
        const reqId = acc.request_id;
        const { data: accs } = await supabase
          .from("request_acceptances")
          .select("*")
          .eq("request_id", reqId);
        const { data: reqRow } = await supabase
          .from("requests")
          .select("*")
          .eq("id", reqId)
          .maybeSingle();
        if (!reqRow) return;
        const req = rowToRequest(reqRow, accs ?? []);
        api.setState((s) => ({
          ...s,
          requests: { ...s.requests, [req.id]: req },
        }));
      },
    )
    // ─── notifications ─────────────────────────────────────────
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
      (payload) => {
        const n = rowToNotification(payload.new as Row<"notifications">);
        api.setState((s) => {
          if (s.notifications.some((x) => x.id === n.id)) return s;
          return { ...s, notifications: [n, ...s.notifications] };
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
      (payload) => {
        const n = rowToNotification(payload.new as Row<"notifications">);
        api.setState((s) => ({
          ...s,
          notifications: s.notifications.map((x) => (x.id === n.id ? n : x)),
        }));
      },
    )
    // ─── groups + members ─────────────────────────────────────
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "groups" },
      async (payload) => {
        const r = (payload.new ?? payload.old) as Row<"groups">;
        if (!r) return;
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", r.id)
          .is("left_at", null);
        const memberIds = (members ?? []).map((m) => m.user_id);
        const g = rowToGroup(r, memberIds);
        api.setState((s) => ({ ...s, groups: { ...s.groups, [g.id]: g } }));
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_members" },
      async (payload) => {
        const r = (payload.new ?? payload.old) as Row<"group_members">;
        if (!r) return;
        const { data: groupRow } = await supabase
          .from("groups")
          .select("*")
          .eq("id", r.group_id)
          .maybeSingle();
        if (!groupRow) return;
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", r.group_id)
          .is("left_at", null);
        const memberIds = (members ?? []).map((m) => m.user_id);
        const g = rowToGroup(groupRow, memberIds);
        api.setState((s) => ({ ...s, groups: { ...s.groups, [g.id]: g } }));
      },
    )
    // ─── chats + participants ─────────────────────────────────
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chats" },
      async (payload) => {
        const r = (payload.new ?? payload.old) as Row<"chats">;
        if (!r) return;
        const { data: parts } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_id", r.id)
          .is("left_at", null);
        const participantIds = (parts ?? []).map((p) => p.user_id);
        const c = rowToChat(r, participantIds);
        api.setState((s) => ({ ...s, chats: { ...s.chats, [c.id]: c } }));
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_participants" },
      (payload) => {
        const r = (payload.new ?? payload.old) as Row<"chat_participants">;
        if (!r) return;
        const cp = rowToParticipant(r);
        api.setState((s) => {
          const others = s.participants.filter(
            (p) => !(p.chatId === cp.chatId && p.userId === cp.userId),
          );
          return { ...s, participants: [...others, cp] };
        });
      },
    )
    // ─── users + profiles (so peer updates land live) ──────────
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      (payload) => {
        const r = (payload.new ?? payload.old) as Row<"users">;
        if (!r) return;
        const u = rowToUser(r);
        api.setState((s) => ({ ...s, users: { ...s.users, [u.id]: u } }));
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      (payload) => {
        const r = (payload.new ?? payload.old) as Row<"profiles">;
        if (!r) return;
        const p = rowToProfile(r);
        api.setState((s) => ({ ...s, profiles: { ...s.profiles, [p.userId]: p } }));
      },
    )
    .subscribe();

  return channel;
}
