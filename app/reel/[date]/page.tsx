import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

type ReelDeal = {
  slug: string | null;
  title: string;
  image_url: string | null;
  original_price: number | null;
  deal_price: number | null;
  discount_pct: number | null;
  url: string;
  affiliate_url: string;
};

function formatAUD(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

export default async function ReelPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const rows = await db.$queryRaw<Array<{ deals: ReelDeal[] }>>`
    SELECT deals FROM reel_posts WHERE date = ${date}::date
  `;
  if (!rows.length) notFound();

  const deals = rows[0].deals;
  const formattedDate = new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date + "T12:00:00"));

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1">
            DealDrop
          </h1>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">🔥 Top 3 Deals</p>
          <p className="text-white/50 text-xs mt-1">{formattedDate}</p>
        </div>

        <div className="flex flex-col gap-4">
          {deals.map((deal, i) => (
            <a
              key={i}
              href={deal.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors"
            >
              {deal.image_url && (
                <div className="flex items-center justify-center h-48 bg-white/5">
                  <img
                    src={deal.image_url}
                    alt={deal.title}
                    className="h-44 w-full object-contain p-3"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wide mb-1">Amazon AU</p>
                <h2 className="font-bold text-lg leading-snug mb-3">{deal.title}</h2>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-3xl font-black text-green-400">
                    {deal.deal_price != null ? formatAUD(deal.deal_price) : ""}
                  </span>
                  {deal.original_price != null && (
                    <span className="text-sm text-white/40 line-through pb-1">
                      {formatAUD(deal.original_price)}
                    </span>
                  )}
                  {deal.discount_pct != null && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {Math.round(deal.discount_pct)}% OFF
                    </span>
                  )}
                </div>
                <div className="bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-center text-sm">
                  View Deal →
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            More deals at dealdrop.au
          </Link>
        </div>
      </div>
    </main>
  );
}
