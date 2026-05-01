export type Deal = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  originalPrice: number | null;
  dealPrice: number | null;
  discountPct: number | null;
  category: string | null;
  source: string | null;
  currency?: string;
  country?: string;
  discountPercentage?: number | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  votes?: number;
  commentsCount?: number;
};

export type Category =
  | "Tech"
  | "Fashion"
  | "Home"
  | "Food"
  | "Travel"
  | "Gaming"
  | "Beauty"
  | "Other";

export const CATEGORIES: Category[] = [
  "Tech", "Fashion", "Home", "Food", "Travel", "Gaming", "Beauty", "Other",
];

export type Country = "AU" | "IN";
export const COUNTRIES: { code: Country; label: string; flag: string }[] = [
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "IN", label: "India",     flag: "🇮🇳" },
];
