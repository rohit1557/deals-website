import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealDrop — Best Promo Deals in One Place",
  description: "Find the hottest online promo deals aggregated from across the web, updated hourly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-4">
            <a href="/" className="font-bold text-xl text-blue-600 shrink-0">
              🏷️ DealDrop
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">Updated hourly</span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-100 mt-12 py-8 px-4">
          <div className="mx-auto max-w-7xl space-y-2 text-center text-xs text-gray-400">
            <p className="font-medium text-gray-500">DealDrop — Best deals aggregated hourly from across the web</p>
            <p>
              As an Amazon Associate I earn from qualifying purchases. Some links on this site are
              affiliate links — if you buy through them, we may earn a small commission at no extra
              cost to you.
            </p>
            <p>Prices and availability are accurate at time of posting and may change.</p>
            <p className="pt-1">© {new Date().getFullYear()} DealDrop. Free to use — no subscription required.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
