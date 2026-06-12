import type { Metadata, Viewport } from "next";
import { Newsreader, Schibsted_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const ui = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Krysalis OS",
  description: "The internal operating system of the Krysalis firm.",
};

export const viewport: Viewport = {
  // Browser-chrome color only — Viewport.themeColor cannot read CSS custom
  // properties, so these two literals mirror the section 5.2 base tokens.
  // This is the one sanctioned hex outside globals.css (docs/ui-contract.md).
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0C100D" },
    { media: "(prefers-color-scheme: light)", color: "#F6F4FA" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ui.variable} ${mono.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  );
}
