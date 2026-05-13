"use client";

import { useEffect, useState } from "react";
import { AdminTopBar } from "@/components/admin/TopBar";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

const SUPABASE_PROJECT_ID = "ttycyzyeogdpzfkcnhlm";
const SB_DASH = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;

export default function AdminSettingsPage() {
  const platform = useRoomiss((s) => s.platform);
  const save = useRoomiss((s) => s.savePlatformSettings);
  const asAdmin = useRoomiss((s) => s.asAdmin);

  // Local edit state so admins can tweak without committing on every keystroke.
  const [draft, setDraft] = useState(platform);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Keep draft synced when the store re-hydrates or another tab updates the row.
  useEffect(() => setDraft(platform), [platform]);

  // Auto-dismiss status pill.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  const dirty =
    draft.closeT0 !== platform.closeT0 ||
    draft.reviewSlaHours !== platform.reviewSlaHours ||
    draft.demoMode !== platform.demoMode;

  const onSave = async () => {
    setSaving(true);
    const r = await save(draft);
    setSaving(false);
    setMsg(r.ok ? { kind: "ok", text: "Saved" } : { kind: "err", text: r.error ?? "Save failed" });
  };

  const onToggleDemo = async () => {
    setDraft((d) => ({ ...d, demoMode: !d.demoMode }));
    // Demo toggle commits immediately — it gates a security-sensitive RPC,
    // so we don't want a stale "unsaved" state hanging around.
    setSaving(true);
    const r = await save({ demoMode: !platform.demoMode });
    setSaving(false);
    setMsg(r.ok ? { kind: "ok", text: "Demo mode updated" } : { kind: "err", text: r.error ?? "Save failed" });
  };

  // dt-local input expects "YYYY-MM-DDTHH:mm" (no seconds, no Z).
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <>
      <AdminTopBar
        title="Platform settings"
        sub="Demo gating · allotment date · SLA · external auth config"
      />

      {!asAdmin && (
        <div
          className="mx-6 mt-4 p-4 rounded-2xl"
          style={{ background: `${RM.bad}10`, color: RM.bad, border: `1px solid ${RM.bad}40` }}
        >
          You're not signed in as an admin. Changes will be rejected by RLS.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 max-w-3xl">
        {/* Demo mode — security-sensitive, gets its own card */}
        <Section
          label="Demo mode"
          danger={platform.demoMode}
          hint="When ON, the /verify/pending screen shows a 'simulate admin approval' button that self-approves the current user. MUST be OFF before real testers."
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                {platform.demoMode ? "Demo backdoor ENABLED" : "Demo backdoor disabled"}
              </span>
              <span style={{ fontSize: 12, color: RM.ink3 }}>
                {platform.demoMode
                  ? "demo_self_approve_verification() succeeds for the calling user."
                  : "demo_self_approve_verification() returns demo_mode_disabled."}
              </span>
            </div>
            <Toggle value={platform.demoMode} onChange={onToggleDemo} danger={platform.demoMode} />
          </div>
        </Section>

        {/* Allotment date + SLA */}
        <Section
          label="Platform timeline"
          hint="close_t0 is the institute hall-allotment day. T-7 disables matching, T+30 archives chats. (Server gating: TODO step 9.)"
        >
          <Row label="Allotment date (close_t0)">
            <input
              type="datetime-local"
              value={toLocal(draft.closeT0)}
              onChange={(e) =>
                setDraft((d) => ({ ...d, closeT0: new Date(e.target.value).toISOString() }))
              }
              className="outline-none"
              style={{
                padding: "8px 10px",
                fontSize: 13.5,
                fontFamily: RM.mono,
                background: RM.bg,
                border: `1px solid ${RM.hairline2}`,
                borderRadius: 8,
              }}
            />
          </Row>
          <Row label="Review SLA (hours)">
            <input
              type="number"
              min={1}
              max={168}
              value={draft.reviewSlaHours}
              onChange={(e) =>
                setDraft((d) => ({ ...d, reviewSlaHours: Number(e.target.value) }))
              }
              className="outline-none w-20"
              style={{
                padding: "8px 10px",
                fontSize: 13.5,
                fontFamily: RM.mono,
                background: RM.bg,
                border: `1px solid ${RM.hairline2}`,
                borderRadius: 8,
                textAlign: "right",
              }}
            />
          </Row>
          <div
            className="flex items-center justify-between gap-3 pt-3"
            style={{ borderTop: `1px solid ${RM.hairline}` }}
          >
            <span style={{ fontSize: 12, color: RM.ink3 }}>
              {dirty ? "Unsaved changes" : "Up to date"}
            </span>
            <div className="flex items-center gap-2">
              {msg && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontFamily: RM.mono,
                    letterSpacing: 0.3,
                    color: msg.kind === "ok" ? RM.good : RM.bad,
                  }}
                >
                  {msg.text}
                </span>
              )}
              <button
                onClick={() => setDraft(platform)}
                disabled={!dirty || saving}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  borderRadius: 10,
                  background: "transparent",
                  border: `1px solid ${RM.hairline2}`,
                  color: dirty ? RM.ink : RM.ink3,
                  cursor: dirty ? "pointer" : "not-allowed",
                }}
              >
                Revert
              </button>
              <button
                onClick={onSave}
                disabled={!dirty || saving}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 10,
                  background: dirty ? RM.ink : RM.hairline2,
                  color: RM.bg,
                  border: "none",
                  cursor: dirty && !saving ? "pointer" : "not-allowed",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </Section>

        {/* External (Supabase dashboard) settings */}
        <Section
          label="External auth config"
          hint="These live in the Supabase dashboard, not the database. Toggle them once during setup; the buttons deep-link you to the exact page."
        >
          <ExternalRow
            label="Email confirmation"
            desc="Require users to click a link in their email before signing in."
            href={`${SB_DASH}/auth/providers?provider=email`}
          />
          <ExternalRow
            label="Leaked password protection"
            desc="Reject passwords found in HaveIBeenPwned breach dump."
            href={`${SB_DASH}/auth/policies`}
          />
          <ExternalRow
            label="Custom SMTP"
            desc="Required if you'll send more than ~3 emails/hour. Resend's free tier covers 100/day."
            href={`${SB_DASH}/auth/templates`}
          />
          <ExternalRow
            label="Auth user directory"
            desc="See every user, force-confirm an account, manually delete."
            href={`${SB_DASH}/auth/users`}
            last
          />
        </Section>

        {/* Quick links */}
        <Section label="Quick links">
          <ExternalRow label="Database tables" desc="Inspect rows, run SQL." href={`${SB_DASH}/editor`} />
          <ExternalRow label="Auth logs" desc="See sign-ins, signups, failed attempts." href={`${SB_DASH}/logs/auth-logs`} />
          <ExternalRow
            label="Storage buckets"
            desc="Browse slips / avatars / attachments."
            href={`${SB_DASH}/storage/buckets`}
            last
          />
        </Section>

        <p
          className="text-xs text-center pt-2 pb-6"
          style={{ color: RM.ink3, fontFamily: RM.mono, letterSpacing: 0.3 }}
        >
          project · {SUPABASE_PROJECT_ID}
        </p>
      </div>
    </>
  );
}

