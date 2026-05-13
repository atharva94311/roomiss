"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { StatusPill } from "@/components/ui/Pills";
import { I } from "@/components/ui/Icons";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";
import { useEffect, useState } from "react";

export default function VerifyPendingPage() {
  const router = useRouter();
  const me = useRoomiss((s) => s.users[s.meId]);
  const myVerification = useRoomiss((s) =>
    [...s.pendingVerifications].reverse().find((v) => v.userId === s.meId),
  );
  const hydrate = useRoomiss((s) => s.hydrate);
  const demoMode = useRoomiss((s) => s.platform.demoMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && me?.verificationStatus === "verified") {
      router.push("/onboarding/profile");
    }
  }, [hydrated, me?.verificationStatus, router]);

  return (
    <MobileShell>
      <div className="px-6 py-3 flex items-center justify-between">
        <Wordmark size={20} />
        <Link href="/login" className="text-sm" style={{ color: RM.ink3 }}>
          Sign out
        </Link>
      </div>

      <div className="flex-1 px-6 pt-7 flex flex-col items-center text-center">
        <div className="relative mb-5" style={{ width: 88, height: 88 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 44,
              background: "#F8EBC8",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: 44,
              border: `2.5px solid ${RM.warn}`,
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
              transform: "rotate(-30deg)",
              animation: "spin 2.4s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              color: "#8A6516",
            }}
          >
            {I.shield}
          </div>
        </div>

        <StatusPill tone="pending">Pending review</StatusPill>
        <h2
          className="font-serif"
          style={{
            fontSize: 32,
            margin: "14px 0 8px",
            letterSpacing: -0.5,
            lineHeight: 1.1,
          }}
        >
          Hang tight, {(myVerification?.name || "fresher").split(" ")[0]}.
        </h2>
        <p style={{ fontSize: 14.5, color: RM.ink2, lineHeight: 1.5, maxWidth: 320 }}>
          A roomiss admin is reviewing your slip. You&rsquo;ll get an email + push the moment
          you&rsquo;re in. Usually 4&ndash;12 hours.
        </p>

        <div
          className="w-full mt-7 p-4 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          {[
            { label: "Slip uploaded", t: "Just now", done: true },
            { label: "Roll# matched against allotment list", t: "Auto-checked", done: true },
            { label: "Admin review", t: "In queue · position ~14", current: true },
            { label: "Profile unlocked", t: "Then you can browse.", done: false },
          ].map((s, i, arr) => (
            <div
              key={i}
              className="flex gap-3 relative"
              style={{ paddingBottom: i === arr.length - 1 ? 0 : 18 }}
            >
              {i < arr.length - 1 && (
                <div
                  className="absolute"
                  style={{
                    left: 9,
                    top: 22,
                    bottom: -2,
                    width: 1,
                    background: s.done ? RM.lbs : RM.hairline2,
                  }}
                />
              )}
              <div
                className="flex items-center justify-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  flexShrink: 0,
                  background: s.done ? RM.lbs : "transparent",
                  border: `2px solid ${s.done ? RM.lbs : s.current ? RM.warn : RM.hairline2}`,
                  color: "#fff",
                  marginTop: 2,
                }}
              >
                {s.done && (
                  <svg width="9" height="9" viewBox="0 0 9 9">
                    <path
                      d="M1 4l2.5 2.5L8 1.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {s.current && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: RM.warn,
                    }}
                  />
                )}
              </div>
              <div className="flex-1 text-left">
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: s.done || s.current ? RM.ink : RM.ink3,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 12, color: RM.ink3, marginTop: 2 }}>{s.t}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center" style={{ fontSize: 13, color: RM.ink3 }}>
          While you wait —{" "}
          <Link href="/onboarding/profile" style={{ color: RM.ink, textDecoration: "underline", fontWeight: 500 }}>
            complete your profile
          </Link>
          .
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <Button variant="soft" hall="LBS" full onClick={() => router.push("/onboarding/profile")}>
          Open profile draft
        </Button>
        {myVerification && demoMode && (
          <Button
            variant="ghost"
            full
            onClick={async () => {
              const { supabase } = await import("@/lib/supabase/client");
              const { error } = await supabase.rpc("demo_self_approve_verification");
              if (error) alert(`Approval failed: ${error.message}`);
              await hydrate();
            }}
          >
            (Demo: simulate admin approval)
          </Button>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(330deg); } }`}</style>
    </MobileShell>
  );
}
