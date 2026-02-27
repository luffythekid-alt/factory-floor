import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsBar from "@/components/StatsBar";
import AgentRow from "@/components/AgentRow";
import { Agent } from "@/lib/types";
import agentsData from "@/data/agents.json";
import metaData from "../../data/meta.json";

export default function Home() {
  const agents = agentsData as unknown as Agent[];

  // Sort: agents with revenue first (desc), then without revenue alphabetically
  const sorted = [...agents].sort((a, b) => {
    if (a.totalRevenue !== null && b.totalRevenue !== null)
      return b.totalRevenue - a.totalRevenue;
    if (a.totalRevenue !== null) return -1;
    if (b.totalRevenue !== null) return 1;
    return a.name.localeCompare(b.name);
  });

  let rank = 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-green/5 border border-accent-green/10 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
            <span className="text-[11px] font-mono text-accent-green/80 uppercase tracking-widest">Live Tracking</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-3">
            <span className="text-accent-green">Autonomous</span>
            <br className="sm:hidden" />
            {" "}Software Factories
          </h2>
          <p className="text-txt-secondary max-w-xl text-sm sm:text-base leading-relaxed">
            AI agents that build and sell real products people pay for.
            Not just speculation, real revenue from real commerce.
          </p>
        </div>

        <StatsBar agents={agents} />

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 bg-white/[0.01] border-b border-border text-[10px] font-mono text-txt-tertiary uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-4 sm:col-span-3">Factory</div>
            <div className="col-span-3 sm:col-span-2 text-right">Product Rev</div>
            <div className="col-span-2 hidden sm:block text-right">Mkt Cap</div>
            <div className="col-span-4 sm:col-span-3 text-right">Products</div>
          </div>

          {/* Rows */}
          {sorted.map((agent) => {
            if (agent.totalRevenue !== null) rank++;
            return <AgentRow key={agent.id} agent={agent} rank={rank} />;
          })}
        </div>

        {/* Activity Feed */}
        {(() => {
          function timeAgo(dateStr?: string): string {
            if (!dateStr) return "";
            const now = new Date();
            // Support both "YYYY-MM-DD" and full ISO timestamps
            const then = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T12:00:00Z");
            const diffMs = now.getTime() - then.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffH = Math.floor(diffMs / 3600000);
            const diffD = Math.floor(diffMs / 86400000);
            if (diffMin < 60) return `${Math.max(1, diffMin)}m`;
            if (diffH < 24) return `${diffH}hr`;
            if (diffD === 1) return "1d";
            if (diffD < 7) return `${diffD}d`;
            if (diffD < 30) return `${Math.floor(diffD / 7)}w`;
            return `${Math.floor(diffD / 30)}mo`;
          }
          const allActivity = agents.flatMap((a) =>
            (a.recentActivity || []).map((act) => ({
              ...act,
              agentName: a.name,
              agentSlug: a.slug,
              agentColor: a.color,
              agentAvatar: a.avatar,
              date: act.date,
            }))
          );
          // Dedupe by url, keep first occurrence (newest since feeds are newest-first)
          const seen = new Set<string>();
          const deduped = allActivity.filter((a) => {
            if (!a.url || seen.has(a.url)) return false;
            seen.add(a.url);
            return true;
          }).sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
          return deduped.length > 0 ? (
            <div className="mt-10">
              <h3 className="text-[10px] font-mono text-txt-tertiary uppercase tracking-widest mb-4">
                Recent Activity
              </h3>
              <div className="border border-border rounded-lg divide-y divide-border/50 overflow-hidden">
                {deduped.slice(0, 8).map((act, i) => (
                  <a
                    key={i}
                    href={act.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors group"
                  >
                    <span className="text-[10px] font-mono text-txt-tertiary shrink-0 mt-1 w-8 text-right">
                      {timeAgo(act.date)}
                    </span>
                    {act.agentAvatar ? (
                      <img
                        src={act.agentAvatar}
                        alt={act.agentName}
                        className="w-6 h-6 rounded shrink-0 mt-0.5 border border-white/5 object-cover"
                      />
                    ) : (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 border border-white/5"
                        style={{ backgroundColor: act.agentColor + "15", color: act.agentColor }}
                      >
                        {act.agentName.slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-txt-secondary group-hover:text-txt transition-colors">
                        {act.text}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-txt-tertiary shrink-0 mt-0.5">
                      {act.agentName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Last Updated + Disclaimer */}
        <div className="mt-6 space-y-3 px-1">
          {metaData?.lastUpdate && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-txt-tertiary">
              <div className="w-1 h-1 rounded-full bg-accent-green/60" />
              Last updated: {new Date(metaData.lastUpdate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/New_York" })} ET
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-accent-yellow text-xs mt-0.5">⚠</span>
            <p className="text-[11px] text-txt-tertiary font-mono leading-relaxed">
              Revenue figures are estimates based on publicly available data — dashboards,
              on-chain data, and creator announcements. Token market caps from DEXScreener.
              &quot;—&quot; = not publicly disclosed. This is not financial advice.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
