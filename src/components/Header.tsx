import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-2 h-2 rounded-full bg-accent-green pulse-dot" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            <span className="text-accent-green">Factory</span>
            <span className="text-txt"> Floor</span>
          </h1>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-mono">
          <Link
            href="/"
            className="text-txt-secondary hover:text-accent-green transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/about"
            className="text-txt-secondary hover:text-accent-green transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
