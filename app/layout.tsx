import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/state";
import RoleSwitcher from "@/components/RoleSwitcher";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "Krysalis OS",
  description: "Krysalis Agentic OS — unified employee hub & client platform.",
};

export const viewport: Viewport = {
  themeColor: "#1A2E22",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${grotesk.variable} font-sans antialiased`}>
        <AppProvider>
          {children}
          <RoleSwitcher />
        </AppProvider>
      </body>
    </html>
  );
}
