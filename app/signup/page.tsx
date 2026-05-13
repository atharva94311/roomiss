"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";

export default function SignupPage() {
  const router = useRouter();
  const signup = useRoomiss((s) => s.signup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  // Pending state so the user sees the click registered — previously the
  // Continue button looked unresponsive during the network round-trip.
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    if (!email.endsWith("@iitkgp.ac.in")) {
      setError("Please use your @iitkgp.ac.in email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!consent) {
      setError("Please accept the privacy policy + terms before continuing.");
      return;
    }
    setError("");
    setPending(true);
    const r = await signup(email, password);
    setPending(false);
    if (!r.ok) {
      const msg = r.error ?? "Sign-up failed";
      // Show inline (so it's visible even if Toast was missed) AND push to
      // the global error channel so the brand Toast also surfaces it.
      setError(msg);
      useRoomiss.setState({ lastError: msg });
      return;
    }
    // Email confirmation is OFF in Supabase project defaults — user is signed
    // in immediately. AuthProvider will hydrate, then onboarding takes over.
    router.push("/onboarding/verification");
  };

  return (
    <MobileShell>
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[var(--color-ink-2)] text-sm">
          &larr; Back
        </Link>
        <Wordmark size={18} />
        <span className="font-mono" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
          STEP 1 / 3
        </span>
      </div>
      <div className="flex-1 px-6 pb-6">
        <h2
          className="font-serif"
          style={{ fontSize: 32, margin: "16px 0 6px", letterSpacing: -0.6, lineHeight: 1.05 }}
        >
          Make your account
        </h2>
        <p style={{ marginTop: 8, fontSize: 14, color: RM.ink2, lineHeight: 1.4 }}>
          Use your institute email. We&rsquo;ll verify it after slip approval.
        </p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
          <Field
            label="IIT KGP email"
            value={email}
            onChange={setEmail}
            placeholder="you@iitkgp.ac.in"
            type="email"
          />
          <Field
            label="Password (8+ chars)"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            type="password"
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            type="password"
          />
          {/* DPDPA consent — must be explicit before account creation */}
          <label className="flex items-start gap-2.5 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span style={{ fontSize: 12.5, color: RM.ink2, lineHeight: 1.5 }}>
              I&rsquo;ve read and accept the{" "}
              <Link href="/privacy" target="_blank" style={{ textDecoration: "underline" }}>
                privacy policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" target="_blank" style={{ textDecoration: "underline" }}>
                terms of service
              </Link>
              . I consent to processing of my profile, slip, and chat data for the purpose of
              matching me with roommates.
            </span>
          </label>
          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: "#F4DCD2", color: "#7A2D17" }}
            >
              {error}
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            full
            disabled={pending}
            style={{ opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Creating account…" : "Continue"}
          </Button>
          <p
            className="text-center mt-2 text-[var(--color-ink-3)]"
            style={{ fontSize: 12, lineHeight: 1.4 }}
          >
            By continuing you agree to roomiss&rsquo;s community guidelines and the
            <br />
            DPDPA-compliant data handling policy.
          </p>
        </form>
      </div>
    </MobileShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
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
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="outline-none focus:ring-2"
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: RM.surface,
          border: `1.5px solid ${RM.hairline2}`,
          fontSize: 15,
          fontFamily: mono ? RM.mono : RM.sans,
          color: RM.ink,
        }}
      />
    </label>
  );
}
