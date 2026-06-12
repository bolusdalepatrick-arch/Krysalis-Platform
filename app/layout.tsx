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
  themeColor: "#0C100D",
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
