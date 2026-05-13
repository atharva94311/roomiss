import { ImageResponse } from "next/og";

// iOS home-screen "Add to Home" icon. 180×180 is the canonical size — iOS
// downsamples for older devices.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B1A17",
          color: "#f4ecd9",
          fontSize: 110,
          fontWeight: 700,
          fontFamily: "serif",
          letterSpacing: -4,
        }}
      >
        r
      </div>
    ),
    { ...size },
  );
}
