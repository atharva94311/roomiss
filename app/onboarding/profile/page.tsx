"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";
import { BRANCHES, LANGUAGES, HOBBY_SUGGESTIONS, STATES } from "@/lib/tokens";
import { uploadAvatar } from "@/lib/supabase/upload";
import { SoloCard } from "@/components/cards/SoloCard";
import type { Hall } from "@/lib/types";
import type { Profile } from "@/lib/types";

const STEPS = ["Identity", "Origin", "Lifestyle", "Habits", "About", "Preview"] as const;

const DRAFT_KEY = "roomiss-wizard-draft";
const STEP_KEY = "roomiss-wizard-step";

export default function ProfileWizard() {
  const router = useRouter();
  const myProfile = useRoomiss((s) => s.profiles[s.meId]);
  const save = useRoomiss((s) => s.saveProfile);
  const me = useRoomiss((s) => s.users[s.meId]);
  const meId = useRoomiss((s) => s.meId);

  // Restore draft + step from localStorage if a prior session was abandoned
  // before the wizard finished. Falls back to the server-side profile (if any),
  // and then to defaults. The "draft owner" is keyed by user id so switching
  // accounts doesn't bleed.
  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = localStorage.getItem(STEP_KEY);
    return raw ? Math.max(0, Math.min(STEPS.length - 1, Number(raw) || 0)) : 0;
  });

  const [draft, setDraft] = useState<Partial<Profile>>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { ownerId?: string; data?: Partial<Profile> };
          if (parsed.ownerId === meId && parsed.data) return parsed.data;
        }
      } catch {
        // ignore corrupt drafts
      }
    }
    return (
      myProfile ?? {
      legalName: "",
      displayName: "",
      branch: "CSE",
      hometownCity: "",
      hometownState: "MH",
      languages: [],
      sleepSchedule: "flexible",
      studyHabits: "hybrid",
      cleanliness: "average",
      socialScore: 3,
      foodPref: "veg",
      smoking: "never",
      drinking: "never",
      noiseTolerance: "medium",
      acPref: "either",
      hobbies: [],
      bio: "",
      privacyHidePhoto: true,
      privacyHideInsta: true,
      privacyHideLastActive: false,
    }
    );
  });

  // Persist draft + step on every change. Debounced via a single timer.
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ownerId: meId, data: draft }));
        localStorage.setItem(STEP_KEY, String(step));
      } catch {
        // quota or private-mode → silently drop
      }
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [draft, step, meId]);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const canNext = (() => {
    switch (step) {
      case 0:
        return !!draft.displayName && !!draft.legalName && !!draft.branch;
      case 1:
        return !!draft.hometownCity && !!draft.hometownState && (draft.languages?.length ?? 0) > 0;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return (draft.bio ?? "").length > 10 && (draft.hobbies?.length ?? 0) > 0;
      case 5: // Preview
        return true;
    }
    return true;
  })();

  const onNext = async () => {
    // Save partial progress each step (server is the source of truth).
    await save(draft);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Final step (Preview) finished → clear the local draft cache.
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(STEP_KEY);
    }
    if (me?.verificationStatus === "verified") router.push("/browse");
    else router.push("/verify/pending");
  };

  return (
    <MobileShell>
      <div className="px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="text-[var(--color-ink-2)] text-sm"
        >
          &larr; Back
        </button>
        <Wordmark size={18} />
        <span className="font-mono" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <div className="px-6 mt-2">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                height: 4,
                borderRadius: 2,
                background: i <= step ? RM.lbs : RM.hairline,
              }}
            />
          ))}
        </div>
        <h1
          className="font-serif"
          style={{ fontSize: 28, margin: "16px 0 4px", letterSpacing: -0.5, lineHeight: 1.05 }}
        >
          {STEPS[step]}
        </h1>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {step === 0 && (
          <div className="flex flex-col gap-4 mt-4">
            <AvatarUploader
              value={draft.primaryPhotoUrl}
              onUploaded={(url) => set("primaryPhotoUrl", url)}
            />
            <Field
              label="Display name (publicly visible)"
              value={draft.displayName ?? ""}
              onChange={(v) => set("displayName", v)}
            />
            <Field
              label="Legal name (matches slip — never shown publicly)"
              value={draft.legalName ?? ""}
              onChange={(v) => set("legalName", v)}
            />
            <Selector
              label="Branch"
              value={draft.branch ?? "CSE"}
              options={BRANCHES.map((b) => ({ label: b, value: b }))}
              onChange={(v) => set("branch", v)}
            />
            <Field
              label="Instagram handle (optional)"
              value={draft.instagramHandle ?? ""}
              onChange={(v) => set("instagramHandle", v)}
              placeholder="@yourhandle"
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4 mt-4">
            <Field
              label="Hometown city"
              value={draft.hometownCity ?? ""}
              onChange={(v) => set("hometownCity", v)}
            />
            <Selector
              label="State"
              value={draft.hometownState ?? "MH"}
              options={STATES.map((s) => ({ label: s, value: s }))}
              onChange={(v) => set("hometownState", v)}
            />
            <MultiSelect
              label="Languages spoken"
              values={draft.languages ?? []}
              options={LANGUAGES}
              onChange={(v) => set("languages", v)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 mt-4">
            <Choice
              label="Sleep schedule"
              value={draft.sleepSchedule ?? "flexible"}
              options={[
                { label: "Early bird", value: "early" },
                { label: "Flexible", value: "flexible" },
                { label: "Night owl", value: "night" },
              ]}
              onChange={(v) => set("sleepSchedule", v as Profile["sleepSchedule"])}
            />
            <Choice
              label="Study habits"
              value={draft.studyHabits ?? "hybrid"}
              options={[
                { label: "In-room", value: "in_room" },
                { label: "Library", value: "library" },
                { label: "Hybrid", value: "hybrid" },
              ]}
              onChange={(v) => set("studyHabits", v as Profile["studyHabits"])}
            />
            <Choice
              label="Cleanliness"
              value={draft.cleanliness ?? "average"}
              options={[
                { label: "Tidy", value: "tidy" },
                { label: "Average", value: "average" },
                { label: "Messy", value: "messy" },
              ]}
              onChange={(v) => set("cleanliness", v as Profile["cleanliness"])}
            />
            <NumberSlider
              label={`Social score: ${draft.socialScore ?? 3}/5`}
              value={draft.socialScore ?? 3}
              onChange={(v) => set("socialScore", v)}
            />
            <Choice
              label="Noise tolerance"
              value={draft.noiseTolerance ?? "medium"}
              options={[
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
              ]}
              onChange={(v) => set("noiseTolerance", v as Profile["noiseTolerance"])}
            />
            <Choice
              label="AC room preference"
              value={draft.acPref ?? "either"}
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" },
                { label: "Either", value: "either" },
              ]}
              onChange={(v) => set("acPref", v as Profile["acPref"])}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 mt-4">
            <Choice
              label="Food"
              value={draft.foodPref ?? "veg"}
              options={[
                { label: "Veg", value: "veg" },
                { label: "Non-veg", value: "non_veg" },
                { label: "Eggetarian", value: "eggetarian" },
                { label: "Jain", value: "jain" },
              ]}
              onChange={(v) => set("foodPref", v as Profile["foodPref"])}
            />
            <Choice
              label="Smoking"
              value={draft.smoking ?? "never"}
              options={[
                { label: "Never", value: "never" },
                { label: "Rarely", value: "rarely" },
                { label: "Regularly", value: "regularly" },
              ]}
              onChange={(v) => set("smoking", v as Profile["smoking"])}
            />
            <Choice
              label="Drinking"
              value={draft.drinking ?? "never"}
              options={[
                { label: "Never", value: "never" },
                { label: "Rarely", value: "rarely" },
                { label: "Regularly", value: "regularly" },
              ]}
              onChange={(v) => set("drinking", v as Profile["drinking"])}
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4 mt-4">
            <div>
              <label
                className="font-mono uppercase block mb-2"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Bio (max 500 chars)
              </label>
              <textarea
                value={draft.bio ?? ""}
                onChange={(e) => set("bio", e.target.value.slice(0, 500))}
                placeholder="Sleep schedule, energy level, dealbreakers, why you'd be a great roommate."
                rows={5}
                className="outline-none w-full"
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: RM.surface,
                  border: `1.5px solid ${RM.hairline2}`,
                  fontSize: 14.5,
                  resize: "none",
                  fontFamily: RM.sans,
                }}
              />
              <div className="text-right text-xs mt-1" style={{ color: RM.ink3 }}>
                {(draft.bio ?? "").length}/500
              </div>
            </div>
            <MultiSelect
              label="Hobbies & interests"
              values={draft.hobbies ?? []}
              options={HOBBY_SUGGESTIONS}
              onChange={(v) => set("hobbies", v)}
            />
            <Toggle
              label="Hide my photo until mutual match"
              value={draft.privacyHidePhoto ?? true}
              onChange={(v) => set("privacyHidePhoto", v)}
            />
            <Toggle
              label="Hide my Instagram handle except in same group"
              value={draft.privacyHideInsta ?? true}
              onChange={(v) => set("privacyHideInsta", v)}
            />
            <Toggle
              label="Hide last-active indicator"
              value={draft.privacyHideLastActive ?? false}
              onChange={(v) => set("privacyHideLastActive", v)}
            />
          </div>
        )}

        {step === 5 && <PreviewStep draft={draft} hall={me?.hall ?? "LBS"} />}
      </div>

      <div
        className="px-5 py-3"
        style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
      >
        <Button onClick={onNext} variant="primary" size="lg" full disabled={!canNext}>
          {step < STEPS.length - 1 ? "Save & continue" : "Finish"}
        </Button>
      </div>
    </MobileShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="font-mono uppercase"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none"
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: RM.surface,
          border: `1.5px solid ${RM.hairline2}`,
          fontSize: 15,
        }}
      />
    </label>
  );
}

