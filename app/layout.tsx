import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealDrop — Best AU Deals in One Place",
  description: "Find the hottest Australian promo deals aggregated from OzBargain and more, updated hourly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-slate-900 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🏷️</span>
              <span className="font-extrabold text-xl tracking-tight">
                <span className="text-orange-400">Deal</span>
                <span className="text-white">Drop</span>
              </span>
            </a>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 rounded-full px-3 py-1 border border-emerald-400/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Live — updated hourly
              </span>
              <span className="text-xs text-slate-400 font-medium">🇦🇺 AU Deals</span>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* ── Footer ── */}
        <footer className="bg-slate-900 mt-16 py-10 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl">🏷️</span>
                <span className="font-extrabold text-lg">
                  <span className="text-orange-400">Deal</span>
                  <span className="text-white">Drop</span>
                </span>
              </a>
              <p className="text-slate-400 text-xs text-center sm:text-right">
                Best Australian deals, aggregated hourly from OzBargain and more.
              </p>
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-xs">
              <a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <span className="text-slate-700">·</span>
              <a href="/terms"   className="text-slate-400 hover:text-white transition-colors">Terms of Use</a>
            </div>

            <div className="border-t border-slate-800 pt-6 space-y-2 text-center text-xs text-slate-500">
              <p className="font-medium text-slate-400">Affiliate Disclosure</p>
              <p>
                As an Amazon Associate I earn from qualifying purchases. Some links on this site are
                affiliate links — if you buy through them, we may earn a small commission at no extra
                cost to you.
              </p>
              <p>Prices and availability are accurate at time of posting and may change. Always verify on the retailer&apos;s website.</p>
              <p className="text-slate-600 pt-2">© {new Date().getFullYear()} DealDrop · Free to use · 🇦🇺 Australia</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
