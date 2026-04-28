import { Suspense } from "react";
import { db } from "@/lib/db";
import DealCard from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import SortSelector from "@/components/SortSelector";
import Pagination from "@/components/Pagination";
import type { Deal } from "@/lib/types";

interface PageProps {
  searchParams: { q?: string; category?: string; sort?: string; page?: string; limit?: string };
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
): Promise<{ deals: Deal[]; total: number }> {
  const where = {
    isActive: true,
    ...(category ? { category } : {}),
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

async function getSiteStats() {
  const [active, sources, fresh] = await Promise.all([
    db.deal.count({ where: { isActive: true } }),
    db.deal.groupBy({ by: ["source"], where: { isActive: true } }).then((r) => r.length),
    db.deal.count({
      where: { isActive: true, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return { active, sources, fresh };
}

export default async function HomePage({ searchParams }: PageProps) {
  const page  = Math.max(1, parseInt(searchParams.page  ?? "1",  10));
  const limit = Math.min(96, Math.max(12, parseInt(searchParams.limit ?? "24", 10)));
  const sort  = searchParams.sort ?? "newest";

  const [{ deals, total }, stats] = await Promise.all([
    getDeals(searchParams.q, searchParams.category, sort, page, limit),
    getSiteStats(),
  ]);

  const isFiltered = !!(searchParams.q || searchParams.category);

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-indigo-900 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight">
          🏷️ Today&apos;s Best <span className="text-orange-400">AU Deals</span>
        </h1>
        <p className="mt-1 text-slate-300 text-sm">
          Handpicked from OzBargain and more — updated every hour.
        </p>
        {/* Stats strip */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <span className="text-2xl font-extrabold text-orange-400">{stats.active}</span>
            <span className="text-xs text-slate-300 leading-tight">active<br/>deals</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <span className="text-2xl font-extrabold text-emerald-400">{stats.fresh}</span>
            <span className="text-xs text-slate-300 leading-tight">added<br/>today</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
            <span className="text-2xl font-extrabold text-sky-400">{stats.sources}</span>
            <span className="text-xs text-slate-300 leading-tight">live<br/>sources</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
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

      {/* ── Results header ── */}
      {isFiltered && (
        <p className="text-sm text-gray-500">
          {total === 0 ? "No deals match your filters" : `${total} deal${total !== 1 ? "s" : ""} found`}
        </p>
      )}

      {/* ── Grid ── */}
      {deals.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600">No deals found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <>
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
    </div>
  );
}

export const revalidate = 300;
