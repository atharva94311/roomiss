"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { Button } from "@/components/ui/Button";
import { I } from "@/components/ui/Icons";
import { RM, hallTheme } from "@/lib/tokens";
import { useRoomiss } from "@/lib/store";
import { MobileShell } from "@/components/layout/MobileShell";

export default function Landing() {
  const router = useRouter();
  const loginAsGuestUser = useRoomiss((s) => s.loginAsGuestUser);
  const loginAsGuestAdmin = useRoomiss((s) => s.loginAsGuestAdmin);
  // `pending` is per-button so the OTHER button stays interactive while one
  // is mid-request. Surfaced as button-disabled + label swap.
  const [pending, setPending] = useState<null | "user" | "admin">(null);

  const onUser = async () => {
    if (pending) return;
    setPending("user");
    const r = await loginAsGuestUser();
    setPending(null);
    if (r.ok) router.push("/browse");
    else useRoomiss.setState({ lastError: r.error ?? "Sign-in failed" });
  };
  const onAdmin = async () => {
    if (pending) return;
    setPending("admin");
    const r = await loginAsGuestAdmin();
    setPending(null);
    if (r.ok) router.push("/admin");
    else useRoomiss.setState({ lastError: r.error ?? "Sign-in failed" });
  };
  return (
    <MobileShell dark>
      <div className="px-6 pt-5 flex justify-between items-center">
        <Wordmark size={22} color="#F7F2E9" />
        <span
          className="font-mono"
          style={{ fontSize: 11, color: "rgba(247,242,233,0.5)", letterSpacing: 0.5 }}
        >
          IIT KGP &middot; 2026
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        <div className="mb-9">
          <h1
            className="font-serif"
            style={{
              fontSize: 60,
              fontWeight: 400,
              letterSpacing: -1.5,
              color: "#F7F2E9",
              margin: 0,
              lineHeight: 0.96,
            }}
          >
            find
            <br />
            your three.
            <br />
            <span style={{ color: RM.snvh, fontStyle: "italic" }}>or four.</span>
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 16,
              lineHeight: 1.45,
              color: "rgba(247,242,233,0.7)",
              maxWidth: 320,
            }}
          >
            Roommate groups for LBS &amp; SNVH freshers. Verified IDs. No rando spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {([hallTheme("LBS"), hallTheme("SNVH")] as const).map((t) => (
            <div
              key={t.key}
              style={{
                borderRadius: 14,
                padding: "14px 14px 16px",
                background: `linear-gradient(160deg, ${t.accent}33 0%, ${t.accent}11 100%)`,
                border: `1px solid ${t.accent}55`,
              }}
            >
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 10.5,
                  color: t.accent,
                  letterSpacing: 0.6,
                }}
              >
                {t.shortName}
              </div>
              <div
                className="font-serif"
                style={{
                  fontSize: 22,
                  color: "#F7F2E9",
                  marginTop: 6,
                  lineHeight: 1.05,
                }}
              >
                {t.gender}
                <br />
                <span style={{ opacity: 0.6, fontSize: 14 }}>{t.groupSize}-up rooms</span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mb-3"
          style={{
            padding: 14,
            borderRadius: 14,
            background: "rgba(247,242,233,0.05)",
            border: "1px solid rgba(247,242,233,0.1)",
          }}
        >
          <div className="font-mono uppercase mb-2" style={{ fontSize: 10, letterSpacing: 0.6, color: "rgba(247,242,233,0.5)" }}>
            How it works
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", color: "rgba(247,242,233,0.85)", fontSize: 13.5, lineHeight: 1.55 }}>
            <li>1. Verify your slip with a real human admin.</li>
            <li>2. Browse other verified freshers in your hall.</li>
            <li>3. Mutually match → chat → form your group → lock.</li>
          </ol>
        </div>
      </div>

      <div className="px-5 pb-4 flex flex-col gap-2.5">
        <div
          className="font-mono uppercase text-center mb-1"
          style={{ fontSize: 10, letterSpacing: 1, color: "rgba(247,242,233,0.45)" }}
        >
          Demo · pick a guest role
        </div>
        <Button
          variant="primary"
          size="lg"
          full
          style={{ background: "#F7F2E9", color: RM.ink, opacity: pending === "user" ? 0.7 : 1 }}
          onClick={onUser}
          disabled={pending !== null}
        >
          {pending === "user" ? "Signing in…" : <>Continue as fresher &nbsp;{I.arrow}</>}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          full
          style={{ borderColor: "rgba(247,242,233,0.4)", color: "#F7F2E9", opacity: pending === "admin" ? 0.7 : 1 }}
          onClick={onAdmin}
          disabled={pending !== null}
        >
          {pending === "admin" ? "Signing in…" : "Continue as admin"}
        </Button>
        <div className="text-center mt-2" style={{ fontSize: 12, color: "rgba(247,242,233,0.5)", lineHeight: 1.5 }}>
          The real product onboards via slip review by an admin — no passwords.
          <br />
          <Link href="/login" style={{ color: "#F7F2E9", textDecoration: "underline" }}>
            Pick a different seed user
          </Link>
          {" · "}
          <Link href="/signup" style={{ color: "#F7F2E9", textDecoration: "underline" }}>
            Walk the onboarding flow
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
