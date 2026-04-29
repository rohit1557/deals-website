import { Suspense } from "react";
import { db } from "@/lib/db";
import DealCard from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import CountryFilter from "@/components/CountryFilter";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import { ShieldCheck, Clock, Store, Star, Zap, TrendingUp } from "lucide-react";
import type { Deal } from "@/lib/types";

interface PageProps {
  searchParams: { q?: string; category?: string; sort?: string; page?: string; limit?: string; country?: string };
}

function getOrderBy(sort: string) {
  switch (sort) {
    case "discount":   return { discountPct: "desc" as const };
    case "price_asc":  return { dealPrice:   "asc"  as const };
    case "price_desc": return { dealPrice:   "desc" as const };
    default:           return { createdAt:   "desc" as const };
  }
}

async function getDeals(
  search?: string,
  category?: string,
  sort = "newest",
  page = 1,
  limit = 24,
  country?: string,
): Promise<{ deals: Deal[]; total: number }> {
  const where = {
    isActive: true,
    ...(category ? { category } : {}),
    ...(country  ? { country }  : {}),
    ...(search
      ? {
          OR: [
            { title:       { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.deal.findMany({ where, orderBy: getOrderBy(sort), skip: (page - 1) * limit, take: limit }),
    db.deal.count({ where }),
  ]);

  return {
    deals: rows.map((d) => ({
      ...d,
      originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
      dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
    })) as Deal[],
    total,
  };
}

async function getSiteStats(country?: string) {
  const where = { isActive: true, ...(country ? { country } : {}) };
  const [active, sources, fresh] = await Promise.all([
    db.deal.count({ where }),
    db.deal.groupBy({ by: ["source"], where }).then((r) => r.length),
    db.deal.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return { active, sources, fresh };
}

// Keywords that flag referral/cashback/promo deals with fake RRP savings
const PROMO_TERMS = [
  "referral", "refer a friend", "refer and earn",
  "cashback", "cash back",
  "freebie", "free gift", "free sample",
  "voucher", "promo code", "coupon code",
  "gift card",
  "signup bonus", "sign-up bonus", "sign up bonus", "welcome bonus", "new customer offer",
];

async function getTopDeals(country?: string): Promise<Deal[]> {
  const where = {
    isActive: true,
    discountPct: { gte: 40, lte: 90 }, // cap at 90% — suspiciously high = likely fake RRP
    ...(country ? { country } : {}),
  };
  // Fetch extra so we have headroom after filtering promo deals
  const rows = await db.deal.findMany({
    where,
    orderBy: [{ discountPct: "desc" }, { createdAt: "desc" }],
    take: 15,
  });

  const genuine = rows.filter((d) => {
    const text = d.title.toLowerCase();
    return !PROMO_TERMS.some((t) => text.includes(t));
  });

  return genuine.slice(0, 3).map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];
}

export default async function HomePage({ searchParams }: PageProps) {
  const page    = Math.max(1, parseInt(searchParams.page  ?? "1",  10));
  const limit   = Math.min(96, Math.max(12, parseInt(searchParams.limit ?? "24", 10)));
  const sort    = searchParams.sort    ?? "newest";
  const country = searchParams.country;
  const isFiltered = !!(searchParams.q || searchParams.category || country);

  const [{ deals, total }, stats, topDeals] = await Promise.all([
    getDeals(searchParams.q, searchParams.category, sort, page, limit, country),
    getSiteStats(country),
    isFiltered ? Promise.resolve([]) : getTopDeals(country),
  ]);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      {!isFiltered && (
        <section className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-12 sm:px-12 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative max-w-2xl">
            <span className="inline-block bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              🔥 {stats.active} live deals right now
            </span>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              Real deals. Verified prices.<br />
              <span className="text-blue-200">Updated every hour.</span>
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-7 leading-relaxed max-w-xl">
              We track deals from Amazon, OzBargain, Flipkart and more — filtering
              out bad links, expired prices, and suspicious discounts automatically.
            </p>
            <div className="flex flex-wrap gap-2.5 text-sm">
              {[
                { Icon: ShieldCheck, text: "Verified links" },
                { Icon: Clock,       text: "Hourly refresh" },
                { Icon: Star,        text: "Free, no signup" },
                { Icon: Store,       text: `${stats.sources}+ sources` },
              ].map(({ Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-white/90">
                  <Icon className="h-3.5 w-3.5" /> {text}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Deals Today ── */}
      {!isFiltered && topDeals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Top Deals Today</h2>
            <span className="text-xs text-gray-400">Highest discounts right now</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* ── Country filter ── */}
      <Suspense>
        <CountryFilter />
      </Suspense>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <SortSelector current={sort} />
        </Suspense>
      </div>
      <Suspense>
        <CategoryFilter />
      </Suspense>

      {/* ── Deal count ── */}
      <div className="flex items-center justify-between">
        <div>
          {isFiltered ? (
            <p className="text-sm text-gray-600 font-medium">
              {total === 0 ? "No deals match your filters" : `${total} deal${total !== 1 ? "s" : ""} found`}
            </p>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Deals</h2>
              <p className="text-sm text-gray-500 mt-0.5">{stats.active} active · {stats.fresh} added today</p>
            </div>
          )}
        </div>
        {isFiltered && (
          <a href="/" className="text-sm text-blue-600 hover:underline font-medium">Clear filters</a>
        )}
      </div>

      {/* ── Deal grid ── */}
      {deals.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600 text-lg">
            {searchParams.q
              ? `No deals found for "${searchParams.q}"`
              : searchParams.category
                ? `No ${searchParams.category} deals right now`
                : "No deals found"}
          </p>
          <p className="text-sm mt-2 text-gray-400">
            {searchParams.q
              ? "Try a broader search term, or browse all deals below."
              : "Check back soon — new deals are added every hour."}
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline font-medium">Clear filters and view all deals</a>
        </div>
      ) : (
        <>
          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center">
            Prices and availability may change. Always check the retailer site before buying.{" "}
            <a href="/about#disclosure" className="underline hover:text-gray-600">Affiliate disclosure</a>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
          <Suspense>
            <Pagination total={total} page={page} limit={limit} />
          </Suspense>
        </>
      )}

      {/* ── Email signup ── */}
      {!isFiltered && (
        <section className="rounded-2xl bg-gradient-to-r from-gray-900 to-slate-800 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="sm:max-w-sm">
            <h2 className="text-xl font-bold mb-1">Get the best deals daily</h2>
            <p className="text-gray-400 text-sm">No spam. Just the top deals of the day, straight to your inbox.</p>
          </div>
          <form
            action="https://formspree.io/f/xvzdjlen"
            method="POST"
            className="flex gap-2 w-full sm:w-auto"
          >
            <input type="hidden" name="_subject" value="DealDrop Newsletter Signup" />
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              className="flex-1 sm:w-60 rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </section>
      )}

      {/* ── About blurb ── */}
      {!isFiltered && (
        <section className="border border-gray-100 rounded-2xl p-6 sm:p-8 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-900 text-lg">About DealDrop</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            DealDrop is an independent deal aggregator scraping Amazon AU, OzBargain, r/AusDeals,
            Flipkart, r/IndiaDeals and more — every hour, automatically. We filter out expired prices,
            suspicious discounts, and low-quality links before anything reaches this page.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/about"   className="text-blue-600 hover:underline font-medium">Learn more →</a>
            <a href="/contact" className="text-blue-600 hover:underline font-medium">Contact us</a>
            <a href="/privacy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
          </div>
        </section>
      )}
    </div>
  );
}

export const revalidate = 300;
