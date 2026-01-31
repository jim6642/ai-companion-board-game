import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";

export const metadata: Metadata = {
  title: "AI Models — The Wolfcha Model Arena",
  description:
    "Wolfcha is a model arena where different AI models play Werewolf (Mafia) with unique personalities and reasoning styles. Watch them argue, bluff, and deduce.",
  alternates: {
    canonical: "https://wolf-cha.com/ai-models",
  },
  openGraph: {
    title: "AI Models — Wolfcha",
    description:
      "A model arena where different AI models play Werewolf (Mafia) with unique personalities and reasoning styles.",
    url: "https://wolf-cha.com/ai-models",
    type: "website",
    images: [
      {
        url: "https://wolf-cha.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wolfcha - AI Werewolf Game",
      },
    ],
  },
};

const models = [
  "DeepSeek",
  "Qwen",
  "Kimi",
  "Gemini",
  "Seed (ByteDance)",
];

export default function AiModelsPage() {
  return (
    <MarketingPageWrapper>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-serif text-4xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          AI Model Arena
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
          Wolfcha isn’t only a Werewolf (Mafia) game — it’s also a place to observe how different AI
          models reason under uncertainty, coordinate, bluff, and read social signals through dialogue.
        </p>

        <div className="mt-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Commonly featured models</h2>
          <ul className="mt-3 grid list-disc gap-2 pl-5 text-[var(--text-secondary)] sm:grid-cols-2">
            {models.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Model availability can vary based on configuration and region.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-gold)] px-6 py-3 font-bold text-black hover:bg-[var(--color-gold-dark)]"
          >
            Play now
          </Link>
          <Link
            href="/ai-werewolf"
            className="rounded-full border border-[var(--border-color)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            What is AI Werewolf?
          </Link>
        </div>
      </div>
    </MarketingPageWrapper>
  );
}

