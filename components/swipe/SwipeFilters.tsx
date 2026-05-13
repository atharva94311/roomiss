"use client";

import { RM } from "@/lib/tokens";
import type { SwipeFilters as SF } from "@/lib/types";

interface Props {
  value: SF;
  onChange: (partial: Partial<SF>) => void;
  /** Open the existing filter drawer for branch/sleep/food/etc. */
  onOpenDrawer: () => void;
  hasExtraFilters?: boolean;
}

export function SwipeFilters({ value, onChange, onOpenDrawer, hasExtraFilters }: Props) {
  return (
    <div className="px-4 pb-3 flex gap-2 overflow-x-auto scroll-row">
      <Toggle on={value.onlySolos} onClick={() => onChange({ onlySolos: !value.onlySolos })}>
        Only solos
      </Toggle>
      <Toggle on={value.lookingForOne} onClick={() => onChange({ lookingForOne: !value.lookingForOne })}>
        Looking for 1 more
      </Toggle>
      <Toggle on={value.activeLast7d} onClick={() => onChange({ activeLast7d: !value.activeLast7d })}>
        Active last 7d
      </Toggle>
      <span style={{ color: RM.hairline2, alignSelf: "center" }}>|</span>
      <Toggle on={!!hasExtraFilters} onClick={onOpenDrawer}>
        + More filters
      </Toggle>
    </div>
  );
}

function Toggle({
  children,
  on,
  onClick,
}: {
  children: React.ReactNode;
  on?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="font-mono"
      style={{
        fontSize: 11.5,
        letterSpacing: 0.3,
        padding: "7px 12px",
        borderRadius: 999,
        background: on ? RM.ink : RM.surface,
        color: on ? RM.bg : RM.ink2,
        border: on ? "1px solid transparent" : `1px solid ${RM.hairline}`,
        whiteSpace: "nowrap",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
