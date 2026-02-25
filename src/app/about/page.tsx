import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
          What Are{" "}
          <span className="text-accent-green">Autonomous Software Factories</span>?
        </h1>

        <div className="space-y-6 text-txt-secondary text-sm leading-relaxed">
          <p>
            Autonomous Software Factories are AI agents that independently build,
            ship, and sell real products and services — generating actual revenue
            from real customers. Not speculation. Not token pumps. Real commerce.
          </p>

          <p>
            These agents operate with minimal human oversight. They identify
            opportunities, build products, handle marketing, process payments, and
            iterate based on results. Some build apps. Some create art. Some run
            entire marketplaces.
          </p>

          <Section title="Why This Matters">
            <p>
              We&apos;re witnessing the emergence of a new economic layer — one
              where AI agents are genuine economic participants. They earn money,
              spend money, hire humans, and compete in markets. This isn&apos;t
              science fiction; it&apos;s happening right now.
            </p>
            <p className="mt-3">
              Factory Floor tracks the agents that are actually doing it — the
              ones generating real revenue from real products. We separate signal
              from noise by focusing on verified commercial output, not hype
              metrics.
            </p>
          </Section>

          <Section title="What We Track">
            <ul className="space-y-2 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-green shrink-0">›</span>
                <span>
                  <strong className="text-txt">Product Revenue</strong> — Agents
                  that build and sell actual products or services (apps, art,
                  digital goods, freelance work)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green shrink-0">›</span>
                <span>
                  <strong className="text-txt">Marketplace Revenue</strong> —
                  Agents that operate or participate in marketplaces, earning
                  through fees or gig completion
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-green shrink-0">›</span>
                <span>
                  <strong className="text-txt">Verified Figures</strong> —
                  Revenue from public dashboards, on-chain data, press coverage,
                  or creator-confirmed announcements
                </span>
              </li>
            </ul>
          </Section>

          <Section title="What We Don't Track">
            <ul className="space-y-2 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-accent-red shrink-0">✕</span>
                <span>Token speculation or market cap as &quot;revenue&quot;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-red shrink-0">✕</span>
                <span>Social media influence without commercial output</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-red shrink-0">✕</span>
                <span>Trading bots (separate category — real but different)</span>
              </li>
            </ul>
          </Section>

          <Section title="Methodology">
            <p>
              Revenue figures are estimates based on the best publicly available
              data. Each agent page includes a methodology note explaining the
              source and confidence level of the numbers shown. When exact
              figures aren&apos;t available, we note it clearly.
            </p>
            <p className="mt-3">
              This is a living dashboard. Data is updated regularly through a
              combination of automated scrapers and manual verification. If you
              have corrections or want to add an agent,{" "}
              <a
                href="https://x.com/factoryfloor"
                className="text-accent-green hover:underline"
              >
                reach out on X
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
      <Footer />
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
    <div>
      <h2 className="text-xs font-mono text-txt-tertiary uppercase tracking-wider mb-3 mt-8 border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
