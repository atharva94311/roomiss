"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./client";

/**
 * Per-chat typing-indicator using Supabase Realtime Presence. Each tab tracks
 * `{ typing: boolean, at: number }`; subscribers compute the set of OTHER
 * users who are typing within the last 4 seconds.
 */
export function useTypingPresence(chatId: string | null, meId: string) {
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!chatId || meId === "guest") return;
    const ch = supabase.channel(`chat:${chatId}:typing`, {
      config: { presence: { key: meId } },
    });

    const recompute = () => {
      const state = ch.presenceState() as Record<string, { typing: boolean; at: number }[]>;
      const now = Date.now();
      const ids: string[] = [];
      Object.entries(state).forEach(([uid, presences]) => {
        if (uid === meId) return;
        if (presences.some((p) => p.typing && now - p.at < 4000)) ids.push(uid);
      });
      setTypingUserIds(ids);
    };

    ch.on("presence", { event: "sync" }, recompute)
      .on("presence", { event: "join" }, recompute)
      .on("presence", { event: "leave" }, recompute);

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ typing: false, at: Date.now() });
      }
    });

    setChannel(ch);
    // Stale-typing reaper: re-evaluate every second so an indicator drops
    // off after 4s even if no further presence sync fires.
    const tick = setInterval(recompute, 1000);
    return () => {
      clearInterval(tick);
      supabase.removeChannel(ch);
      setChannel(null);
    };
  }, [chatId, meId]);

  /**
   * Call on every input change. Debounces to 2.5s of idle = "not typing".
   *
   * The IIFE pattern this replaced created a fresh closure on every render,
   * so the debounce timer was reset to null each time the component
   * re-rendered (which happens on every keystroke), defeating the purpose.
   * useRef persists the timer across renders.
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setTyping = useCallback(
    (active: boolean) => {
      if (!channel) return;
      channel.track({ typing: active, at: Date.now() });
      if (active) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          channel.track({ typing: false, at: Date.now() });
        }, 2500);
      }
    },
    [channel],
  );

  return { typingUserIds, setTyping };
}
