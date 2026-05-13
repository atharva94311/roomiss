"use client";

import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";
import { fmtAgo, cmpIsoDesc } from "@/lib/format";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  request_received: "New roommate request",
  request_accepted: "Request accepted",
  member_joined: "New member joined your group",
  verification_approved: "You're verified ✓",
  verification_rejected: "Verification needs attention",
  group_locked: "Group locked",
  message: "New message",
};

export default function NotificationsPage() {
  const router = useRouter();
  const meId = useRoomiss((s) => s.meId);
  const profiles = useRoomiss((s) => s.profiles);
  const list = useRoomiss((s) =>
    s.notifications.filter((n) => n.userId === meId).sort((a, b) => cmpIsoDesc(a.createdAt, b.createdAt)),
  );
  const markRead = useRoomiss((s) => s.markNotificationRead);
  const markAllRead = useRoomiss((s) => s.markAllNotificationsRead);
  const unread = list.filter((n) => !n.readAt).length;

  return (
    <MobileShell>
      <div className="px-4 py-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          style={{ background: "none", border: "none", fontSize: 22, color: RM.ink2, cursor: "pointer" }}
        >
          ←
        </button>
        <h1 className="font-serif flex-1" style={{ fontSize: 28, letterSpacing: -0.5, lineHeight: 1 }}>
          Notifications
        </h1>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead()}
            className="font-mono"
            style={{
              fontSize: 11.5, letterSpacing: 0.3, padding: "6px 11px", borderRadius: 999,
              background: "transparent", color: RM.ink2,
              border: `1px solid ${RM.hairline2}`, cursor: "pointer",
            }}
          >
            Mark all read · {unread}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
        {list.length === 0 && (
          <div
            className="text-center mt-6 p-6 rounded-2xl mx-2"
            style={{ background: RM.surface, color: RM.ink3, border: `1px dashed ${RM.hairline2}` }}
          >
            You&rsquo;re all caught up.
          </div>
        )}
        {list.map((n) => {
          const fromUserId = (n.payload as { from?: string }).from;
          const fromUser = fromUserId ? profiles[fromUserId] : null;
          return (
            <button
              key={n.id}
              onClick={() => {
                markRead(n.id);
                if (n.type === "request_received") router.push("/requests");
                else if (n.type === "verification_approved") router.push("/onboarding/profile");
              }}
              className="w-full text-left p-3.5 rounded-2xl flex gap-3 items-center"
              style={{
                background: RM.surface,
                boxShadow: `0 0 0 1px ${RM.hairline}`,
                opacity: n.readAt ? 0.55 : 1,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: n.readAt ? RM.hairline2 : RM.lbs,
                  flexShrink: 0,
                }}
              />
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {TYPE_LABELS[n.type] ?? n.type}
                </div>
                {fromUser && (
                  <div style={{ fontSize: 12, color: RM.ink3, marginTop: 2 }}>
                    From {fromUser.displayName} · {fromUser.branch}
                  </div>
                )}
              </div>
              <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                {fmtAgo(n.createdAt)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-3 text-center text-xs" style={{ color: RM.ink3, borderTop: `1px solid ${RM.hairline}` }}>
        <Link href="/settings" className="underline">
          Notification settings
        </Link>
      </div>
    </MobileShell>
  );
}

