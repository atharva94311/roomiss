// DPDPA §6 / spec §3.10: user-initiated data export. Returns a JSON archive
// of every row the authenticated user can read about themselves, signed by
// the user's own session JWT (RLS does the filtering).
//
// Hit /api/export from any logged-in browser → forced download.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: "supabase_config_missing" }, { status: 500 });
  }

  // The browser sends its access token via cookie set by supabase-js (storageKey
  // "roomiss-auth"). The cookie name is `sb-<project_ref>-auth-token` after the
  // Supabase Auth Helpers redirect, but supabase-js by default stores in
  // localStorage on the browser. Server side, we let the client pass its bearer
  // token via the `Authorization` header — the data-export link adds it.
  const auth =
    req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";

  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "missing_authorization", hint: "Open the link from within the app." },
      { status: 401 },
    );
  }

  const supabase = createClient<Database>(url, anon, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: user, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user.user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const uid = user.user.id;

  // RLS gates everything below to what the caller is allowed to read.
  const [
    me, profile, verifications, groups, group_members, requests, request_acceptances,
    chats, chat_participants, messages, blocks, notifications, cooldowns,
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", uid).maybeSingle(),
    supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("verifications").select("*").eq("user_id", uid),
    supabase.from("groups").select("*"),
    supabase.from("group_members").select("*"),
    supabase.from("requests").select("*"),
    supabase.from("request_acceptances").select("*"),
    supabase.from("chats").select("*"),
    supabase.from("chat_participants").select("*"),
    supabase.from("messages").select("*"),
    supabase.from("blocks").select("*"),
    supabase.from("notifications").select("*").eq("user_id", uid),
    supabase.from("cooldowns").select("*").eq("user_id", uid),
  ]);

  const archive = {
    schema: "roomiss-export/v1",
    exported_at: new Date().toISOString(),
    user_id: uid,
    user: me.data,
    profile: profile.data,
    verifications: verifications.data ?? [],
    groups: groups.data ?? [],
    group_members: group_members.data ?? [],
    requests: requests.data ?? [],
    request_acceptances: request_acceptances.data ?? [],
    chats: chats.data ?? [],
    chat_participants: chat_participants.data ?? [],
    messages: messages.data ?? [],
    blocks: blocks.data ?? [],
    notifications: notifications.data ?? [],
    cooldowns: cooldowns.data ?? [],
    notice:
      "This file contains every row the roomiss server has on you, per DPDPA §6 access right. " +
      "Storage objects (slip PDF, profile photo, chat attachments) are referenced by path only — fetch " +
      "from Supabase Storage with your auth token if you need the binaries.",
  };

  const filename = `roomiss-export-${uid.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(archive, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
