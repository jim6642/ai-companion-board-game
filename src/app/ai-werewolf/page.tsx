import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd, getGameJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "AI Werewolf (Mafia) Game — Play Solo with AI | Wolfcha",
  description:
    "Wolfcha is an AI-powered Werewolf (Mafia) social deduction game you can play solo in your browser. Talk, deduce, vote, and watch different AI models battle it out.",
  alternates: {
    canonical: "https://wolf-cha.com/ai-werewolf",
  },
  openGraph: {
    title: "AI Werewolf (Mafia) Game — Wolfcha",
    description:
      "Play Werewolf (Mafia) solo against AI opponents. A browser-based social deduction game with voice acting and multiple AI models.",
    url: "https://wolf-cha.com/ai-werewolf",
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

export default function AiWerewolfPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd data={getGameJsonLd()} />

      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-serif text-4xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          AI Werewolf (Mafia), playable solo
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
          Werewolf (also known as the Mafia party game) is a social deduction game about hidden roles,
          persuasion, and imperfect information. Wolfcha turns it into a single-player experience:
          every other seat is controlled by AI.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">What makes Wolfcha different</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-[var(--text-secondary)]">
            <li>Solo play: you can play Werewolf without needing a group.</li>
            <li>AI model arena: different models play different personalities and strategies.</li>
            <li>Voice acting: immersive narration and character speech (optional).</li>
            <li>Classic roles: Werewolf, Seer, Witch, Hunter, Guard, Villager.</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-gold)] px-6 py-3 font-bold text-black hover:bg-[var(--color-gold-dark)]"
          >
            Play now
          </Link>
          <Link
            href="/how-to-play"
            className="rounded-full border border-[var(--border-color)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            How to play
          </Link>
          <Link
            href="/ai-models"
            className="rounded-full border border-[var(--border-color)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            AI models
          </Link>
        </div>
      </div>
    </MarketingPageWrapper>
  );
}

