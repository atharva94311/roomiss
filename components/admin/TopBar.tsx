"use client";

import { I } from "@/components/ui/Icons";
import { RM } from "@/lib/tokens";

export function AdminTopBar({ title, sub }: { title: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3"
      style={{ borderBottom: `1px solid ${RM.hairline}`, background: RM.bg, flexShrink: 0 }}
    >
      <div>
        <h1
          className="font-serif"
          style={{ fontSize: 26, letterSpacing: -0.5, margin: 0, lineHeight: 1.1 }}
        >
          {title}
        </h1>
        {sub && (
          <div
            className="font-mono mt-1"
            style={{ fontSize: 12.5, color: RM.ink3, letterSpacing: 0.2 }}
          >
            {sub}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg"
          style={{
            background: RM.surface,
            boxShadow: `0 0 0 1px ${RM.hairline}`,
            color: RM.ink3,
            fontSize: 12.5,
            width: 240,
          }}
        >
          <span>{I.search}</span>
          Search by name, roll, ID…
          <span
            className="ml-auto font-mono"
            style={{
              fontSize: 10,
              padding: "1px 5px",
              background: "rgba(0,0,0,0.06)",
              borderRadius: 3,
            }}
          >
            ⌘K
          </span>
        </div>
        <button
          className="font-medium"
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: "none",
            background: RM.ink,
            color: RM.bg,
            fontSize: 13,
          }}
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
