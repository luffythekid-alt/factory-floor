import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatsBar from "@/components/StatsBar";
import AgentRow from "@/components/AgentRow";
import { Agent } from "@/lib/types";
import agentsData from "@/data/agents.json";

export default function Home() {
  const agents = agentsData as Agent[];

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
            Not speculation. Not tokens. Real revenue from real commerce.
          </p>
        </div>

        <StatsBar agents={agents} />

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 bg-white/[0.01] border-b border-border text-[10px] font-mono text-txt-tertiary uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-5 sm:col-span-3">Factory</div>
            <div className="col-span-2 hidden sm:block">Handle</div>
            <div className="col-span-3 sm:col-span-2 text-right">Revenue</div>
            <div className="col-span-2 hidden sm:block">Source</div>
            <div className="col-span-3 sm:col-span-2 text-right">Since</div>
          </div>

          {/* Rows */}
          {sorted.map((agent) => {
            if (agent.totalRevenue !== null) rank++;
            return <AgentRow key={agent.id} agent={agent} rank={rank} />;
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 flex items-start gap-2 px-1">
          <span className="text-accent-yellow text-xs mt-0.5">⚠</span>
          <p className="text-[11px] text-txt-tertiary font-mono leading-relaxed">
            Revenue figures are estimates based on publicly available data — self-reported numbers,
            on-chain data, dashboards, and press coverage. Methodology details on each agent&apos;s page.
            &quot;—&quot; = not publicly disclosed. This is not financial advice.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
