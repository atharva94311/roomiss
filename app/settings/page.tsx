"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { useRoomiss, selectMyProfile } from "@/lib/store";
import { RM } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const me = useRoomiss((s) => s.users[s.meId]);
  const profile = useRoomiss(selectMyProfile);
  const togglePrivacy = useRoomiss((s) => s.togglePrivacy);
  const setHall = useRoomiss((s) => s.setHall);
  const logout = useRoomiss((s) => s.logout);
  const deleteAcc = useRoomiss((s) => s.deleteAccount);
  const [showDelete, setShowDelete] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [emailDigest, setEmailDigest] = useState<"off" | "2h" | "daily">("2h");

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
        <h1
          className="font-serif"
          style={{ fontSize: 28, letterSpacing: -0.5, lineHeight: 1 }}
        >
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3.5">
        <Section label="Account">
          <Row label="Email" value={me?.email ?? "—"} />
          <Row label="Hall" value={me?.hall ?? "Unverified"} />
          <Row
            label="Verification"
            value={me?.verificationStatus.replace("_", " ") ?? "—"}
          />
        </Section>

        <Section label="Hall change">
          <p className="text-xs px-3.5 pb-2" style={{ color: RM.ink3 }}>
            Changing your hall forces re-verification and removes you from any current group.
          </p>
          <div className="flex gap-2 px-3.5 pb-3.5">
            {(["LBS", "SNVH"] as Hall[]).map((h) => (
              <button
                key={h}
                onClick={() => {
                  if (confirm(`Switch to ${h}? This forces re-verification.`)) setHall(h);
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: me?.hall === h ? RM.ink : RM.surface2,
                  color: me?.hall === h ? RM.bg : RM.ink,
                  border: "none",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Privacy">
          <ToggleRow
            label="Hide my photo until mutual match"
            value={profile?.privacyHidePhoto ?? true}
            onToggle={() => togglePrivacy("privacyHidePhoto")}
          />
          <ToggleRow
            label="Hide my Instagram outside my group"
            value={profile?.privacyHideInsta ?? true}
            onToggle={() => togglePrivacy("privacyHideInsta")}
          />
          <ToggleRow
            label="Hide last-active indicator"
            value={profile?.privacyHideLastActive ?? false}
            onToggle={() => togglePrivacy("privacyHideLastActive")}
          />
        </Section>

        <Section label="Notifications">
          <SelectRow
            label="Email digest cadence"
            value={emailDigest}
            onChange={(v) => setEmailDigest(v as "off" | "2h" | "daily")}
            options={[
              { value: "off", label: "Off" },
              { value: "2h", label: "Every 2 hours" },
              { value: "daily", label: "Daily" },
            ]}
          />
          <Row
            label="Quiet hours"
            value={
              <div className="flex gap-1 items-center">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="outline-none"
                  style={{
                    padding: "4px 8px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: `1px solid ${RM.hairline2}`,
                  }}
                />
                <span style={{ color: RM.ink3 }}>–</span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="outline-none"
                  style={{
                    padding: "4px 8px",
                    fontSize: 13,
                    borderRadius: 6,
                    border: `1px solid ${RM.hairline2}`,
                  }}
                />
              </div>
            }
          />
        </Section>

        <Section label="Profile">
          <LinkRow href="/onboarding/profile">Edit profile</LinkRow>
          <LinkRow href="/blocked">Blocked users</LinkRow>
          <button
            onClick={async () => {
              const { supabase } = await import("@/lib/supabase/client");
              const { data } = await supabase.auth.getSession();
              const token = data.session?.access_token;
              if (!token) {
                alert("Sign in to export your data.");
                return;
              }
              try {
                const res = await fetch("/api/export", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `roomiss-export-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert(`Export failed: ${e instanceof Error ? e.message : e}`);
              }
            }}
            className="w-full px-3.5 py-3.5 text-left flex items-center justify-between"
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${RM.hairline}`,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            <span>Export my data (JSON)</span>
            <span style={{ color: RM.ink3 }}>↓</span>
          </button>
          <LinkRow href="/privacy">Privacy policy</LinkRow>
        </Section>

        <Section label="Session">
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="w-full px-3.5 py-3.5 text-left"
            style={{ fontSize: 15, color: RM.ink2 }}
          >
            Log out everywhere
          </button>
          <button
            onClick={() => router.push("/forgot-password")}
            className="w-full px-3.5 py-3.5 text-left"
            style={{ fontSize: 15, color: RM.ink2, borderTop: `1px solid ${RM.hairline}` }}
          >
            Change password
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="w-full px-3.5 py-3.5 text-left"
            style={{
              fontSize: 15,
              color: RM.bad,
              borderTop: `1px solid ${RM.hairline}`,
            }}
          >
            Delete account (30-day soft delete)
          </button>
        </Section>

        <p className="text-xs text-center pt-2 pb-6" style={{ color: RM.ink3 }}>
          roomiss · v0.1 · IIT KGP 2026 · DPDPA-compliant
        </p>
      </div>

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowDelete(false)}
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div
            className="w-full max-w-[480px] p-5 rounded-t-3xl"
            style={{ background: RM.bg }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif" style={{ fontSize: 24, letterSpacing: -0.4 }}>
              Delete your account?
            </h3>
            <p className="mt-2" style={{ fontSize: 14, color: RM.ink2, lineHeight: 1.5 }}>
              We&rsquo;ll soft-delete your account immediately and permanently purge after 30 days.
              You&rsquo;ll be removed from any group, your chats will be archived, and your profile
              will appear as &ldquo;Former member&rdquo;.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Button variant="secondary" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                full
                onClick={async () => {
                  const r = await deleteAcc();
                  setShowDelete(false);
                  if (!r.ok) alert(`Couldn't schedule deletion: ${r.error}`);
                  // Stay signed in so the user can hit "Cancel deletion" in the
                  // global banner if they change their mind.
                }}
              >
                Schedule deletion
              </Button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="font-mono uppercase mb-2 px-1"
        style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
      >
        {label}
      </div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="px-3.5 py-3 flex justify-between items-center gap-3"
      style={{ borderBottom: `1px solid ${RM.hairline}` }}
    >
      <span style={{ fontSize: 14, color: RM.ink2 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="px-3.5 py-3 flex justify-between items-center gap-3"
      style={{ borderBottom: `1px solid ${RM.hairline}` }}
    >
      <span style={{ fontSize: 14, color: RM.ink2 }}>{label}</span>
      <button
        onClick={onToggle}
        style={{
          width: 40,
          height: 24,
          borderRadius: 999,
          background: value ? RM.lbs : RM.hairline2,
          position: "relative",
          border: "none",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 18 : 2,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left 0.15s",
          }}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="px-3.5 py-3 flex justify-between items-center gap-3"
      style={{ borderBottom: `1px solid ${RM.hairline}` }}
    >
      <span style={{ fontSize: 14, color: RM.ink2 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none"
        style={{
          padding: "6px 10px",
          fontSize: 13,
          borderRadius: 6,
          border: `1px solid ${RM.hairline2}`,
          background: RM.bg,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LinkRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="w-full px-3.5 py-3.5 flex justify-between items-center text-left"
      style={{
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${RM.hairline}`,
        fontSize: 15,
      }}
    >
      <span>{children}</span>
      <span style={{ color: RM.ink3 }}>›</span>
    </button>
  );
}
