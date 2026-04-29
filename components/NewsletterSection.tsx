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
        <h2 className="text-xl font-bold mb-1">Join 1,000+ Aussie bargain hunters</h2>
        <p className="text-gray-400 text-sm">No spam. Just the top deals of the day, straight to your inbox.</p>
      </div>
      {status === "success" ? (
        <p className="text-green-400 font-semibold text-sm">You&apos;re in! Check your inbox for the best deals.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 sm:w-60 rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            {status === "loading" ? "Sending…" : "Get Free Deals →"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-red-400 text-xs mt-1">Something went wrong — please try again.</p>
      )}
    </section>
  );
}
