"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useRoomiss } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";
import type { Hall, RoomRequest } from "@/lib/types";

/**
 * Co-sign acceptance grid for a request. For group↔solo / group↔group
 * requests, renders a row per voter with their decision. For solo↔solo
 * requests we just show "1 of 2 approved" — the page above usually shows
 * both parties' avatars elsewhere already.
 */
export function AcceptanceGrid({
  request,
  hall,
  compact,
}: {
  request: RoomRequest;
  hall: Hall;
  compact?: boolean;
}) {
  const profiles = useRoomiss((s) => s.profiles);
  const meId = useRoomiss((s) => s.meId);
  const t = hallTheme(hall);
  const acc = request.acceptances ?? [];
  if (acc.length <= 2 && request.type === "solo_solo") return null;

  const accepted = acc.filter((a) => a.decision === "accept").length;
  const declined = acc.filter((a) => a.decision === "decline").length;
  const total = acc.length;

  return (
    <div
      className="mt-3 p-2.5 rounded-xl"
      style={{ background: RM.surface2, border: `1px solid ${RM.hairline}` }}
    >
      <div
        className="flex items-center justify-between mb-1.5 font-mono uppercase"
        style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.4 }}
      >
        <span>Approvals</span>
        <span>
          {accepted} / {total} approved
          {declined > 0 && (
            <span style={{ color: RM.bad, marginLeft: 6 }}>· {declined} declined</span>
          )}
        </span>
      </div>
      <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-col gap-1.5"}>
        {acc.map((a) => {
          const p = profiles[a.userId];
          const name = p?.displayName ?? a.userId.slice(0, 6);
          const tone =
            a.decision === "accept" ? RM.good : a.decision === "decline" ? RM.bad : RM.ink3;
          const dot =
            a.decision === "accept" ? "✓" : a.decision === "decline" ? "✕" : "·";
          if (compact) {
            return (
              <div
                key={a.userId}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full"
                style={{ background: RM.surface, border: `1px solid ${RM.hairline}` }}
                title={`${name} · ${a.decision}`}
              >
                <Avatar name={name} hall={hall} size={18} />
                <span style={{ fontSize: 11, color: RM.ink2 }}>{name.split(" ")[0]}</span>
                <span style={{ color: tone, fontSize: 11, fontWeight: 600 }}>{dot}</span>
              </div>
            );
          }
          return (
            <div
              key={a.userId}
              className="flex items-center gap-2.5 py-1"
            >
              <Avatar name={name} hall={hall} size={22} />
              <span style={{ fontSize: 13, flex: 1 }}>
                {name}
                {a.userId === meId && (
                  <span style={{ color: RM.ink3, marginLeft: 6 }}>(you)</span>
                )}
              </span>
              <span
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: 0.4,
                  color: tone,
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: tone === RM.ink3 ? "transparent" : `${tone}15`,
                  border: tone === RM.ink3 ? `1px dashed ${RM.hairline2}` : "none",
                }}
              >
                {a.decision === "pending" ? "waiting" : a.decision === "accept" ? "approved" : "declined"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Small "expires in 12d" pill used in the request card top-right. */
export function ExpiryChip({ expiresAt }: { expiresAt: string }) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return <span className="font-mono" style={{ fontSize: 10.5, color: RM.bad }}>expired</span>;
  const days = Math.floor(ms / 86_400_000);
  const hrs = Math.floor(ms / 3_600_000);
  const label = days >= 1 ? `${days}d left` : `${Math.max(1, hrs)}h left`;
  const urgent = days < 2;
  return (
    <span
      className="font-mono"
      style={{ fontSize: 10.5, color: urgent ? RM.bad : RM.ink3, letterSpacing: 0.3 }}
    >
      {label}
    </span>
  );
}
