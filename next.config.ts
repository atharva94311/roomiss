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
//   - default-src 'self': everything not listed below.
//   - script-src 'self' 'unsafe-inline' 'unsafe-eval'.
//       * 'unsafe-inline' — required for Next.js inlined <script id="__NEXT_DATA__">
//         and for inline <style jsx> hydration markers.
//       * 'unsafe-eval' — required in BOTH dev and prod. Empirically, the prod
//         build of Supabase Auth and/or one of its transitive deps invokes
//         `new Function(...)` (or `setTimeout("string", ...)`) during the auth
//         token-refresh path, which silently blocked the login flow on Vercel.
//         A stricter nonce-based policy would require turning off 'unsafe-inline'
//         too and threading nonces through Next's app-router renderer — out of
//         scope for now. 'wasm-unsafe-eval' is added for libraries that compile
//         WebAssembly modules (e.g. some PostHog / analytics builds) and is
//         strictly weaker than 'unsafe-eval'.
//   - connect-src must include the Supabase host (REST + Realtime websockets via wss).
//   - img-src must include both the public avatars CDN URL and data: for inline blurs.
//   - font-src includes Google Fonts (Instrument Serif, Geist, JetBrains Mono).

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`,
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
