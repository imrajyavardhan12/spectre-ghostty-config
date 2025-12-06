import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { StoreProvider } from "@/components/providers/StoreProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Spectre - Ghostty Config Generator",
  description:
    "A beautiful, modern configuration generator for Ghostty terminal. Customize fonts, colors, keybindings, and more with an intuitive visual interface.",
  keywords: [
    "ghostty",
    "terminal",
    "config",
    "configuration",
    "generator",
    "theme",
    "fonts",
    "colors",
  ],
  authors: [{ name: "imrajyavardhan12" }],
  openGraph: {
    title: "Spectre - Ghostty Config Generator",
    description:
      "A beautiful, modern configuration generator for Ghostty terminal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
