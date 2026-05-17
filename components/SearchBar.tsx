"use client";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useEffect, useRef } from "react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced timeout
      timeoutRef.current = setTimeout(() => {
        const next = new URLSearchParams(params.toString());
        if (q) {
          next.set("q", q);
        } else {
          next.delete("q");
        }
        startTransition(() => router.push(`/?${next.toString()}`));
      }, 300);
    },
    [params, router]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative max-w-xl w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="search"
        placeholder="Search deals…"
        defaultValue={params.get("q") ?? ""}
        onChange={handleChange}
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
