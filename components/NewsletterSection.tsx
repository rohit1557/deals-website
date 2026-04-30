"use client";
import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="rounded-2xl bg-gradient-to-r from-gray-900 to-slate-800 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="sm:max-w-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Free daily digest</p>
        <h2 className="text-xl font-bold mb-2">Get the top 5 deals every day — free</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          We do the scrolling so you don&apos;t have to. One email, five real deals, no fluff.
          Unsubscribe any time with one click.
        </p>
      </div>
      {status === "success" ? (
        <div className="text-center sm:text-left">
          <p className="text-green-400 font-semibold text-sm">You&apos;re in! 🎉</p>
          <p className="text-gray-400 text-xs mt-1">First drop lands in your inbox tomorrow morning.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 sm:w-64 rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {status === "loading" ? "Sending…" : "Send Me Deals →"}
            </button>
          </div>
          {status === "error" && (
            <p className="text-red-400 text-xs">Something went wrong — please try again.</p>
          )}
          <p className="text-gray-500 text-[11px]">No spam. No affiliate noise. Just deals worth your time.</p>
        </form>
      )}
    </section>
  );
}
