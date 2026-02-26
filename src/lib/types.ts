export interface Agent {
  id: string;
  name: string;
  slug: string;
  twitter: string | null;
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
  links: Record<string, string>;
  recentActivity: string[];
}
