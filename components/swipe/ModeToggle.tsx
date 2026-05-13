"use client";

import { RM } from "@/lib/tokens";
import type { ViewMode } from "@/lib/types";

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/** Segmented Feed/Swipe toggle pinned at the top of /browse. */
export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Discovery mode"
      className="inline-flex p-1 rounded-full"
      style={{
        background: "rgba(27,26,23,0.06)",
        border: `1px solid ${RM.hairline}`,
      }}
    >
      <Seg active={value === "feed"} onClick={() => onChange("feed")} icon={<FeedIcon />}>
        Feed
      </Seg>
      <Seg active={value === "swipe"} onClick={() => onChange("swipe")} icon={<SwipeIcon />}>
        Swipe
      </Seg>
    </div>
  );
}

function Seg({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="font-mono uppercase flex items-center gap-1.5"
      style={{
        fontSize: 11,
        letterSpacing: 0.4,
        padding: "7px 13px",
        borderRadius: 999,
        background: active ? RM.surface : "transparent",
        color: active ? RM.ink : RM.ink3,
        boxShadow: active ? "0 1px 3px rgba(27,26,23,0.12)" : "none",
        fontWeight: active ? 600 : 500,
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <span style={{ width: 14, height: 14, display: "inline-flex" }}>{icon}</span>
      {children}
    </button>
  );
}

function FeedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="4.5" height="4.5" rx="1" />
      <rect x="7.5" y="2" width="4.5" height="4.5" rx="1" />
      <rect x="2" y="7.5" width="4.5" height="4.5" rx="1" />
      <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" />
    </svg>
  );
}

function SwipeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="2.5" width="7" height="9" rx="1.3" />
      <path d="M11.5 5.5l1.2-.7M2.5 5.5l-1.2-.7" />
    </svg>
  );
}
