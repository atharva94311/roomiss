"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { supabase } from "@/lib/supabase/client";
import { RM } from "@/lib/tokens";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true); setError(null);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <MobileShell>
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/login" style={{ color: RM.ink2, fontSize: 14 }}>← Back</Link>
        <Wordmark size={18} />
        <span style={{ width: 24 }} />
      </div>
      <div className="flex-1 px-6 pt-4 pb-6 flex flex-col">
        <h2 className="font-serif" style={{ fontSize: 30, letterSpacing: -0.6, lineHeight: 1.1 }}>
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm" style={{ color: RM.ink2, lineHeight: 1.5 }}>
          Enter the email you signed up with — we&rsquo;ll send a reset link.
        </p>

        {sent ? (
          <div
            className="mt-6 p-4 rounded-2xl"
            style={{ background: RM.surface, border: `1px solid ${RM.hairline2}` }}
          >
            <div className="font-serif" style={{ fontSize: 18, letterSpacing: -0.3 }}>
              Check your inbox.
            </div>
            <p className="mt-1 text-sm" style={{ color: RM.ink2, lineHeight: 1.5 }}>
              We&rsquo;ve sent a reset link to <b>{email}</b>. The link is good for 1 hour.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <label className="font-mono uppercase" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@iitkgp.ac.in"
              className="outline-none"
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: RM.surface,
                border: `1.5px solid ${RM.hairline2}`,
                fontSize: 15,
              }}
            />
            {error && (
              <div style={{ fontSize: 13, color: RM.bad }}>{error}</div>
            )}
            <Button variant="primary" size="lg" full>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="flex-1" />

        <div
          className="text-center"
          style={{ fontSize: 13, color: RM.ink3 }}
        >
          Remember it now?{" "}
          <Link href="/login" style={{ color: RM.ink, textDecoration: "underline" }}>
            Sign in
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
