"use client";
import { useState } from "react";
import { Zap } from "lucide-react";
import DealCard from "@/components/DealCard";
import TopDealSearch from "@/components/TopDealSearch";
import type { Deal } from "@/lib/types";

interface TopDealSectionProps {
  deals: Deal[];
}

export default function TopDealSection({ deals }: TopDealSectionProps) {
  const [filteredDeals, setFilteredDeals] = useState(deals);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">Top Deals Today</h2>
        <span className="text-xs text-gray-400">Highest verified discounts right now</span>
      </div>
      <div className="mb-4">
        <TopDealSearch deals={deals} onFilter={setFilteredDeals} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredDeals.map((deal, i) => (
          <DealCard key={deal.id} deal={deal} trending={i < 3} />
        ))}
      </div>
    </section>
  );
}
