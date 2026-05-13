import { ImageResponse } from "next/og";

// Default OG card used when someone pastes a roomiss link into Slack, iMessage,
// WhatsApp, etc. 1200×630 is the Twitter/OG standard; FB rejects much smaller.
// Per-route pages can override this by adding their own opengraph-image file.

export const alt = "roomiss · pre-allotment roommate matching";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(circle at 30% 20%, #ece5d6 0%, #d8cdb6 70%)",
          color: "#1B1A17",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#1B1A17",
              color: "#f4ecd9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            r
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: "monospace",
              letterSpacing: 1,
              opacity: 0.7,
            }}
          >
            roomiss.app
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 86,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            Pre-allotment roommate matching for IITKGP freshers.
          </div>
          <div
            style={{
              fontSize: 32,
              fontFamily: "sans-serif",
              opacity: 0.7,
              maxWidth: 900,
            }}
          >
            Verified profiles · LBS & SNVH · No more rando spreadsheets.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
