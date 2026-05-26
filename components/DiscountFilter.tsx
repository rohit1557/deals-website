"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";

const OPTIONS = [
  { label: "10%+",  value: "10"  },
  { label: "25%+",  value: "25"  },
  { label: "50%+",  value: "50"  },
];

export default function DiscountFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = params.get("minDiscount") ?? "";

  const toggle = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (active === value) next.delete("minDiscount");
    else next.set("minDiscount", value);
    next.delete("page");
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  return (
    <div className={clsx("flex items-center gap-2", isPending && "opacity-50 pointer-events-none")}>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">Off</span>
      {OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => toggle(value)}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-sm font-bold transition-all duration-150 shadow-sm shrink-0",
            active === value
              ? "bg-red-500 text-white border-red-500 shadow-red-200 shadow-md"
              : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
