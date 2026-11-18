import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Workspace",
  description: "A focused chat interface for your AI agent.",
  applicationName: "Agent Workspace",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Agent" },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-type="software">
      <head>
        <meta name="page-type" content="software" />
        <meta name="site-kind" content="software" />
        <meta name="theme-color" content="#f7f6f2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
