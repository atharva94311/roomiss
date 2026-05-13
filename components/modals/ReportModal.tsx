"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRoomiss } from "@/lib/store";
import { RM } from "@/lib/tokens";
import type { ReportCategory } from "@/lib/types";

const CATS: { value: ReportCategory; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  targetUserId,
  targetName,
  messageId,
  onClose,
}: {
  targetUserId: string;
  targetName: string;
  messageId?: string;
  onClose: () => void;
}) {
  const report = useRoomiss((s) => s.reportUser);
  const [category, setCategory] = useState<ReportCategory>("harassment");
  const [details, setDetails] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-[480px] p-5 rounded-t-3xl"
        style={{ background: RM.bg, maxHeight: "80dvh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h3 className="font-serif" style={{ fontSize: 24, letterSpacing: -0.4 }}>
              Thanks. We&rsquo;re on it.
            </h3>
            <p className="mt-2 text-sm" style={{ color: RM.ink2, lineHeight: 1.5 }}>
              An admin will review your report within a day. You won&rsquo;t see {targetName}&rsquo;s
              flagged content again.
            </p>
            <div className="mt-5">
              <Button variant="primary" full onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-serif" style={{ fontSize: 24, letterSpacing: -0.4 }}>
              Report {targetName}
            </h3>
            <p className="mt-1 text-sm" style={{ color: RM.ink3 }}>
              Reports go to a human admin. We never share your identity with the reported user.
            </p>
            <div className="mt-4">
              <div
                className="font-mono uppercase mb-2"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Category
              </div>
              <div className="flex flex-wrap gap-2">
                {CATS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 999,
                      background: c.value === category ? RM.ink : RM.surface,
                      color: c.value === category ? RM.bg : RM.ink,
                      border: `1.5px solid ${c.value === category ? RM.ink : RM.hairline}`,
                      fontSize: 13,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div
                className="font-mono uppercase mb-2"
                style={{ fontSize: 11, color: RM.ink3, letterSpacing: 0.4 }}
              >
                Details (optional)
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                rows={4}
                className="w-full outline-none"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: RM.surface,
                  border: `1.5px solid ${RM.hairline2}`,
                  fontSize: 14,
                  resize: "none",
                  fontFamily: RM.sans,
                }}
              />
            </div>
            <div className="mt-5 flex gap-2.5">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                full
                onClick={() => {
                  report(targetUserId, category, details, messageId);
                  setDone(true);
                }}
              >
                Submit report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
