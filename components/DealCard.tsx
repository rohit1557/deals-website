import Image from "next/image";
import { cn } from "@/lib/utils";

export interface DealCardProps {
  id: string;
  title: string;
  description?: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  merchantName: string;
  merchantLogoUrl?: string;
  dealUrl: string;
  expiresAt?: Date | null;
  isExpired?: boolean;
}

export function DealCard({
  title,
  description,
  originalPrice,
  discountedPrice,
  discountPercent,
  merchantName,
  merchantLogoUrl,
  dealUrl,
  isExpired = false,
}: DealCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden",
        isExpired && "opacity-50 grayscale pointer-events-none"
      )}
    >
      <span className="absolute top-3 left-3 z-10 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-semibold text-white">
        -{discountPercent}%
      </span>

      {isExpired && (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-zinc-400 px-2.5 py-0.5 text-xs font-semibold text-white">
          Expired
        </span>
      )}

      <div className="flex flex-col gap-3 p-4 pt-10">
        <div className="flex items-center gap-2">
          {merchantLogoUrl ? (
            <Image
              src={merchantLogoUrl}
              alt={merchantName}
              width={24}
              height={24}
              className="rounded-full object-contain"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-zinc-200" />
          )}
          <span className="text-xs font-medium text-zinc-500">{merchantName}</span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {title}
        </h3>

        {description && (
          <p className="line-clamp-2 text-xs text-zinc-500">{description}</p>
        )}

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">
            ${discountedPrice.toFixed(2)}
          </span>
          <span className="text-sm text-zinc-400 line-through">
            ${originalPrice.toFixed(2)}
          </span>
        </div>

        <a
          href={dealUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block w-full rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Get Deal
        </a>
      </div>
    </article>
  );
}

export default DealCard;
