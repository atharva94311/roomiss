import { ImageResponse } from "next/og";

// Browser tab favicon. Next builds this into /icon and links it from <head>.
// 32×32 is the smallest size browsers render in tab strips without aliasing.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "serif",
          letterSpacing: -1,
          borderRadius: 6,
        }}
      >
        r
      </div>
    ),
    { ...size },
  );
}
