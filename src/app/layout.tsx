import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SiteHeader } from "~/components/site/header";
import { ThemeProvider } from "~/components/site/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "pulse",
  description: "what should you know or inspect today, and why.",
};

export const viewport: Viewport = {
  themeColor: "#F2EEE6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className="flex min-h-full flex-col bg-paper text-ink">
          <ThemeProvider>
            <SiteHeader />
            <main className="mx-auto w-full max-w-[640px] flex-1">
              {children}
            </main>
            <Toaster
              position="top-center"
              toastOptions={{
                classNames: {
                  toast:
                    "!bg-paper !text-ink !border !border-[color:var(--rule-strong)] !rounded-[4px] !font-mono",
                  title: "!text-[12px] !font-bold !uppercase !tracking-wider",
                  description: "!text-[12px] !text-[color:var(--ink-3)]",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
