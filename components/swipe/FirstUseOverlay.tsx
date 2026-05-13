"use client";

import { useEffect, useState } from "react";
import { RM } from "@/lib/tokens";

const KEY = "roomiss-swipe-onboarded-v1";

/**
 * One-time tip overlay shown the first time a user enters swipe mode. Dismisses
 * on Got it (or anywhere outside) and persists via localStorage.
 */
export function FirstUseOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  if (!open) return null;
  const dismiss = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-[480px] rounded-t-3xl p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
        style={{ background: RM.bg }}
      >
        <div className="flex justify-center pt-1 pb-3">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: RM.hairline2 }} />
        </div>
        <h3
          className="font-serif"
          style={{ fontSize: 24, letterSpacing: -0.4, lineHeight: 1.1 }}
        >
          Three things to know
        </h3>
        <p style={{ marginTop: 6, fontSize: 13.5, color: RM.ink2, lineHeight: 1.5 }}>
          Swipe mode is the same matchmaking as Feed view — just one card at a time.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Tip
            icon="↔"
            title="Drag right to request · left to pass"
            body="Right-swipe sends a roommate request. They see it in their inbox and either match with you or pass."
          />
          <Tip
            icon="⌨"
            title="Or use ← / → on a keyboard"
            body="Faster on laptops. ⌘Z (or Backspace) undoes the last swipe — request auto-withdraws."
          />
          <Tip
            icon="👁"
            title="Tap a card to see the full profile"
            body="Bio, languages, lifestyle grid — slides up from the bottom. You can swipe right from there too."
          />
        </div>

        <button
          onClick={dismiss}
          className="w-full mt-5"
          style={{
            background: RM.ink,
            color: RM.bg,
            padding: "13px 16px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function Tip({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 36, height: 36, borderRadius: 12,
          background: RM.surface, border: `1px solid ${RM.hairline2}`,
          fontSize: 18, color: RM.ink2,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: RM.ink2, lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}
