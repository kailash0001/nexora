import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora | AI-Powered Team Knowledge Platform",
  description: "Nexora combines Notion, Confluence, Slack, and ChatGPT into a premium, unified AI-powered team workspace. Connect, search, and automate your company knowledge base.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0B1020] text-white selection:bg-primary selection:text-white">
        {children}
      </body>
    </html>
  );
}
