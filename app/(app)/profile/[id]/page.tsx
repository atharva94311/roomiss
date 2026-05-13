"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRoomiss, selectMyHall, selectMyProfile } from "@/lib/store";
import { compatScore, compatServer, compatBreakdown as fetchBreakdown, type CompatBreakdown } from "@/lib/compat";
import { Button } from "@/components/ui/Button";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { CompatRing } from "@/components/ui/CompatRing";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { I } from "@/components/ui/Icons";
import { RM, hallTheme } from "@/lib/tokens";
import { ReportModal } from "@/components/modals/ReportModal";

export default function SoloProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const profile = useRoomiss((s) => s.profiles[id]);
  const user = useRoomiss((s) => s.users[id]);
  const myHall = useRoomiss(selectMyHall);
  const myProfile = useRoomiss(selectMyProfile);
  const sendRequest = useRoomiss((s) => s.sendSoloSoloRequest);
  const block = useRoomiss((s) => s.blockUser);
  const requests = useRoomiss((s) => s.requests);
  const meId = useRoomiss((s) => s.meId);
  const [note, setNote] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showReport, setShowReport] = useState(false);
  // ⚠ Rules-of-hooks: keep every hook call above the `if (!profile…)` early
  // return below — order must be identical on every render. State that hangs
  // off optional data (serverScore, breakdown) still uses null-safe defaults.
  const [serverScore, setServerScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<CompatBreakdown | null>(null);
  // Cooldown lookup — if there's an unexpired cooldown for *me* targeting this
  // profile, the Send Request CTA is replaced with a disabled state + countdown.
  const cooldowns = useRoomiss((s) => s.cooldowns);

  useEffect(() => {
    if (!profile || !myProfile || myProfile.userId === profile.userId) return;
    let cancelled = false;
    compatServer(myProfile.userId, profile.userId).then((v) => {
      if (!cancelled && v >= 0) setServerScore(v);
    });
    fetchBreakdown(myProfile.userId, profile.userId).then((b) => {
      if (!cancelled && b) setBreakdown(b);
    });
    return () => { cancelled = true; };
  }, [myProfile, profile]);

  if (!profile || !user) return <div className="p-6">User not found</div>;

  const hall = user.hall ?? myHall;
  const t = hallTheme(hall);
  // Optimistic local score for instant paint; replaced by server value once it arrives.
  const localScore = myProfile ? compatScore(myProfile, profile) : 70;
  const score = serverScore ?? localScore;

  const myCooldown = cooldowns.find(
    (c) => c.userId === meId && c.targetUserId === id && new Date(c.expiresAt) > new Date(),
  );

  // 5-outstanding cap pre-flight check — disable button if I'd be over.
  const myOutstanding = Object.values(requests).filter(
    (r) => r.initiatorUserId === meId && r.status === "pending",
  ).length;
  const overOutstandingCap = myOutstanding >= 5;

  const existingReq = Object.values(requests).find(
    (r) =>
      ((r.initiatorUserId === meId && r.targetUserId === id) ||
        (r.targetUserId === meId && r.initiatorUserId === id)) &&
      r.status === "pending",
  );

  const onSendRequest = async () => {
    const id_ = await sendRequest(id, note);
    if (id_) setRequestSent(true);
    else setShowNote(true);
  };

  return (
    <>
      <div className="relative" style={{ height: 320, flexShrink: 0 }}>
        <PhotoSlot
          ratio="auto"
          hall={hall}
          label="profile photo"
          style={{ height: "100%", borderRadius: 0 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          <button
            type="button"
            aria-label="Back"
            onClick={() => router.back()}
            className="flex items-center justify-center"
            style={{
              width: 40, height: 40, borderRadius: 20, border: "none",
              background: "rgba(255,255,255,0.92)", color: RM.ink,
              fontSize: 20, cursor: "pointer",
            }}
          >
            ←
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Report this user"
              onClick={() => setShowReport(true)}
              className="flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "none",
                background: "rgba(255,255,255,0.92)",
                color: RM.ink2,
              }}
            >
              {I.flag}
            </button>
            <button
              type="button"
              aria-label={`Block ${profile.displayName}`}
              onClick={() => {
                if (confirm(`Block ${profile.displayName}? You won't see each other anymore.`)) {
                  block(id);
                  router.push("/browse");
                }
              }}
              className="flex items-center justify-center"
              style={{
                width: 40, height: 40, borderRadius: 20, border: "none",
                background: "rgba(255,255,255,0.92)", color: RM.ink2,
                cursor: "pointer",
              }}
            >
              {I.shield}
            </button>
          </div>
        </div>
        <div className="absolute" style={{ bottom: 16, left: 20, right: 20 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <HallPill hall={hall} />
            <StatusPill tone="verified">Verified</StatusPill>
          </div>
          <h1
            className="font-serif"
            style={{
              fontSize: 38,
              color: "#fff",
              margin: 0,
              letterSpacing: -0.6,
              lineHeight: 1,
            }}
          >
            {profile.displayName}
          </h1>
          <div className="mt-1.5" style={{ fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
            {profile.branch} &middot; from {profile.hometownCity}, {profile.hometownState}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div
          className="flex gap-3 items-center p-3.5 rounded-2xl"
          style={{ background: t.soft }}
        >
          <CompatRing score={score} size={56} hall={hall} />
          <div className="flex-1">
            <div
              className="font-serif"
              style={{ fontSize: 18, color: t.deep, lineHeight: 1.1, letterSpacing: -0.3 }}
            >
              {score >= 85 ? "Strong match" : score >= 70 ? "Decent match" : "Worth a look"}
              {breakdown?.capped && (
                <span
                  className="ml-2 font-mono uppercase"
                  style={{
                    fontSize: 9.5, letterSpacing: 0.4, color: RM.bad,
                    background: `${RM.bad}15`, padding: "2px 6px", borderRadius: 999,
                  }}
                >
                  capped · food mismatch
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 4, lineHeight: 1.4 }}>
              {compatBlurb(myProfile, profile)}
            </div>
          </div>
        </div>

        {/* Per-axis breakdown (live from server) */}
        {breakdown && (
          <div
            className="p-4 rounded-2xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div
              className="font-mono uppercase mb-2.5"
              style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
            >
              Compatibility breakdown
            </div>
            <div className="flex flex-col gap-1.5">
              {AXES.map((a) => {
                const ax = breakdown.axes[a.key];
                const frac = ax.weight === 0 ? 0 : ax.earned / ax.weight;
                const tone = frac >= 0.66 ? RM.good : frac >= 0.33 ? RM.warn : RM.bad;
                return (
                  <div key={a.key} className="flex items-center gap-3">
                    <span
                      style={{ width: 8, height: 8, borderRadius: 4, background: tone, flexShrink: 0 }}
                    />
                    <span
                      style={{ fontSize: 13, color: RM.ink, width: 90 }}
                    >
                      {a.label}
                    </span>
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: 5, background: RM.hairline }}
                    >
                      <div
                        style={{
                          width: `${Math.max(2, frac * 100)}%`,
                          height: "100%",
                          background: tone,
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                    <span
                      className="font-mono"
                      style={{ fontSize: 10.5, color: RM.ink3, width: 36, textAlign: "right" }}
                    >
                      {ax.earned}/{ax.weight}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase mb-2"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            About
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: RM.ink }}>
            {profile.bio}
          </p>
          {profile.instagramHandle && (
            <div
              className="mt-3 font-mono"
              style={{ fontSize: 13, color: RM.ink3 }}
            >
              <span style={{ opacity: 0.5 }}>Instagram (visible to matches): </span>
              {existingReq?.status === "accepted" ? (
                <span>{profile.instagramHandle}</span>
              ) : (
                <span style={{ filter: "blur(3.5px)", userSelect: "none" }}>
                  @privatehandle
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Lifestyle label="Sleep" value={fmtSleep(profile.sleepSchedule)} icon={I.sleep} />
          <Lifestyle label="Cleanliness" value={profile.cleanliness} icon={I.clean} />
          <Lifestyle label="Social" value={`${profile.socialScore}/5`} icon={I.user} />
          <Lifestyle label="Food" value={fmtFood(profile.foodPref)} icon={I.food} />
          <Lifestyle label="AC room" value={profile.acPref} icon={I.search} />
          <Lifestyle label="Noise" value={profile.noiseTolerance} icon={I.music} />
          <Lifestyle label="Smoking" value={profile.smoking} icon={I.x} />
          <Lifestyle label="Drinking" value={profile.drinking} icon={I.x} />
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase mb-2"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Speaks
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.languages.map((l) => (
              <span
                key={l}
                style={{
                  fontSize: 13,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(27,26,23,0.05)",
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <div
            className="font-mono uppercase mb-2"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Hobbies
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.hobbies.map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 13,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(27,26,23,0.05)",
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        {existingReq?.status === "pending" && existingReq.targetUserId === meId ? (
          <div className="flex gap-2.5">
            <Button
              variant="primary"
              size="md"
              hall={hall}
              full
              onClick={() => useRoomiss.getState().acceptRequest(existingReq.id)}
            >
              Accept &amp; chat
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => useRoomiss.getState().declineRequest(existingReq.id)}
            >
              Decline
            </Button>
          </div>
        ) : existingReq?.status === "pending" ? (
          <Button variant="soft" hall={hall} full disabled>
            Request pending…
          </Button>
        ) : existingReq?.status === "accepted" ? (
          <Button
            variant="primary"
            hall={hall}
            full
            onClick={() => router.push("/chat")}
          >
            Open chat
          </Button>
        ) : showNote ? (
          <>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="Add a note (optional, 200 chars)"
              rows={2}
              className="w-full outline-none"
              style={{
                padding: "12px",
                borderRadius: 12,
                background: RM.surface,
                border: `1.5px solid ${RM.hairline2}`,
                fontSize: 14,
                resize: "none",
                fontFamily: RM.sans,
              }}
            />
            <div className="flex gap-2.5">
              <Button variant="secondary" onClick={() => setShowNote(false)}>
                Cancel
              </Button>
              <Button variant="primary" hall={hall} size="md" full onClick={onSendRequest}>
                Send roommate request
              </Button>
            </div>
          </>
        ) : requestSent ? (
          <Button variant="soft" hall={hall} full disabled>
            ✓ Request sent
          </Button>
        ) : myCooldown ? (
          <div
            className="p-3 rounded-2xl flex flex-col gap-1.5"
            style={{ background: `${RM.warn}15`, border: `1px solid ${RM.warn}55` }}
          >
            <div
              className="font-mono uppercase"
              style={{ fontSize: 10.5, color: RM.warn, letterSpacing: 0.4 }}
            >
              Cooldown active
            </div>
            <div style={{ fontSize: 13.5, color: RM.ink }}>
              They declined a recent request. You can re-send in{" "}
              <b>{daysUntil(myCooldown.expiresAt)}</b>.
            </div>
          </div>
        ) : overOutstandingCap ? (
          <div
            className="p-3 rounded-2xl flex flex-col gap-1.5"
            style={{ background: `${RM.bad}15`, border: `1px solid ${RM.bad}55` }}
          >
            <div
              className="font-mono uppercase"
              style={{ fontSize: 10.5, color: RM.bad, letterSpacing: 0.4 }}
            >
              5-request cap reached
            </div>
            <div style={{ fontSize: 13.5, color: RM.ink }}>
              You already have 5 pending outgoing requests. Withdraw one in{" "}
              <Link href="/requests" style={{ textDecoration: "underline" }}>
                Requests
              </Link>{" "}
              before sending another.
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={() => router.back()}>
              Back
            </Button>
            <Button variant="primary" hall={hall} size="md" full onClick={() => setShowNote(true)}>
              Send roommate request
            </Button>
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          targetUserId={id}
          targetName={profile.displayName}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

function Lifestyle({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="p-3.5 rounded-xl"
      style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
    >
      <div
        className="font-mono uppercase flex items-center gap-1.5"
        style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.4 }}
      >
        <span style={{ width: 14, height: 14, display: "inline-flex" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2" style={{ fontSize: 15, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

function fmtSleep(s: string) {
  return { early: "Early bird", flexible: "Flexible", night: "Night owl" }[s as "early" | "flexible" | "night"] ?? s;
}

function fmtFood(s: string) {
  return ({ veg: "Veg", non_veg: "Non-veg", eggetarian: "Eggetarian", jain: "Jain" } as Record<string, string>)[s] ?? s;
}

function compatBlurb(me: ReturnType<typeof selectMyProfile> | null | undefined, them: ReturnType<typeof selectMyProfile>) {
  if (!me || !them) return "Set your profile to see what overlaps.";
  const overlaps: string[] = [];
  if (me.sleepSchedule === them.sleepSchedule) overlaps.push(fmtSleep(me.sleepSchedule).toLowerCase());
  if (me.foodPref === them.foodPref) overlaps.push(fmtFood(me.foodPref).toLowerCase());
  if (me.acPref === them.acPref) overlaps.push(`${me.acPref}-AC`);
  if (overlaps.length === 0) return "You differ on most lifestyle dims — chat it out.";
  return `You both: ${overlaps.join(", ")}.`;
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / 86_400_000));
  return days === 1 ? "1 day" : `${days} days`;
}

// Per-axis labels for the compatibility breakdown card. Order matches §3.4.
const AXES = [
  { key: "sleep" as const, label: "Sleep" },
  { key: "food" as const, label: "Food" },
  { key: "clean" as const, label: "Cleanliness" },
  { key: "smoke" as const, label: "Smoking" },
  { key: "drink" as const, label: "Drinking" },
  { key: "noise" as const, label: "Noise tol." },
  { key: "social" as const, label: "Social" },
];
