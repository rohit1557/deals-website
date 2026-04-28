"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { CATEGORIES } from "@/lib/types";
import clsx from "clsx";

const CAT_META: Record<string, { emoji: string; active: string; idle: string }> = {
  Tech:    { emoji: "💻", active: "bg-blue-600 text-white shadow-blue-200",    idle: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
  Fashion: { emoji: "👗", active: "bg-pink-500 text-white shadow-pink-200",    idle: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100" },
  Home:    { emoji: "🏠", active: "bg-amber-500 text-white shadow-amber-200",  idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  Food:    { emoji: "🍕", active: "bg-green-600 text-white shadow-green-200",  idle: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
  Travel:  { emoji: "✈️", active: "bg-sky-500 text-white shadow-sky-200",      idle: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
  Gaming:  { emoji: "🎮", active: "bg-purple-600 text-white shadow-purple-200",idle: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
  Beauty:  { emoji: "💄", active: "bg-fuchsia-500 text-white shadow-fuchsia-200", idle: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100" },
  Other:   { emoji: "🏷️", active: "bg-slate-600 text-white shadow-slate-200",  idle: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100" },
};

export default function CategoryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = params.get("category") ?? "";

  const toggle = (cat: string) => {
    const next = new URLSearchParams(params.toString());
    if (active === cat) next.delete("category");
    else next.set("category", cat);
    next.delete("page");
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  return (
    <div className={clsx("flex flex-wrap gap-2 transition-opacity duration-150", isPending && "opacity-50 pointer-events-none")}>
      {CATEGORIES.map((cat) => {
        const meta = CAT_META[cat] ?? CAT_META["Other"];
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 shadow-sm",
              active === cat ? `${meta.active} shadow-md` : meta.idle
            )}
          >
            <span>{meta.emoji}</span>
            {cat}
          </button>
        );
      })}
    </div>
  );
}
