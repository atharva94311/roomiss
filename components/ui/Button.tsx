"use client";

import { RM, hallTheme } from "@/lib/tokens";
import type { Hall } from "@/lib/types";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  hall?: Hall;
  full?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { children, variant = "primary", size = "md", hall, full, icon, style, ...rest },
  ref,
) {
  const t = hall ? hallTheme(hall) : null;
  let bg: string, fg: string, border: string;
  switch (variant) {
    case "primary":
      bg = t ? t.accent : RM.ink;
      fg = t ? "#fff" : RM.bg;
      border = "transparent";
      break;
    case "secondary":
      bg = "transparent";
      fg = RM.ink;
      border = RM.ink;
      break;
    case "ghost":
      bg = "transparent";
      fg = RM.ink2;
      border = "transparent";
      break;
    case "soft":
      bg = t ? t.soft : "rgba(27,26,23,0.06)";
      fg = t ? t.deep : RM.ink;
      border = "transparent";
      break;
    case "danger":
      bg = "transparent";
      fg = RM.bad;
      border = RM.bad;
      break;
  }
  const sizing = {
    sm: { fz: 13, py: "8px", px: "14px" },
    md: { fz: 14.5, py: "12px", px: "20px" },
    lg: { fz: 15.5, py: "15px", px: "24px" },
  }[size];
  return (
    <button
      ref={ref}
      style={{
        width: full ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: `${sizing.py} ${sizing.px}`,
        borderRadius: 12,
        background: bg,
        color: fg,
        border: `1.5px solid ${border}`,
        fontFamily: RM.sans,
        fontSize: sizing.fz,
        fontWeight: 500,
        letterSpacing: -0.1,
        cursor: "pointer",
        lineHeight: 1.2,
        transition: "filter 0.15s, transform 0.06s",
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.985)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
