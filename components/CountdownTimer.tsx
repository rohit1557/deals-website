"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface Props {
  expiresAt: Date;
  className?: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function CountdownTimer({ expiresAt, className = "" }: Props) {
  const [remaining, setRemaining] = useState(() =>
    new Date(expiresAt).getTime() - Date.now()
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff);
      if (diff <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return null;

  return (
    <span className={`flex items-center gap-1 text-[11px] font-bold text-amber-600 ${className}`}>
      <Timer className="h-3 w-3 shrink-0" />
      {formatCountdown(remaining)}
    </span>
  );
}
