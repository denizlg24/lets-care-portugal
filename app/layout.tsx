import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Roboto } from "next/font/google";
import "./globals.css";
import { stripMarkdown } from "@/lib/markdown/strip";
import { getSiteConfig } from "@/lib/settings/service";
import { siteConfig, siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });

const nunitoHeading = Nunito({ subsets: ["latin"], variable: "--font-heading" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Admin-configurable identity; falls back to the bundled `siteConfig`
  // until the first save (see `lib/settings/service`).
  const config = await getSiteConfig();
  // Footer prose fields are markdown; metadata must be plain text.
  const description = stripMarkdown(config.description);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: config.title,
      template: `%s | ${config.name}`,
    },
    description,
    applicationName: config.name,
    keywords: [
      "cuidados de longa duração",
      "cuidados continuados",
      "Estratégia Europeia de Cuidados",
      "European Care Strategy",
      "long-term care",
      "LeTs Care",
      "LeTs Care Portugal",
      "investigação em cuidados",
      "políticas de cuidados",
      "cuidadores",
      "envelhecimento",
      "Universidade do Porto",
    ],
    authors: [{ name: config.name }],
    creator: config.name,
    publisher: config.name,
    category: "research",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: "/",
      siteName: config.name,
      title: config.title,
      description,
      images: [
        {
          url: "/hands_logo.png",
          alt: config.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description,
      images: ["/hands_logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [{ url: "/favicon.ico" }, { url: "/hands_logo.png", type: "image/png" }],
      apple: [{ url: "/hands_logo.png" }],
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      style={{ colorScheme: "light" }}
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        roboto.variable,
        nunitoHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
