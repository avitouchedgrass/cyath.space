import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cyath — Stop chasing client feedback across 15 emails",
  description: "One link. Clients pin feedback directly on your live staging site with automated telemetry. Milestone approval sign-off with a timestamped receipt.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
