import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SUBMISSIONS_FILE = path.join(process.cwd(), "data", "submissions.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, twitter, website, description, revenue, submitterTwitter } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const submission = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(name).slice(0, 100),
      twitter: String(twitter || "").slice(0, 50),
      website: String(website || "").slice(0, 200),
      description: String(description).slice(0, 500),
      revenue: String(revenue || "").slice(0, 200),
      submitterTwitter: String(submitterTwitter || "").slice(0, 50),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    let submissions: unknown[] = [];
    try {
      const raw = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
      submissions = JSON.parse(raw);
    } catch {
      // file doesn't exist yet
    }

    submissions.push(submission);
    await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));

    return NextResponse.json({ ok: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
