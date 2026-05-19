"use client";
import { Search } from "lucide-react";
import { useState } from "react";
import type { Deal } from "@/lib/types";

interface TopDealSearchProps {
  deals: Deal[];
  onFilter: (filteredDeals: Deal[]) => void;
}

export default function TopDealSearch({ deals, onFilter }: TopDealSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toLowerCase();
    setQuery(q);

    if (!q) {
      onFilter(deals);
      return;
    }

    const filtered = deals.filter((deal) => {
      const title = deal.title.toLowerCase();
      const category = (deal.category || "").toLowerCase();
      return title.includes(q) || category.includes(q);
    });

    onFilter(filtered);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="search"
        placeholder="Filter top deals by title or category…"
        value={query}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
