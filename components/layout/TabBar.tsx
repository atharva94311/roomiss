"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "@/components/ui/Icons";
import { RM, hallTheme } from "@/lib/tokens";
import { useRoomiss } from "@/lib/store";
import type { Hall } from "@/lib/types";

const TABS = [
  { id: "discover", label: "Discover", href: "/browse", icon: I.search },
  { id: "inbox", label: "Requests", href: "/requests", icon: I.heart },
  { id: "chats", label: "Chats", href: "/chat", icon: I.chat },
  { id: "me", label: "You", href: "/me", icon: I.user },
] as const;

export function TabBar({ hall = "LBS" }: { hall?: Hall }) {
  const pathname = usePathname();
  const t = hallTheme(hall);
  const unreadReqs = useRoomiss((s) =>
    Object.values(s.requests).filter(
      (r) => r.targetUserId === s.meId && r.status === "pending",
    ).length,
  );
  const unreadChats = useRoomiss((s) => {
    const myChats = Object.values(s.chats).filter((c) =>
      c.participantIds.includes(s.meId) && c.status === "active",
    );
    let c = 0;
    myChats.forEach((ch) => {
      const p = s.participants.find((pp) => pp.chatId === ch.id && pp.userId === s.meId);
      const last = s.messages
        .filter((m) => m.chatId === ch.id && m.senderId !== s.meId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .pop();
      if (last && (!p?.lastReadAt || p.lastReadAt < last.createdAt)) c++;
    });
    return c;
  });

  const badges: Record<string, number> = {
    inbox: unreadReqs,
    chats: unreadChats,
  };

  return (
    <nav
      className="sticky bottom-0 z-30 flex justify-around"
      style={{
        padding: "10px 12px 6px",
        background: RM.surface,
        borderTop: `1px solid ${RM.hairline}`,
      }}
    >
      {TABS.map((tb) => {
        const on = pathname === tb.href || pathname.startsWith(tb.href);
        const badge = badges[tb.id];
        return (
          <Link
            key={tb.id}
            href={tb.href}
            className="relative flex flex-col items-center gap-1"
            style={{
              padding: "4px 10px",
              color: on ? t.accent : RM.ink3,
            }}
          >
            <span className="relative">
              {tb.icon}
              {badge ? (
                <span
                  className="absolute font-mono"
                  style={{
                    top: -4,
                    right: -7,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 7,
                    padding: "0 4px",
                    background: t.accent,
                    color: "#fff",
                    fontSize: 9.5,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: 10.5,
                letterSpacing: 0.4,
                fontWeight: on ? 600 : 500,
              }}
            >
              {tb.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
