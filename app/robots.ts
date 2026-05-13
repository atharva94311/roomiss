import type { MetadataRoute } from "next";

/**
 * Crawler policy. Public-marketing surface is allowed; everything inside the
 * authenticated app shell, the admin console, and account-lifecycle pages
 * (notifications, settings, onboarding, verify) is disallowed — those routes
 * are meaningless without a session and we don't want them surfaced in SERPs.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/privacy", "/terms"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/browse",
          "/chat",
          "/discover",
          "/group",
          "/notifications",
          "/onboarding",
          "/profile/",
          "/requests",
          "/settings",
          "/verify",
          "/blocked",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
