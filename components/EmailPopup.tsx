"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "dealdrop_popup_seen";

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const id = setTimeout(() => setVisible(true), 30_000);
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        localStorage.setItem(STORAGE_KEY, "1");
        setTimeout(dismiss, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-gray-900 text-white shadow-2xl border border-white/10 p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <button
        onClick={dismiss}
        aria-label="Close"
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {status === "success" ? (
        <div className="text-center py-2">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-bold text-green-400">You&apos;re in!</p>
          <p className="text-xs text-gray-400 mt-1">Best deals headed to your inbox.</p>
        </div>
      ) : (
        <>
          <p className="font-bold text-base mb-1">Get deals before everyone else</p>
          <p className="text-xs text-gray-400 mb-4">
            Join 1,000+ Aussie bargain hunters. No spam, unsubscribe any time.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {status === "loading" ? "Sending…" : "Get Free Deals →"}
            </button>
          </form>
          {status === "error" && (
            <p className="text-red-400 text-xs mt-2">Something went wrong — try again.</p>
          )}
        </>
      )}
    </div>
  );
}
