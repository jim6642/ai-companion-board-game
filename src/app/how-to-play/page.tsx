import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd, getFAQJsonLd, getHowToJsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "How to Play Werewolf (Mafia) Alone with AI | Wolfcha",
  description:
    "Learn how to play Werewolf (Mafia) solo in Wolfcha. Get a role, act at night, discuss by day, and vote — all against AI opponents in your browser.",
  alternates: {
    canonical: "https://wolf-cha.com/how-to-play",
  },
  openGraph: {
    title: "How to Play — Wolfcha",
    description:
      "Learn how to play Werewolf (Mafia) solo against AI in your browser. Night actions, day discussion, and voting — simplified.",
    url: "https://wolf-cha.com/how-to-play",
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

export default function HowToPlayPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd data={getFAQJsonLd()} />
      <JsonLd data={getHowToJsonLd()} />

      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="font-serif text-4xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          How to play Werewolf (Mafia) solo
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
          Wolfcha turns the classic Werewolf (Mafia) party game into a single-player experience. You
          play one seat; every other seat is an AI opponent.
        </p>

        <div className="mt-10 grid gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Quick steps</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-[var(--text-secondary)]">
            <li>Enter your name and start a game.</li>
            <li>Get a random role (Werewolf, Seer, Witch, Hunter, Guard, Villager).</li>
            <li>At night, use your role ability (if applicable).</li>
            <li>By day, discuss with AI players and look for contradictions.</li>
            <li>Vote to eliminate suspects. Villagers win by eliminating all werewolves.</li>
          </ol>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-gold)] px-6 py-3 font-bold text-black hover:bg-[var(--color-gold-dark)]"
          >
            Play now
          </Link>
          <Link
            href="/features"
            className="rounded-full border border-[var(--border-color)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          >
            See features
          </Link>
        </div>
      </div>
    </MarketingPageWrapper>
  );
}

