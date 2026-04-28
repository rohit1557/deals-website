"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { COUNTRIES } from "@/lib/types";
import clsx from "clsx";

export default function CountryFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = params.get("country") ?? "";

  const toggle = (code: string) => {
    const next = new URLSearchParams(params.toString());
    if (active === code) next.delete("country");
    else next.set("country", code);
    next.delete("page");
    startTransition(() => router.push(`/?${next.toString()}`));
  };

  return (
    <div className={clsx("flex gap-2 transition-opacity duration-150", isPending && "opacity-50 pointer-events-none")}>
      {COUNTRIES.map(({ code, label, flag }) => (
        <button
          key={code}
          onClick={() => toggle(code)}
          className={clsx(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150 shadow-sm",
            active === code
              ? "bg-indigo-600 text-white shadow-indigo-200 shadow-md"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <span>{flag}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
