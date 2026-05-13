"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { I } from "@/components/ui/Icons";
import { useRoomiss } from "@/lib/store";
import { uploadSlip } from "@/lib/supabase/upload";
import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

export default function VerificationPage() {
  const router = useRouter();
  const submit = useRoomiss((s) => s.submitVerification);
  const [legalName, setLegalName] = useState("");
  const [jeeRoll, setJeeRoll] = useState("");
  const [admissionRoll, setAdmissionRoll] = useState("");
  const [hall, setHall] = useState<Hall>("LBS");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!legalName || !jeeRoll || !admissionRoll || !slipFile) {
      setError("All fields and a slip upload are required.");
      return;
    }
    if (!agree) {
      setError("Please confirm the slip belongs to you.");
      return;
    }
    setBusy(true);
    try {
      const { path } = await uploadSlip(slipFile);
      const r = await submit({
        jeeRoll, admissionRoll, hallClaimed: hall, slipName: path, legalName,
      });
      if (!r.ok) {
        setError(humanizeError(r.error));
        setBusy(false);
        return;
      }
      router.push("/verify/pending");
    } catch (e: unknown) {
      setError(humanizeError(e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  };

  return (
    <MobileShell>
      <div className="px-6 py-3 flex items-center justify-between">
        <Link href="/signup" className="text-[var(--color-ink-2)] text-sm">
          &larr; Back
        </Link>
        <span className="font-mono" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
          STEP 2 / 3
        </span>
      </div>

      <form onSubmit={onSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-6 pb-6">
          <h2
            className="font-serif"
            style={{ fontSize: 32, margin: "16px 0 6px", letterSpacing: -0.6, lineHeight: 1.05 }}
          >
            Verify you&rsquo;re a fresher
          </h2>
          <p style={{ marginTop: 8, fontSize: 14, color: RM.ink2, lineHeight: 1.4 }}>
            We&rsquo;ll match this against the institute&rsquo;s allotment list. A human reviews each upload.
          </p>

          <div className="mt-6 flex flex-col gap-3.5">
            <Field label="Legal name (matches slip)" value={legalName} onChange={setLegalName} placeholder="Aarav Mehta" />
            <Field label="JEE roll number" value={jeeRoll} onChange={setJeeRoll} placeholder="JEE-2400412" mono />
            <Field label="Admission roll number" value={admissionRoll} onChange={setAdmissionRoll} placeholder="ADM-114" mono />

            <div>
              <label
                className="font-mono uppercase block"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Allotted hall
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(["LBS", "SNVH"] as Hall[]).map((h) => {
                  const t = hallTheme(h);
                  const sel = h === hall;
                  return (
                    <button
                      type="button"
                      key={h}
                      onClick={() => setHall(h)}
                      style={{
                        textAlign: "left",
                        borderRadius: 14,
                        padding: "14px",
                        background: sel ? t.soft : RM.surface,
                        border: `1.5px solid ${sel ? t.accent : RM.hairline2}`,
                        position: "relative",
                        cursor: "pointer",
                      }}
                    >
                      <div className="font-mono" style={{ fontSize: 10, color: t.accent, letterSpacing: 0.6 }}>
                        {h}
                      </div>
                      <div className="font-serif" style={{ fontSize: 18, marginTop: 4, color: t.deep, lineHeight: 1.1 }}>
                        {t.gender}
                        <br />
                        <span style={{ fontSize: 12, fontFamily: RM.sans, color: RM.ink2 }}>
                          {t.groupSize}-up rooms
                        </span>
                      </div>
                      {sel && (
                        <div className="absolute" style={{ top: 10, right: 10, color: t.accent }}>
                          {I.check}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                className="font-mono uppercase block"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Hall allotment slip (PDF / JPG / PNG · max 10 MB)
              </label>
              <label
                className="mt-2 flex items-center gap-3.5 cursor-pointer"
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: RM.surface,
                  border: `1.5px dashed ${RM.hairline2}`,
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)}
                />
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 56,
                    borderRadius: 6,
                    flexShrink: 0,
                    background: RM.lbsSoft,
                    color: RM.lbs,
                  }}
                >
                  {I.doc}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>
                    {slipFile?.name || "Tap to choose your slip"}
                  </div>
                  <div className="font-mono" style={{ fontSize: 12, color: RM.ink3, marginTop: 3 }}>
                    {slipFile
                      ? `${(slipFile.size / 1024).toFixed(0)} KB · ${slipFile.type || "file"}`
                      : "We never share your slip."}
                  </div>
                </div>
                {slipFile && <span style={{ color: RM.good }}>{I.check}</span>}
              </label>
            </div>

            <label className="flex items-start gap-2.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: RM.ink2, lineHeight: 1.45 }}>
                This slip belongs to me. I agree to admin review and to the community guidelines.
              </span>
            </label>

            {error && (
              <div className="rounded-xl p-3 text-sm" style={{ background: "#F4DCD2", color: "#7A2D17" }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div
          className="px-5 py-3"
          style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
        >
          <Button type="submit" variant="primary" size="lg" full>
            {busy ? "Uploading…" : "Submit for review"}
          </Button>
          <p
            className="text-center mt-2.5"
            style={{ fontSize: 11.5, color: RM.ink3, lineHeight: 1.4 }}
          >
            Reviewed within 24h. Limit: 1 submission / 6h, 3 attempts.
          </p>
        </div>
      </form>
    </MobileShell>
  );
}

function humanizeError(raw?: string): string {
  if (!raw) return "Something went wrong. Try again.";
  if (raw.includes("rate_limited_6h"))
    return "You can only submit once every 6 hours — please wait and try again.";
  if (raw.includes("slip_too_large"))
    return "Slip is larger than 10 MB. Try a smaller export.";
  if (raw.includes("slip_wrong_type"))
    return "Slips must be PDF, JPG, or PNG.";
  if (raw.toLowerCase().includes("network"))
    return "Network hiccup — check your connection and try again.";
  return raw;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
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
          fontFamily: mono ? RM.mono : RM.sans,
        }}
      />
    </label>
  );
}
