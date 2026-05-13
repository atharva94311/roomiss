"use client";

import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

/**
 * Persistent banner shown on every screen while the user's account is
 * scheduled for deletion. Lets them undo within the 30-day grace window.
 */
export function DeletionBanner() {
  const me = useRoomiss((s) => s.users[s.meId]);
  const cancel = useRoomiss((s) => s.cancelAccountDeletion);
  if (!me?.scheduledDeletionAt) return null;

  const ts = new Date(me.scheduledDeletionAt).getTime();
  const days = Math.max(0, Math.ceil((ts - Date.now()) / 86_400_000));

  return (
    <div
      style={{
        background: RM.bad,
        color: "#fff",
        padding: "8px 14px",
        fontSize: 12.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: RM.sans,
        letterSpacing: 0.1,
      }}
    >
      <span>
        Account scheduled for deletion · purges in {days} day{days === 1 ? "" : "s"}
      </span>
      <button
        onClick={async () => {
          const r = await cancel();
          if (!r.ok) alert(`Couldn't cancel: ${r.error}`);
        }}
        style={{
          background: "rgba(255,255,255,0.18)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.45)",
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: 11.5,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Cancel deletion
      </button>
    </div>
  );
}
