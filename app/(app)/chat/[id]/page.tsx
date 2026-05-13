"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill } from "@/components/ui/Pills";
import { Button } from "@/components/ui/Button";
import { I } from "@/components/ui/Icons";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { useTypingPresence } from "@/lib/supabase/presence";
import { RM, hallTheme } from "@/lib/tokens";
import { cmpIsoAsc } from "@/lib/format";
import { ReportModal } from "@/components/modals/ReportModal";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const chat = useRoomiss((s) => s.chats[id]);
  const profiles = useRoomiss((s) => s.profiles);
  const messages = useRoomiss((s) => s.messages);
  const sendMessage = useRoomiss((s) => s.sendMessage);
  const markRead = useRoomiss((s) => s.markChatRead);
  const toggleMute = useRoomiss((s) => s.toggleMute);
  const meId = useRoomiss((s) => s.meId);
  const myHall = useRoomiss(selectMyHall);
  const groups = useRoomiss((s) => s.groups);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const participants = useRoomiss((s) => s.participants);
  const { typingUserIds, setTyping } = useTypingPresence(id, meId);

  useEffect(() => {
    markRead(id);
    const t = setTimeout(() => scrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
    return () => clearTimeout(t);
  }, [id, markRead, messages.length]);

  // ⚠ Hooks must run unconditionally on every render — keep all hook calls
  // above the `if (!chat) return …` early-return below. Anything that doesn't
  // need to read `chat` directly can use chat?.* and null-fallbacks.

  /**
   * Compute the partner's "seen up to" timestamp from chat_participants.
   * Renders "Seen" under the last of MY messages that's older than this.
   */
  const partnerSeenAt = useMemo(() => {
    if (chat?.type !== "dm") return null;
    const other = participants.find(
      (p) => p.chatId === id && p.userId !== meId && !p.leftAt,
    );
    return other?.lastReadAt ?? null;
  }, [participants, id, meId, chat?.type]);

  const lastSeenMineId = useMemo(() => {
    if (!partnerSeenAt) return null;
    const mineSeen = chatMessagesUpTo(messages, id, meId, partnerSeenAt);
    return mineSeen.length ? mineSeen[mineSeen.length - 1].id : null;
  }, [partnerSeenAt, messages, id, meId]);

  if (!chat) return <div className="p-6">Chat not found</div>;

  const hall = myHall;
  const t = hallTheme(hall);
  const otherIds = chat.participantIds.filter((u) => u !== meId);
  const otherProfiles = otherIds.map((u) => profiles[u]).filter(Boolean);
  const chatMsgs = messages
    .filter((m) => m.chatId === id)
    .sort((a, b) => cmpIsoAsc(a.createdAt, b.createdAt));

  const onSend = () => {
    const v = draft.trim();
    if (!v) return;
    sendMessage(id, v, "text", undefined, replyTo ?? undefined);
    setDraft("");
    setReplyTo(null);
    setTyping(false);
  };

  const group = chat.groupId ? groups[chat.groupId] : undefined;

  const title =
    chat.type === "dm"
      ? otherProfiles[0]?.displayName ?? "Match"
      : otherProfiles
          .map((p) => p.displayName.split(" ")[0])
          .join(", ");

  const subtitle =
    group
      ? group.status === "locked"
        ? `Locked ${group.size}/${group.finalSize}`
        : `Partial · ${group.size}/${group.finalSize}`
      : chat.status === "archived"
        ? "Archived (read-only)"
        : "1:1";

  return (
    <>
      <div
        className="px-4 py-2.5"
        style={{ borderBottom: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back to chats"
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              color: RM.ink2,
              cursor: "pointer",
            }}
          >
            ←
          </button>
          {chat.type === "group" ? (
            <div className="relative" style={{ width: 36, height: 36, flexShrink: 0 }}>
              {otherProfiles.slice(0, 3).map((p, i) => (
                <div
                  key={p.userId}
                  className="absolute"
                  style={{
                    top: i === 0 ? 0 : i === 1 ? 0 : "auto",
                    bottom: i === 2 ? 0 : "auto",
                    left: i === 0 ? 0 : i === 2 ? 6 : "auto",
                    right: i === 1 ? 0 : "auto",
                  }}
                >
                  <Avatar name={p.displayName} hall={hall} size={22} />
                </div>
              ))}
            </div>
          ) : (
            <Avatar name={title} hall={hall} size={36} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-serif truncate"
                style={{ fontSize: 17, letterSpacing: -0.2 }}
              >
                {title}
              </span>
              <HallPill hall={hall} size="sm" />
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 11.5, color: RM.ink3, letterSpacing: 0.3, marginTop: 1 }}
            >
              {subtitle}
            </div>
          </div>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", color: RM.ink3, fontSize: 22 }}
          >
            ⋯
          </button>
        </div>
        {menuOpen && (
          <div
            className="absolute right-4 mt-1 z-30 rounded-xl"
            style={{
              top: 56,
              background: RM.surface,
              boxShadow: "0 8px 28px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05)",
              minWidth: 180,
              padding: 4,
            }}
          >
            {chat.type === "group" && (
              <MenuItem
                onClick={() => {
                  setShowMembers(true);
                  setMenuOpen(false);
                }}
              >
                See members
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                toggleMute(id);
                setMenuOpen(false);
              }}
            >
              Mute notifications
            </MenuItem>
            {group && (
              <MenuItem
                onClick={() => {
                  router.push(`/group/leave`);
                  setMenuOpen(false);
                }}
              >
                Leave group
              </MenuItem>
            )}
            <MenuItem
              danger
              onClick={() => {
                setReportingMessageId("");
                setMenuOpen(false);
              }}
            >
              Report
            </MenuItem>
          </div>
        )}
      </div>

      {/* Match banner for DM */}
      {chat.type === "dm" && (
        <div className="px-4 pt-3">
          <div
            className="p-3.5 rounded-2xl flex items-center gap-2.5"
            style={{ background: t.soft, color: t.deep }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: "rgba(255,255,255,0.6)",
                color: t.accent,
              }}
            >
              {I.heart}
            </div>
            <div className="flex-1">
              <div
                className="font-serif"
                style={{ fontSize: 15, letterSpacing: -0.2 }}
              >
                You matched with {otherProfiles[0]?.displayName.split(" ")[0]}
              </div>
              <div style={{ fontSize: 12, color: RM.ink2, marginTop: 2 }}>
                Chat first — if you click, form a partial group of 2.
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-3.5 pb-2"
      >
        <div
          className="text-center font-mono"
          style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.3, margin: "4px 0 12px" }}
        >
          Today
        </div>
        {chatMsgs.map((m) => {
          if (m.kind === "system") {
            // Lightweight glyph dictionary so scanners can tell at a glance
            // what kind of life-cycle event happened — joined, locked, left,
            // matched, warning. Fallback diamond for anything unrecognized.
            const glyph = (() => {
              const b = m.body.toLowerCase();
              if (b.includes("matched")) return "♡";
              if (b.includes("joined")) return "+";
              if (b.includes("locked")) return "🔒";
              if (b.includes("left") || b.includes("removed")) return "−";
              if (b.includes("merged")) return "⇄";
              if (b.includes("heads-up") || b.includes("warning")) return "⚠";
              return "◇";
            })();
            return (
              <div key={m.id} className="text-center my-3.5">
                <div
                  className="inline-flex items-center gap-1.5 font-mono"
                  style={{
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: t.soft,
                    color: t.deep,
                    fontSize: 10.5,
                    letterSpacing: 0.3,
                    lineHeight: 1.3,
                  }}
                >
                  <span aria-hidden style={{ fontSize: 11, opacity: 0.9 }}>{glyph}</span>
                  <span style={{ opacity: 0.6 }}>{fmtTime(m.createdAt)}</span>
                  <span>{m.body}</span>
                </div>
              </div>
            );
          }
          const mine = m.senderId === meId;
          const sender = m.senderId ? profiles[m.senderId] : null;
          return (
            <div
              key={m.id}
              className={`flex items-end gap-1.5 mb-1 ${mine ? "justify-end" : "justify-start"}`}
            >
              {!mine && chat.type === "group" && sender && (
                <Avatar name={sender.displayName} hall={hall} size={22} />
              )}
              <div className="max-w-[78%]">
                {!mine && chat.type === "group" && sender && (
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 11,
                      color: RM.ink3,
                      marginBottom: 2,
                      marginLeft: 6,
                    }}
                  >
                    {sender.displayName.split(" ")[0]}
                  </div>
                )}
                {m.replyToMessageId &&
                  (() => {
                    const orig = messages.find((mm) => mm.id === m.replyToMessageId);
                    if (!orig) return null;
                    const origName =
                      orig.senderId === meId
                        ? "You"
                        : orig.senderId
                          ? profiles[orig.senderId]?.displayName.split(" ")[0] ?? "Member"
                          : "System";
                    return (
                      <div
                        className="px-2.5 py-1.5 rounded-md mb-1 text-xs truncate"
                        style={{
                          background: mine ? "rgba(255,255,255,0.15)" : RM.surface2,
                          color: mine ? "rgba(255,255,255,0.9)" : RM.ink2,
                          borderLeft: `2px solid ${mine ? "rgba(255,255,255,0.6)" : t.accent}`,
                          maxWidth: 220,
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>{origName}: </span>
                        {orig.body}
                      </div>
                    );
                  })()}
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 16,
                    background: mine ? t.accent : RM.surface,
                    color: mine ? "#fff" : RM.ink,
                    boxShadow: mine ? "none" : `0 0 0 1px ${RM.hairline}`,
                    fontSize: 14.5,
                    lineHeight: 1.4,
                    letterSpacing: -0.1,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                  }}
                >
                  {m.kind === "image" && m.attachmentUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={m.attachmentUrl}
                      alt={m.body || "attachment"}
                      loading="lazy"
                      decoding="async"
                      style={{ maxWidth: "100%", borderRadius: 10, display: "block" }}
                    />
                  ) : (
                    m.body
                  )}
                </div>
                <div
                  className="flex items-center gap-2"
                  style={{ marginTop: 2, justifyContent: mine ? "flex-end" : "flex-start" }}
                >
                  {!mine && (
                    <button
                      onClick={() => setReplyTo(m.id)}
                      aria-label="Reply"
                      className="font-mono"
                      style={{
                        background: "transparent", border: "none", color: RM.ink3,
                        fontSize: 10, padding: "0 4px", cursor: "pointer", letterSpacing: 0.3,
                      }}
                    >
                      ↩ reply
                    </button>
                  )}
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 9.5,
                      opacity: 0.5,
                      marginLeft: mine ? 0 : 0,
                      textAlign: mine ? "right" : "left",
                    }}
                  >
                    {fmtTime(m.createdAt)}
                  </div>
                  {mine && (
                    <button
                      onClick={() => setReplyTo(m.id)}
                      aria-label="Reply"
                      className="font-mono"
                      style={{
                        background: "transparent", border: "none", color: RM.ink3,
                        fontSize: 10, padding: "0 4px", cursor: "pointer", letterSpacing: 0.3,
                      }}
                    >
                      ↩
                    </button>
                  )}
                </div>
                {mine && lastSeenMineId === m.id && (
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 9.5,
                      color: RM.good,
                      textAlign: "right",
                      letterSpacing: 0.3,
                      marginTop: 2,
                    }}
                  >
                    Seen
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Group lock prompt */}
        {group && group.size === group.finalSize && group.status === "partial" && (
          <div
            className="my-3.5 mx-auto text-center p-3.5 rounded-2xl"
            style={{ background: RM.ink, color: RM.bg }}
          >
            <div className="font-serif" style={{ fontSize: 15, letterSpacing: -0.2 }}>
              {group.size} of {group.finalSize} members · ready to lock
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Tap below to finalize — this turns off discovery for everyone.
            </div>
            <Button
              variant="primary"
              size="sm"
              hall={hall}
              style={{ marginTop: 10, background: t.accent }}
              onClick={() => router.push("/group/lock")}
            >
              🔒 Lock our group
            </Button>
          </div>
        )}
      </div>

      {/* Typing indicator (above composer) */}
      {typingUserIds.length > 0 && (
        <div
          className="px-4 py-1 font-mono"
          style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.3 }}
        >
          {typingUserIds
            .map((uid) => profiles[uid]?.displayName.split(" ")[0] ?? "Someone")
            .join(", ")}
          {typingUserIds.length === 1 ? " is " : " are "}typing…
        </div>
      )}

      {/* Reply-to staging pill (above composer) */}
      {replyTo &&
        (() => {
          const rm = messages.find((m) => m.id === replyTo);
          if (!rm) return null;
          const rsender = rm.senderId ? profiles[rm.senderId] : null;
          return (
            <div
              className="mx-3 mb-1.5 p-2 rounded-xl flex items-center gap-2"
              style={{ background: RM.surface2, borderLeft: `3px solid ${t.accent}` }}
            >
              <div className="flex-1 min-w-0">
                <div
                  className="font-mono uppercase"
                  style={{ fontSize: 9.5, color: t.deep, letterSpacing: 0.3 }}
                >
                  Replying to {rsender?.displayName ?? "you"}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 12.5, color: RM.ink2 }}
                >
                  {rm.body}
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                aria-label="Cancel reply"
                style={{
                  background: "transparent", border: "none", color: RM.ink3,
                  fontSize: 18, lineHeight: 1, cursor: "pointer", padding: 4,
                }}
              >
                ×
              </button>
            </div>
          );
        })()}

      {chat.status === "active" ? (
        <div
          className="px-3 py-2.5 flex items-center gap-2"
          style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
        >
          <label
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(27,26,23,0.06)", color: RM.ink2,
            }}
            aria-label="Attach image"
          >
            {I.attach}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.currentTarget.value = "";
                const { uploadAttachment, signedAttachmentUrl } = await import("@/lib/supabase/upload");
                try {
                  const { path } = await uploadAttachment(id, file);
                  // Resolve to a signed URL for inline rendering; this is what
                  // the message body links to (recipients regenerate on read).
                  const url = await signedAttachmentUrl(path, 60 * 60);
                  await sendMessage(id, file.name, "image", url);
                } catch (ex) {
                  alert(`Upload failed: ${ex instanceof Error ? ex.message : ex}`);
                }
              }}
            />
          </label>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
            placeholder={`Message ${title.split(",")[0]}…`}
            className="flex-1 outline-none"
            style={{
              padding: "10px 14px",
              borderRadius: 20,
              background: RM.surface,
              boxShadow: `0 0 0 1px ${RM.hairline}`,
              fontSize: 14,
            }}
          />
          <button
            onClick={onSend}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: "none",
              background: t.accent,
              color: "#fff",
            }}
          >
            {I.send}
          </button>
        </div>
      ) : (
        <div
          className="px-4 py-3 text-center"
          style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg, color: RM.ink3, fontSize: 13 }}
        >
          This chat is archived. <Link href="/me" className="underline">Open settings</Link> to export.
        </div>
      )}

      {reportingMessageId !== null && (
        <ReportModal
          targetUserId={otherIds[0] ?? meId}
          targetName={otherProfiles[0]?.displayName ?? "user"}
          messageId={reportingMessageId || undefined}
          onClose={() => setReportingMessageId(null)}
        />
      )}

      {/* Group member sheet */}
      {showMembers && chat.type === "group" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowMembers(false)}
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="w-full max-w-[480px] rounded-t-3xl"
            style={{ background: RM.bg, maxHeight: "85dvh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div style={{ width: 40, height: 4, borderRadius: 2, background: RM.hairline2 }} />
            </div>
            <div className="px-5 pb-5">
              <h3 className="font-serif" style={{ fontSize: 22, letterSpacing: -0.3 }}>
                Members
              </h3>
              <p style={{ fontSize: 12.5, color: RM.ink3, marginTop: 2 }}>
                {group ? `${group.size}/${group.finalSize} · ${group.status}` : ""}
              </p>
              <div className="flex flex-col gap-2 mt-3.5">
                {chat.participantIds.map((uid) => {
                  const p = profiles[uid];
                  if (!p) return null;
                  return (
                    <Link
                      key={uid}
                      href={`/profile/${uid}`}
                      onClick={() => setShowMembers(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{
                        background: RM.surface, border: `1px solid ${RM.hairline}`,
                        color: "inherit", textDecoration: "none",
                      }}
                    >
                      <Avatar name={p.displayName} hall={hall} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="font-serif" style={{ fontSize: 16, letterSpacing: -0.2 }}>
                          {p.displayName}
                          {uid === meId && (
                            <span style={{ color: RM.ink3, marginLeft: 6, fontSize: 13 }}>(you)</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: RM.ink3 }}>
                          {p.branch}
                          {p.hometownCity && ` · ${p.hometownCity}`}
                        </div>
                      </div>
                      <span style={{ color: RM.ink3 }}>›</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "8px 12px",
        border: 0,
        background: "transparent",
        borderRadius: 6,
        color: danger ? RM.bad : RM.ink,
        fontSize: 13,
        fontWeight: 500,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** All of MY messages in this chat that were sent ≤ the given ISO timestamp. */
function chatMessagesUpTo(
  messages: Array<{ id: string; chatId: string; senderId?: string; createdAt: string }>,
  chatId: string,
  meId: string,
  uptoIso: string,
) {
  return messages.filter(
    (m) =>
      m.chatId === chatId &&
      m.senderId === meId &&
      m.createdAt <= uptoIso,
  );
}
