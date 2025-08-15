import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Main text font: Haffer (variable)
const haffer = localFont({
  src: "../../public/fonts/Haffer-VF.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-haffer",
  display: "swap",
});

// Display font for large headlines: LyonDisplay (static weights)
const lyonDisplay = localFont({
  src: [
    { path: "../../public/fonts/LyonDisplayWeb-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/LyonDisplayWeb-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/LyonDisplayWeb-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/LyonDisplayWeb-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/LyonDisplayWeb-Black.woff2", weight: "900", style: "normal" },
    { path: "../../public/fonts/LyonDisplay-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "../../public/fonts/LyonDisplayWeb-RegularItalic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/LyonDisplayWeb-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../../public/fonts/LyonDisplayWeb-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "../../public/fonts/LyonDisplayWeb-BlackItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-lyon-display",
  display: "swap",
});

// Mono font for buttons and small headlines: HafferMono (static weights)
const hafferMono = localFont({
  src: [
    { path: "../../public/fonts/HafferMono-TRIAL-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/HafferMono-TRIAL-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-haffer-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIR - AI Readiness Assessment",
  description: "Assess your organization's AI readiness with our comprehensive survey tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${haffer.variable} ${lyonDisplay.variable} ${hafferMono.variable} antialiased`}
>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
