export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-txt-tertiary">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green pulse-dot" />
            <span>Factory Floor — tracking autonomous software factories</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Data updated manually + scrapers</span>
            <span>·</span>
            <a
              href="https://x.com/luffy_____luffy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-green transition-colors"
            >
              Submit an agent →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
