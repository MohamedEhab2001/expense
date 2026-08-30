import {
  Wallet,
  Landmark,
  CreditCard,
  PiggyBank,
  CircleDollarSign,
  Utensils,
  Car,
  Home,
  Plug,
  Clapperboard,
  HeartPulse,
  ShoppingBag,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Tag,
  Target,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  landmark: Landmark,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  "circle-dollar-sign": CircleDollarSign,
  utensils: Utensils,
  car: Car,
  home: Home,
  plug: Plug,
  clapperboard: Clapperboard,
  "heart-pulse": HeartPulse,
  "shopping-bag": ShoppingBag,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  tag: Tag,
  target: Target,
};

export function getIcon(key: string): LucideIcon {
  return ICON_MAP[key] ?? Tag;
}

export const ACCOUNT_ICON_OPTIONS = ["wallet", "landmark", "credit-card", "piggy-bank", "circle-dollar-sign"];
export const CATEGORY_ICON_OPTIONS = [
  "utensils",
  "car",
  "home",
  "plug",
  "clapperboard",
  "heart-pulse",
  "shopping-bag",
  "briefcase",
  "laptop",
  "more-horizontal",
];
export const GOAL_ICON_OPTIONS = ["target", "piggy-bank", "home", "car", "circle-dollar-sign"];

export const COLOR_PALETTE = [
  "#34D399",
  "#60A5FA",
  "#F59E0B",
  "#F472B6",
  "#A78BFA",
  "#FB7185",
  "#38BDF8",
  "#94A3B8",
];
