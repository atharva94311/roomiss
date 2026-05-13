"use client";

import Link from "next/link";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

const DAY = 86_400_000;

type Phase =
  | { kind: "early"; days: number }
  | { kind: "t-7"; days: number }
  | { kind: "t0"; days: number }
  | { kind: "t30"; days: number }
  | { kind: "t90" };

function phaseFor(closeIso: string): Phase | null {
  const t = new Date(closeIso).getTime();
  const now = Date.now();
  const ms = t - now;
  if (ms > 7 * DAY) {
    const d = Math.ceil(ms / DAY);
    // Only nudge in the last 30 days before T-7
    return d <= 30 ? { kind: "early", days: d } : null;
  }
  if (ms > 0) return { kind: "t-7", days: Math.ceil(ms / DAY) };
  if (-ms < 30 * DAY) return { kind: "t0", days: Math.ceil((30 * DAY + ms) / DAY) };
  if (-ms < 90 * DAY) return { kind: "t30", days: Math.ceil((90 * DAY + ms) / DAY) };
  return { kind: "t90" };
}

/**
 * Platform timeline banner shown above every screen during the close-T window.
 * Hidden when the demo's `close_t0` is more than 30 days out.
 */
export function PlatformBanner() {
  const meId = useRoomiss((s) => s.meId);
  const closeT0 = useRoomiss((s) => s.platform.closeT0);
  if (meId === "guest" || !closeT0) return null;
  const phase = phaseFor(closeT0);
  if (!phase) return null;

  let bg = RM.warn;
  let fg = "#fff";
  let label = "";
  let cta: { href: string; text: string } | null = null;

  switch (phase.kind) {
    case "early":
      bg = RM.surface2;
      fg = RM.ink;
      label = `Institute allotment in ${phase.days} day${phase.days === 1 ? "" : "s"}. Discovery closes ${phase.days - 7 <= 0 ? "today" : `in ${phase.days - 7}d`}.`;
      break;
    case "t-7":
      bg = RM.warn;
      label = `Matching closes in ${phase.days} day${phase.days === 1 ? "" : "s"}. Finish forming your group.`;
      break;
    case "t0":
      bg = RM.ink;
      label = `Allotment day. Chats stay open for ${phase.days} more day${phase.days === 1 ? "" : "s"} — coordinate move-in.`;
      cta = { href: "/me", text: "Open group" };
      break;
    case "t30":
      bg = RM.bad;
      label = `Chats are read-only. Export your data within ${phase.days} day${phase.days === 1 ? "" : "s"}.`;
      cta = { href: "/api/export", text: "Download data" };
      break;
    case "t90":
      bg = RM.bad;
      label = "Accounts archived. Contact admin if you need help.";
      break;
  }

  return (
    <div
      role="status"
      style={{
        background: bg,
        color: fg,
        fontFamily: RM.sans,
        fontSize: 12.5,
        letterSpacing: 0.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "7px 14px",
      }}
    >
      <span>{label}</span>
      {cta && (
        <Link
          href={cta.href}
          style={{
            background: "rgba(255,255,255,0.18)",
            color: fg,
            border: `1px solid rgba(255,255,255,0.45)`,
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 11.5,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {cta.text}
        </Link>
      )}
    </div>
  );
}
