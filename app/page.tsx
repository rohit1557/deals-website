import { Suspense } from "react";
import { db } from "@/lib/db";
import DealCard from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import { ShieldCheck, Clock, Store, Star, Zap, TrendingUp, Flame, Plane } from "lucide-react";
import { TRAVEL_DEALS } from "@/lib/travel-deals";
import CountdownTimer from "@/components/CountdownTimer";
import NewsletterSection from "@/components/NewsletterSection";
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
  const isIndia = country === "IN";
  const where = {
    isActive: true,
    // India: lower minimum (15%) — fewer extreme discounts; higher cap (90%) — fashion/electronics
    // AU: strict 40–75% range to weed out fake RRP
    discountPct: { gte: isIndia ? 15 : 40, lte: isIndia ? 90 : 75 },
    ...(country ? { country } : {}),
  };
  // Fetch extra so we have headroom after filtering promo deals
  const rows = await db.deal.findMany({
    where,
    orderBy: [{ discountPct: "desc" }, { createdAt: "desc" }],
    take: 15,
  });

  const REFERRAL_URL_PATTERNS = ["/join/", "/refer/", "/referral/", "/invite/", "/enroll/"];

  const genuine = rows.filter((d) => {
    const text = d.title.toLowerCase();
    const url  = d.url.toLowerCase();
    return (
      !PROMO_TERMS.some((t) => text.includes(t)) &&
      !REFERRAL_URL_PATTERNS.some((p) => url.includes(p))
    );
  });

  return genuine.slice(0, 9).map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];
}

async function getEndingSoon(country?: string): Promise<Deal[]> {
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000); // next 24h
  const rows = await db.deal.findMany({
    where: {
      isActive: true,
      expiresAt: { not: null, lte: cutoff, gte: new Date() },
      ...(country ? { country } : {}),
    },
    orderBy: { expiresAt: "asc" },
    take: 4,
  });
  return rows.map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];
}

async function getAllTimeLows(country?: string): Promise<Deal[]> {
  const isIndia = country === "IN";
  const where = isIndia
    // India: best available deals from any source with verified discount
    ? { isActive: true, discountPct: { gte: 20 }, country: "IN" }
    // AU: CamelCamelCamel verified price drops only
    : { isActive: true, source: "camelcamelcamel", discountPct: { gte: 20 } };

  const rows = await db.deal.findMany({
    where,
    orderBy: { discountPct: "desc" },
    take: 4,
  });
  return rows.map((d) => ({
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
  // country is a display mode, not a search filter — sections stay visible when it's set
  const isFiltered = !!(searchParams.q || searchParams.category);

  const [{ deals, total }, stats, topDeals, endingSoon, allTimeLows] = await Promise.all([
    getDeals(searchParams.q, searchParams.category, sort, page, limit, country),
    getSiteStats(country),
    isFiltered ? Promise.resolve([]) : getTopDeals(country),
    isFiltered ? Promise.resolve([]) : getEndingSoon(country),
    isFiltered ? Promise.resolve([]) : getAllTimeLows(country),
  ]);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      {!isFiltered && (
        <section className="relative rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-12 sm:px-12 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                {stats.active} live deals right now
              </span>
              <span className="bg-white/15 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full">
                {country === "IN" ? "🇮🇳 Showing India deals" : "🇦🇺 Showing Australia deals"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              We filter out the junk.<br />
              <span className="text-blue-200">Only real deals make it here.</span>
            </h1>
            <p className="text-blue-100 text-base sm:text-lg mb-7 leading-relaxed max-w-xl">
              {country === "IN"
                ? "DealDrop tracks Amazon India, Flipkart, r/IndiaDeals and more — dropping expired prices, inflated MRPs, and fake coupons automatically."
                : "DealDrop tracks Amazon AU, OzBargain, r/AusDeals and more — automatically dropping expired prices, inflated RRPs, and dodgy voucher codes before anything hits your screen."
              }
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
            <span className="text-xs text-gray-400">Highest verified discounts right now</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} trending={i < 3} />
            ))}
          </div>
        </section>
      )}

      {/* ── Travel Picks — AU only (prices in AUD, AU destinations) ── */}
      {!isFiltered && country !== "IN" && (
        <section className="rounded-3xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-white" />
                <h2 className="text-lg font-bold text-white">Travel Picks</h2>
                <span className="text-xs text-white/70 bg-white/15 px-2 py-0.5 rounded-full">Handpicked</span>
              </div>
              <p className="text-[10px] text-white/50">
                Via Booking.com · <a href="/about#disclosure" className="underline">disclosure</a>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {TRAVEL_DEALS.map((t) => (
                <a
                  key={t.id}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl bg-white/15 backdrop-blur border border-white/20 p-4 flex flex-col gap-2 hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
                >
                  <span className="text-4xl">{t.imageEmoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-wide">{t.destination}</p>
                    <p className="text-sm font-semibold text-white leading-snug mt-0.5">
                      {t.title}
                    </p>
                  </div>
                  <span className="self-start text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                    {t.tag}
                  </span>
                  <span className="mt-auto text-xs font-bold text-sky-700 bg-white group-hover:bg-white/90 text-center py-1.5 rounded-xl transition-colors">
                    View Deals →
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── All-Time Lows (CamelCamelCamel) ── */}
      {!isFiltered && allTimeLows.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-red-500 fill-red-500" />
            <h2 className="text-lg font-bold text-gray-900">All-Time Lows</h2>
            <span className="text-xs text-gray-400">
              {country === "IN" ? "Best discounts right now" : "Verified price drops by CamelCamelCamel"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {allTimeLows.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* ── Ending Soon ── */}
      {!isFiltered && endingSoon.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">Ending Soon</h2>
            <span className="text-xs text-gray-400">These deals expire in the next 24 hours</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {endingSoon.map((deal) => (
              <div key={deal.id} className="relative">
                <DealCard deal={deal} />
                {deal.expiresAt && (
                  <div className="absolute bottom-[68px] left-4 right-4 flex justify-center">
                    <CountdownTimer expiresAt={deal.expiresAt} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
      {!isFiltered && <NewsletterSection />}

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
