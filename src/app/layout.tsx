import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Sarabun } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { NavigationProvider } from "@/lib/app-navigation";
import { AppThemeProvider } from "@/providers/theme-provider";

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CPAC Safety",
  description: "CPAC Safety — Safety Effort & Safety Culture",
  icons: {
    icon: "/images/mascots/wangjai/41.png",
    shortcut: "/images/mascots/wangjai/41.png",
    apple: "/images/mascots/wangjai/41.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "var(--c-3b1d07)",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="th"
      data-theme="wangjai"
      suppressHydrationWarning
      className={`${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans" suppressHydrationWarning>
        <AppThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <AppShell>
                <NavigationProvider>{children}</NavigationProvider>
              </AppShell>
            </AppProviders>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
