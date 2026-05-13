"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { SwipeCard, type SwipeItem } from "./SwipeCard";
import { RM, hallTheme } from "@/lib/tokens";
import type { SwipeDecision } from "@/lib/types";

interface Props {
  items: SwipeItem[];
  onSwipe: (item: SwipeItem, decision: SwipeDecision) => void;
  onTap?: (item: SwipeItem) => void;
  onUndo?: () => void;
  canUndo: boolean;
  /** Optional empty-state CTA — e.g. "Switch to Feed view". */
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

const SWIPE_THRESHOLD = 120; // px
const FLY_OFF = 800; // px destination for fly-out

/**
 * SwipeDeck — stack of cards with drag/tap/keyboard interaction.
 * - Drag past 120px commits the swipe (right = like, left = pass)
 * - Tap (no drag) calls onTap to open the profile sheet
 * - Keyboard ←/→ act like swipes; ⌘Z / Backspace undoes
 * - Action bar at the bottom: pass · undo · info · like
 */
export function SwipeDeck({
  items,
  onSwipe,
  onTap,
  onUndo,
  canUndo,
  onEmptyAction,
  emptyActionLabel,
}: Props) {
  // Stack: visible top card + up to 2 cards behind for depth.
  const queue = items.slice(0, 3);
  const top = queue[0];

  // The top card's drag motion — single shared MotionValue we reset after each commit.
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const passOpacity = useTransform(x, [-160, -40], [1, 0]);
  // Disable interactions briefly during the fly-off so a second swipe can't double-fire.
  const [busy, setBusy] = useState(false);
  const draggedRef = useRef(false);

  // Reset x whenever the top card identity changes so the new card starts centered.
  useEffect(() => {
    x.set(0);
  }, [top?.key, x]);

  const fly = (dir: 1 | -1, decision: SwipeDecision) => {
    if (!top || busy) return;
    setBusy(true);
    animate(x, dir * FLY_OFF, {
      type: "spring",
      stiffness: 180,
      damping: 22,
      onComplete: () => {
        onSwipe(top, decision);
        // The items prop will shrink; useEffect above will reset x to 0.
        setBusy(false);
      },
    });
  };

  const onDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      fly(1, "like");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      fly(-1, "pass");
    } else {
      // Spring back to center
      animate(x, 0, { type: "spring", stiffness: 320, damping: 30 });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs / textareas
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        fly(1, "like");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        fly(-1, "pass");
      } else if ((e.key === "z" && (e.metaKey || e.ctrlKey)) || e.key === "Backspace") {
        if (canUndo && onUndo) {
          e.preventDefault();
          onUndo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Empty state
  if (!top) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            background: RM.surface,
            border: `1.5px dashed ${RM.hairline2}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            marginBottom: 18,
          }}
        >
          🎉
        </div>
        <h3 className="font-serif" style={{ fontSize: 28, letterSpacing: -0.5, marginBottom: 6 }}>
          That&rsquo;s everyone for now.
        </h3>
        <p style={{ fontSize: 14, color: RM.ink2, maxWidth: 280, lineHeight: 1.5 }}>
          You&rsquo;ve seen every fresher who matches your filters. Try the Feed view to revisit, or
          come back when more freshers verify.
        </p>
        <div className="flex gap-2.5 mt-5">
          {canUndo && onUndo && (
            <button
              onClick={onUndo}
              className="px-4 py-2.5 rounded-xl font-medium"
              style={{
                background: RM.surface,
                border: `1.5px solid ${RM.ink}`,
                color: RM.ink,
                fontSize: 13.5,
              }}
            >
              Undo last
            </button>
          )}
          {onEmptyAction && emptyActionLabel && (
            <button
              onClick={onEmptyAction}
              className="px-4 py-2.5 rounded-xl font-medium"
              style={{ background: RM.ink, color: RM.bg, fontSize: 13.5 }}
            >
              {emptyActionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Card stack */}
      <div
        className="relative mx-auto w-full"
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          maxWidth: 420,
          padding: "8px 16px 0",
        }}
      >
        <div className="relative w-full h-full">
          {/* Depth cards (static, behind top) */}
          {queue
            .slice(1)
            .reverse()
            .map((item, revIdx) => {
              const depth = queue.length - 1 - revIdx; // 1 = closer behind, 2 = deeper
              return (
                <div
                  key={item.key}
                  className="absolute inset-0"
                  style={{
                    transform: `scale(${1 - depth * 0.045}) translateY(${depth * 12}px)`,
                    opacity: 1 - depth * 0.25,
                    pointerEvents: "none",
                    transition: "transform 0.18s, opacity 0.18s",
                  }}
                >
                  <SwipeCard item={item} />
                </div>
              );
            })}

          {/* Top card (draggable) */}
          <motion.div
            key={top.key}
            className="absolute inset-0"
            drag={busy ? false : "x"}
            dragSnapToOrigin={false}
            dragConstraints={{ left: -FLY_OFF, right: FLY_OFF, top: 0, bottom: 0 }}
            dragElastic={1}
            style={{ x, rotate, zIndex: 3, touchAction: "pan-y", cursor: "grab" }}
            onPointerDown={() => {
              draggedRef.current = false;
            }}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onDragEnd={onDragEnd}
            onTap={() => {
              if (!draggedRef.current && onTap) onTap(top);
            }}
          >
            {/* REQUEST overlay (right side, fades in as you drag right) */}
            <motion.div
              className="absolute top-12 left-6 z-10 pointer-events-none font-mono uppercase"
              style={{
                opacity: likeOpacity,
                color: RM.good,
                border: `3px solid ${RM.good}`,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 22,
                letterSpacing: 2,
                fontWeight: 700,
                transform: "rotate(-12deg)",
                background: "rgba(255,255,255,0.92)",
              }}
            >
              Request
            </motion.div>
            {/* PASS overlay */}
            <motion.div
              className="absolute top-12 right-6 z-10 pointer-events-none font-mono uppercase"
              style={{
                opacity: passOpacity,
                color: RM.bad,
                border: `3px solid ${RM.bad}`,
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 22,
                letterSpacing: 2,
                fontWeight: 700,
                transform: "rotate(12deg)",
                background: "rgba(255,255,255,0.92)",
              }}
            >
              Pass
            </motion.div>

            <SwipeCard item={top} />
          </motion.div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-center gap-4 px-4 pt-3 pb-5 flex-shrink-0">
        <ActionBtn
          ariaLabel="Pass"
          onClick={() => fly(-1, "pass")}
          color={RM.bad}
          background={RM.surface}
          size={52}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 5l12 12M17 5L5 17" />
          </svg>
        </ActionBtn>
        <ActionBtn
          ariaLabel="Undo"
          onClick={onUndo}
          disabled={!canUndo}
          color={RM.ink2}
          background={RM.surface}
          size={44}
        >
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h11a5 5 0 1 1 0 10H8" />
            <path d="M4 8l4-4M4 8l4 4" />
          </svg>
        </ActionBtn>
        <ActionBtn
          ariaLabel="View details"
          onClick={() => top && onTap?.(top)}
          color={hallTheme(top.hall).deep}
          background={hallTheme(top.hall).soft}
          size={44}
        >
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M11 7v0M11 10v5" />
          </svg>
        </ActionBtn>
        <ActionBtn
          ariaLabel="Send request"
          onClick={() => fly(1, "like")}
          color="#fff"
          background={RM.good}
          size={52}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 18S3 13 3 8a4 4 0 0 1 8-2.6A4 4 0 0 1 19 8c0 5-8 10-8 10z" />
          </svg>
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  ariaLabel,
  color,
  background,
  size,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  color: string;
  background: string;
  size: number;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background,
        color,
        border: `1.5px solid ${RM.hairline2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(27,26,23,0.10)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
