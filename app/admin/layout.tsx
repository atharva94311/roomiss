"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";
import { useEffect } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◇" },
  { href: "/admin/verifications", label: "Verification", icon: "✓" },
  { href: "/admin/moderation", label: "Reports", icon: "⚠" },
  { href: "/admin/groups", label: "Groups", icon: "◐" },
  { href: "/admin/users", label: "Users", icon: "○" },
  { href: "/admin/audit", label: "Audit log", icon: "≡" },
  { href: "/admin/settings", label: "Settings", icon: "✸" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const asAdmin = useRoomiss((s) => s.asAdmin);
  const hydrated = useRoomiss((s) => s.hydrated);
  const meId = useRoomiss((s) => s.meId);
  const meProfile = useRoomiss((s) => s.profiles[s.meId]);
  const pendingCount = useRoomiss((s) => s.pendingVerifications.filter((v) => v.status === "pending").length);
  const reportCount = useRoomiss((s) => Object.values(s.reports).filter((r) => r.status === "open").length);
  const groupCount = useRoomiss((s) => Object.values(s.groups).filter((g) => g.status !== "dissolved").length);
  const demoMode = useRoomiss((s) => s.platform.demoMode);

  // Gate access: must be signed-in admin/verifier.
  useEffect(() => {
    if (!hydrated) return;
    if (meId === "guest") router.replace("/login");
    else if (!asAdmin) router.replace("/browse");
  }, [hydrated, meId, asAdmin, router]);

  const counts: Record<string, number> = {
    "/admin/verifications": pendingCount,
    "/admin/moderation": reportCount,
    "/admin/groups": groupCount,
  };

  return (
    <div className="flex min-h-dvh" style={{ background: RM.bg }}>
      <aside
        className="flex flex-col gap-1 p-3.5"
        style={{
          width: 220,
          flexShrink: 0,
          background: "#0F0E0C",
          color: "#EFE9DD",
        }}
      >
        <div className="flex items-center gap-2 px-2 pt-1 pb-4">
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${RM.lbs} 50%, ${RM.snvh} 50%)`,
            }}
          />
          <div>
            <div className="font-serif" style={{ fontSize: 17, letterSpacing: -0.3, lineHeight: 1 }}>
              roomiss
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 9.5, opacity: 0.5, letterSpacing: 1 }}
            >
              ADMIN
            </div>
          </div>
        </div>
        {NAV.map((item) => {
          const on = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const n = counts[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5"
              style={{
                padding: "9px 10px",
                borderRadius: 8,
                background: on ? "rgba(196,106,72,0.18)" : "transparent",
                color: on ? "#fff" : "rgba(239,233,221,0.7)",
                borderLeft: on ? `2px solid ${RM.lbs}` : "2px solid transparent",
                fontSize: 13.5,
              }}
            >
              <span className="font-mono" style={{ width: 14, opacity: 0.6 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {n != null && n > 0 && (
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.1)",
                  }}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
        <div className="flex-1" />
        {/* Live platform-state callout — demo-mode warning is the most
            important admin reminder; clicking jumps to /admin/settings. */}
        <Link
          href="/admin/settings"
          className="p-3 rounded-lg mb-2 block"
          style={{
            background: demoMode ? "rgba(196,106,72,0.18)" : "rgba(255,255,255,0.04)",
            border: demoMode ? `1px solid ${RM.lbs}` : "1px solid transparent",
            color: "inherit", textDecoration: "none",
          }}
        >
          <div
            className="font-mono mb-1"
            style={{ fontSize: 9.5, opacity: 0.6, letterSpacing: 0.6 }}
          >
            PLATFORM
          </div>
          <div className="flex items-center justify-between gap-2">
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>
              {demoMode ? "Demo mode ON" : "Production"}
            </span>
            <span
              style={{
                width: 8, height: 8, borderRadius: 4,
                background: demoMode ? RM.lbs : "#34c759",
              }}
            />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 9.5, opacity: 0.55, letterSpacing: 0.3, marginTop: 3 }}
          >
            {demoMode ? "self-approve enabled" : "all gates live"}
          </div>
        </Link>
        <div className="flex items-center gap-2 p-2 text-xs">
          <Avatar name={meProfile?.displayName ?? "Admin"} size={28} />
          <div className="min-w-0">
            <div className="font-medium truncate">{meProfile?.displayName ?? "Admin"}</div>
            <div className="font-mono" style={{ fontSize: 10, opacity: 0.5 }}>
              {meProfile?.branch ?? "Warden console"}
            </div>
          </div>
        </div>
        <Link href="/" className="text-xs underline" style={{ color: "rgba(239,233,221,0.5)", padding: "4px 8px" }}>
          ← Exit admin
        </Link>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
