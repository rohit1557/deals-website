"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

interface Props {
  total: number;
  page: number;
  limit: number;
}

export default function Pagination({ total, page, limit }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.ceil(total / limit);

  const navigate = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) next.set(k, v);
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <span>Show</span>
        <div className="flex gap-1">
          {PAGE_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => navigate({ limit: String(n), page: "1" })}
              disabled={isPending}
              className={clsx(
                "rounded-lg px-2.5 py-1 text-sm font-medium transition-colors disabled:opacity-60",
                limit === n
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="hidden sm:inline">per page &middot;</span>
        <strong className="text-gray-700">{total} deals</strong>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ page: String(page - 1) })}
            disabled={page <= 1 || isPending}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm text-gray-500 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => navigate({ page: String(page + 1) })}
            disabled={page >= totalPages || isPending}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
