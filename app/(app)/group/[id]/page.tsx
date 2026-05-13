"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { avgCompatVsGroup } from "@/lib/compat";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CompatRing } from "@/components/ui/CompatRing";
import { StatusPill } from "@/components/ui/Pills";
import { RM, hallTheme } from "@/lib/tokens";

export default function JointProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const group = useRoomiss((s) => s.groups[id]);
  const profiles = useRoomiss((s) => s.profiles);
  const myHall = useRoomiss(selectMyHall);
  const myProfile = useRoomiss(selectMyProfile);
  const sendGroupRequest = useRoomiss((s) => s.sendSoloGroupRequest);
  const myGroupId = useRoomiss((s) => s.myGroupId());
  const initiateMerge = useRoomiss((s) => s.initiateMerge);
  const meId = useRoomiss((s) => s.meId);
  const [sent, setSent] = useState(false);

  if (!group) return <div className="p-6">Group not found</div>;
  const t = hallTheme(group.hall);
  const members = group.memberIds.map((mid) => profiles[mid]).filter(Boolean);
  const need = group.finalSize - members.length;
  const score = myProfile ? avgCompatVsGroup(myProfile, members) : 70;
  const isMember = group.memberIds.includes(meId);

  const onSendRequest = async () => {
    if (myGroupId) {
      const id_ = await initiateMerge(group.id);
      if (id_) setSent(true);
      else alert("Couldn't initiate merge — group sizes don't fit.");
    } else {
      const id_ = await sendGroupRequest(group.id);
      if (id_) setSent(true);
      else alert("Group is full or you can't request.");
    }
  };

  return (
    <>
      {/* Header strip */}
      <div
        className="textured"
        style={{
          background: `linear-gradient(160deg, ${t.soft} 0%, #F0E4D2 100%)`,
          padding: "8px 16px 18px",
          borderBottom: `3px solid ${t.accent}`,
        }}
      >
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "none",
              padding: "8px 12px",
              borderRadius: 20,
              fontSize: 13,
            }}
          >
            ← Back
          </button>
          <StatusPill tone="pending" dot={false}>
            partial · {members.length}/{group.finalSize}
          </StatusPill>
          <span style={{ width: 50 }} />
        </div>

        <div className="mt-4">
          <div
            className="font-mono uppercase"
            style={{ fontSize: 10.5, color: t.deep, letterSpacing: 0.5 }}
          >
            Joint profile
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 30,
              margin: "4px 0 0",
              color: t.deep,
              letterSpacing: -0.5,
              lineHeight: 1.05,
            }}
          >
            {members.map((m) => m.displayName.split(" ")[0]).join(" & ")}
          </h1>
          <div className="mt-1.5" style={{ fontSize: 13, color: RM.ink2 }}>
            looking for {need} more · matched recently
          </div>
        </div>

        <div className="flex gap-2 mt-3.5">
          {members.map((m) => (
            <div
              key={m.userId}
              className="flex-1 flex flex-col items-center gap-1.5 rounded-xl p-2.5"
              style={{ background: "rgba(255,255,255,0.55)" }}
            >
              <Avatar name={m.displayName} hall={group.hall} size={48} />
              <div className="font-serif" style={{ fontSize: 15, lineHeight: 1, letterSpacing: -0.2 }}>
                {m.displayName.split(" ")[0]}
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                {m.branch}
              </div>
            </div>
          ))}
          {Array.from({ length: need }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5"
              style={{
                border: `2px dashed ${t.accent}`,
                background: "rgba(255,255,255,0.3)",
                color: t.accent,
                minHeight: 96,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: `2px dashed ${t.accent}`,
                  fontSize: 22,
                }}
              >
                +
              </div>
              <div
                className="font-mono uppercase"
                style={{ fontSize: 10, letterSpacing: 0.3 }}
              >
                open seat
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div
          className="flex gap-3 items-center p-3.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <CompatRing score={score} size={50} hall={group.hall} />
          <div className="flex-1">
            <div
              className="font-serif"
              style={{ fontSize: 17, lineHeight: 1.1, letterSpacing: -0.3 }}
            >
              {score}% group match with you
            </div>
            <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 3 }}>
              Avg of {members.length} pairwise scores.
            </div>
          </div>
        </div>

        {group.sharedBio && (
          <div
            className="p-3.5 rounded-2xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div
              className="font-mono uppercase mb-2"
              style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
            >
              Group bio
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: RM.ink, margin: 0 }}>
              {group.sharedBio}
            </p>
          </div>
        )}

        <div
          className="p-3.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase mb-2.5"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Shared preferences
          </div>
          {[
            { l: "Food", v: distinct(members.map((m) => m.foodPref)) },
            { l: "AC room", v: distinct(members.map((m) => m.acPref)) },
            { l: "Sleep", v: distinct(members.map((m) => m.sleepSchedule)) },
            { l: "Cleanliness", v: members.map((m) => m.cleanliness).join(" / ") },
          ].map((row, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-2"
              style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
            >
              <span style={{ fontSize: 13.5, color: RM.ink2 }}>{row.l}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{row.v}</span>
            </div>
          ))}
        </div>

        <SectionLabel>What each of them said</SectionLabel>
        {members.map((m) => (
          <Link
            key={m.userId}
            href={`/profile/${m.userId}`}
            className="block p-3.5 rounded-2xl flex gap-3"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <Avatar name={m.displayName} hall={group.hall} size={36} />
            <div className="flex-1">
              <div
                className="font-serif"
                style={{ fontSize: 16, letterSpacing: -0.2 }}
              >
                {m.displayName.split(" ")[0]}
              </div>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13.5,
                  color: RM.ink2,
                  lineHeight: 1.45,
                }}
              >
                {m.bio}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="px-4 py-3 flex gap-2.5"
        style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        <Button variant="secondary" onClick={() => router.back()}>
          Pass
        </Button>
        {isMember ? (
          <Button variant="soft" hall={group.hall} full disabled>
            You&rsquo;re a member of this group
          </Button>
        ) : sent ? (
          <Button variant="soft" hall={group.hall} full disabled>
            ✓ Request sent
          </Button>
        ) : (
          <Button variant="primary" hall={group.hall} size="md" full onClick={onSendRequest}>
            {myGroupId ? `Propose merge · needs ${members.length} approvals` : `Ask to join · needs ${members.length} approvals`}
          </Button>
        )}
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase"
      style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, padding: "0 4px" }}
    >
      {children}
    </div>
  );
}

function distinct(values: string[]): string {
  const all = [...new Set(values)];
  return all.join(" / ");
}
