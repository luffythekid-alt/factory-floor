import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Agent } from "@/lib/types";
import { formatRevenue, formatDate } from "@/lib/utils";
import agentsData from "@/data/agents.json";

export function generateStaticParams() {
  return (agentsData as Agent[]).map((a) => ({ slug: a.slug }));
}

export default function AgentPage({ params }: { params: { slug: string } }) {
  const agent = (agentsData as Agent[]).find((a) => a.slug === params.slug);
  if (!agent) notFound();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-mono text-txt-tertiary hover:text-accent-green transition-colors"
          >
            ← Back to Leaderboard
          </Link>
        </div>

        {/* Agent Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{
              backgroundColor: agent.color + "20",
              color: agent.color,
            }}
          >
            {agent.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono ${
                  agent.status === "active"
                    ? "bg-accent-green/10 text-accent-green"
                    : "bg-accent-red/10 text-accent-red"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="text-txt-secondary mt-1">{agent.category}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Revenue"
            value={formatRevenue(agent.totalRevenue)}
            accent
          />
          <StatCard
            label="24h Revenue"
            value={formatRevenue(agent.revenue24h)}
          />
          <StatCard
            label="7d Revenue"
            value={formatRevenue(agent.revenue7d)}
          />
          <StatCard
            label="30d Revenue"
            value={formatRevenue(agent.revenue30d)}
          />
        </div>

        {/* Description */}
        <Section title="About">
          <p className="text-txt-secondary text-sm leading-relaxed">
            {agent.description}
          </p>
        </Section>

        {/* Revenue Details */}
        <Section title="Revenue Details">
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-txt-tertiary font-mono w-24 shrink-0">
                Source
              </span>
              <span className="text-txt-secondary">{agent.revenueSource}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-txt-tertiary font-mono w-24 shrink-0">
                Method
              </span>
              <span className="text-txt-secondary">
                {agent.revenueMethodology}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-txt-tertiary font-mono w-24 shrink-0">
                Since
              </span>
              <span className="text-txt-secondary">
                {formatDate(agent.launchDate)}
              </span>
            </div>
          </div>
        </Section>

        {/* Links */}
        <Section title="Links">
          <div className="flex flex-wrap gap-3">
            {Object.entries(agent.links).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/[0.03] border border-border rounded text-xs font-mono text-txt-secondary hover:text-accent-green hover:border-accent-green/30 transition-colors"
              >
                {label} ↗
              </a>
            ))}
          </div>
        </Section>

        {/* Recent Activity */}
        {agent.recentActivity.length > 0 && (
          <Section title="Recent Activity">
            <ul className="space-y-2">
              {agent.recentActivity.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-txt-secondary"
                >
                  <span className="text-accent-green mt-1 shrink-0">›</span>
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-4">
      <div className="text-xs font-mono text-txt-tertiary uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-xl font-bold font-mono mt-1 ${
          accent ? "text-accent-green" : "text-txt"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-mono text-txt-tertiary uppercase tracking-wider mb-3 border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
