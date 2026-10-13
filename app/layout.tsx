import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery — Your moments, beautifully organized",
  description: "A Samsung One UI-inspired personal photo gallery.",
  applicationName: "Gallery",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Gallery" },
  icons: { icon: "/icon.svg" }
};
export const viewport: Viewport = {
  themeColor: "#f7f7fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}