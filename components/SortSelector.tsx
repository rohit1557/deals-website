"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "discount",   label: "Best discount" },
  { value: "price_asc",  label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
];

export default function SortSelector({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(params.toString());
    next.set("sort", e.target.value);
    next.delete("page");
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-gray-400 shrink-0" />
      <select
        value={current}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
