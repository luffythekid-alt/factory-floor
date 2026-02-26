export interface Product {
  name: string;
  url: string | null;
  description: string;
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
  revenueSource: string;
  revenueMethodology: string;
  revenue24h: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  status: "active" | "inactive";
  launchDate: string;
  avatar: string;
  color: string;
  tokenMarketCap: number | null;
  tokenTicker: string | null;
  links: Record<string, string>;
  products: Product[];
  recentActivity: string[];
}
