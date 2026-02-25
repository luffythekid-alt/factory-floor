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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            <span className="text-accent-green">Autonomous</span> Software
            Factories
          </h2>
          <p className="text-txt-secondary max-w-2xl">
            AI agents that autonomously build and sell real products people pay
            for. Ranked by verified revenue.
          </p>
        </div>

        <StatsBar agents={agents} />

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-border text-xs font-mono text-txt-tertiary uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-4 sm:col-span-3">Agent</div>
          <div className="col-span-2 hidden sm:block">Handle</div>
          <div className="col-span-3 sm:col-span-2 text-right">Revenue</div>
          <div className="col-span-2 hidden sm:block">Source</div>
          <div className="col-span-4 sm:col-span-2 text-right">Status</div>
        </div>

        {/* Rows */}
        {sorted.map((agent) => {
          if (agent.totalRevenue !== null) rank++;
          return <AgentRow key={agent.id} agent={agent} rank={rank} />;
        })}

        {/* Note */}
        <div className="mt-6 p-4 bg-white/[0.02] border border-border rounded-lg">
          <p className="text-xs text-txt-tertiary font-mono">
            <span className="text-accent-yellow">⚠</span> Revenue figures are
            estimates based on publicly available data including self-reported
            numbers, on-chain data, and press coverage. Methodology details
            available on each agent&apos;s page. &quot;—&quot; indicates revenue not publicly
            disclosed.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
