import Image from "next/image";
import { Badge } from "@/components/ui/badge";
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
    <a
      href={dealUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden",
        isExpired && "opacity-50 pointer-events-none grayscale"
      )}
    >
      {/* Merchant header */}
      <div className="flex items-center gap-2 px-4 pt-4">
        {merchantLogoUrl ? (
          <Image
            src={merchantLogoUrl}
            alt={`${merchantName} logo`}
            width={24}
            height={24}
            className="rounded-full object-contain"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-zinc-100" />
        )}
        <span className="text-xs font-medium text-zinc-500">{merchantName}</span>
        {isExpired && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Expired
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 px-4 py-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="line-clamp-2 text-xs text-zinc-500">{description}</p>
        )}
      </div>

      {/* Pricing footer */}
      <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-3">
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-bold">
          -{discountPercent}%
        </Badge>
        <span className="text-base font-bold text-zinc-900">
          ${discountedPrice.toFixed(2)}
        </span>
        <span className="ml-auto text-xs text-zinc-400 line-through">
          ${originalPrice.toFixed(2)}
        </span>
      </div>
    </a>
  );
}

export default DealCard;
