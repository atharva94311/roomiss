"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { TabBar } from "@/components/layout/TabBar";
import { useRoomiss, selectMyHall } from "@/lib/store";
import { RM } from "@/lib/tokens";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useRoomiss((s) => s.users[s.meId]);
  const meId = useRoomiss((s) => s.meId);
  const hydrated = useRoomiss((s) => s.hydrated);
  const hall = useRoomiss(selectMyHall);

  useEffect(() => {
    if (!hydrated) return; // wait for AuthProvider to finish
    if (meId === "guest" || !me) {
      router.replace("/login");
      return;
    }
    if (me.verificationStatus !== "verified") {
      if (me.verificationStatus === "unverified") router.replace("/onboarding/verification");
      else router.replace("/verify/pending");
    }
  }, [hydrated, meId, me, router]);

  // Pre-hydration: render a quiet loading state instead of flashing the empty UI.
  if (!hydrated) {
    return (
      <MobileShell>
        <div
          className="flex-1 flex items-center justify-center"
          style={{ color: RM.ink3, fontFamily: RM.mono, fontSize: 12, letterSpacing: 0.4 }}
        >
          loading…
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <TabBar hall={hall} />
    </MobileShell>
  );
}
