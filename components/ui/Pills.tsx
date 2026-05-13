import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

export function HallPill({ hall = "LBS", size = "sm" }: { hall?: Hall; size?: "sm" | "md" }) {
  const t = hallTheme(hall);
  const px = size === "sm" ? 5 : 7;
  const fz = size === "sm" ? 10.5 : 11.5;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono uppercase rounded-full"
      style={{
        padding: `${px}px 8px`,
        background: t.soft,
        color: t.deep,
        fontSize: fz,
        fontWeight: 500,
        letterSpacing: 0.4,
        lineHeight: 1,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 5, background: t.accent }} />
      {t.shortName}
    </span>
  );
}

export type Tone = "neutral" | "pending" | "verified" | "locked" | "danger";

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: "rgba(27,26,23,0.06)", fg: RM.ink2, dot: RM.ink3 },
  pending: { bg: "#F8EBC8", fg: "#8A6516", dot: "#C99843" },
  verified: { bg: "#E1EBD3", fg: "#3F5827", dot: "#5C7A3F" },
  locked: { bg: "#1B1A17", fg: "#F7F2E9", dot: "#F7F2E9" },
  danger: { bg: "#F4DCD2", fg: "#7A2D17", dot: "#9B4029" },
};

export function StatusPill({
  tone = "neutral",
  children,
  dot = true,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  const c = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono uppercase rounded-full"
      style={{
        padding: "5px 10px",
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.4,
        lineHeight: 1,
      }}
    >
      {dot && <span style={{ width: 5, height: 5, borderRadius: 5, background: c.dot }} />}
      {children}
    </span>
  );
}
