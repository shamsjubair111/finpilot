import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sanchay — Smart money for everyone",
    short_name: "Sanchay",
    description: "Track accounts, budgets, goals and savings in English or বাংলা.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0d1f",
    theme_color: "#6366f1",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
