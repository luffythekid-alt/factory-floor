import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border backdrop-blur-sm bg-bg/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-green pulse-dot" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent-green/20 animate-ping" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-accent-green">Factory</span>
            <span className="text-txt/80"> Floor</span>
          </h1>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm font-mono text-txt-secondary hover:text-accent-green hover:bg-white/[0.03] rounded transition-all"
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className="px-3 py-1.5 text-sm font-mono text-txt-secondary hover:text-accent-green hover:bg-white/[0.03] rounded transition-all"
          >
            About
          </Link>
          {/* Submit link in footer only */}
        </nav>
      </div>
    </header>
  );
}
