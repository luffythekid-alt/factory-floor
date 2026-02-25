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
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 border border-white/5"
            style={{
              backgroundColor: agent.color + "15",
              color: agent.color,
            }}
          >
            {agent.name.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{agent.name}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                  agent.status === "active"
                    ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                    : "bg-accent-red/10 text-accent-red border border-accent-red/20"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="text-txt-secondary text-sm mt-1 font-mono">{agent.category}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Revenue"
            value={formatRevenue(agent.totalRevenue)}
            accent
          />
          <StatCard
            label="Weekly"
            value={formatRevenue(agent.revenue7d)}
          />
          <StatCard
            label="24h"
            value={formatRevenue(agent.revenue24h)}
          />
          <StatCard
            label="Since"
            value={formatDate(agent.launchDate)}
          />
        </div>

        {/* Description */}
        <Section title="About">
          <p className="text-txt-secondary text-sm leading-relaxed">
            {agent.description}
          </p>
        </Section>

        {/* Revenue Details */}
        <Section title="Revenue Methodology">
          <div className="space-y-3 text-sm">
            <DetailRow label="Source" value={agent.revenueSource} />
            <DetailRow label="Methodology" value={agent.revenueMethodology} />
            <DetailRow label="Launch" value={formatDate(agent.launchDate)} />
          </div>
        </Section>

        {/* Links */}
        {Object.keys(agent.links).length > 0 && (
          <Section title="Links">
            <div className="flex flex-wrap gap-2">
              {Object.entries(agent.links).map(([label, url]) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] border border-border rounded-md text-xs font-mono text-txt-secondary hover:text-accent-green hover:border-accent-green/20 hover:bg-accent-green/5 transition-all"
                >
                  {label}
                  <span className="text-txt-tertiary">↗</span>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Recent Activity */}
        {agent.recentActivity.length > 0 && (
          <Section title="Recent Activity">
            <div className="space-y-2">
              {agent.recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-txt-secondary"
                >
                  <span className="text-accent-green mt-0.5 shrink-0 text-xs">▸</span>
                  {item}
                </div>
              ))}
            </div>
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
    <div className="relative overflow-hidden bg-white/[0.02] border border-border rounded-lg p-4">
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-green/50 to-transparent" />
      )}
      <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`text-xl font-bold font-mono mt-1.5 ${
          accent ? "text-accent-green" : "text-txt"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-txt-tertiary font-mono text-xs w-24 shrink-0 uppercase tracking-wider pt-0.5">
        {label}
      </span>
      <span className="text-txt-secondary text-sm">{value}</span>
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
      <h2 className="text-[10px] font-mono text-txt-tertiary uppercase tracking-widest mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </div>
  );
}
