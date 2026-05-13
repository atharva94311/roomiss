import { RM } from "@/lib/tokens";

export function Wordmark({ size = 28, color = RM.ink }: { size?: number; color?: string }) {
  return (
    <span
      className="font-serif italic leading-none"
      style={{ fontSize: size, color, letterSpacing: -0.5 }}
    >
      roomiss<span style={{ color: RM.lbs }}>.</span>
    </span>
  );
}

export function Logomark({ size = 28, color = RM.ink }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M4 22V14a6 6 0 0 1 12 0v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 22V14a6 6 0 0 1 12 0v8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="22" r="1.4" fill={color} />
    </svg>
  );
}
