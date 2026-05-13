import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";

const AVATAR_TONES = ["#E8D2C0", "#EFD8C8", "#E5C8B5", "#F1DAC8", "#E0D0BE"];

export function Avatar({
  name = "A",
  hall = "LBS",
  size = 44,
  ring = false,
  className,
}: {
  name?: string;
  hall?: Hall;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const t = hallTheme(hall);
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: `linear-gradient(135deg, ${tone} 0%, ${t.soft} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: RM.serif,
        fontStyle: "italic",
        fontSize: size * 0.42,
        color: t.deep,
        boxShadow: ring ? `0 0 0 2px ${RM.bg}, 0 0 0 4px ${t.accent}` : "none",
      }}
    >
      {initials}
    </div>
  );
}
