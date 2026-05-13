import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { DeletionBanner } from "@/components/DeletionBanner";
import { PlatformBanner } from "@/components/PlatformBanner";
import { Toast } from "@/components/Toast";

// Allow absolute OG/Twitter image URLs. Falls back to localhost in dev so
// `next build` doesn't warn about missing metadataBase.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "roomiss · pre-allotment roommate matching",
    template: "%s · roomiss",
  },
  description:
    "Verified roommate matching for IIT Kharagpur LBS & SNVH freshers. No more rando spreadsheets.",
  applicationName: "roomiss",
  authors: [{ name: "roomiss" }],
  creator: "roomiss",
  publisher: "roomiss",
  keywords: [
    "IIT Kharagpur",
    "IITKGP",
    "roommate",
    "hostel",
    "LBS",
    "SNVH",
    "freshers",
    "allotment",
  ],
  category: "education",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "roomiss",
    title: "roomiss · pre-allotment roommate matching",
    description:
      "Verified roommate matching for IIT Kharagpur LBS & SNVH freshers. No more rando spreadsheets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "roomiss",
    description:
      "Verified roommate matching for IIT Kharagpur LBS & SNVH freshers.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Tells the iOS home-screen install to use the apple-touch-icon below.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "roomiss",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ecd9" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1A17" },
  ],
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <PlatformBanner />
          <DeletionBanner />
          {children}
          <Toast />
        </AuthProvider>
      </body>
    </html>
  );
}
