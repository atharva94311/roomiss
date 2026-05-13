"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Pills";
import { I } from "@/components/ui/Icons";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";
import type { Hall, Profile } from "@/lib/types";

export default function MergeConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const request = useRoomiss((s) => s.requests[id]);
  const groups = useRoomiss((s) => s.groups);
  const profiles = useRoomiss((s) => s.profiles);
  const accept = useRoomiss((s) => s.acceptRequest);
  const decline = useRoomiss((s) => s.declineRequest);
  const meId = useRoomiss((s) => s.meId);
  const hall = useRoomiss(selectMyHall);
  const t = hallTheme(hall);

  if (!request || !request.initiatorGroupId || !request.targetGroupId)
    return (
      <MobileShell>
        <div className="p-6">Merge request not found.</div>
      </MobileShell>
    );

  const groupA = groups[request.initiatorGroupId];
  const groupB = groups[request.targetGroupId];
  const allMembers = [
    ...groupA.memberIds.map((id) => profiles[id]),
    ...groupB.memberIds.map((id) => profiles[id]),
  ].filter(Boolean);

  const myAcc = request.acceptances.find((a) => a.userId === meId);
  const accepted = request.acceptances.filter((a) => a.decision === "accept").length;
  const total = request.acceptances.length;

  return (
    <MobileShell>
      <div
        className="px-4 pt-3 pb-5 text-white"
        style={{ background: t.deep }}
      >
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              padding: "7px 12px",
              borderRadius: 20,
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <span
            className="font-mono"
            style={{ fontSize: 10.5, letterSpacing: 1, opacity: 0.7 }}
          >
            MERGE PROPOSAL
          </span>
          <span style={{ width: 50 }} />
        </div>
        <h1
          className="font-serif mt-3.5"
          style={{ fontSize: 26, letterSpacing: -0.4, lineHeight: 1.1, margin: "0 0 6px" }}
        >
          Merge into a group of {groupA.size + groupB.size}?
        </h1>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          All {total} members must approve. Until then, neither side is locked.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div
          className="p-4 rounded-2xl flex items-center gap-3 justify-around"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <DiagramSide label="Group A" members={groupA.memberIds.map((id) => profiles[id]).filter(Boolean)} hall={hall} />
          <span style={{ fontSize: 22, color: t.accent, fontWeight: 300 }}>+</span>
          <DiagramSide label="Group B" members={groupB.memberIds.map((id) => profiles[id]).filter(Boolean)} hall={hall} />
          <span style={{ fontSize: 22, color: t.accent, fontWeight: 300 }}>=</span>
          <DiagramSide
            label="New group"
            members={allMembers}
            hall={hall}
            highlight
          />
        </div>

        <div
          className="p-3.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div className="flex justify-between items-baseline mb-2">
            <div
              className="font-mono uppercase"
              style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
            >
              Approvals
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: RM.ink2 }}>
              {accepted} / {total}
            </div>
          </div>
          {request.acceptances.map((a, i) => {
            const p = profiles[a.userId];
            if (!p) return null;
            return (
              <div
                key={a.userId}
                className="flex items-center gap-3 py-2.5"
                style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
              >
                <Avatar name={p.displayName} hall={hall} size={32} />
                <div className="flex-1">
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>
                    {p.displayName}
                    {a.userId === meId && (
                      <span style={{ color: RM.ink3, fontWeight: 400 }}> (you)</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: RM.ink3 }}>{p.branch}</div>
                </div>
                {a.decision === "accept" && <StatusPill tone="verified">Approved</StatusPill>}
                {a.decision === "decline" && <StatusPill tone="danger">Declined</StatusPill>}
                {a.decision === "pending" && <StatusPill tone="pending">Waiting</StatusPill>}
              </div>
            );
          })}
        </div>

        <div
          className="p-3.5 rounded-2xl"
          style={{ background: `${t.accent}10`, border: `1px solid ${t.accent}33` }}
        >
          <div
            className="font-mono uppercase mb-2 flex items-center gap-1.5"
            style={{ fontSize: 10.5, color: t.deep, letterSpacing: 0.5 }}
          >
            {I.info} What this changes
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 13, lineHeight: 1.6, color: RM.ink2 }}>
            <li>+ All members join the canonical (older) chat with full history</li>
            <li>+ Group {groupA.size + groupB.size === groupA.finalSize ? "becomes locked — discovery turns off" : "stays partial"}</li>
            <li>− Pending requests on either side will be auto-invalidated</li>
            <li>− The younger chat is archived (read-only to its members for 30 days)</li>
          </ul>
        </div>
      </div>

      <div
        className="px-4 py-3"
        style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            onClick={async () => {
              const r = await decline(id);
              if (!r.ok) alert(`Couldn't decline: ${r.error}`);
              else router.back();
            }}
            disabled={myAcc?.decision === "decline"}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            hall={hall}
            full
            onClick={async () => {
              const r = await accept(id);
              if (!r.ok) {
                alert(`Couldn't approve: ${r.error}`);
                return;
              }
              // If everyone has now approved, the group has been merged — the
              // realtime channel will update the local cache and /me will show
              // the canonical (older) chat. If we're still mid-vote, /me still
              // shows my current partial group; the request stays on this page.
              router.push("/me");
            }}
            disabled={myAcc?.decision === "accept"}
          >
            {myAcc?.decision === "accept" ? "You approved — waiting on others" : "Approve merge"}
          </Button>
        </div>
        <div className="text-center mt-2 text-xs" style={{ color: RM.ink3 }}>
          Locking is final — discovery turns off for everyone in the group.
        </div>
      </div>
    </MobileShell>
  );
}

function DiagramSide({
  label,
  members,
  hall,
  highlight,
}: {
  label: string;
  members: Profile[];
  hall: Hall;
  highlight?: boolean;
}) {
  return (
    <div className="text-center flex-1">
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9.5,
          letterSpacing: 0.6,
          color: highlight ? hallTheme(hall).deep : RM.ink3,
        }}
      >
        {label}
      </div>
      <div className="flex justify-center mt-2">
        {members.map((p, i) => (
          <div key={p.userId} style={{ marginLeft: i ? -10 : 0 }}>
            <Avatar name={p.displayName} hall={hall} size={32} />
          </div>
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          color: highlight ? hallTheme(hall).deep : RM.ink2,
          marginTop: 6,
          fontWeight: highlight ? 500 : 400,
        }}
      >
        {members.length} {highlight ? "✓" : ""}
      </div>
    </div>
  );
}
