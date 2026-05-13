"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { Avatar } from "@/components/ui/Avatar";
import { HallPill } from "@/components/ui/Pills";
import { I } from "@/components/ui/Icons";
import { useRoomiss } from "@/lib/store";
import { RM, hallTheme } from "@/lib/tokens";

export default function LoginPage() {
  const router = useRouter();
  const loginAsGuestUser = useRoomiss((s) => s.loginAsGuestUser);
  const loginAsGuestAdmin = useRoomiss((s) => s.loginAsGuestAdmin);
  const loginAsSeedUser = useRoomiss((s) => s.loginAsSeedUser);
  const [showSwitcher, setShowSwitcher] = useState(false);
  // `pending` holds the identifier of the button mid-request: "user", "admin",
  // or the seed user's email. Other buttons stay clickable.
  const [pending, setPending] = useState<string | null>(null);

  // Pre-baked demo accounts (so the picker works pre-auth, before hydrate).
  const seedDirectory: Array<{ email: string; name: string; hall: "LBS" | "SNVH"; branch: string }> = [
    { email: "vikram@iitkgp.ac.in",   name: "Vikram Reddy",   hall: "LBS",  branch: "EE"  },
    { email: "rohan@iitkgp.ac.in",    name: "Rohan Iyer",     hall: "LBS",  branch: "ME"  },
    { email: "karthik@iitkgp.ac.in",  name: "Karthik Raman",  hall: "LBS",  branch: "EC"  },
    { email: "pratyush@iitkgp.ac.in", name: "Pratyush Singh", hall: "LBS",  branch: "CSE" },
    { email: "ananya@iitkgp.ac.in",   name: "Ananya Sharma",  hall: "SNVH", branch: "CSE" },
    { email: "priya@iitkgp.ac.in",    name: "Priya Verma",    hall: "SNVH", branch: "BT"  },
    { email: "tanvi@iitkgp.ac.in",    name: "Tanvi Khanna",   hall: "SNVH", branch: "EE"  },
    { email: "meera@iitkgp.ac.in",    name: "Meera Iyengar",  hall: "SNVH", branch: "MA"  },
  ];

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
    <MobileShell>
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-[var(--color-ink-2)] text-sm">
          &larr; Back
        </Link>
        <Wordmark size={18} />
        <span style={{ width: 24 }} />
      </div>

      <div className="flex-1 px-6 pb-6">
        <h2
          className="font-serif"
          style={{ fontSize: 32, margin: "16px 0 6px", letterSpacing: -0.6, lineHeight: 1.05 }}
        >
          Pick how you&rsquo;re here
        </h2>
        <p style={{ marginTop: 8, fontSize: 14, color: RM.ink2, lineHeight: 1.5 }}>
          The real product onboards freshers via slip review by a human admin — no passwords. For
          this preview, jump in as a guest below.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={onUser}
            disabled={pending !== null}
            className="text-left p-4 rounded-2xl flex items-center gap-3.5"
            style={{
              background: RM.surface,
              border: `1.5px solid ${RM.lbs}`,
              boxShadow: `0 6px 24px ${RM.lbs}22`,
              opacity: pending && pending !== "user" ? 0.5 : 1,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: RM.lbsSoft,
                color: RM.lbsInk,
              }}
            >
              {I.user}
            </div>
            <div className="flex-1">
              <div className="font-serif" style={{ fontSize: 18, letterSpacing: -0.3 }}>
                {pending === "user" ? "Signing in…" : "Continue as fresher"}
              </div>
              <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 2 }}>
                Sign in as Aarav (LBS, verified). 2 incoming requests waiting.
              </div>
            </div>
            <span style={{ color: RM.ink3 }}>›</span>
          </button>

          <button
            type="button"
            onClick={onAdmin}
            disabled={pending !== null}
            className="text-left p-4 rounded-2xl flex items-center gap-3.5"
            style={{
              background: RM.surface,
              border: `1.5px solid ${RM.ink}`,
              boxShadow: "0 6px 24px rgba(27,26,23,0.18)",
              opacity: pending && pending !== "admin" ? 0.5 : 1,
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: RM.ink,
                color: RM.bg,
              }}
            >
              {I.shield}
            </div>
            <div className="flex-1">
              <div className="font-serif" style={{ fontSize: 18, letterSpacing: -0.3 }}>
                {pending === "admin" ? "Signing in…" : "Continue as admin"}
              </div>
              <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 2 }}>
                Warden console. Verifications, reports, audit log.
              </div>
            </div>
            <span style={{ color: RM.ink3 }}>›</span>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowSwitcher((v) => !v)}
            className="w-full text-left text-sm flex items-center justify-between py-2"
            style={{ color: RM.ink3 }}
          >
            <span>Or sign in as a different seed fresher</span>
            <span style={{ transform: showSwitcher ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
          </button>
          {showSwitcher && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {seedDirectory.map((u) => {
                const t = hallTheme(u.hall);
                return (
                  <button
                    key={u.email}
                    type="button"
                    onClick={async () => {
                      if (pending) return;
                      setPending(u.email);
                      const r = await loginAsSeedUser(u.email);
                      setPending(null);
                      if (r.ok) router.push("/browse");
                      else useRoomiss.setState({ lastError: r.error ?? "Sign-in failed" });
                    }}
                    disabled={pending !== null}
                    className="text-left p-3 rounded-xl flex items-center gap-2.5"
                    style={{
                      background: RM.surface,
                      border: `1px solid ${RM.hairline2}`,
                      opacity: pending && pending !== u.email ? 0.5 : 1,
                      cursor: pending ? "not-allowed" : "pointer",
                    }}
                  >
                    <Avatar name={u.name} hall={u.hall} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate" style={{ fontSize: 13 }}>
                        {u.name.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 10.5, color: t.deep }}>
                        {u.branch} · {u.hall}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-7 p-4 rounded-2xl" style={{ background: RM.surface2 }}>
          <div
            className="font-mono uppercase mb-2"
            style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
          >
            Want the full onboarding flow?
          </div>
          <p className="text-sm mb-3" style={{ color: RM.ink2, lineHeight: 1.5 }}>
            Walk through slip upload, verification pending, profile wizard, then matching.
          </p>
          <Link href="/signup">
            <Button variant="secondary" size="sm">
              Walk the new-user flow →
            </Button>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
