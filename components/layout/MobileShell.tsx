"use client";

import type { ReactNode } from "react";
import { RM } from "@/lib/tokens";

/**
 * Phone-shaped viewport container. On mobile (< 720px) it just fills the
 * screen edge-to-edge. On wider viewports we render an inset frame so
 * desktop users don't see a tiny column floating on cream — it visually
 * reads as "this is a phone app preview".
 */
export function MobileShell({
  children,
  dark = false,
  edges = true,
  noScroll = false,
}: {
  children: ReactNode;
  dark?: boolean;
  edges?: boolean;
  noScroll?: boolean;
}) {
  const baseBg = dark ? RM.ink : RM.bg;
  return (
    <>
      {/* Desktop backdrop only renders ≥720px via media query */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background:
            "radial-gradient(circle at 30% 20%, #ece5d6 0%, #d8cdb6 70%)",
          display: "none",
        }}
        className="roomiss-desktop-bg"
      />
      <div
        className="mx-auto roomiss-mobile-shell"
        style={{
          maxWidth: 480,
          minHeight: "100dvh",
          background: baseBg,
          color: dark ? "#fff" : RM.ink,
          paddingTop: edges ? "env(safe-area-inset-top, 12px)" : 0,
          paddingBottom: edges ? "env(safe-area-inset-bottom, 12px)" : 0,
          display: "flex",
          flexDirection: "column",
          overflow: noScroll ? "hidden" : "visible",
          position: "relative",
        }}
      >
        {children}
      </div>
      <style jsx>{`
        @media (min-width: 720px) {
          :global(.roomiss-desktop-bg) {
            display: block !important;
          }
          :global(.roomiss-mobile-shell) {
            min-height: 844px !important;
            max-height: 96dvh !important;
            margin-top: 2vh !important;
            margin-bottom: 2vh !important;
            border-radius: 36px !important;
            box-shadow:
              0 40px 80px rgba(0, 0, 0, 0.22),
              0 0 0 8px ${dark ? "#0a0a0a" : "#1B1A17"},
              0 0 0 9px rgba(0, 0, 0, 0.06);
            overflow: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
