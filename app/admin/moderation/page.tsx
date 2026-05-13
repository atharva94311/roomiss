"use client";

import { useState } from "react";
import { AdminTopBar } from "@/components/admin/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useRoomiss } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import { RM } from "@/lib/tokens";

type DialogKind = "dismiss" | "warn" | "suspend" | "ban" | null;

export default function AdminModerationPage() {
  const reports = useRoomiss((s) => Object.values(s.reports));
  const profiles = useRoomiss((s) => s.profiles);
  const users = useRoomiss((s) => s.users);
  const messages = useRoomiss((s) => s.messages);
  const [selectedId, setSelectedId] = useState<string | null>(reports[0]?.id ?? null);
  const [dialog, setDialog] = useState<DialogKind>(null);

  const sel = reports.find((r) => r.id === selectedId);
  const target = sel ? profiles[sel.targetUserId] : null;
  const targetUser = sel ? users[sel.targetUserId] : null;
  const reporter = sel ? profiles[sel.reporterId] : null;
  const flaggedMessage = sel?.targetMessageId ? messages.find((m) => m.id === sel.targetMessageId) : null;

  /** Refresh local cache after a moderation RPC. */
  const refreshAfter = async (status?: "resolved" | "dismissed") => {
    if (!sel) return;
    const action = status ?? "resolved";
    if (status) {
      await supabase.rpc("admin_resolve_report", {
        p_report_id: sel.id,
        p_status: status,
        p_action_taken: action,
      });
    }
    // Patch local immediately; realtime + next hydrate cycle confirm.
    useRoomiss.setState((s) => ({
      ...s,
      reports: {
        ...s.reports,
        [sel.id]: {
          ...s.reports[sel.id],
          status: status ?? s.reports[sel.id].status,
          reviewedAt: new Date().toISOString(),
          actionTaken: action,
        },
      },
    }));
  };

  return (
    <>
      <AdminTopBar
        title="Reports"
        sub={`${reports.filter((r) => r.status === "open").length} open · ${
          reports.filter((r) => r.status === "resolved").length
        } resolved`}
      />

      <div className="flex-1 flex min-h-0 p-4 gap-3">
        <div
          className="rounded-2xl flex flex-col min-h-0"
          style={{ width: 320, flexShrink: 0, background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="px-3.5 py-3 font-mono uppercase"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5, borderBottom: `1px solid ${RM.hairline}` }}
          >
            Open reports
          </div>
          <div className="flex-1 overflow-y-auto">
            {reports.length === 0 && (
              <div className="p-6 text-center text-sm" style={{ color: RM.ink3 }}>
                No open reports.
              </div>
            )}
            {reports.map((r) => {
              const targetProfile = profiles[r.targetUserId];
              const reporterProfile = profiles[r.reporterId];
              const isSel = r.id === selectedId;
              const tone = r.category === "harassment" || r.category === "fake_profile" ? "danger" : "pending";
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="block w-full text-left"
                  style={{
                    padding: "11px 14px",
                    borderBottom: `1px solid ${RM.hairline}`,
                    background: isSel ? RM.surface2 : "transparent",
                    cursor: "pointer",
                    borderLeft: isSel ? `3px solid ${RM.lbs}` : "3px solid transparent",
                    opacity: r.status !== "open" ? 0.55 : 1,
                  }}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono" style={{ fontSize: 11, color: RM.ink3 }}>
                      {r.id.slice(0, 6)}…
                    </span>
                    <span className="font-mono" style={{ fontSize: 10.5, color: RM.ink3 }}>
                      {fmtAgo(r.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1" style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {r.category.replace("_", " ")}
                  </div>
                  <div style={{ fontSize: 11.5, color: RM.ink3, marginTop: 2 }}>
                    by {reporterProfile?.displayName ?? "user"} on {targetProfile?.displayName ?? "user"}
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <StatusPill tone={tone as "danger" | "pending"} dot={false}>
                      {r.category}
                    </StatusPill>
                    {r.status !== "open" && <StatusPill tone="verified" dot={false}>{r.status}</StatusPill>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {sel ? (
          <div
            className="flex-1 min-w-0 rounded-2xl flex flex-col min-h-0"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div
              className="px-4 py-3.5 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${RM.hairline}` }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif" style={{ fontSize: 20, letterSpacing: -0.3, margin: 0 }}>
                    {sel.id.slice(0, 8)} · {sel.category.replace("_", " ")}
                  </h2>
                  <StatusPill tone="danger">{sel.category}</StatusPill>
                </div>
                <div className="font-mono mt-1" style={{ fontSize: 12.5, color: RM.ink3 }}>
                  Reporter: {reporter?.displayName ?? "user"} · Reported: {target?.displayName ?? "user"} ·{" "}
                  {fmtAgo(sel.createdAt)} ago
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDialog("dismiss")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${RM.hairline}`,
                    background: RM.bg,
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setDialog("warn")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: RM.warn,
                    color: "#fff",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Warn
                </button>
                <button
                  onClick={() => setDialog("suspend")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: RM.ink,
                    color: "#fff",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Suspend 7d
                </button>
                <button
                  onClick={() => setDialog("ban")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: RM.bad,
                    color: "#fff",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Ban
                </button>
              </div>
            </div>

            <div className="flex-1 grid min-h-0" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
              <div
                className="p-4 overflow-y-auto"
                style={{ borderRight: `1px solid ${RM.hairline}`, background: RM.bg }}
              >
                <div
                  className="font-mono uppercase mb-3"
                  style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
                >
                  Context
                </div>
                {sel.details && (
                  <div
                    className="p-3 rounded-lg mb-3"
                    style={{ background: RM.surface, fontSize: 13.5 }}
                  >
                    <b style={{ color: RM.ink3 }}>Reporter said:</b> {sel.details}
                  </div>
                )}
                {flaggedMessage && (
                  <div
                    className="p-3 rounded-lg mb-3"
                    style={{
                      background: `${RM.bad}15`,
                      border: `1px solid ${RM.bad}`,
                    }}
                  >
                    <div
                      className="flex justify-between items-baseline mb-1"
                    >
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: RM.bad }}>
                        Flagged message
                      </span>
                      <span className="font-mono" style={{ fontSize: 10, color: RM.ink3 }}>
                        {fmtTime(flaggedMessage.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: RM.bad }}>{flaggedMessage.body}</div>
                  </div>
                )}
                {!flaggedMessage && (
                  <p className="text-sm" style={{ color: RM.ink3 }}>
                    No specific message attached. Review the user&rsquo;s recent activity.
                  </p>
                )}
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="font-mono uppercase mb-2.5" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Reported user
                </div>
                {target && (
                  <div
                    className="flex gap-3 items-center p-3 rounded-lg"
                    style={{ background: RM.bg, border: `1px solid ${RM.hairline}` }}
                  >
                    <Avatar name={target.displayName} hall="LBS" size={48} />
                    <div className="flex-1">
                      <div className="font-serif" style={{ fontSize: 18, letterSpacing: -0.2 }}>
                        {target.displayName}
                      </div>
                      <div className="font-mono" style={{ fontSize: 12, color: RM.ink3 }}>
                        {target.branch}
                      </div>
                    </div>
                    <HallPill hall="LBS" />
                  </div>
                )}
                <div
                  className="mt-3 p-3 rounded-lg"
                  style={{ background: RM.bg, border: `1px solid ${RM.hairline}` }}
                >
                  <div
                    className="font-mono uppercase mb-2"
                    style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
                  >
                    History
                  </div>
                  {[
                    { l: "Prior reports", v: "0" },
                    { l: "Verified", v: "Yes" },
                    { l: "Group state", v: "Solo" },
                    { l: "Account age", v: "14d" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex justify-between py-1.5"
                      style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none", fontSize: 13 }}
                    >
                      <span style={{ color: RM.ink3 }}>{row.l}</span>
                      <span style={{ fontWeight: 500 }}>{row.v}</span>
                    </div>
                  ))}
                </div>
                <div className="font-mono uppercase mt-4 mb-2" style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}>
                  Suggested action
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ background: `${RM.warn}10`, border: `1px solid ${RM.warn}40` }}
                >
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>Warn + 7-day suspend</div>
                  <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 4, lineHeight: 1.5 }}>
                    First offense, standard policy: warning email + 7-day discovery suspension.
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-sm rounded-2xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}`, color: RM.ink3 }}
          >
            Select a report.
          </div>
        )}
      </div>

      {sel && dialog === "dismiss" && (
        <ConfirmDialog
          title="Dismiss this report?"
          body="No action will be taken against the reported user."
          confirmLabel="Dismiss"
          onClose={() => setDialog(null)}
          onConfirm={async () => { await refreshAfter("dismissed"); }}
        />
      )}
      {sel && dialog === "warn" && (
        <ConfirmDialog
          title={`Warn ${target?.displayName ?? "this user"}?`}
          body="A system DM is sent to the user. Their account stays active."
          reasonPrompt="Warning text (visible to the user)"
          confirmLabel="Send warning"
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            if (sel.targetUserId) {
              await supabase.rpc("admin_warn_user", {
                p_user_id: sel.targetUserId,
                p_message: reason,
              });
            }
            await refreshAfter("resolved");
          }}
        />
      )}
      {sel && dialog === "suspend" && (
        <ConfirmDialog
          title={`Suspend ${target?.displayName ?? "this user"} for 7 days?`}
          body="They can sign in but matching, requests, and chat are blocked."
          reasonPrompt="Reason (audit log only)"
          confirmLabel="Suspend for 7 days"
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            if (sel.targetUserId) {
              await supabase.rpc("admin_suspend_user", {
                p_user_id: sel.targetUserId,
                p_days: 7,
                p_reason: reason,
              });
            }
            await refreshAfter("resolved");
          }}
        />
      )}
      {sel && dialog === "ban" && (
        <ConfirmDialog
          title={`Ban ${target?.displayName ?? "this user"}?`}
          body="Force-leaves any group, invalidates pending requests, blocks future sign-ins. This is reversible by un-banning manually."
          reasonPrompt="Reason (audit log only)"
          typeToConfirm={targetUser?.email ?? "BAN"}
          confirmLabel="Ban this user"
          danger
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            if (sel.targetUserId) {
              await supabase.rpc("admin_ban_user", {
                p_user_id: sel.targetUserId,
                p_reason: reason,
              });
            }
            await refreshAfter("resolved");
          }}
        />
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
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
