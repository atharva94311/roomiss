"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/Pills";
import { AcceptanceGrid, ExpiryChip } from "@/components/requests/AcceptanceGrid";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { compatScore } from "@/lib/compat";
import { RM, hallTheme } from "@/lib/tokens";
import type { RoomRequest } from "@/lib/types";

type Tab = "incoming" | "outgoing" | "history";

export default function RequestsPage() {
  const router = useRouter();
  const hall = useRoomiss(selectMyHall);
  const t = hallTheme(hall);
  const requests = useRoomiss((s) => s.requests);
  const profiles = useRoomiss((s) => s.profiles);
  const chats = useRoomiss((s) => s.chats);
  const meId = useRoomiss((s) => s.meId);
  const myProfile = useRoomiss(selectMyProfile);
  const accept = useRoomiss((s) => s.acceptRequest);
  const decline = useRoomiss((s) => s.declineRequest);
  const withdraw = useRoomiss((s) => s.withdrawRequest);

  const [tab, setTab] = useState<Tab>("incoming");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Buckets are derived from `requests` + `meId` only; memo skips the entire
  // 3-filter scan on every typing/presence broadcast.
  const { incoming, outgoing, history, all } = useMemo(() => {
    const all = Object.values(requests);
    const incoming = all.filter(
      (r) =>
        r.status === "pending" &&
        r.acceptances.some(
          (a) => a.userId === meId && a.side === "target" && a.decision === "pending",
        ),
    );
    const outgoing = all.filter(
      (r) =>
        r.status === "pending" &&
        (r.initiatorUserId === meId ||
          r.acceptances.some((a) => a.userId === meId && a.side === "initiator")),
    );
    const history = all
      .filter((r) => r.status !== "pending")
      .sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt));
    return { all, incoming, outgoing, history };
  }, [requests, meId]);

  const list = tab === "incoming" ? incoming : tab === "outgoing" ? outgoing : history;

  // Outstanding count for the "5 cap" guidance
  const outstandingMine = all.filter(
    (r) => r.initiatorUserId === meId && r.status === "pending",
  ).length;

  const onAccept = async (req: RoomRequest) => {
    setBusy(req.id);
    const r = await accept(req.id);
    setBusy(null);
    if (!r.ok) return;
    // If the request resolved to a DM chat (solo↔solo mutual accept), route there.
    if (req.type === "solo_solo") {
      const other = req.initiatorUserId === meId ? req.targetUserId : req.initiatorUserId;
      const dm = Object.values(useRoomiss.getState().chats).find(
        (c) =>
          c.type === "dm" &&
          c.participantIds.includes(meId) &&
          other &&
          c.participantIds.includes(other),
      );
      if (dm) router.push(`/chat/${dm.id}`);
    }
  };

  const onDecline = async (req: RoomRequest) => {
    setBusy(req.id);
    const r = await decline(req.id);
    setBusy(null);
    if (r.ok) {
      // Surface the cooldown side-effect so it doesn't feel like a black hole.
      useRoomiss.setState({
        lastSuccess: "Declined — they can request you again in 30 days.",
      });
    }
  };

  const confirmWithdraw = async (req: RoomRequest) => {
    setBusy(req.id);
    await withdraw(req.id);
    setBusy(null);
    setWithdrawing(null);
  };

  return (
    <>
      <AppHeader
        hall={hall}
        title="Requests"
        sub={`${outstandingMine} of 5 outgoing slots used · expires after 14 days`}
      />

      <div className="px-4 pb-3 flex gap-1.5">
        {[
          { id: "incoming" as const, l: "Incoming", n: incoming.length },
          { id: "outgoing" as const, l: "Sent", n: outgoing.length },
          { id: "history" as const, l: "History", n: history.length },
        ].map((x) => (
          <button
            key={x.id}
            onClick={() => setTab(x.id)}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 10, border: "none",
              background: tab === x.id ? RM.ink : RM.surface,
              color: tab === x.id ? RM.bg : RM.ink,
              fontFamily: RM.sans, fontSize: 14, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "pointer",
            }}
          >
            {x.l}
            <span className="font-mono" style={{ fontSize: 11, opacity: 0.7 }}>
              {x.n}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5">
        {list.length === 0 && (
          <div
            className="text-center mt-6 p-6 rounded-2xl"
            style={{ background: RM.surface, color: RM.ink3, border: `1px dashed ${RM.hairline2}` }}
          >
            {tab === "incoming" && "No incoming requests yet. Browse to find roommates."}
            {tab === "outgoing" && "Nothing pending. Send a request from Discover."}
            {tab === "history" && "No history yet."}
          </div>
        )}

        {list.map((r) => {
          const otherUserId = r.initiatorUserId === meId ? r.targetUserId : r.initiatorUserId;
          const counter = otherUserId ? profiles[otherUserId] : undefined;
          const groupId = r.targetGroupId ?? r.initiatorGroupId;
          const score = myProfile && counter ? compatScore(myProfile, counter) : 0;
          const isGroupRequest = r.type !== "solo_solo";

          return (
            <Card key={r.id} hall={hall} padded={false} style={{ padding: 14 }}>
              <div className="flex gap-3 items-center">
                {counter ? (
                  <Avatar name={counter.displayName} hall={hall} size={48} />
                ) : (
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: 14, background: RM.surface2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: RM.ink3,
                    }}
                  >
                    G
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={
                        counter ? `/profile/${counter.userId}` : `/group/${groupId}`
                      }
                      className="font-serif"
                      style={{ fontSize: 18, letterSpacing: -0.2 }}
                    >
                      {counter?.displayName ?? "Partial group"}
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.status === "pending" && <ExpiryChip expiresAt={r.expiresAt} />}
                      <span className="font-mono" style={{ fontSize: 10.5, color: RM.ink3 }}>
                        {fmtAgo(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {counter && (
                    <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 3 }}>
                      {counter.branch} · {counter.hometownCity} · {score}% match
                    </div>
                  )}
                  {r.note && (
                    <div
                      className="mt-2 p-2 text-sm italic rounded-md"
                      style={{ background: RM.surface2, color: RM.ink2 }}
                    >
                      &ldquo;{r.note}&rdquo;
                    </div>
                  )}
                </div>
              </div>

              {/* Co-sign progress for group requests */}
              {isGroupRequest && <AcceptanceGrid request={r} hall={hall} compact />}

              {tab === "incoming" && r.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    hall={hall}
                    size="sm"
                    full
                    onClick={() => onAccept(r)}
                  >
                    {busy === r.id ? "…" : counter ? `Accept · chat with ${counter.displayName.split(" ")[0]}` : "Accept"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDecline(r)}
                  >
                    Decline
                  </Button>
                </div>
              )}
              {tab === "outgoing" && r.status === "pending" && (
                <div className="mt-2.5 flex justify-between items-center">
                  <StatusPill tone="pending">Waiting</StatusPill>
                  <button
                    onClick={() => setWithdrawing(r.id)}
                    style={{
                      background: "none", border: "none", fontSize: 12.5,
                      color: RM.ink3, textDecoration: "underline", cursor: "pointer",
                    }}
                  >
                    Withdraw
                  </button>
                </div>
              )}
              {tab === "history" && (
                <div className="mt-2.5 flex justify-between items-center">
                  {r.status === "accepted" && <StatusPill tone="verified">Matched</StatusPill>}
                  {r.status === "declined" && <StatusPill tone="danger">Declined</StatusPill>}
                  {r.status === "withdrawn" && <StatusPill tone="neutral">Withdrawn</StatusPill>}
                  {r.status === "expired" && <StatusPill tone="neutral">Expired</StatusPill>}
                  {r.status === "invalidated" && (
                    <StatusPill tone="neutral">
                      Invalidated{r.invalidatedReason ? ` · ${r.invalidatedReason.replace(/_/g, " ")}` : ""}
                    </StatusPill>
                  )}
                  {r.status === "accepted" && counter && (
                    <Link
                      href={(() => {
                        const dm = Object.values(chats).find(
                          (c) =>
                            c.type === "dm" &&
                            c.participantIds.includes(meId) &&
                            c.participantIds.includes(counter.userId),
                        );
                        return dm ? `/chat/${dm.id}` : "/chat";
                      })()}
                      className="font-mono"
                      style={{ fontSize: 12, color: t.deep, textDecoration: "underline" }}
                    >
                      open chat →
                    </Link>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Withdraw confirmation modal */}
      {withdrawing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setWithdrawing(null)}
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="w-full max-w-[480px] p-5 rounded-t-3xl"
            style={{ background: RM.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif" style={{ fontSize: 22, letterSpacing: -0.3 }}>
              Withdraw this request?
            </h3>
            <p className="mt-2" style={{ fontSize: 14, color: RM.ink2, lineHeight: 1.5 }}>
              The other side won&rsquo;t see it anymore. You can send a fresh one later — no
              cooldown for withdraws.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Button variant="secondary" onClick={() => setWithdrawing(null)}>
                Keep waiting
              </Button>
              <Button
                variant="danger"
                full
                onClick={() => {
                  const req = all.find((x) => x.id === withdrawing);
                  if (req) confirmWithdraw(req);
                }}
              >
                {busy === withdrawing ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function fmtAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}
