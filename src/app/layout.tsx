import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { AuthHeader } from "@/components/shared/auth-header";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "CRM IMMO PRO X",
    template: "%s | CRM IMMO PRO X",
  },
  description:
    "SaaS CRM immobilier multi-tenant. Gestion complete du cycle de vente immobilier : leads, clients, biens, transactions, equipes.",
  keywords: [
    "CRM",
    "immobilier",
    "gestion",
    "leads",
    "pipeline",
    "multi-tenant",
    "SaaS",
  ],
  authors: [{ name: "PRO-X" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "CRM IMMO PRO X",
    title: "CRM IMMO PRO X",
    description:
      "SaaS CRM immobilier multi-tenant. Gestion complete du cycle de vente immobilier.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CRM IMMO PRO X",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM IMMO PRO X",
    description:
      "SaaS CRM immobilier multi-tenant. Gestion complete du cycle de vente immobilier.",
    images: ["/og-image.png"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider localization={frFR}>
          <I18nProvider>
            <AuthHeader />
            {children}
          </I18nProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
