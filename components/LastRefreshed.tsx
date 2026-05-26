"use client";
import { useEffect, useState } from "react";

function relativeTime(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LastRefreshed() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let updatedAt: Date | null = null;

    const tick = () => {
      if (updatedAt) setLabel(relativeTime(updatedAt));
    };

    fetch("/api/last-updated")
      .then((r) => r.json())
      .then(({ updatedAt: ua }: { updatedAt: string | null }) => {
        if (ua) { updatedAt = new Date(ua); tick(); }
      })
      .catch(() => {});

    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!label) return null;

  return (
    <span className="text-xs text-gray-400 font-medium hidden sm:block">
      Updated {label}
    </span>
  );
}
