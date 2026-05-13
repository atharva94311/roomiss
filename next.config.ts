import type { NextConfig } from "next";

// Pulled from .env at build time so the CSP knows which Supabase host to allow.
// In dev/local fallback to the demo project ref so the CSP still passes.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ttycyzyeogdpzfkcnhlm.supabase.co";

const supabaseHost = (() => {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return "*.supabase.co";
  }
})();

// CSP rationale:
//   - default-src 'self': everything not listed below
//   - script-src 'self' 'unsafe-inline' 'unsafe-eval' in dev only (Next dev needs eval).
//     Next.js production builds use nonces if you opt in; for now we ship the prod CSP
//     without 'unsafe-eval' but keep 'unsafe-inline' for inline <style jsx> tags.
//   - connect-src must include the Supabase host (REST + Realtime websockets via wss).
//   - img-src must include both the public avatars CDN URL and data: for inline blurs.
//   - font-src includes Google Fonts (Instrument Serif, Geist, JetBrains Mono).
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https://${supabaseHost}`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  `media-src 'self' https://${supabaseHost} blob:`,
  `frame-src https://${supabaseHost}`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Block everything we don't actively need. Camera/mic stay off until v2 voice/video.
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
