"use client";

import { RM } from "@/lib/tokens";

/**
 * Pulsing rectangle for loading states. Matches the brand cream rather than
 * a stock gray shimmer.
 */
export function Skeleton({
  width,
  height = 14,
  radius = 6,
  className,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`roomiss-skeleton ${className ?? ""}`}
      style={{
        display: "inline-block",
        width: width ?? "100%",
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${RM.surface} 0%, ${RM.surface2} 50%, ${RM.surface} 100%)`,
        backgroundSize: "200% 100%",
        animation: "roomiss-skeleton-shimmer 1.4s ease-in-out infinite",
        ...style,
      }}
    >
      <style jsx>{`
        @keyframes roomiss-skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </span>
  );
}

/**
 * Single-card placeholder matching SoloCard dimensions, used while /browse
 * waits for hydrate.
 */
export function SoloCardSkeleton() {
  return (
    <div
      style={{
        background: RM.surface,
        borderRadius: 18,
        boxShadow: `0 0 0 1px ${RM.hairline}`,
        overflow: "hidden",
        padding: 12,
      }}
    >
      <Skeleton height={180} radius={12} />
      <div className="mt-3 space-y-2">
        <Skeleton width="60%" height={18} />
        <Skeleton width="40%" height={13} />
        <div className="flex gap-1.5 mt-2">
          <Skeleton width={48} height={20} radius={999} />
          <Skeleton width={44} height={20} radius={999} />
          <Skeleton width={60} height={20} radius={999} />
        </div>
      </div>
    </div>
  );
}
