import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next"
import { I18nProvider } from "@/i18n/I18nProvider";
import { defaultLocale, localeToHtmlLang } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

const defaultMessages = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: {
    default: defaultMessages.app.title,
    template: `%s | ${defaultMessages.app.title}`,
  },
  description: defaultMessages.app.description,
  applicationName: defaultMessages.app.title,
  keywords: [
    "狼人杀",
    "单人狼人杀",
    "AI 狼人杀",
    "沉浸式游戏",
    "推理游戏",
    "语音旁白",
    "Werewolf",
    "single-player",
    "immersive",
    "AI narrator",
  ],
  openGraph: {
    title: defaultMessages.app.title,
    description: defaultMessages.app.description,
    type: "website",
    siteName: defaultMessages.app.title,
    locale: localeToHtmlLang[defaultLocale],
  },
  twitter: {
    card: "summary",
    title: defaultMessages.app.title,
    description: defaultMessages.app.description,
  },
  icons: {
    icon: "/brand/wolfcha-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={localeToHtmlLang[defaultLocale]} suppressHydrationWarning>
      <Analytics />
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3SSRH8KPLY"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3SSRH8KPLY');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <I18nProvider>
          <Toaster position="top-center" closeButton />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
