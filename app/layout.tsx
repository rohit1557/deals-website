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
        <footer className="text-center text-xs text-gray-400 py-8">
          DealDrop — deals aggregated from Slickdeals, RetailMeNot & DealNews
        </footer>
      </body>
    </html>
  );
}
