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
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
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
