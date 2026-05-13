"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { subscribeRealtime } from "@/lib/supabase/realtime";
import { useRoomiss } from "@/lib/store";

/**
 * Wires Supabase Auth → store hydration → Realtime subscription.
 *
 *   - On INITIAL_SESSION / SIGNED_IN → hydrate() then attach realtime channel
 *   - On SIGNED_OUT → reset cache + detach channel
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useRoomiss((s) => s.hydrate);
  const resetCache = useRoomiss((s) => s.resetCache);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;
    const attachLive = () => {
      if (channelRef.current) return;
      channelRef.current = subscribeRealtime({
        getState: useRoomiss.getState,
        setState: useRoomiss.setState as never,
      });
    };
    const detachLive = async () => {
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    // Run initial hydrate (if a session is restored from localStorage)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session) {
        await hydrate();
        attachLive();
      } else {
        resetCache();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await hydrate();
        attachLive();
      } else if (event === "SIGNED_OUT") {
        await detachLive();
        resetCache();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      detachLive();
    };
  }, [hydrate, resetCache]);

  // Session ping: keeps users.last_active_at fresh so "Active last 7d" filter
  // and the chat "online" indicators work. Skips when no session is live.
  useEffect(() => {
    const tick = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      // RPC errors are swallowed — a missed ping just means stale lastActiveAt.
      try { await supabase.rpc("session_ping"); } catch { /* noop */ }
    };
    // Ping on mount + every 60s while the tab is visible.
    tick();
    const id = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) tick();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return <>{children}</>;
}
