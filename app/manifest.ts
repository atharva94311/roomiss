import type { MetadataRoute } from "next";

/**
 * Web App Manifest — minimum needed for Android "Add to Home Screen" + Chrome
 * install prompts. iOS reads `apple-icon.tsx` + the `appleWebApp` block in
 * root metadata, not this file.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "roomiss",
    short_name: "roomiss",
    description:
      "Pre-allotment roommate matching for IIT Kharagpur freshers.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4ecd9",
    theme_color: "#1B1A17",
    categories: ["education", "social", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
