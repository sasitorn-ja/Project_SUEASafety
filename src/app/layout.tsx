import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_Thai, Sarabun } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { AppThemeProvider } from "@/providers/theme-provider";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SUEA Safety",
  description: "SUEA Safety — Safety Effort, We're OK & Safety Culture",
  icons: {
    icon: "/images/branding/logo.png",
    shortcut: "/images/branding/logo.png",
    apple: "/images/branding/logo.png",
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
      data-theme="tiger"
      suppressHydrationWarning
      className={`${notoSansThai.variable} ${sarabun.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('suea-safety-theme');document.documentElement.dataset.theme=t==='wangjai'?'wangjai':'tiger'}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppThemeProvider>
          <TooltipProvider>
            <AppProviders>
              <AppShell>{children}</AppShell>
            </AppProviders>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
