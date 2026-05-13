"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary. Catches anything thrown in a `app/*` page that the
 * page itself didn't handle. Logs to console (and Sentry once wired) so
 * production failures don't end on a blank screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[roomiss] unhandled error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "#F7F2E9",
        color: "#1B1A17",
        fontFamily: '"Geist", system-ui, sans-serif',
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 60,
          lineHeight: 0.95,
          letterSpacing: -1.5,
          marginBottom: 18,
        }}
      >
        well, that wasn&rsquo;t
        <br />
        supposed to happen.
      </div>
      <p style={{ fontSize: 15, color: "#4A453C", maxWidth: 380, lineHeight: 1.5 }}>
        Something on this page broke. Your data is fine — we just couldn&rsquo;t render. Try the
        button below; if it keeps happening, send us a screenshot of this digest.
      </p>
      {error.digest && (
        <code
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "6px 10px",
            background: "rgba(27,26,23,0.06)",
            borderRadius: 6,
            fontFamily: '"Geist Mono", ui-monospace, monospace',
            fontSize: 11,
            color: "#85806F",
          }}
        >
          {error.digest}
        </code>
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#1B1A17",
            color: "#F7F2E9",
            border: "none",
            borderRadius: 12,
            padding: "12px 22px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            background: "transparent",
            color: "#1B1A17",
            border: "1.5px solid #1B1A17",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
