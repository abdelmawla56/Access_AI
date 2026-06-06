import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Symbio Tech — AI-Driven Smart Assistive Ecosystem",
  description: "An Embedded System Integration of Computer Vision Glasses and Sensor-Based Gloves for Inclusive Accessibility.",
  keywords: ["accessibility", "computer vision", "glasses", "gloves", "AI", "smart assistive", "symbio"],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0a0a0f",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Skip to main content for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
