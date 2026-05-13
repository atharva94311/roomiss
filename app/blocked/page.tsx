"use client";

import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { RM } from "@/lib/tokens";
import { fmtDaysAgo } from "@/lib/format";

export default function BlockedPage() {
  const router = useRouter();
  const meId = useRoomiss((s) => s.meId);
  const blocks = useRoomiss((s) => s.blocks.filter((b) => b.blockerId === meId));
  const profiles = useRoomiss((s) => s.profiles);
  const unblock = useRoomiss((s) => s.unblockUser);
  const hall = useRoomiss(selectMyHall);

  return (
    <MobileShell>
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", fontSize: 22, color: RM.ink2 }}
        >
          ←
        </button>
        <h1 className="font-serif" style={{ fontSize: 28, letterSpacing: -0.5, lineHeight: 1 }}>
          Blocked users
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {blocks.length === 0 && (
          <div
            className="text-center mt-6 p-6 rounded-2xl"
            style={{ background: RM.surface, color: RM.ink3, border: `1px dashed ${RM.hairline2}` }}
          >
            You haven&rsquo;t blocked anyone. (Cap: 50 lifetime; admin reviewed at 30+.)
          </div>
        )}
        {blocks.map((b) => {
          const p = profiles[b.blockedId];
          if (!p) return null;
          return (
            <div
              key={b.blockedId}
              className="p-3.5 rounded-2xl flex items-center gap-3"
              style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
            >
              <Avatar name={p.displayName} hall={hall} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-serif" style={{ fontSize: 16, letterSpacing: -0.2 }}>
                  {p.displayName}
                </div>
                <div style={{ fontSize: 12, color: RM.ink3 }}>
                  Blocked {fmtDaysAgo(b.createdAt)} · they cannot see your profile or message you.
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => unblock(b.blockedId)}>
                Unblock
              </Button>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
}

