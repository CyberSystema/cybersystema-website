import type { Metadata, Viewport } from "next";
import { Rajdhani, Share_Tech_Mono, Syncopate } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: "400",
});

const syncopate = Syncopate({
  variable: "--font-syncopate",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cybersystema.com"),
  title: {
    default: "CyberSystema — Secure Edge-Native Engineering",
    template: "%s · CyberSystema",
  },
  description:
    "CyberSystema is an independent technology organization engineering secure, edge-native platforms and applications on Cloudflare and Next.js.",
  applicationName: "CyberSystema",
  keywords: [
    "CyberSystema",
    "Cloudflare Workers",
    "Next.js",
    "edge computing",
    "secure software engineering",
  ],
  authors: [{ name: "CyberSystema", url: "https://cybersystema.com" }],
  openGraph: {
    type: "website",
    siteName: "CyberSystema",
    url: "https://cybersystema.com",
    title: "CyberSystema — Secure Edge-Native Engineering",
    description:
      "Independent technology organization engineering secure, edge-native platforms and applications.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberSystema",
    description:
      "Independent technology organization engineering secure, edge-native platforms and applications.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030813",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const isChromeless = pathname.startsWith("/admin");
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${shareTechMono.variable} ${syncopate.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {isChromeless ? null : <SiteHeader />}
        <div className="flex flex-1 flex-col">{children}</div>
        {isChromeless ? null : <SiteFooter />}
      </body>
    </html>
  );
}
