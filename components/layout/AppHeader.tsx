"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/ui/Wordmark";
import { HallPill } from "@/components/ui/Pills";
import { I } from "@/components/ui/Icons";
import { RM, hallTheme } from "@/lib/tokens";
import { useRoomiss } from "@/lib/store";
import type { Hall } from "@/lib/types";
import type { ReactNode } from "react";

export function AppHeader({
  hall = "LBS",
  title,
  sub,
  right,
}: {
  hall?: Hall;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  const t = hallTheme(hall);
  const router = useRouter();
  const unread = useRoomiss((s) => s.notifications.filter((n) => n.userId === s.meId && !n.readAt).length);
  const logout = useRoomiss((s) => s.logout);
  const asAdmin = useRoomiss((s) => s.asAdmin);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the kebab menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <div className="px-5 pb-3 pt-2" style={{ background: RM.bg }}>
      <div className="flex items-center justify-between">
        <Wordmark size={20} />
        <div className="flex items-center gap-2.5">
          <HallPill hall={hall} />
          <Link
            href="/notifications"
            className="relative text-[var(--color-ink-2)]"
            aria-label="Notifications"
          >
            {I.bell}
            {unread > 0 && (
              <span
                className="absolute"
                style={{
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: t.accent,
                  border: `1.5px solid ${RM.bg}`,
                }}
              />
            )}
          </Link>
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              style={{
                background: "transparent",
                border: "none",
                padding: 4,
                color: RM.ink2,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ⋮
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute z-20"
                style={{
                  top: 28,
                  right: 0,
                  minWidth: 180,
                  background: RM.surface,
                  borderRadius: 12,
                  padding: 4,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
                }}
              >
                <MenuItem onClick={() => { setMenuOpen(false); router.push("/me"); }}>
                  You · group
                </MenuItem>
                <MenuItem onClick={() => { setMenuOpen(false); router.push("/settings"); }}>
                  Settings
                </MenuItem>
                <MenuItem onClick={() => { setMenuOpen(false); router.push("/privacy"); }}>
                  Privacy & export
                </MenuItem>
                {asAdmin && (
                  <MenuItem onClick={() => { setMenuOpen(false); router.push("/admin"); }}>
                    Admin console
                  </MenuItem>
                )}
                <div style={{ borderTop: `1px solid ${RM.hairline}`, margin: "4px 0" }} />
                <MenuItem
                  danger
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.push("/login");
                  }}
                >
                  Sign out everywhere
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
      <h1
        className="font-serif"
        style={{
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: -0.5,
          margin: "14px 0 0",
          lineHeight: 1,
        }}
      >
        {title}
      </h1>
      {sub && <div className="mt-1 text-[13px] text-[var(--color-ink-3)]">{sub}</div>}
      {right}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: "9px 12px",
        textAlign: "left",
        background: "transparent",
        border: "none",
        borderRadius: 6,
        fontSize: 13.5,
        fontWeight: 500,
        color: danger ? RM.bad : RM.ink,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(27,26,23,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