function Selector({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="font-mono uppercase"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none"
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: RM.surface,
          border: `1.5px solid ${RM.hairline2}`,
          fontSize: 15,
          appearance: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div
        className="font-mono uppercase mb-2"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const sel = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                background: sel ? RM.ink : RM.surface,
                color: sel ? RM.bg : RM.ink,
                border: `1.5px solid ${sel ? RM.ink : RM.hairline}`,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o));
    else onChange([...values, o]);
  };
  return (
    <div>
      <div
        className="font-mono uppercase mb-2"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label} <span style={{ color: RM.ink3 }}>({values.length} selected)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const sel = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: sel ? RM.ink : RM.surface,
                color: sel ? RM.bg : RM.ink,
                border: `1.5px solid ${sel ? RM.ink : RM.hairline}`,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumberSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        className="font-mono uppercase mb-2"
        style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
      >
        {label}
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span style={{ fontSize: 14, color: RM.ink2 }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 24,
          borderRadius: 999,
          background: value ? RM.lbs : RM.hairline2,
          position: "relative",
          transition: "background 0.15s",
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
            transition: "left 0.15s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </label>
  );
}

function AvatarUploader({
  value,
  onUploaded,
}: {
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const { publicUrl } = await uploadAvatar(file);
      if (publicUrl) onUploaded(publicUrl);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "upload failed");
    }
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono uppercase" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
        Profile photo
      </span>
      <label
        className="cursor-pointer flex items-center gap-4 p-3 rounded-2xl"
        style={{ background: RM.surface, border: `1.5px dashed ${RM.hairline2}` }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: 16, flexShrink: 0,
            background: value
              ? `url(${value}) center/cover`
              : `linear-gradient(135deg, #EFE4D2 0%, #E0D0BE 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: RM.ink3, fontSize: 28,
          }}
        >
          {!value && "+"}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>
            {busy ? "Uploading…" : value ? "Replace photo" : "Add a photo"}
          </div>
          <div className="font-mono" style={{ fontSize: 11.5, color: RM.ink3, marginTop: 2 }}>
            JPG, PNG, or WebP · max 5 MB
          </div>
          {err && <div className="text-xs mt-1" style={{ color: RM.bad }}>{err}</div>}
        </div>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPick} />
      </label>
    </div>
  );
}

/**
 * Final wizard step — shows peers exactly how the user's solo card will look
 * in Discover, plus a checklist of what still won't be visible until certain
 * actions happen.
 */
function PreviewStep({ draft, hall }: { draft: Partial<Profile>; hall: Hall }) {
  // SoloCard expects a full Profile. Fill in safe defaults for any missing
  // fields so the preview renders even mid-wizard.
  const preview: Profile = {
    userId: "preview",
    legalName: draft.legalName ?? "",
    displayName: draft.displayName ?? "You",
    branch: draft.branch ?? "CSE",
    hometownCity: draft.hometownCity ?? "",
    hometownState: draft.hometownState ?? "",
    languages: draft.languages ?? [],
    sleepSchedule: draft.sleepSchedule ?? "flexible",
    studyHabits: draft.studyHabits ?? "hybrid",
    cleanliness: draft.cleanliness ?? "average",
    socialScore: draft.socialScore ?? 3,
    foodPref: draft.foodPref ?? "veg",
    smoking: draft.smoking ?? "never",
    drinking: draft.drinking ?? "never",
    noiseTolerance: draft.noiseTolerance ?? "medium",
    acPref: draft.acPref ?? "either",
    hobbies: draft.hobbies ?? [],
    bio: draft.bio ?? "",
    instagramHandle: draft.instagramHandle,
    privacyHidePhoto: draft.privacyHidePhoto ?? true,
    privacyHideInsta: draft.privacyHideInsta ?? true,
    privacyHideLastActive: draft.privacyHideLastActive ?? false,
    primaryPhotoUrl: draft.primaryPhotoUrl,
    secondaryPhotoUrls: draft.secondaryPhotoUrls ?? [],
    completeness: draft.completeness ?? 75,
    updatedAt: new Date().toISOString(),
  };
  return (
    <div className="flex flex-col gap-4 mt-4">
      <p style={{ fontSize: 14, color: RM.ink2, lineHeight: 1.5 }}>
        This is how peers in {hall} will see your card in Discover. Tap Finish to publish — you
        can edit anything later from <b>Settings → Edit profile</b>.
      </p>
      <div className="grid grid-cols-2 gap-2.5 max-w-[360px]">
        <SoloCard profile={preview} score={87} hall={hall} />
      </div>
      <div
        className="p-4 rounded-2xl"
        style={{ background: RM.surface2, border: `1px solid ${RM.hairline2}` }}
      >
        <div
          className="font-mono uppercase mb-2"
          style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
        >
          What's gated until someone matches with you
        </div>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: RM.ink2, lineHeight: 1.7, margin: 0 }}>
          {preview.privacyHidePhoto && <li>Your photo (visible after mutual match)</li>}
          {preview.privacyHideInsta && preview.instagramHandle && (
            <li>Your Instagram handle (visible to group members only)</li>
          )}
          {preview.privacyHideLastActive && <li>Your last-active indicator</li>}
          <li>Your legal name, JEE roll, and slip — admins only</li>
        </ul>
      </div>
    </div>
  );
}
