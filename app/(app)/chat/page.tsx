"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { I } from "@/components/ui/Icons";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";
import { fmtAgoLong, cmpIsoAsc, cmpIsoDesc } from "@/lib/format";

export default function ChatInboxPage() {
  const hall = useRoomiss(selectMyHall);
  const t = hallTheme(hall);
  const chats = useRoomiss((s) => s.chats);
  const profiles = useRoomiss((s) => s.profiles);
  const messages = useRoomiss((s) => s.messages);
  const participants = useRoomiss((s) => s.participants);
  const meId = useRoomiss((s) => s.meId);

  // Memo'd because Object.values + per-chat message scan is O(M * C) and this
  // selector re-runs on every store update (incl. typing presence broadcasts).
  // Bucket messages by chat once per render — was previously a full scan per
  // chat. Bring it down to O(M + C log C).
  const myChats = useMemo(() => {
    const byChat = new Map<string, typeof messages>();
    for (const m of messages) {
      let bucket = byChat.get(m.chatId);
      if (!bucket) {
        bucket = [];
        byChat.set(m.chatId, bucket);
      }
      bucket.push(m);
    }
    // Sort each bucket ascending once.
    for (const bucket of byChat.values()) {
      bucket.sort((a, b) => cmpIsoAsc(a.createdAt, b.createdAt));
    }
    return Object.values(chats)
      .filter((c) => c.participantIds.includes(meId))
      .map((c) => {
        const inChat = byChat.get(c.id) ?? [];
        const last = inChat[inChat.length - 1];
        const p = participants.find((pp) => pp.chatId === c.id && pp.userId === meId);
        const since = p?.lastReadAt;
        const unread = inChat.reduce(
          (acc, m) =>
            m.senderId !== meId && m.kind !== "system" && (!since || m.createdAt > since)
              ? acc + 1
              : acc,
          0,
        );
        return { chat: c, last, unread };
      })
      .sort((a, b) => cmpIsoDesc(a.last?.createdAt, b.last?.createdAt));
  }, [chats, messages, participants, meId]);

  return (
    <>
      <AppHeader hall={hall} title="Chats" sub="Your matches & groups" />
      <div className="px-4 pb-2">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <span style={{ color: RM.ink3 }}>{I.search}</span>
          <span style={{ fontSize: 14, color: RM.ink3 }}>Search messages</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {myChats.length === 0 && (
          <div
            className="text-center mt-6 p-6 rounded-2xl mx-2"
            style={{ background: RM.surface, color: RM.ink3, border: `1px dashed ${RM.hairline2}` }}
          >
            No chats yet. Match with someone to start one.
          </div>
        )}

        {myChats.map(({ chat, last, unread }) => {
          const otherIds = chat.participantIds.filter((id) => id !== meId);
          const otherProfiles = otherIds.map((id) => profiles[id]).filter(Boolean);
          const name =
            chat.type === "dm"
              ? otherProfiles[0]?.displayName ?? "Match"
              : otherProfiles
                  .map((p) => p.displayName.split(" ")[0])
                  .join(", ");
          const sub = last
            ? last.kind === "system"
              ? last.body
              : `${last.senderId === meId ? "You: " : ""}${last.body}`
            : chat.status === "archived"
              ? "Archived"
              : "Say hi!";

          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-3 px-3 py-3 rounded-xl"
              style={{ opacity: chat.status === "archived" ? 0.55 : 1 }}
            >
              {chat.type === "group" ? (
                <div className="relative" style={{ width: 48, height: 48, flexShrink: 0 }}>
                  {otherProfiles.slice(0, 2).map((p, i) => (
                    <div
                      key={p.userId}
                      className="absolute"
                      style={{
                        top: i === 0 ? 0 : "auto",
                        left: i === 0 ? 0 : "auto",
                        bottom: i === 1 ? 0 : "auto",
                        right: i === 1 ? 0 : "auto",
                      }}
                    >
                      <Avatar name={p.displayName} hall={hall} size={32} />
                    </div>
                  ))}
                </div>
              ) : (
                <Avatar name={otherProfiles[0]?.displayName ?? "M"} hall={hall} size={48} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <div
                    className="font-serif"
                    style={{
                      fontSize: 17,
                      letterSpacing: -0.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontSize: 10.5, color: RM.ink3, flexShrink: 0, marginLeft: 6 }}
                  >
                    {last ? fmtAgoLong(last.createdAt) : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <div
                    className="text-[13px]"
                    style={{
                      color: RM.ink2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sub}
                  </div>
                  {unread > 0 && (
                    <span
                      className="font-mono flex items-center justify-center"
                      style={{
                        minWidth: 18,
                        height: 18,
                        padding: "0 6px",
                        borderRadius: 9,
                        background: t.accent,
                        color: "#fff",
                        fontSize: 10.5,
                        fontWeight: 600,
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

