import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";
import type { CSSProperties, ReactNode } from "react";

export function Card({
  children,
  hall,
  padded = true,
  hairline = true,
  style,
  className,
}: {
  children: ReactNode;
  hall?: Hall;
  padded?: boolean;
  hairline?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const t = hall ? hallTheme(hall) : null;
  return (
    <div
      className={className}
      style={{
        background: RM.surface,
        borderRadius: 18,
        borderLeft: t ? `3px solid ${t.accent}` : "none",
        boxShadow: hairline ? `0 0 0 1px ${RM.hairline}` : "none",
        padding: padded ? 16 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
