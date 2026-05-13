"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { supabase } from "@/lib/supabase/client";
import { RM } from "@/lib/tokens";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  // The /reset-password URL is opened from the reset-link email. Supabase
  // exchanges the code in the URL hash for a session as soon as the page
  // loads (detectSessionInUrl is on in the client config).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasRecoverySession(!!data.session);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 1800);
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
          Set a new password
        </h2>

        {hasRecoverySession === false && (
          <p className="mt-3 text-sm" style={{ color: RM.bad, lineHeight: 1.5 }}>
            This link is invalid or expired. Request a new one from{" "}
            <Link href="/forgot-password" style={{ textDecoration: "underline" }}>
              forgot password
            </Link>.
          </p>
        )}

        {done ? (
          <div
            className="mt-6 p-4 rounded-2xl"
            style={{ background: RM.surface, border: `1px solid ${RM.hairline2}` }}
          >
            <div className="font-serif" style={{ fontSize: 18, letterSpacing: -0.3 }}>
              All set.
            </div>
            <p className="mt-1 text-sm" style={{ color: RM.ink2, lineHeight: 1.5 }}>
              Redirecting to sign in…
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <label className="font-mono uppercase" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
              New password
            </label>
            <input
              type="password" value={pw} required autoComplete="new-password"
              onChange={(e) => setPw(e.target.value)}
              className="outline-none"
              style={{ padding: "12px 14px", borderRadius: 12, background: RM.surface, border: `1.5px solid ${RM.hairline2}`, fontSize: 15 }}
            />
            <label className="font-mono uppercase mt-1" style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}>
              Confirm
            </label>
            <input
              type="password" value={confirm} required autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              className="outline-none"
              style={{ padding: "12px 14px", borderRadius: 12, background: RM.surface, border: `1.5px solid ${RM.hairline2}`, fontSize: 15 }}
            />
            {error && <div style={{ fontSize: 13, color: RM.bad }}>{error}</div>}
            <Button variant="primary" size="lg" full>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </MobileShell>
  );
}
