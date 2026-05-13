import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

export function CompatRing({
  score = 82,
  size = 44,
  hall = "LBS",
}: {
  score?: number;
  size?: number;
  hall?: Hall;
}) {
  const t = hallTheme(hall);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={RM.hairline} strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t.accent}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: RM.mono,
          fontSize: size * 0.28,
          color: RM.ink,
          fontWeight: 500,
          letterSpacing: -0.3,
        }}
      >
        {score}
      </div>
    </div>
  );
}
