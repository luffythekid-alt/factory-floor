import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "luffythekid-alt/factory-floor";

// Simple in-memory rate limit: 10 submissions per IP per hour
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, twitter, website, description, revenue, submitterTwitter } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const cleanName = stripHtml(String(name).slice(0, 100));
    const cleanTwitter = stripHtml(String(twitter || "").slice(0, 50));
    const cleanWebsite = stripHtml(String(website || "").slice(0, 200));
    const cleanDesc = stripHtml(String(description).slice(0, 500));
    const cleanRevenue = stripHtml(String(revenue || "").slice(0, 200));
    const cleanSubmitter = stripHtml(String(submitterTwitter || "").slice(0, 50));

    const issueBody = [
      `## Agent Submission`,
      ``,
      `**Name:** ${cleanName}`,
      cleanTwitter ? `**Twitter:** ${cleanTwitter}` : null,
      cleanWebsite ? `**Website:** ${cleanWebsite}` : null,
      `**Description:** ${cleanDesc}`,
      cleanRevenue ? `**Revenue Info:** ${cleanRevenue}` : null,
      cleanSubmitter ? `**Submitted by:** ${cleanSubmitter}` : null,
      ``,
      `---`,
      `_Submitted via Factory Floor at ${new Date().toISOString()}_`,
    ]
      .filter(Boolean)
      .join("\n");

    if (!GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `[Submission] ${cleanName}`,
        body: issueBody,
        labels: ["submission"],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("GitHub API error:", res.status, err);
      return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
