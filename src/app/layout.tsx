import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const lora = localFont({
  src: [
    {
      path: "../../public/fonts/Lora[wght].woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Lora-Italic[wght].woff2",
      weight: "100 900", 
      style: "italic",
    },
  ],
  variable: "--font-lora",
  display: "swap",
});

const bastardoGrotesk = localFont({
  src: "../../public/fonts/BastardoGrotesk-Variable.woff2",
  weight: "100 900",
  variable: "--font-bastardo-grotesk",
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
          className={`${lora.variable} ${bastardoGrotesk.variable} antialiased`}
>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
