import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Ghostty Configuration | Spectre",
  description: "A Ghostty configuration shared with Spectre.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ShareLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
