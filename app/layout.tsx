import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";
import { Suspense } from "react";
import EmailPopup from "@/components/EmailPopup";
import CountryToggle from "@/components/CountryToggle";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealDrop — Best Deals in Australia & India",
  description:
    "Real promo deals from Amazon AU, OzBargain, Flipkart and more. Verified prices, updated every hour. Free, no signup needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">

            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🏷️</span>
              <span className="font-black text-xl tracking-tight">
                <span className="text-blue-600">Deal</span>
                <span className="text-gray-900">Drop</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
              <Link href="/"        className="text-gray-600 hover:text-blue-600 transition-colors">Deals</Link>
              <Link href="/about"   className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Suspense fallback={
                <div className="flex items-center bg-gray-100 rounded-full p-0.5">
                  <span className="px-2.5 py-1 text-xs font-bold text-gray-400">🇦🇺 <span className="hidden sm:inline">Australia</span><span className="sm:hidden">AU</span></span>
                  <span className="px-2.5 py-1 text-xs font-bold text-gray-400">🇮🇳 <span className="hidden sm:inline">India</span><span className="sm:hidden">IN</span></span>
                </div>
              }>
                <CountryToggle />
              </Suspense>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs text-gray-500 font-medium hidden sm:block">Live</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <EmailPopup />

        {/* ── Footer ── */}
        <footer className="border-t border-gray-200 bg-white mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏷️</span>
                  <span className="font-black text-lg">
                    <span className="text-blue-600">Deal</span>
                    <span className="text-gray-900">Drop</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Real deals from Australia and India, curated every hour. No fluff,
                  no spam — just genuine savings.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-widest">Pages</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/about"   className="text-gray-500 hover:text-blue-600 transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="text-gray-500 hover:text-blue-600 transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms"   className="text-gray-500 hover:text-blue-600 transition-colors">Terms of Use</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-widest">Disclosure</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Some links are affiliate links. When you buy through them we may earn a
                  small commission at no extra cost to you. Prices are accurate at time of
                  posting and may change.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
              <p>© {new Date().getFullYear()} DealDrop. Free to use — no subscription required.</p>
              <p>Amazon Associate — qualifying purchases earn a commission.</p>
            </div>
          </div>
        </footer>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
