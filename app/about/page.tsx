import { ShieldCheck, Clock, Zap, Globe, TrendingUp, Heart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About DealDrop — Real Deals from Australia & India",
  description:
    "DealDrop is an independent deal aggregator tracking Amazon AU, OzBargain, Flipkart and more. Built by Rohit Ramesh Naik.",
};

const HOW_IT_WORKS = [
  {
    Icon: Clock,
    title: "Hourly scraping",
    body: "Our bots check OzBargain, r/AusDeals, r/IndiaDeals, Amazon and more every hour — around the clock.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    Icon: ShieldCheck,
    title: "Quality filters",
    body: "Expired links, suspicious discounts, and low-quality posts are filtered out before anything reaches this page.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    Icon: Zap,
    title: "Instant updates",
    body: "The site refreshes every 5 minutes. When a deal goes live on OzBargain it appears here within the hour.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    Icon: Globe,
    title: "AU & IN focused",
    body: "We cover Australia and India — two markets that are underserved by most deal aggregators.",
    color: "bg-purple-50 text-purple-600",
  },
];

const AU_SOURCES = ["Amazon AU", "OzBargain", "r/AusDeals", "eBay AU", "Kogan"];
const IN_SOURCES = ["Flipkart", "Amazon IN", "r/IndiaDeals", "Myntra", "Nykaa"];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl py-8 space-y-12">

      {/* Hero */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">About</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
          Real deals. No fluff.<br />
          <span className="text-blue-600">Updated every hour.</span>
        </h1>
        <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
          DealDrop is a free, independent deal aggregator tracking the best discounts from Australia
          and India. No accounts, no paywalls — just genuine savings surfaced automatically.
        </p>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-5">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map(({ Icon, title, body, color }) => (
            <div key={title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Where we find deals</h2>
        <p className="text-sm text-gray-500 mb-5">
          We track all of these sources automatically — no manual curation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">🇦🇺 Australia</p>
            <ul className="space-y-2">
              {AU_SOURCES.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">🇮🇳 India</p>
            <ul className="space-y-2">
              {IN_SOURCES.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Who runs it */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          <h2 className="text-xl font-bold text-gray-900">Who runs DealDrop</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          DealDrop is built and maintained by <span className="font-semibold text-gray-800">Rohit Ramesh Naik</span>,
          a software engineer based in Australia. It started as a side project to solve a real frustration:
          finding genuine deals across two countries without manually checking a dozen subreddits and
          deal sites every day.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          The site is free to use and always will be. If you spot a broken link, wrong price, or just
          want to say hi, use the{" "}
          <a href="/contact" className="text-blue-600 hover:underline font-medium">contact page</a>.
        </p>
      </section>

      {/* Affiliate disclosure */}
      <section id="disclosure" className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-bold text-amber-900 mb-2 text-sm uppercase tracking-widest">
          Affiliate Disclosure
        </h2>
        <p className="text-sm text-amber-800 leading-relaxed">
          Some links on DealDrop are affiliate links. When you click through and make a purchase,
          we may earn a small commission at no extra cost to you. This helps keep the site running.
          We never promote deals because of affiliate potential — only because they&apos;re genuinely good
          value. Prices are accurate at time of posting and may change.
        </p>
        <p className="text-sm text-amber-800 leading-relaxed mt-2">
          DealDrop is a participant in the Amazon Associates Programme (Australia and India).
        </p>
      </section>

    </div>
  );
}
