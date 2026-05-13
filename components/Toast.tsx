"use client";

import { useEffect, useState } from "react";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

function humanize(msg: string | null): string | null {
  if (!msg) return null;
  const map: Record<string, string> = {
    not_authenticated: "Please sign in to do that.",
    not_verified: "Your account isn't verified yet.",
    forbidden: "You don't have permission.",
    cooldown_active: "You're in a cooldown for that person.",
    too_many_outstanding: "You have 5 pending requests already — wait or withdraw one.",
    duplicate_pending: "You've already requested them.",
    cannot_request_self: "Can't send a request to yourself.",
    different_hall: "That person isn't in your hall.",
    target_in_group: "That person is already in a group.",
    already_swiped: "Already swiped on this one.",
    group_unavailable: "That group is full or already locked.",
    rate_limited_6h: "Try again — you can resubmit every 6 hours.",
    merge_exceeds_capacity: "Those two groups together don't fit a single room.",
    not_pending: "That request is no longer pending.",
    not_in_group: "You're not in a group right now.",
    matching_closed: "Matching closed 7 days before institute allotment.",
    demo_mode_disabled: "Demo self-approval is off in this environment.",
  };
  for (const key of Object.keys(map)) {
    if (msg.includes(key)) return map[key];
  }
  return msg;
}

/**
 * Bottom-center toast. Two channels:
 *  - `lastError` → red, 4s dwell, friendly server-error mapping
 *  - `lastSuccess` → ink, 2s dwell, raw string (callers write whatever)
 * Click to dismiss either.
 */
export function Toast() {
  const lastError = useRoomiss((s) => s.lastError);
  const lastSuccess = useRoomiss((s) => s.lastSuccess);
  const setState = useRoomiss.setState;
  const [visible, setVisible] = useState<{ text: string; tone: "error" | "ok" } | null>(null);

  useEffect(() => {
    const friendly = humanize(lastError);
    if (!friendly) return;
    setVisible({ text: friendly, tone: "error" });
    const t = setTimeout(() => {
      setVisible(null);
      setState({ lastError: null });
    }, 4000);
    return () => clearTimeout(t);
  }, [lastError, setState]);

  useEffect(() => {
    if (!lastSuccess) return;
    setVisible({ text: lastSuccess, tone: "ok" });
    const t = setTimeout(() => {
      setVisible(null);
      setState({ lastSuccess: null });
    }, 2000);
    return () => clearTimeout(t);
  }, [lastSuccess, setState]);

  if (!visible) return null;
  const isError = visible.tone === "error";
  return (
    <div
      onClick={() => {
        setVisible(null);
        setState({ lastError: null, lastSuccess: null });
      }}
      role={isError ? "alert" : "status"}
      style={{
        position: "fixed",
        // Clears the tab bar (~70px) on (app) routes + iOS home-indicator safe area.
        bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        background: isError ? RM.bad : RM.ink,
        color: isError ? "#fff" : RM.bg,
        padding: "10px 16px",
        borderRadius: 999,
        fontSize: 13,
        fontFamily: RM.mono,
        letterSpacing: 0.2,
        boxShadow: "0 8px 28px rgba(0,0,0,0.25)",
        cursor: "pointer",
        zIndex: 100,
        maxWidth: "90vw",
      }}
    >
      {visible.text}
    </div>
  );
}
