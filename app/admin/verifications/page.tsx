"use client";

import { useEffect, useState } from "react";
import { AdminTopBar } from "@/components/admin/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { useRoomiss } from "@/lib/store";
import { signedSlipUrl } from "@/lib/supabase/upload";
import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

const REJECT_CATS = [
  "Slip illegible",
  "Roll mismatch",
  "Wrong hall",
  "Duplicate account",
  "Other",
];

export default function AdminVerifyPage() {
  const queue = useRoomiss((s) => s.pendingVerifications);
  const approve = useRoomiss((s) => s.approveVerification);
  const reject = useRoomiss((s) => s.rejectVerification);
  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "flagged" | "mine">("all");
  const [showReject, setShowReject] = useState(false);
  const [rejectCat, setRejectCat] = useState(REJECT_CATS[0]);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = queue.filter((q) => {
    if (q.status !== "pending") return false;
    if (filter === "flagged") return (q.flags ?? []).length > 0;
    return true;
  });

  const sel = queue.find((q) => q.id === selectedId);
  const t = sel ? hallTheme(sel.hallClaimed) : hallTheme("LBS");
  const [slipPreview, setSlipPreview] = useState<{ url: string; isPdf: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlipPreview(null);
    if (!sel?.slipUrl) return;
    // Old fake submissions stored `slips://name.pdf` — skip those.
    if (sel.slipUrl.startsWith("slips://")) return;
    (async () => {
      try {
        const url = await signedSlipUrl(sel.slipUrl!, 300);
        if (cancelled) return;
        const isPdf = sel.slipUrl!.toLowerCase().endsWith(".pdf");
        setSlipPreview({ url, isPdf });
      } catch {
        if (!cancelled) setSlipPreview(null);
      }
    })();
    return () => { cancelled = true; };
  }, [sel?.id, sel?.slipUrl]);

  const onApprove = () => {
    if (!sel) return;
    approve(sel.id);
    setSelectedId(filtered.find((f) => f.id !== sel.id)?.id ?? null);
  };
  const onRejectSubmit = () => {
    if (!sel) return;
    reject(sel.id, rejectReason, rejectCat);
    setShowReject(false);
    setRejectReason("");
    setSelectedId(filtered.find((f) => f.id !== sel.id)?.id ?? null);
  };

  return (
    <>
      <AdminTopBar
        title="Verification queue"
        sub={`${filtered.length} pending · auto-flagged ${queue.filter((q) => (q.flags ?? []).length > 0).length}`}
      />

      <div className="p-4 flex gap-3" style={{ flexShrink: 0 }}>
        {[
          { l: "Pending", v: `${queue.filter((q) => q.status === "pending").length}`, c: RM.warn, hint: "↑ 3 today" },
          { l: "Auto-flagged", v: `${queue.filter((q) => (q.flags ?? []).length > 0).length}`, c: RM.bad, hint: "name mismatch" },
          { l: "Approved 7d", v: "127", c: RM.good, hint: "99.2%" },
          { l: "Rejected 7d", v: "4", c: RM.ink3, hint: "3 reapplied" },
        ].map((s) => (
          <div
            key={s.l}
            className="flex-1 p-3.5 rounded-xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div className="font-mono uppercase" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
              {s.l}
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-serif" style={{ fontSize: 28, letterSpacing: -0.5 }}>
                {s.v}
              </span>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: s.c }} />
            </div>
            <div style={{ fontSize: 11.5, color: RM.ink3, marginTop: 4 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex min-h-0 px-4 pb-4 gap-3">
        <div
          className="rounded-2xl flex flex-col min-h-0"
          style={{ width: 360, flexShrink: 0, background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="px-3.5 py-3 flex gap-1.5 items-center"
            style={{ borderBottom: `1px solid ${RM.hairline}` }}
          >
            {(
              [
                { id: "all" as const, l: "All", n: queue.filter((q) => q.status === "pending").length },
                { id: "flagged" as const, l: "Auto-flag", n: queue.filter((q) => (q.flags ?? []).length > 0).length },
                { id: "mine" as const, l: "Mine", n: 0 },
              ]
            ).map((x) => (
              <button
                key={x.id}
                onClick={() => setFilter(x.id)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: filter === x.id ? RM.ink : "transparent",
                  color: filter === x.id ? RM.bg : RM.ink2,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  border: "none",
                }}
              >
                {x.l}
                <span className="font-mono" style={{ fontSize: 10, opacity: 0.7 }}>
                  {x.n}
                </span>
              </button>
            ))}
            <div className="flex-1" />
            <span className="font-mono" style={{ fontSize: 10.5, color: RM.ink3 }}>
              oldest first ↓
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((q) => {
              const qt = hallTheme(q.hallClaimed);
              const isSel = q.id === selectedId;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  className="block w-full text-left flex gap-3"
                  style={{
                    padding: "12px 14px",
                    borderBottom: `1px solid ${RM.hairline}`,
                    background: isSel ? qt.soft : "transparent",
                    cursor: "pointer",
                    borderLeft: isSel ? `3px solid ${qt.accent}` : "3px solid transparent",
                  }}
                >
                  <Avatar name={q.name ?? "Fresher"} hall={q.hallClaimed} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{q.name ?? q.userId}</span>
                      <span className="font-mono" style={{ fontSize: 10.5, color: RM.ink3 }}>
                        {fmtAgo(q.createdAt)}
                      </span>
                    </div>
                    <div
                      className="font-mono mt-0.5"
                      style={{ fontSize: 11.5, color: RM.ink3 }}
                    >
                      {q.id} · {q.hallClaimed}
                    </div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {(q.flags ?? []).map((f) => (
                        <StatusPill key={f} tone="danger" dot={false}>
                          {f}
                        </StatusPill>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm" style={{ color: RM.ink3 }}>
                Queue is empty 🎉
              </div>
            )}
          </div>
        </div>

        {sel ? (
          <div
            className="flex-1 min-w-0 rounded-2xl overflow-y-auto"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div
              className="px-5 py-4 flex items-center gap-3.5"
              style={{ borderBottom: `1px solid ${RM.hairline}` }}
            >
              <Avatar name={sel.name ?? "F"} hall={sel.hallClaimed} size={56} />
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-serif" style={{ fontSize: 22, margin: 0, letterSpacing: -0.4 }}>
                    {sel.name ?? sel.userId}
                  </h2>
                  <HallPill hall={sel.hallClaimed as Hall} />
                  {(sel.flags ?? []).length > 0 && (
                    <StatusPill tone="danger">{sel.flags?.length} flag{(sel.flags?.length ?? 0) > 1 ? "s" : ""}</StatusPill>
                  )}
                </div>
                <div
                  className="font-mono mt-1"
                  style={{ fontSize: 12.5, color: RM.ink3 }}
                >
                  {sel.id} · submitted {fmtAgo(sel.createdAt)} ago
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReject(true)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: RM.bad,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={onApprove}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: t.accent,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Approve &amp; verify
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-5">
              <div>
                <div className="font-mono uppercase mb-2" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Submitted documents
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Real slip preview — signed URL, expires in 5 minutes */}
                  <div
                    className="rounded-lg overflow-hidden flex flex-col relative"
                    style={{ aspectRatio: "4/3", background: RM.bg, border: `1px solid ${RM.hairline}` }}
                  >
                    {slipPreview ? (
                      slipPreview.isPdf ? (
                        <iframe
                          src={slipPreview.url}
                          title="Slip preview"
                          className="flex-1"
                          style={{ border: "none", background: "#fff" }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slipPreview.url}
                          alt="Submitted hall allotment slip"
                          loading="lazy"
                          decoding="async"
                          className="flex-1 w-full object-cover"
                        />
                      )
                    ) : (
                      <div
                        className="flex-1 flex items-center justify-center font-mono uppercase"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, rgba(27,26,23,0.05) 0 6px, transparent 6px 12px)`,
                          color: RM.ink3, fontSize: 11, letterSpacing: 0.5,
                        }}
                      >
                        {sel?.slipUrl?.startsWith("slips://") ? "Legacy placeholder" : "No slip"}
                      </div>
                    )}
                    <div
                      className="px-2 py-1.5 flex justify-between items-baseline"
                      style={{ borderTop: `1px solid ${RM.hairline}` }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500 }}>Slip</span>
                      <a
                        href={slipPreview?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono"
                        style={{
                          fontSize: 9.5,
                          color: slipPreview ? RM.lbsInk : RM.ink3,
                          textDecoration: slipPreview ? "underline" : "none",
                          pointerEvents: slipPreview ? "auto" : "none",
                        }}
                      >
                        Open full ↗
                      </a>
                    </div>
                  </div>
                  {[
                    { l: "Photo ID", tag: "JPG · 1.2MB" },
                    { l: "Selfie + ID", tag: "JPG · auto-flag" },
                    { l: "Fee receipt", tag: "PDF · 78KB" },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden flex flex-col relative"
                      style={{
                        aspectRatio: "4/3",
                        background: RM.bg,
                        border: `1px solid ${RM.hairline}`,
                      }}
                    >
                      <div
                        className="flex-1 flex items-center justify-center font-mono uppercase"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, rgba(27,26,23,0.05) 0 6px, transparent 6px 12px)`,
                          color: RM.ink3,
                          fontSize: 11,
                          letterSpacing: 0.5,
                        }}
                      >
                        {d.tag.split("·")[0]}
                      </div>
                      <div
                        className="px-2 py-1.5 flex justify-between items-baseline"
                        style={{ borderTop: `1px solid ${RM.hairline}` }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{d.l}</span>
                        <span className="font-mono" style={{ fontSize: 9.5, color: RM.ink3 }}>
                          {d.tag}
                        </span>
                      </div>
                      {i === 2 && (
                        <div
                          className="absolute font-mono"
                          style={{
                            top: 6,
                            right: 6,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: RM.bad,
                            color: "#fff",
                            fontSize: 9.5,
                            letterSpacing: 0.4,
                          }}
                        >
                          FLAG
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="font-mono uppercase mt-4 mb-2" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Auto-checks
                </div>
                <div className="rounded-lg" style={{ background: RM.bg, border: `1px solid ${RM.hairline}` }}>
                  {[
                    { l: "Roll number exists in admissions DB", s: "pass" as const },
                    { l: "Email domain matches institute", s: "pass" as const },
                    { l: "Photo ID name = registration name", s: "fail" as const, n: "differs by middle name" },
                    { l: "Selfie vs ID face match (≥85%)", s: "warn" as const, n: "78% — review manually" },
                    { l: "Duplicate submission check", s: "pass" as const },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2"
                      style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
                    >
                      <span
                        className="flex items-center justify-center font-mono"
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          background: row.s === "pass" ? RM.good : row.s === "warn" ? RM.warn : RM.bad,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {row.s === "pass" ? "✓" : row.s === "warn" ? "!" : "×"}
                      </span>
                      <span style={{ fontSize: 13, flex: 1 }}>{row.l}</span>
                      {row.n && (
                        <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                          {row.n}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono uppercase mb-2" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Submitted info
                </div>
                <div className="rounded-lg" style={{ background: RM.bg, border: `1px solid ${RM.hairline}` }}>
                  {[
                    ["Name (registered)", sel.name ?? "—"],
                    ["JEE roll", sel.jeeRoll],
                    ["Admission roll", sel.admissionRoll],
                    ["Hall claimed", sel.hallClaimed],
                    ["Submitted from", "campus VPN ✓"],
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="flex px-3 py-2"
                      style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
                    >
                      <span style={{ width: 150, fontSize: 12.5, color: RM.ink3 }}>{r[0]}</span>
                      <span style={{ flex: 1, fontSize: 13, fontFamily: i === 1 || i === 2 ? RM.mono : RM.sans }}>
                        {r[1]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="font-mono uppercase mt-4 mb-2" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Activity
                </div>
                <div className="pl-2.5 space-y-3">
                  {[
                    { t: fmtAgo(sel.createdAt) + " ago", l: "Submitted verification", c: RM.ink3 },
                    { t: "auto", l: "Auto-checks completed", c: RM.warn },
                    { t: "now", l: "Awaiting your review", c: t.accent },
                  ].map((e, i, arr) => (
                    <div key={i} className="flex gap-2.5 relative pb-1">
                      <div className="flex flex-col items-center">
                        <div
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: 5,
                            background: e.c,
                            marginTop: 5,
                            boxShadow: `0 0 0 3px ${RM.surface}`,
                          }}
                        />
                        {i !== arr.length - 1 && (
                          <div
                            className="flex-1"
                            style={{ width: 1, background: RM.hairline, marginTop: 3 }}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div style={{ fontSize: 13, color: RM.ink }}>{e.l}</div>
                        <div className="font-mono" style={{ fontSize: 11, color: RM.ink3, marginTop: 1 }}>
                          {e.t}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-sm rounded-2xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}`, color: RM.ink3 }}
          >
            Select a submission from the queue.
          </div>
        )}
      </div>

      {showReject && sel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowReject(false)}
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="rounded-2xl p-5 max-w-md w-full mx-4"
            style={{ background: RM.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif" style={{ fontSize: 22, letterSpacing: -0.4 }}>
              Reject {sel.name}?
            </h3>
            <div className="mt-3">
              <label
                className="font-mono uppercase block mb-1.5"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Category
              </label>
              <select
                value={rejectCat}
                onChange={(e) => setRejectCat(e.target.value)}
                className="w-full p-2.5 outline-none"
                style={{
                  borderRadius: 8,
                  border: `1px solid ${RM.hairline2}`,
                  background: RM.surface,
                }}
              >
                {REJECT_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label
                className="font-mono uppercase block mt-3 mb-1.5"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Reason (visible to user)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 outline-none"
                style={{
                  borderRadius: 8,
                  border: `1px solid ${RM.hairline2}`,
                  background: RM.surface,
                  resize: "none",
                  fontSize: 14,
                  fontFamily: RM.sans,
                }}
              />
            </div>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setShowReject(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: `1.5px solid ${RM.ink}`,
                  background: "transparent",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={onRejectSubmit}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: RM.bad,
                  color: "#fff",
                  fontWeight: 500,
                }}
              >
                Reject
              </button>
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
