"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { I } from "@/components/ui/Icons";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";

const REASONS = [
  "Lifestyle clash",
  "Found someone else",
  "Personal reason",
  "Reporting concern",
  "Other",
];

export default function LeaveGroupPage() {
  const router = useRouter();
  const profile = useRoomiss(selectMyProfile);
  const hall = useRoomiss(selectMyHall);
  const t = hallTheme(hall);
  const myGroupId = useRoomiss((s) => s.myGroupId());
  const groups = useRoomiss((s) => s.groups);
  const profiles = useRoomiss((s) => s.profiles);
  const leaveGroup = useRoomiss((s) => s.leaveGroup);
  const meId = useRoomiss((s) => s.meId);
  const [reason, setReason] = useState(REASONS[0]);
  const [confirm, setConfirm] = useState("");

  if (!myGroupId) {
    return (
      <MobileShell>
        <div className="p-6">You&rsquo;re not in a group.</div>
      </MobileShell>
    );
  }

  const group = groups[myGroupId];
  const others = group.memberIds.filter((id) => id !== meId).map((id) => profiles[id]).filter(Boolean);

  const canConfirm = confirm.toLowerCase().trim() === (profile?.displayName.toLowerCase() ?? "leave");

  const onLeave = async () => {
    const r = await leaveGroup(reason);
    if (!r.ok) {
      alert(`Couldn't leave: ${r.error ?? "unknown"}`);
      return;
    }
    router.push("/browse");
  };

  return (
    <MobileShell>
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", fontSize: 22, color: RM.ink2, cursor: "pointer" }}
        >
          ←
        </button>
        <span
          className="font-mono"
          style={{ fontSize: 10.5, letterSpacing: 1, color: RM.ink3 }}
        >
          LEAVE GROUP
        </span>
        <span style={{ width: 22 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3.5">
        <div
          className="p-4 rounded-2xl"
          style={{
            background: `linear-gradient(180deg, ${RM.bad}10, ${RM.bad}05)`,
            border: `1px solid ${RM.bad}40`,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              background: `${RM.bad}20`,
              color: RM.bad,
            }}
          >
            {I.warn}
          </div>
          <h1
            className="font-serif"
            style={{ fontSize: 24, letterSpacing: -0.4, margin: "14px 0 6px" }}
          >
            Are you sure?
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: RM.ink2 }}>
            {group.size === 2 ? (
              <>
                You and {others[0]?.displayName.split(" ")[0] ?? "your partner"} are the whole group.
                Leaving <b>dissolves it</b> — they go back to discovery as a solo, and your shared
                chat is archived. They lose access to your past messages.
              </>
            ) : group.status === "locked" ? (
              <>
                Leaving <b>unlocks the group</b>. The remaining members ({others.map((o) => o.displayName.split(" ")[0]).join(" + ")}) become a partial group again and can find a replacement.
              </>
            ) : (
              <>
                The group shrinks to a partial group of {group.size - 1}.{" "}
                {others.map((o) => o.displayName.split(" ")[0]).join(" and ")} can keep matching.
              </>
            )}
          </p>
        </div>

        <div
          className="font-mono uppercase mt-2"
          style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, padding: "0 4px 6px" }}
        >
          What happens next
        </div>
        <div
          className="rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          {[
            { l: "You", v: "Return to solo · 7-day cooldown before you can re-match" },
            {
              l: "Other members",
              v:
                group.size - 1 === 0
                  ? "n/a — you're the only member"
                  : group.size - 1 === 1
                    ? "One member left → group dissolves, they return to solo"
                    : `Stay as a partial group of ${group.size - 1}`,
            },
            {
              l: "Group chat",
              v:
                group.size === 2
                  ? "Archived. Both lose live access; you can both export your history"
                  : "You lose access; remaining members keep the chat",
            },
            { l: "Pending outgoing requests", v: "Auto-withdrawn" },
          ].map((row, i) => (
            <div
              key={i}
              className="px-3.5 py-3"
              style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
            >
              <div style={{ fontSize: 13, color: RM.ink3, fontWeight: 500 }}>{row.l}</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>{row.v}</div>
            </div>
          ))}
        </div>

        <div
          className="font-mono uppercase mt-2"
          style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, padding: "0 4px 6px" }}
        >
          Reason (helps us tune matching)
        </div>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 999,
                background: reason === r ? RM.ink : RM.surface,
                color: reason === r ? RM.bg : RM.ink,
                boxShadow: `0 0 0 1px ${RM.hairline}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div
          className="p-3.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Type your display name (&ldquo;{profile?.displayName}&rdquo;) to confirm
          </div>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2.5 w-full outline-none"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: RM.bg,
              border: `1px solid ${RM.hairline}`,
              fontSize: 14,
              fontFamily: RM.mono,
            }}
          />
        </div>
      </div>

      <div
        className="px-4 py-3 flex gap-2.5"
        style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        <Button variant="secondary" full onClick={() => router.back()}>
          Cancel
        </Button>
        <Button variant="danger" full onClick={onLeave} disabled={!canConfirm}>
          Leave group
        </Button>
      </div>
      <div style={{ background: t.deep, height: 0 }} />
    </MobileShell>
  );
}
