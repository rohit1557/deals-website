import { Suspense } from "react";
import { db } from "@/lib/db";
import DealCard from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import type { Deal } from "@/lib/types";

interface PageProps {
  searchParams: { q?: string; category?: string };
}

async function getDeals(search?: string, category?: string): Promise<Deal[]> {
  const deals = await db.deal.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title:       { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  // Prisma Decimal → number coercion for the client type
  return deals.map((d) => ({
    ...d,
    originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
    dealPrice:     d.dealPrice     ? Number(d.dealPrice)     : null,
  })) as Deal[];
}

async function getActiveCount(category?: string): Promise<number> {
  return db.deal.count({
    where: { isActive: true, ...(category ? { category } : {}) },
  });
}

export default async function HomePage({ searchParams }: PageProps) {
  const [deals, totalActive] = await Promise.all([
    getDeals(searchParams.q, searchParams.category),
    getActiveCount(searchParams.category),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Best Deals</h1>
        <p className="text-sm text-gray-500 mt-1">
          {deals.length} active deals — updated hourly
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>
      <Suspense>
        <CategoryFilter />
      </Suspense>

      {/* Deal grid */}
      {deals.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-medium">No deals found</p>
          <p className="text-sm">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}

export const revalidate = 300; // ISR — revalidate every 5 minutes
