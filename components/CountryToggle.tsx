"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

const COUNTRIES = [
  { code: "AU", flag: "🇦🇺", label: "Australia", short: "AU" },
  { code: "IN", flag: "🇮🇳", label: "India",     short: "IN" },
] as const;

function detectCountry(): "AU" | "IN" {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "IN";
    const lang = navigator.language?.toLowerCase() ?? "";
    if (lang.startsWith("en-in") || lang.startsWith("hi")) return "IN";
  } catch {}
  return "AU";
}

export default function CountryToggle() {
  const router     = useRouter();
  const params     = useSearchParams();
  const didInit    = useRef(false);
  const activeCode = (params.get("country") ?? "AU") as "AU" | "IN";

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const current = params.get("country");

    if (current) {
      // URL is authoritative — persist it
      localStorage.setItem("dealdrop_country", current);
      return;
    }

    // No URL param: restore saved preference or auto-detect
    const saved     = localStorage.getItem("dealdrop_country") as "AU" | "IN" | null;
    const preferred = saved ?? detectCountry();

    if (preferred === "IN") {
      localStorage.setItem("dealdrop_country", "IN");
      const next = new URLSearchParams(params.toString());
      next.set("country", "IN");
      router.replace(`/?${next.toString()}`, { scroll: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function select(code: "AU" | "IN") {
    const next = new URLSearchParams(params.toString());
    next.delete("page");

    if (code === "AU") {
      next.delete("country");
      localStorage.removeItem("dealdrop_country");
    } else {
      next.set("country", code);
      localStorage.setItem("dealdrop_country", code);
    }

    router.push(`/?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center bg-gray-100 rounded-full p-0.5 shrink-0">
      {COUNTRIES.map(({ code, flag, label, short }) => (
        <button
          key={code}
          onClick={() => select(code)}
          aria-label={`Switch to ${label} deals`}
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 select-none whitespace-nowrap",
            activeCode === code
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <span>{flag}</span>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{short}</span>
        </button>
      ))}
    </div>
  );
}
