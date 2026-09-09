import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Nexora · Employer Operations", description: "Service delivery, medication tracking and audit trails in one local employer workspace." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('nexora-theme')||'light'}catch(e){}" }} />{children}</body></html>;
}
