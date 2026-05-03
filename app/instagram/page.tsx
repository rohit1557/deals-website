import { db } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DealDrop — Latest Instagram Deals",
  description: "All deals featured on our Instagram, updated daily. Best Amazon AU price drops.",
};

export const revalidate = 0;

const AFFILIATE_TAG = "dealdrop0d5-22";

interface RawRow {
  asin: string;
  title: string | null;
  url: string | null;
  deal_price: string | null;
  savings: string | null;
  drop_pct: number | null;
  posted_at: Date;
}

interface PostRow {
  asin: string;
  title: string | null;
  url: string;
  dealPrice: number | null;
  savings: number | null;
  dropPct: number | null;
  postedAt: Date;
}

async function getPosts(): Promise<PostRow[]> {
  let rows: RawRow[] = [];

  try {
    // Join instagram_posted (every ASIN ever posted) with instagram_posts (rich data added later)
    rows = await db.$queryRaw<RawRow[]>`
      SELECT
        ip.asin,
        p.title,
        p.url,
        p.deal_price::text  AS deal_price,
        p.savings::text     AS savings,
        p.drop_pct,
        ip.posted_at
      FROM instagram_posted ip
      LEFT JOIN instagram_posts p ON p.asin = ip.asin
      ORDER BY ip.posted_at DESC
      LIMIT 50
    `;
  } catch {
    // instagram_posts table doesn't exist yet — fall back to asin-only
    try {
      rows = await db.$queryRaw<RawRow[]>`
        SELECT asin, NULL::text AS title, NULL::text AS url,
               NULL::text AS deal_price, NULL::text AS savings,
               NULL::int  AS drop_pct, posted_at
        FROM instagram_posted
        ORDER BY posted_at DESC
        LIMIT 50
      `;
    } catch {
      return [];
    }
  }

  return rows.map((r) => ({
    asin:      r.asin,
    title:     r.title ?? null,
    url:       r.url ?? `https://www.amazon.com.au/dp/${r.asin}?tag=${AFFILIATE_TAG}`,
    dealPrice: r.deal_price != null ? parseFloat(r.deal_price) : null,
    savings:   r.savings    != null ? parseFloat(r.savings)    : null,
    dropPct:   r.drop_pct   ?? null,
    postedAt:  new Date(r.posted_at),
  }));
}

function formatAUD(price: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
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
            <span className="ml-2 text-xs text-white/40 font-medium">@audealdrop</span>
          </div>
          <a
            href="https://instagram.com/audealdrop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold bg-gradient-to-r from-pink-500 to-orange-400 text-white px-3 py-1.5 rounded-full"
          >
            Follow ↗
          </a>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <p className="text-center text-sm text-white/40 pb-2">
          🛒 Every deal we&apos;ve posted — tap to shop on Amazon AU
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-white/30 text-sm">
            No posts yet — check back after our next deal drop!
          </div>
        ) : (
          posts.map((post) => (
            <a
              key={post.asin + post.postedAt.toISOString()}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block group"
            >
              <div className="bg-white/5 hover:bg-white/10 border border-white/[0.08] hover:border-indigo-500/50 rounded-2xl p-4 transition-all duration-200">
                <div className="flex items-start gap-3">
                  {/* Amazon product thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-white flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://m.media-amazon.com/images/P/${post.asin}.01._SX100_.jpg`}
                      alt=""
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {post.title ? (
                      <>
                        <p className="text-sm font-semibold text-white/90 leading-snug line-clamp-2">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {post.dealPrice != null && (
                            <span className="text-green-400 font-bold text-sm">
                              {formatAUD(post.dealPrice)}
                            </span>
                          )}
                          {post.savings != null && post.savings > 0 && (
                            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                              SAVE {formatAUD(post.savings)}
                            </span>
                          )}
                          <span className="text-white/25 text-xs ml-auto">
                            {timeAgo(post.postedAt)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white/50 italic">View deal on Amazon AU</p>
                        <span className="text-white/25 text-xs">{timeAgo(post.postedAt)}</span>
                      </div>
                    )}
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
