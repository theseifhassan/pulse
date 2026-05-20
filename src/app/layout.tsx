import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SiteHeader } from "~/components/site/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse",
  description:
    "Private signal feed for Seif. What's worth knowing or inspecting today.",
};

export const viewport: Viewport = {
  themeColor: "#faf7f1",
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
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <SiteHeader />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
            {children}
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast:
                  "!bg-[color:var(--paper)] !text-[color:var(--ink)] !border-[color:var(--rule)]",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
