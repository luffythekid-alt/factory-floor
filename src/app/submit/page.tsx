"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SubmitPage() {
  const [form, setForm] = useState({
    name: "",
    twitter: "",
    website: "",
    description: "",
    revenue: "",
    submitterTwitter: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Submit a <span className="text-accent-green">Factory</span>
        </h1>
        <p className="text-sm text-txt-secondary mb-8">
          Know an AI agent that autonomously builds and sells real products?
          We only track agents with verified product revenue — no trading bots, no token-only projects.
        </p>

        {status === "done" ? (
          <div className="border border-accent-green/30 bg-accent-green/5 rounded-lg p-6 text-center">
            <div className="text-accent-green text-lg font-bold mb-2">Submitted ✓</div>
            <p className="text-sm text-txt-secondary">
              We&apos;ll review and verify the agent. If it qualifies, it&apos;ll appear on the leaderboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Agent Name *" placeholder="e.g. Felix">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={100}
                required
                className="input-field"
                placeholder="e.g. Felix"
              />
            </Field>

            <Field label="Agent Twitter" placeholder="@handle">
              <input
                type="text"
                value={form.twitter}
                onChange={(e) => set("twitter", e.target.value)}
                maxLength={50}
                className="input-field"
                placeholder="@handle"
              />
            </Field>

            <Field label="Website / Dashboard" placeholder="https://...">
              <input
                type="text"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                maxLength={200}
                className="input-field"
                placeholder="https://..."
              />
            </Field>

            <Field label="What does it build/sell? *" placeholder="">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={500}
                required
                rows={3}
                className="input-field resize-none"
                placeholder="Describe what products or services the agent creates and sells autonomously"
              />
            </Field>

            <Field label="Known Revenue" placeholder="">
              <input
                type="text"
                value={form.revenue}
                onChange={(e) => set("revenue", e.target.value)}
                maxLength={200}
                className="input-field"
                placeholder="e.g. $10K from app sales (link to source)"
              />
            </Field>

            <Field label="Your Twitter (optional)" placeholder="@you">
              <input
                type="text"
                value={form.submitterTwitter}
                onChange={(e) => set("submitterTwitter", e.target.value)}
                maxLength={50}
                className="input-field"
                placeholder="@you"
              />
            </Field>

            <button
              type="submit"
              disabled={status === "sending" || !form.name || !form.description}
              className="w-full py-3 px-4 bg-accent-green/10 border border-accent-green/30 text-accent-green font-mono text-sm rounded-lg hover:bg-accent-green/20 hover:border-accent-green/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "sending" ? "Submitting..." : "Submit for Review"}
            </button>

            {status === "error" && (
              <p className="text-accent-red text-sm text-center">
                Something went wrong. Try again.
              </p>
            )}
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-mono text-txt-tertiary uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
