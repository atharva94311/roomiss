"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CompatRing } from "@/components/ui/CompatRing";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { useRoomiss } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";
import type { Hall, Profile } from "@/lib/types";

type Interaction =
  | { kind: "you-requested" }
  | { kind: "they-requested" }
  | { kind: "matched" }
  | { kind: "cooldown"; until: string }
  | { kind: "none" };

function useInteractionWith(targetUserId: string): Interaction {
  const meId = useRoomiss((s) => s.meId);
  const requests = useRoomiss((s) => s.requests);
  const cooldowns = useRoomiss((s) => s.cooldowns);
  const cd = cooldowns.find(
    (c) => c.userId === meId && c.targetUserId === targetUserId && new Date(c.expiresAt) > new Date(),
  );
  if (cd) return { kind: "cooldown", until: cd.expiresAt };
  const open = Object.values(requests).find(
    (r) =>
      (r.targetUserId === targetUserId || r.initiatorUserId === targetUserId) &&
      (r.targetUserId === meId || r.initiatorUserId === meId) &&
      r.type === "solo_solo" &&
      r.status === "pending",
  );
  if (open) {
    return open.initiatorUserId === meId
      ? { kind: "you-requested" }
      : { kind: "they-requested" };
  }
  const mutual = Object.values(requests).find(
    (r) =>
      r.type === "solo_solo" &&
      r.status === "accepted" &&
      ((r.initiatorUserId === meId && r.targetUserId === targetUserId) ||
        (r.initiatorUserId === targetUserId && r.targetUserId === meId)),
  );
  return mutual ? { kind: "matched" } : { kind: "none" };
}

function Badge({ interaction, hall }: { interaction: Interaction; hall: Hall }) {
  if (interaction.kind === "none") return null;
  const t = hallTheme(hall);
  const styles: Record<Exclude<Interaction["kind"], "none">, { bg: string; fg: string; label: string }> = {
    "you-requested": { bg: t.soft, fg: t.deep, label: "you requested ↑" },
    "they-requested": { bg: "#1B1A17", fg: "#F7F2E9", label: "they requested ↓" },
    matched: { bg: RM.good, fg: "#fff", label: "matched ✓" },
    cooldown: { bg: `${RM.warn}30`, fg: "#7A5316", label: "cooldown" },
  };
  const s = styles[interaction.kind];
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 9.5, letterSpacing: 0.4, fontWeight: 600,
        padding: "3px 7px", borderRadius: 4,
        background: s.bg, color: s.fg,
      }}
    >
      {s.label}
    </span>
  );
}

export function SoloCard({
  profile,
  score,
  hall,
}: {
  profile: Profile;
  score: number;
  hall: Hall;
}) {
  const interaction = useInteractionWith(profile.userId);
  return (
    <Link href={`/profile/${profile.userId}`}>
      <Card hall={hall} padded={false} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="relative" style={{ padding: 12, paddingBottom: 0 }}>
          <PhotoSlot ratio="4/5" hall={hall} label="profile photo" style={{ borderRadius: 12 }} />
          <div
            className="absolute"
            style={{
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "5px 10px 5px 6px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <CompatRing score={score} size={26} hall={hall} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: RM.ink2, letterSpacing: 0.4 }}
            >
              match
            </span>
          </div>
          <div
            className="absolute flex items-center gap-1.5"
            style={{ bottom: 8, left: 20 }}
          >
            <span
              className="font-mono uppercase"
              style={{
                background: "rgba(27,26,23,0.78)",
                color: "#F7F2E9",
                fontSize: 10,
                letterSpacing: 0.4,
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              solo
            </span>
            <Badge interaction={interaction} hall={hall} />
          </div>
        </div>

        <div style={{ padding: "12px 14px 14px" }}>
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-serif" style={{ fontSize: 22, lineHeight: 1, letterSpacing: -0.4 }}>
              {profile.displayName.split(" ")[0]}{" "}
              <span style={{ color: RM.ink3 }}>
                {profile.displayName.split(" ").slice(1).join(" ")}
              </span>
            </div>
          </div>
          <div className="mt-1.5 text-[13px]" style={{ color: RM.ink2 }}>
            {profile.branch} &middot; {profile.hometownCity}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[profile.sleepSchedule, profile.foodPref, `social ${profile.socialScore}/5`, profile.acPref === "yes" ? "AC" : profile.acPref === "no" ? "Non-AC" : "AC?"].map(
              (tag) => (
                <span
                  key={tag}
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    color: RM.ink2,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(27,26,23,0.05)",
                    letterSpacing: 0.3,
                  }}
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
