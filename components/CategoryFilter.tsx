"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATEGORIES } from "@/lib/types";
import clsx from "clsx";

const EMOJI: Record<string, string> = {
  Tech: "💻", Fashion: "👗", Home: "🏠", Food: "🍕",
  Travel: "✈️", Gaming: "🎮", Beauty: "💄", Other: "🏷️",
};

export default function CategoryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const active = params.get("category") ?? "";

  const toggle = (cat: string) => {
    const next = new URLSearchParams(params.toString());
    if (active === cat) {
      next.delete("category");
    } else {
      next.set("category", cat);
    }
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => toggle(cat)}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            active === cat
              ? "bg-blue-600 text-white shadow"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <span>{EMOJI[cat]}</span>
          {cat}
        </button>
      ))}
    </div>
  );
}
