import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n/provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker";
import { SITE_URL } from "@/lib/site";
import { isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

const geistSans = Geist({ variable: "--font-latin", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const hindSiliguri = Hind_Siliguri({ variable: "--font-bangla", subsets: ["bengali"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Sanchay — Smart money for everyone", template: "%s · Sanchay" },
  description:
    "Sanchay (সঞ্চয়) helps you track bank accounts, bKash, cards, loans, budgets and savings goals — in English or বাংলা, in any currency.",
  applicationName: "Sanchay",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "Sanchay",
    title: "Sanchay — Smart money for everyone",
    description: "Track bank accounts, bKash, cards, budgets, bills and savings goals — in English or বাংলা.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: "Sanchay" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6366f1",
};

async function initialLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^bn\b|,\s*bn\b/i.test(accept) ? "bn" : "en";
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await initialLang();
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider initialLang={lang}>
            <TooltipProvider delayDuration={200}>
              {children}
              <ServiceWorkerRegistration />
              <Toaster position="top-right" richColors closeButton />
            </TooltipProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
