import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DealDrop — Latest Instagram Deals",
  description: "All deals featured on our Instagram, updated daily. Best Amazon AU price drops.",
};

export const revalidate = 0; // always fresh — no static caching

interface InstagramPost {
  id: string;
  asin: string;
  title: string;
  url: string;
  deal_price: number | null;
  savings: number | null;
  drop_pct: number | null;
  posted_at: string;
}

async function getPosts(): Promise<InstagramPost[]> {
  try {
    const rows = await db.$queryRaw<InstagramPost[]>`
      SELECT id, asin, title, url, deal_price, savings, drop_pct, posted_at
      FROM instagram_posts
      ORDER BY posted_at DESC
      LIMIT 50
    `;
    return rows;
  } catch {
    return [];
  }
}

function formatAUD(price: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

export default async function InstagramPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              DealDrop
            </span>
            <span className="ml-2 text-xs text-white/40 font-medium">@dealdrop.contact</span>
          </div>
          <a
            href="https://instagram.com/dealdrop.contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold bg-gradient-to-r from-pink-500 to-orange-400 text-white px-3 py-1.5 rounded-full"
          >
            Follow ↗
          </a>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {/* Sub-heading */}
        <p className="text-center text-sm text-white/40 pb-2">
          🛒 All deals from our posts — tap to shop
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No posts yet — check back after our next deal drop!
          </div>
        ) : (
          posts.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block group"
            >
              <div className="bg-white/5 hover:bg-white/10 border border-white/8 hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-200">
                <div className="flex items-start gap-3">
                  {/* Amazon thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://m.media-amazon.com/images/P/${post.asin}.01._SX100_.jpg`}
                      alt=""
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 leading-snug line-clamp-2">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {post.deal_price != null && (
                        <span className="text-green-400 font-bold text-sm">
                          {formatAUD(Number(post.deal_price))}
                        </span>
                      )}
                      {post.savings != null && Number(post.savings) > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          SAVE {formatAUD(Number(post.savings))}
                        </span>
                      )}
                      <span className="text-white/25 text-xs ml-auto">
                        {timeAgo(post.posted_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Shop on Amazon AU →
                </div>
              </div>
            </a>
          ))
        )}

        <p className="text-center text-xs text-white/20 pt-4 pb-8">
          Affiliate links · Prices may change · dealdrop.au
        </p>
      </div>
    </div>
  );
}
