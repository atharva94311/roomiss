import { hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";
import type { CSSProperties } from "react";

export function PhotoSlot({
  ratio = "4/5",
  hall,
  label,
  style,
}: {
  ratio?: string;
  hall?: Hall;
  label?: string;
  style?: CSSProperties;
}) {
  const t = hall ? hallTheme(hall) : null;
  return (
    <div
      style={{
        aspectRatio: ratio === "auto" ? undefined : ratio,
        borderRadius: 14,
        background: t
          ? `linear-gradient(135deg, ${t.soft} 0%, #E8D8C8 100%)`
          : "linear-gradient(135deg, #EFE4D2 0%, #E0D0BE 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        color: "rgba(27,26,23,0.4)",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        backgroundImage:
          "repeating-linear-gradient(135deg, transparent 0 14px, rgba(27,26,23,0.04) 14px 15px)",
        ...style,
      }}
    >
      {label || ""}
    </div>
  );
}
