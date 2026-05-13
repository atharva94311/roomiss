"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { RM } from "@/lib/tokens";

interface Props {
  title: string;
  body?: string;
  /** If set, the admin must type this string to enable Confirm. Use for ban/delete. */
  typeToConfirm?: string;
  /** Optional reason textarea (returned to onConfirm). */
  reasonPrompt?: string;
  confirmLabel: string;
  /** "danger" makes the confirm button red. */
  danger?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Confirmation modal used across the admin console. Two safety levels:
 *   - typeToConfirm: must echo a specific string (ban, delete, etc.)
 *   - reasonPrompt: required reason textarea (warn, suspend)
 */
export function ConfirmDialog({
  title,
  body,
  typeToConfirm,
  reasonPrompt,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: Props) {
  const [echo, setEcho] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const echoOk = !typeToConfirm || echo.trim() === typeToConfirm;
  const reasonOk = !reasonPrompt || reason.trim().length >= 3;
  const canConfirm = echoOk && reasonOk && !busy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{ background: RM.bg, boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="font-serif"
          style={{ fontSize: 22, letterSpacing: -0.3, lineHeight: 1.1 }}
        >
          {title}
        </h3>
        {body && (
          <p style={{ marginTop: 8, fontSize: 14, color: RM.ink2, lineHeight: 1.5 }}>{body}</p>
        )}

        {reasonPrompt && (
          <div className="mt-4">
            <label
              className="font-mono uppercase block mb-1.5"
              style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.4 }}
            >
              {reasonPrompt}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full outline-none"
              style={{
                padding: "10px 12px",
                fontSize: 13.5,
                borderRadius: 10,
                background: RM.surface,
                border: `1px solid ${RM.hairline2}`,
                resize: "none",
                fontFamily: RM.sans,
              }}
            />
          </div>
        )}

        {typeToConfirm && (
          <div className="mt-4">
            <label
              className="font-mono uppercase block mb-1.5"
              style={{ fontSize: 10.5, color: RM.ink3, letterSpacing: 0.4 }}
            >
              Type <code style={{ color: RM.ink }}>{typeToConfirm}</code> to confirm
            </label>
            <input
              value={echo}
              onChange={(e) => setEcho(e.target.value)}
              className="w-full outline-none"
              style={{
                padding: "10px 12px",
                fontSize: 13.5,
                borderRadius: 10,
                background: RM.surface,
                border: `1.5px solid ${echoOk && echo ? RM.good : RM.hairline2}`,
                fontFamily: RM.mono,
              }}
            />
          </div>
        )}

        <div className="mt-5 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={!canConfirm}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(reason);
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