function Section({
  label,
  hint,
  danger,
  children,
}: {
  label: string;
  hint?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{
        background: RM.surface,
        boxShadow: `0 0 0 1px ${danger ? RM.bad : RM.hairline}`,
      }}
    >
      <div
        className="font-mono uppercase mb-3"
        style={{ fontSize: 10.5, color: danger ? RM.bad : RM.ink3, letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
      {hint && (
        <p
          className="mt-3 text-xs"
          style={{ color: RM.ink3, lineHeight: 1.5 }}
        >
          {hint}
        </p>
      )}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span style={{ fontSize: 14, color: RM.ink2 }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  danger,
}: {
  value: boolean;
  onChange: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      aria-pressed={value}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: value ? (danger ? RM.bad : RM.good) : RM.hairline2,
        position: "relative",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: value ? 20 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: "#fff",
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function ExternalRow({
  label,
  desc,
  href,
  last,
}: {
  label: string;
  desc: string;
  href: string;
  last?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 py-2.5"
      style={{
        borderBottom: last ? "none" : `1px solid ${RM.hairline}`,
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: RM.ink3 }}>{desc}</span>
      </div>
      <span
        className="font-mono"
        style={{ fontSize: 11, color: RM.ink3, flexShrink: 0, letterSpacing: 0.3 }}
      >
        Open ↗
      </span>
    </a>
  );
}
