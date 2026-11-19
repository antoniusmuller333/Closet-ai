import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/dm-sans/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Closet — what to wear today",
  description: "Scan your wardrobe, check the weather, get an outfit.",
  appleWebApp: { capable: true, title: "Closet", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f3eee4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
