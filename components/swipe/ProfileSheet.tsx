"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { CompatRing } from "@/components/ui/CompatRing";
import { HallPill, StatusPill } from "@/components/ui/Pills";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { Button } from "@/components/ui/Button";
import { RM, hallTheme } from "@/lib/tokens";
import type { SwipeItem } from "./SwipeCard";
import type { SwipeDecision } from "@/lib/types";

interface Props {
  item: SwipeItem | null;
  onClose: () => void;
  onDecide: (decision: SwipeDecision) => void;
}

/**
 * ProfileSheet — slide-up detail sheet for a swipe-deck item.
 * Tap to open, drag handle to dismiss, action buttons to commit a swipe.
 */
export function ProfileSheet({ item, onClose, onDecide }: Props) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ background: "rgba(0,0,0,0)" }}
          animate={{ background: "rgba(0,0,0,0.45)" }}
          exit={{ background: "rgba(0,0,0,0)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="w-full max-w-[480px] rounded-t-3xl flex flex-col"
            style={{
              background: RM.bg,
              maxHeight: "92dvh",
              overflow: "hidden",
              boxShadow: "0 -20px 60px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1.5 flex-shrink-0">
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: RM.hairline2,
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {item.kind === "user" ? <SoloSheet item={item} /> : <GroupSheet item={item} />}
            </div>

            <div
              className="flex-shrink-0 flex gap-2.5 p-4"
              style={{ borderTop: `1px solid ${RM.hairline}`, background: RM.bg }}
            >
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  onClose();
                  onDecide("pass");
                }}
              >
                Pass
              </Button>
              <Button
                variant="primary"
                hall={item.hall}
                size="md"
                full
                onClick={() => {
                  onClose();
                  onDecide("like");
                }}
              >
                {item.kind === "user" ? "Send roommate request" : "Request to join group"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SoloSheet({ item }: { item: Extract<SwipeItem, { kind: "user" }> }) {
  const t = hallTheme(item.hall);
  const p = item.profile;

  return (
    <>
      <div className="relative" style={{ height: 260, margin: "0 -16px 14px" }}>
        <PhotoSlot
          ratio="auto"
          hall={item.hall}
          label="profile photo"
          style={{ height: "100%", borderRadius: 0, aspectRatio: "unset" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
          }}
        />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex gap-1.5 mb-1.5">
            <HallPill hall={item.hall} />
            <StatusPill tone="verified">Verified</StatusPill>
          </div>
          <div
            className="font-serif"
            style={{ fontSize: 32, color: "#fff", letterSpacing: -0.5, lineHeight: 1 }}
          >
            {p.displayName}
          </div>
          <div className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
            {p.branch}
            {p.hometownCity && ` · ${p.hometownCity}`}
            {p.hometownState && `, ${p.hometownState}`}
          </div>
        </div>
      </div>

      {/* Compatibility */}
      <div
        className="flex items-center gap-3 p-3.5 rounded-2xl mb-3"
        style={{ background: t.soft }}
      >
        <CompatRing score={item.score} size={50} hall={item.hall} />
        <div className="flex-1">
          <div
            className="font-serif"
            style={{ fontSize: 17, color: t.deep, letterSpacing: -0.2, lineHeight: 1.1 }}
          >
            {item.score >= 85 ? "Strong match" : item.score >= 70 ? "Decent match" : "Worth a look"}
          </div>
          <div style={{ fontSize: 12.5, color: RM.ink2, marginTop: 3, lineHeight: 1.4 }}>
            Pairwise compatibility across sleep, food, cleanliness, social and habits.
          </div>
        </div>
      </div>

      {p.bio && (
        <div
          className="p-3.5 rounded-2xl mb-3"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <Label>About</Label>
          <p style={{ fontSize: 14, color: RM.ink, lineHeight: 1.5, margin: 0 }}>{p.bio}</p>
        </div>
      )}

      {/* Lifestyle grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          ["Sleep", labelize(p.sleepSchedule)],
          ["Food", labelize(p.foodPref)],
          ["Cleanliness", labelize(p.cleanliness)],
          ["Social", `${p.socialScore}/5`],
          ["Smoking", labelize(p.smoking)],
          ["Drinking", labelize(p.drinking)],
          ["Noise", labelize(p.noiseTolerance)],
          ["AC room", labelize(p.acPref)],
        ].map(([l, v]) => (
          <div
            key={l}
            className="p-3 rounded-xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <div
              className="font-mono uppercase"
              style={{ fontSize: 10, color: RM.ink3, letterSpacing: 0.5 }}
            >
              {l}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: RM.ink }}>{v}</div>
          </div>
        ))}
      </div>

      {p.languages.length > 0 && (
        <div
          className="p-3.5 rounded-2xl"
          style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
        >
          <Label>Speaks</Label>
          <div className="flex flex-wrap gap-1.5">
            {p.languages.map((l) => (
              <span
                key={l}
                style={{
                  fontSize: 12.5,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(27,26,23,0.05)",
                }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function GroupSheet({ item }: { item: Extract<SwipeItem, { kind: "group" }> }) {
  const t = hallTheme(item.hall);
  const need = t.groupSize - item.members.length;

  return (
    <>
      <div
        className="rounded-3xl p-4 mb-3"
        style={{
          background: `linear-gradient(135deg, ${t.soft} 0%, #F0E4D2 100%)`,
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 14px, rgba(27,26,23,0.04) 14px 15px)`,
          borderLeft: `3px solid ${t.accent}`,
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <StatusPill tone="pending" dot={false}>
            partial · {item.members.length}/{t.groupSize}
          </StatusPill>
          <CompatRing score={item.score} size={42} hall={item.hall} />
        </div>
        <div
          className="font-serif"
          style={{ fontSize: 24, color: t.deep, letterSpacing: -0.4, lineHeight: 1.05 }}
        >
          {item.members.map((m) => m.displayName.split(" ")[0]).join(" & ")}
        </div>
        <div className="text-[13px] mt-1" style={{ color: RM.ink2 }}>
          looking for {need} more · all current members must approve
        </div>
      </div>

      <Label>Members</Label>
      <div className="flex flex-col gap-2 mb-3">
        {item.members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-2.5 p-3 rounded-xl"
            style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
          >
            <Avatar name={m.displayName} hall={item.hall} size={40} />
            <div className="flex-1 min-w-0">
              <div
                className="font-serif truncate"
                style={{ fontSize: 16, letterSpacing: -0.2 }}
              >
                {m.displayName}
              </div>
              <div className="text-[11px]" style={{ color: RM.ink3 }}>
                {m.branch} · {labelize(m.sleepSchedule)} · {labelize(m.foodPref)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Label>Shared preferences</Label>
      <div
        className="p-3.5 rounded-2xl"
        style={{ background: RM.surface, boxShadow: `0 0 0 1px ${RM.hairline}` }}
      >
        {[
          {
            l: "Food",
            all: item.members.every((m) => m.foodPref === item.members[0].foodPref),
            v: item.members.every((m) => m.foodPref === item.members[0].foodPref)
              ? labelize(item.members[0].foodPref)
              : "Mixed",
          },
          {
            l: "Sleep",
            all: item.members.every((m) => m.sleepSchedule === item.members[0].sleepSchedule),
            v: item.members.map((m) => labelize(m.sleepSchedule).split(" ")[0]).join(" / "),
          },
          {
            l: "AC",
            all: item.members.every((m) => m.acPref === "yes"),
            v: item.members.every((m) => m.acPref === "yes") ? "All want AC" : "Mixed",
          },
        ].map((row, i) => (
          <div
            key={row.l}
            className="flex justify-between items-center py-2"
            style={{ borderTop: i ? `1px solid ${RM.hairline}` : "none" }}
          >
            <span style={{ fontSize: 13, color: RM.ink2 }}>{row.l}</span>
            <span
              className="inline-flex items-center gap-1.5"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {row.all && (
                <span
                  style={{ width: 6, height: 6, borderRadius: 3, background: RM.good }}
                />
              )}
              {row.v}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono uppercase mb-2"
      style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.5 }}
    >
      {children}
    </div>
  );
}

function labelize(v: string): string {
  const map: Record<string, string> = {
    early: "Early bird",
    flexible: "Flexible",
    night: "Late owl",
    veg: "Veg",
    non_veg: "Non-veg",
    eggetarian: "Eggetarian",
    jain: "Jain",
    tidy: "Tidy",
    average: "Average",
    messy: "Messy",
    never: "Never",
    rarely: "Rarely",
    regularly: "Regularly",
    low: "Low",
    medium: "Medium",
    high: "High",
    yes: "Yes",
    no: "No",
    either: "Either",
  };
  return map[v] ?? v;
}
