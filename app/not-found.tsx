import Link from "next/link";

/**
 * Root 404 page. Next renders this when nothing matches a route or you call
 * notFound() from inside a page.
 */
export default function NotFound() {
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
          fontSize: 72,
          lineHeight: 1,
          letterSpacing: -2,
          marginBottom: 12,
        }}
      >
        404
      </div>
      <p style={{ fontSize: 16, color: "#4A453C", maxWidth: 320, lineHeight: 1.5, marginBottom: 24 }}>
        That page isn&rsquo;t a thing on roomiss. Maybe it was archived after allotment.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <Link
          href="/"
          style={{
            background: "#1B1A17",
            color: "#F7F2E9",
            border: "none",
            borderRadius: 12,
            padding: "12px 22px",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Landing
        </Link>
        <Link
          href="/browse"
          style={{
            background: "transparent",
            color: "#1B1A17",
            border: "1.5px solid #1B1A17",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Discover
        </Link>
      </div>
    </div>
  );
}
