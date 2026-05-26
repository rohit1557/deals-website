import { Suspense } from "react";
import { db } from "@/lib/db";
import DealCard from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import { ShieldCheck, Clock, Store, Star, Flame } from "lucide-react";
import type { Deal } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "India Deals — DealDrop AU | Flipkart, Amazon IN & DesiDime",
  description:
    "Best deals from Flipkart, Amazon India, DesiDime and r/IndiaDeals — curated for the Indian diaspora in Australia. Updated every hour.",
};

interface PageProps {
  searchParams: { q?: string; sort?: string; page?: string };
}

function getOrderBy(sort: string) {
  switch (sort) {
    case "discount":  return { discountPct: "desc" as const };
    case "popular":   return { votes:       "desc" as const };
    case "price_asc": return { dealPrice:   "asc"  as const };
    default:          return { createdAt:   "desc" as const };
  }
}

async function getIndiaDeals(search?: string, sort = "newest", page = 1, limit = 24) {
  const where = {
    isActive: true,
    country: "IN",
    ...(search
      ? {
          OR: [
            { title:    { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
            { source:   { contains: search, mode: "insensitive" as const } },
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

async function getIndiaStats() {
  const [active, sources, fresh] = await Promise.all([
    db.deal.count({ where: { isActive: true, country: "IN" } }),
    db.deal.groupBy({ by: ["source"], where: { isActive: true, country: "IN" } }).then((r) => r.length),
    db.deal.count({ where: { isActive: true, country: "IN", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return { active, sources, fresh };
}

async function getIndiaTopDeals() {
  const rows = await db.deal.findMany({
    where: { isActive: true, country: "IN", discountPct: { gte: 30 } },
    orderBy: [{ votes: "desc" }, { discountPct: "desc" }],
    take: 4,
  });
  return rows.map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];
}

export default async function IndiaDealsPage({ searchParams }: PageProps) {
  const page  = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const sort  = searchParams.sort ?? "newest";
  const isFiltered = !!searchParams.q;

  const [{ deals, total }, stats, topDeals] = await Promise.all([
    getIndiaDeals(searchParams.q, sort, page),
    getIndiaStats(),
    isFiltered ? Promise.resolve([]) : getIndiaTopDeals(),
  ]);

  return (
    <div className="space-y-8">

      {/* ── Hero ── */}
      {!isFiltered && (
        <section className="relative rounded-3xl overflow-hidden text-white px-6 py-12 sm:px-12"
          style={{ background: "linear-gradient(135deg, #FF9933 0%, #FF7B00 30%, #ffffff 50%, #138808 70%, #0a5e04 100%)" }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <span className="text-4xl">🇮🇳</span>
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300" />
                </span>
                {stats.active} live India deals
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4 drop-shadow">
              India Deals<br />
              <span className="text-orange-200">for the Desi diaspora</span>
            </h1>
            <p className="text-white/90 text-base sm:text-lg mb-7 leading-relaxed max-w-xl drop-shadow-sm">
              Best picks from Flipkart, Amazon India, DesiDime and r/IndiaDeals — curated every hour.
              Perfect for Indian families in Australia shopping back home.
            </p>
            <div className="flex flex-wrap gap-2.5 text-sm">
              {[
                { Icon: ShieldCheck, text: "Verified deals" },
                { Icon: Clock,       text: "Hourly refresh" },
                { Icon: Star,        text: "Free, no signup" },
                { Icon: Store,       text: `${stats.sources}+ sources` },
              ].map(({ Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-white/90">
                  <Icon className="h-3.5 w-3.5" /> {text}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Category quick-links for Desi shoppers ── */}
      {!isFiltered && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "📱 Electronics",   q: "electronics" },
            { label: "👗 Fashion",        q: "fashion" },
            { label: "💄 Beauty",         q: "beauty" },
            { label: "🍽️ Kitchen",        q: "kitchen" },
            { label: "🏠 Home",           q: "home" },
            { label: "📚 Books",          q: "books" },
          ].map(({ label, q }) => (
            <a
              key={q}
              href={`/india-deals?q=${q}`}
              className="text-sm font-medium bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── Top picks ── */}
      {!isFiltered && topDeals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Top Picks Right Now</h2>
            <span className="text-xs text-gray-400">Highest discount + community votes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {topDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} featured />
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

      {/* ── Deal count ── */}
      <div className="flex items-center justify-between">
        <div>
          {isFiltered ? (
            <p className="text-sm text-gray-600 font-medium">
              {total === 0 ? "No India deals match your search" : `${total} deal${total !== 1 ? "s" : ""} found`}
            </p>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-gray-900">All India Deals</h2>
              <p className="text-sm text-gray-500 mt-0.5">{stats.active} active · {stats.fresh} added today</p>
            </div>
          )}
        </div>
        {isFiltered && (
          <a href="/india-deals" className="text-sm text-orange-600 hover:underline font-medium">Clear search</a>
        )}
      </div>

      {/* ── Deal grid ── */}
      {deals.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🇮🇳</p>
          <p className="font-semibold text-gray-600 text-lg">No India deals found</p>
          <p className="text-sm mt-2">Check back soon — new deals are added every hour.</p>
          <a href="/india-deals" className="mt-4 inline-block text-sm text-orange-600 hover:underline font-medium">View all India deals</a>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 text-center">
            Prices in INR. Verify current price on retailer site before buying.{" "}
            <a href="/about#disclosure" className="underline hover:text-gray-600">Affiliate disclosure</a>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
          <Suspense>
            <Pagination total={total} page={page} limit={24} />
          </Suspense>
        </>
      )}
    </div>
  );
}

export const revalidate = 1800;
