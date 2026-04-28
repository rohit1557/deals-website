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
    db.deal.findMany({
      where,
      orderBy: getOrderBy(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.deal.count({ where }),
  ]);

  const deals = rows.map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];

  return { deals, total };
}

export default async function HomePage({ searchParams }: PageProps) {
  const page  = Math.max(1, parseInt(searchParams.page  ?? "1",  10));
  const limit = Math.min(96, Math.max(12, parseInt(searchParams.limit ?? "24", 10)));
  const sort  = searchParams.sort ?? "newest";

  const { deals, total } = await getDeals(
    searchParams.q,
    searchParams.category,
    sort,
    page,
    limit,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Best Deals</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} active deals — updated hourly
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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

      {deals.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-medium">No deals found</p>
          <p className="text-sm">Try a different search or category</p>
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
