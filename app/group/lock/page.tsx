"use client";

import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { hallTheme } from "@/lib/tokens";

export default function LockGroupPage() {
  const router = useRouter();
  const hall = useRoomiss(selectMyHall);
  const t = hallTheme(hall);
  const myGroupId = useRoomiss((s) => s.myGroupId());
  const groups = useRoomiss((s) => s.groups);
  const profiles = useRoomiss((s) => s.profiles);

  if (!myGroupId) {
    return (
      <MobileShell>
        <div className="p-6">No group to lock.</div>
      </MobileShell>
    );
  }

  const group = groups[myGroupId];
  const members = group.memberIds.map((id) => profiles[id]).filter(Boolean);
  const ready = group.size === group.finalSize;

  const onLock = () => {
    if (!ready) return;
    useRoomiss.setState((s) => {
      const g = s.groups[myGroupId];
      if (!g) return s;
      g.status = "locked";
      g.lockedAt = new Date().toISOString();
      return { ...s };
    });
    router.push("/me");
  };

  return (
    <MobileShell dark>
      <div className="px-6 pt-12 pb-8 flex-1 flex flex-col items-center text-center text-white" style={{ background: t.deep }}>
        <div
          className="flex items-center justify-center mb-6"
          style={{
            width: 86,
            height: 86,
            borderRadius: 43,
            background: t.accent,
            color: "#fff",
            boxShadow: `0 0 0 8px ${t.accent}33`,
          }}
        >
          <span style={{ fontSize: 36 }}>🔒</span>
        </div>
        <h1
          className="font-serif"
          style={{ fontSize: 36, letterSpacing: -0.6, lineHeight: 1, margin: "0 0 14px" }}
        >
          Lock the group?
        </h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.5, opacity: 0.8, maxWidth: 320 }}>
          Locking ends discovery for everyone in the group. The group is submitted to admin for room
          assignment. Members can still leave (24-hour cooldown).
        </p>
        <div className="flex justify-center mt-7 mb-7">
          {members.map((m, i) => (
            <div
              key={m.userId}
              style={{
                marginLeft: i ? -16 : 0,
                width: 64,
                height: 64,
                borderRadius: 32,
                boxShadow: `0 0 0 4px ${t.deep}`,
                position: "relative",
              }}
            >
              <Avatar name={m.displayName} hall={hall} size={64} />
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="w-full flex flex-col gap-2.5">
          <Button
            variant="primary"
            full
            size="lg"
            style={{ background: t.accent }}
            onClick={onLock}
            disabled={!ready}
          >
            🔒 Lock our group
          </Button>
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "12px 16px",
              borderRadius: 12,
              fontSize: 14,
            }}
          >
            Not yet
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
