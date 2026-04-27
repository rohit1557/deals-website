import Image from "next/image";
import { cn } from "@/lib/utils";

export type Deal = {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  merchantName: string;
  merchantLogoUrl?: string;
  dealUrl: string;
  expiresAt?: Date | null;
};

type DealCardProps = {
  deal: Deal;
  className?: string;
};

export default function DealCard({ deal, className }: DealCardProps) {
  const isExpired = deal.expiresAt
    ? new Date(deal.expiresAt) < new Date()
    : false;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden",
        isExpired && "opacity-50 grayscale pointer-events-none",
        className
      )}
    >
      {/* Discount Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white">
          -{deal.discountPercent}%
        </span>
      </div>

      {/* Merchant Logo Slot */}
      <div className="flex h-12 items-center px-4 pt-4">
        {deal.merchantLogoUrl ? (
          <Image
            src={deal.merchantLogoUrl}
            alt={deal.merchantName}
            width={80}
            height={32}
            className="object-contain"
          />
        ) : (
          <span className="text-sm font-medium text-zinc-500">
            {deal.merchantName}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-900">
          {deal.title}
        </h2>
        <p className="line-clamp-3 text-sm text-zinc-500">
          {deal.description}
        </p>

        {/* Pricing */}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-xl font-bold text-zinc-900">
            ${deal.discountedPrice.toFixed(2)}
          </span>
          <span className="text-sm text-zinc-400 line-through">
            ${deal.originalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-zinc-100 px-4 py-3">
        <a
          href={deal.dealUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-indigo-600 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Get Deal
        </a>
      </div>
    </article>
  );
}
