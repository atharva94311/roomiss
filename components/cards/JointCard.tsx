"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CompatRing } from "@/components/ui/CompatRing";
import { Avatar } from "@/components/ui/Avatar";
import { RM, hallTheme } from "@/lib/tokens";
import type { Group, Profile } from "@/lib/types";

export function JointCard({
  group,
  members,
  score,
}: {
  group: Group;
  members: Profile[];
  score: number;
}) {
  const t = hallTheme(group.hall);
  const need = group.finalSize - members.length;
  return (
    <Link href={`/group/${group.id}`}>
      <Card hall={group.hall} padded={false} style={{ overflow: "hidden" }}>
        <div
          className="relative textured"
          style={{
            padding: 14,
            background: `linear-gradient(135deg, ${t.soft} 0%, #F0E4D2 100%)`,
          }}
        >
          <div
            className="absolute font-mono uppercase"
            style={{
              top: 12,
              right: 12,
              fontSize: 10,
              letterSpacing: 0.4,
              color: t.deep,
              background: "rgba(255,255,255,0.7)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            partial &middot; {members.length}/{group.finalSize}
          </div>

          <div className="flex mt-2.5">
            {members.map((m, i) => (
              <div key={m.userId} style={{ marginLeft: i ? -14 : 0, zIndex: members.length - i }}>
                <Avatar name={m.displayName} hall={group.hall} size={62} ring />
              </div>
            ))}
            {Array.from({ length: need }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 20,
                  border: `2px dashed ${t.accent}`,
                  marginLeft: -14,
                  background: "rgba(255,255,255,0.4)",
                  color: t.accent,
                  fontSize: 22,
                  zIndex: 0,
                }}
              >
                +
              </div>
            ))}
          </div>

          <div className="mt-3.5 flex justify-between items-end">
            <div>
              <div
                className="font-serif"
                style={{ fontSize: 22, lineHeight: 1, letterSpacing: -0.4, color: t.deep }}
              >
                {members.map((m) => m.displayName.split(" ")[0]).join(" & ")}
              </div>
              <div
                className="mt-1 font-mono"
                style={{ fontSize: 12.5, color: RM.ink2, letterSpacing: 0.3 }}
              >
                looking for {need} more
              </div>
            </div>
            <CompatRing score={score} size={46} hall={group.hall} />
          </div>
        </div>

        {group.sharedBio && (
          <div className="px-4 py-3" style={{ fontSize: 13, color: RM.ink2 }}>
            {group.sharedBio}
          </div>
        )}
      </Card>
    </Link>
  );
}
