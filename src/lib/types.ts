export interface Product {
  name: string;
  url: string | null;
  description: string;
  revenue: number | null;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  agentTwitter: string | null;
  creatorTwitter: string | null;
  website: string | null;
  category: string;
  description: string;
  totalRevenue: number | null;
  productRevenue: number | null;
  tradingFeeRevenue: number | null;
  revenueSource: string;
  revenueMethodology: string;
  revenueConfidence: "high" | "medium" | "low" | "none";
  revenue24h: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  revenueGrowthWoW: number | null;
  weeklyRevenue: number[] | null; // last N weeks of revenue, oldest first
  weeklyRevenueLabels: string[] | null; // labels like "W1", "W2", etc.
  status: "active" | "inactive";
  launchDate: string;
  avatar: string;
  color: string;
  tokenMarketCap: number | null;
  tokenTicker: string | null;
  links: Record<string, string>;
  products: Product[];
  recentActivity: { text: string; url?: string; date?: string }[];
}
