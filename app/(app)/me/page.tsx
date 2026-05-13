"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Pills";
import { CompatRing } from "@/components/ui/CompatRing";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { avgCompatVsGroup } from "@/lib/compat";
import { supabase } from "@/lib/supabase/client";
import { RM, hallTheme } from "@/lib/tokens";

export default function MePage() {
  const router = useRouter();
  const me = useRoomiss((s) => s.users[s.meId]);
  const myProfile = useRoomiss(selectMyProfile);
  const hall = useRoomiss(selectMyHall);
  const profiles = useRoomiss((s) => s.profiles);
  const myGroupId = useRoomiss((s) => s.myGroupId());
  const groups = useRoomiss((s) => s.groups);
  const platform = useRoomiss((s) => s.platform);

  const t = hallTheme(hall);
  const group = myGroupId ? groups[myGroupId] : null;
  const groupMembers = group ? group.memberIds.map((id) => profiles[id]).filter(Boolean) : [];
  const others = groupMembers.filter((p) => p.userId !== me?.id);
  const groupFit = myProfile && others.length > 0 ? avgCompatVsGroup(myProfile, others) : 0;

  const daysToClose = Math.max(
    0,
    Math.round((new Date(platform.closeT0).getTime() - Date.now()) / 86400000),
  );

  if (group?.status === "locked") {
    return (
      <>
        <div className="relative flex-1 flex flex-col" style={{ background: t.deep, color: "#fff", overflow: "hidden" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.18,
              backgroundImage: `radial-gradient(circle at 20% 18%, ${t.accent} 0 4px, transparent 5px),
                                radial-gradient(circle at 80% 12%, #fff 0 3px, transparent 4px),
                                radial-gradient(circle at 65% 26%, ${t.accent} 0 2px, transparent 3px),
                                radial-gradient(circle at 30% 40%, #fff 0 2px, transparent 3px),
                                radial-gradient(circle at 88% 55%, ${t.accent} 0 3px, transparent 4px),
                                radial-gradient(circle at 12% 70%, #fff 0 2px, transparent 3px),
                                radial-gradient(circle at 75% 85%, ${t.accent} 0 4px, transparent 5px)`,
            }}
          />
          <div className="relative flex-1 flex flex-col px-6 pt-12 pb-6">
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <div
                className="flex items-center justify-center mb-5"
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  background: t.accent,
                  color: "#fff",
                  boxShadow: `0 0 0 8px ${t.accent}33, 0 18px 40px rgba(0,0,0,0.3)`,
                }}
              >
                <span style={{ fontSize: 36 }}>🔒</span>
              </div>

              <div className="font-mono uppercase mb-1" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.7 }}>
                LOCKED · {hall} HALL
              </div>

              <h1
                className="font-serif"
                style={{ fontSize: 40, letterSpacing: -0.8, lineHeight: 1, margin: "0 0 14px" }}
              >
                You&rsquo;re a group.
              </h1>
              <p style={{ fontSize: 15.5, lineHeight: 1.5, opacity: 0.8, maxWidth: 320, margin: "0 0 28px" }}>
                {groupMembers.map((m) => m.displayName.split(" ")[0]).join(", ")}. Submitted to admin for room
                assignment. We&rsquo;ll buzz when allotment opens.
              </p>

              <div className="flex justify-center mb-5">
                {groupMembers.map((m, i) => (
                  <div
                    key={m.userId}
                    style={{
                      marginLeft: i ? -16 : 0,
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      boxShadow: `0 0 0 4px ${t.deep}`,
                      position: "relative",
                    }}
                  >
                    <Avatar name={m.displayName} hall={hall} size={72} />
                  </div>
                ))}
              </div>

              <div
                className="font-serif text-center mb-4"
                style={{ fontSize: 16, letterSpacing: -0.2 }}
              >
                {groupMembers.map((m) => m.displayName.split(" ")[0]).join(" · ")}
              </div>

              <div
                className="mt-5 flex gap-6 px-4 py-3.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Stat value={`${groupFit}%`} label="group fit" />
                <Divider />
                <Stat value={`${daysToClose}d`} label="to allotment" />
                <Divider />
                <Stat value={`${group.size}/${group.finalSize}`} label="locked" />
              </div>

              <div className="w-full mt-5">
                <SharedNote groupId={group.id} initial={group.sharedBio ?? ""} light />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                variant="primary"
                hall={hall}
                size="md"
                full
                style={{ background: t.accent }}
                onClick={() => {
                  // Find or create group chat
                  const chat = useRoomiss
                    .getState()
                    .chats;
                  const myChat = Object.values(chat).find((c) => c.groupId === group.id);
                  if (myChat) router.push(`/chat/${myChat.id}`);
                }}
              >
                Open group chat
              </Button>
              <Link href="/group/leave">
                <button
                  className="w-full"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    fontSize: 14,
                  }}
                >
                  Leave group
                </button>
              </Link>
              <Link href="/settings">
                <button
                  className="w-full"
                  style={{
                    background: "transparent",
                    color: "rgba(255,255,255,0.85)",
                    border: "none",
                    padding: "8px 16px",
                    fontSize: 13,
                  }}
                >
                  Settings · Profile · Privacy
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Solo / partial group state
  return (
    <>
      <AppHeader hall={hall} title="You" sub={`${hall} · status: ${group ? `partial ${group.size}/${group.finalSize}` : "solo"}`} />
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3.5">
        <div
          className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          {myProfile && <Avatar name={myProfile.displayName} hall={hall} size={56} ring />}
          <div className="flex-1 min-w-0">
            <div className="font-serif" style={{ fontSize: 22, letterSpacing: -0.3 }}>
              {myProfile?.displayName ?? "You"}
            </div>
            <div className="text-sm" style={{ color: RM.ink2 }}>
              {myProfile?.branch} · {myProfile?.hometownCity}, {myProfile?.hometownState}
            </div>
            <div className="mt-1.5">
              <StatusPill tone={(myProfile?.completeness ?? 0) >= 80 ? "verified" : "pending"}>
                Profile {myProfile?.completeness ?? 0}%
              </StatusPill>
            </div>
          </div>
          <Link href="/onboarding/profile">
            <Button variant="soft" size="sm">Edit</Button>
          </Link>
        </div>

        {group && (
          <div
            className="p-4 rounded-2xl"
            style={{ background: t.soft, color: t.deep }}
          >
            <div className="flex justify-between items-baseline">
              <div className="font-serif" style={{ fontSize: 20, letterSpacing: -0.3 }}>
                Your partial group
              </div>
              <span
                className="font-mono"
                style={{ fontSize: 11, letterSpacing: 0.4 }}
              >
                {group.size}/{group.finalSize}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              {groupMembers.map((m) => (
                <div key={m.userId} className="flex flex-col items-center gap-1">
                  <Avatar name={m.displayName} hall={hall} size={42} />
                  <span style={{ fontSize: 11 }}>{m.displayName.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Link href="/browse">
                <Button variant="primary" size="sm" hall={hall}>
                  Find member #{group.size + 1}
                </Button>
              </Link>
              <Link href="/group/leave">
                <Button variant="secondary" size="sm">Leave</Button>
              </Link>
            </div>
          </div>
        )}

        {group && (
          <SharedNote groupId={group.id} initial={group.sharedBio ?? ""} />
        )}

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div className="font-mono uppercase" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
            Allotment countdown
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif" style={{ fontSize: 32, letterSpacing: -0.5 }}>
              {daysToClose}
            </span>
            <span className="text-sm" style={{ color: RM.ink2 }}>
              days until institute allotment locks rooms
            </span>
          </div>
          <div className="text-xs mt-2" style={{ color: RM.ink3 }}>
            Platform-close milestones: T-7 freezes matching · T+0 banner · T+30 read-only · T+90 export · T+180 PII purge.
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/settings">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
            >
              <span style={{ fontSize: 15 }}>Settings · privacy · notifications</span>
              <span style={{ color: RM.ink3 }}>›</span>
            </div>
          </Link>
          <Link href="/notifications">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
            >
              <span style={{ fontSize: 15 }}>Notifications</span>
              <span style={{ color: RM.ink3 }}>›</span>
            </div>
          </Link>
          <Link href="/blocked">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
            >
              <span style={{ fontSize: 15 }}>Blocked users</span>
              <span style={{ color: RM.ink3 }}>›</span>
            </div>
          </Link>
          <Link href="/privacy">
            <div
              className="p-3.5 rounded-2xl flex items-center justify-between"
              style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
            >
              <span style={{ fontSize: 15 }}>Privacy & data export</span>
              <span style={{ color: RM.ink3 }}>›</span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

/**
 * Live-editable shared note backed by `groups.shared_bio`. Any active member
 * can edit it (RLS policy `groups_update_member`). Saves on blur and shows
 * a small "saved" indicator.
 */
function SharedNote({
  groupId,
  initial,
  light = false,
}: {
  groupId: string;
  initial: string;
  light?: boolean;
}) {
  const [val, setVal] = useState(initial);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-sync from server-side changes (realtime update on groups row).
  useEffect(() => setVal(initial), [initial]);

  const save = async () => {
    if (val === initial) return;
    setSaving(true);
    const { error } = await supabase
      .from("groups").update({ shared_bio: val }).eq("id", groupId);
    setSaving(false);
    if (!error) setSavedAt(Date.now());
  };

  return (
    <div
      className="p-4 rounded-2xl"
      style={
        light
          ? { background: "rgba(255,255,255,0.08)" }
          : { background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }
      }
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 8 }}
      >
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: 0.5,
            color: light ? "rgba(255,255,255,0.65)" : RM.ink3,
          }}
        >
          Shared room preferences
        </div>
        {(saving || savedAt) && (
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: 0.3,
              color: light ? "rgba(255,255,255,0.55)" : RM.good,
            }}
          >
            {saving ? "saving…" : "saved"}
          </span>
        )}
      </div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        rows={3}
        placeholder="AC vs non-AC, floor preference, noise tolerance, things to bring vs share, anything else the warden's office should know…"
        className="w-full outline-none"
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: light ? "rgba(0,0,0,0.18)" : RM.bg,
          color: light ? "#fff" : RM.ink,
          border: `1px solid ${light ? "rgba(255,255,255,0.18)" : RM.hairline2}`,
          fontSize: 14,
          resize: "vertical",
          fontFamily: RM.sans,
          lineHeight: 1.5,
        }}
      />
      <div
        className="font-mono"
        style={{
          fontSize: 10.5,
          letterSpacing: 0.3,
          marginTop: 6,
          color: light ? "rgba(255,255,255,0.55)" : RM.ink3,
        }}
      >
        Every member can edit. Auto-saves on blur.
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-serif" style={{ fontSize: 22, letterSpacing: -0.3 }}>
        {value}
      </div>
      <div className="font-mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 2, letterSpacing: 0.4 }}>
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />;
}
