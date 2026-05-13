"use client";

import { Avatar } from "@/components/ui/Avatar";
import { CompatRing } from "@/components/ui/CompatRing";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { RM, hallTheme } from "@/lib/tokens";
import type { Group, Hall, Profile } from "@/lib/types";

/** Discriminated input for the deck. */
export type SwipeItem =
  | { kind: "user"; key: string; profile: Profile; score: number; hall: Hall }
  | { kind: "group"; key: string; group: Group; members: Profile[]; score: number; hall: Hall };

interface Props {
  item: SwipeItem;
  /** Optional active-since label like "active 2h ago". */
  activeLabel?: string;
}

/**
 * SwipeCard — single profile card body. Same materials as the brand
 * cards but laid out as a tall full-bleed phone card. Renders both solo
 * and partial-group items.
 */
export function SwipeCard({ item, activeLabel }: Props) {
  const t = hallTheme(item.hall);

  return (
    <div
      className="w-full h-full flex flex-col select-none"
      style={{
        background: RM.surface,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: `0 24px 60px rgba(27,26,23,0.18), 0 0 0 1px ${RM.hairline2}`,
        borderLeft: `4px solid ${t.accent}`,
      }}
    >
      {/* Photo / hero zone */}
      <div className="relative" style={{ flex: "1 1 auto", minHeight: 0 }}>
        {item.kind === "user" ? (
          <PhotoSlot
            ratio="auto"
            hall={item.hall}
            label="profile photo"
            style={{ width: "100%", height: "100%", borderRadius: 0, aspectRatio: "unset" }}
          />
        ) : (
          <div
            className="w-full h-full relative"
            style={{
              background: `linear-gradient(135deg, ${t.soft} 0%, #F0E4D2 100%)`,
              backgroundImage: `repeating-linear-gradient(135deg, transparent 0 14px, rgba(27,26,23,0.04) 14px 15px)`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex">
                {item.members.map((p, i) => (
                  <div
                    key={p.userId}
                    style={{ marginLeft: i ? -24 : 0, zIndex: item.members.length - i }}
                  >
                    <Avatar name={p.displayName} hall={item.hall} size={104} ring />
                  </div>
                ))}
                {[...Array(t.groupSize - item.members.length)].map((_, i) => (
                  <div
                    key={`ph${i}`}
                    style={{
                      width: 104,
                      height: 104,
                      borderRadius: 30,
                      border: `2px dashed ${t.accent}`,
                      marginLeft: -24,
                      background: "rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: t.accent,
                      fontSize: 36,
                      zIndex: 0,
                    }}
                  >
                    +
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dark gradient at bottom for legibility of overlay text */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: "55%",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(27,26,23,0.0) 35%, rgba(27,26,23,0.78) 100%)",
          }}
        />

        {/* Top-row badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex gap-1.5 items-center">
            <HallPill hall={item.hall} />
            {item.kind === "user" ? (
              <StatusPill tone="verified">Verified</StatusPill>
            ) : (
              <StatusPill tone="pending" dot={false}>
                partial · {item.members.length}/{t.groupSize}
              </StatusPill>
            )}
          </div>
          <div
            className="flex items-center gap-1.5"
            style={{
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "5px 10px 5px 6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <CompatRing score={item.score} size={28} hall={item.hall} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: RM.ink2, letterSpacing: 0.4 }}
            >
              match
            </span>
          </div>
        </div>

        {/* Bottom-row text overlay (on photo) */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          {item.kind === "user" ? (
            <>
              <div
                className="font-serif"
                style={{ fontSize: 36, letterSpacing: -0.6, lineHeight: 1, color: "#fff" }}
              >
                {item.profile.displayName}
              </div>
              <div className="mt-1.5 text-[14px]" style={{ color: "rgba(255,255,255,0.86)" }}>
                {item.profile.branch}
                {item.profile.hometownCity && ` · from ${item.profile.hometownCity}`}
                {item.profile.hometownState && `, ${item.profile.hometownState}`}
              </div>
              {activeLabel && (
                <div
                  className="font-mono mt-1.5 inline-flex items-center gap-1.5"
                  style={{ fontSize: 10.5, letterSpacing: 0.4, color: "rgba(255,255,255,0.7)" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: RM.good,
                      display: "inline-block",
                    }}
                  />
                  {activeLabel}
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className="font-serif"
                style={{ fontSize: 30, letterSpacing: -0.5, lineHeight: 1.05, color: "#fff" }}
              >
                {item.members.map((m) => m.displayName.split(" ")[0]).join(" & ")}
              </div>
              <div className="mt-1.5 text-[14px]" style={{ color: "rgba(255,255,255,0.86)" }}>
                looking for {t.groupSize - item.members.length} more · partial group
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lower info panel */}
      <div
        className="flex-shrink-0"
        style={{ background: RM.surface, padding: "14px 16px 18px", borderTop: `1px solid ${RM.hairline}` }}
      >
        {item.kind === "user" ? (
          <>
            <div className="flex flex-wrap gap-1.5">
              {[
                item.profile.sleepSchedule === "early"
                  ? "Early bird"
                  : item.profile.sleepSchedule === "night"
                    ? "Late owl"
                    : "Flexible",
                item.profile.foodPref === "veg"
                  ? "Veg"
                  : item.profile.foodPref === "non_veg"
                    ? "Non-veg"
                    : item.profile.foodPref === "jain"
                      ? "Jain"
                      : "Eggetarian",
                `Social ${item.profile.socialScore}/5`,
                `Clean ${item.profile.cleanliness}`,
                item.profile.acPref === "yes" ? "AC" : item.profile.acPref === "no" ? "Non-AC" : "AC?",
              ].map((tag) => (
                <span
                  key={tag}
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    color: RM.ink2,
                    padding: "4px 9px",
                    borderRadius: 999,
                    background: "rgba(27,26,23,0.05)",
                    letterSpacing: 0.3,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            {item.profile.bio && (
              <p
                className="mt-2.5"
                style={{
                  fontSize: 13,
                  color: RM.ink2,
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.profile.bio}
              </p>
            )}
            <div
              className="mt-2 text-center"
              style={{ fontSize: 11, color: RM.ink3, fontFamily: RM.mono, letterSpacing: 0.3 }}
            >
              tap to view full profile
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(
                new Set(
                  item.members.flatMap((m) => [
                    m.branch,
                    m.hometownState,
                    m.foodPref === "veg" ? "Veg" : m.foodPref === "non_veg" ? "Non-veg" : "Mixed food",
                  ]),
                ),
              )
                .filter(Boolean)
                .slice(0, 5)
                .map((tag) => (
                  <span
                    key={tag as string}
                    className="font-mono"
                    style={{
                      fontSize: 10.5,
                      color: RM.ink2,
                      padding: "4px 9px",
                      borderRadius: 999,
                      background: "rgba(27,26,23,0.05)",
                      letterSpacing: 0.3,
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <div
              className="mt-2 text-center"
              style={{ fontSize: 11, color: RM.ink3, fontFamily: RM.mono, letterSpacing: 0.3 }}
            >
              tap to see joint profile · right-swipe requests to join all members
            </div>
          </>
        )}
      </div>
    </div>
  );
}
