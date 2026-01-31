import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";

export const metadata: Metadata = {
  title: "Features — AI Werewolf (Mafia) Game | Wolfcha",
  description:
    "Explore Wolfcha features: solo social deduction gameplay, multi-model AI arena, voice acting, and classic Werewolf roles in a browser-based experience.",
  alternates: {
    canonical: "https://wolf-cha.com/features",
  },
  openGraph: {
    title: "Wolfcha Features — AI Werewolf Game",
    description:
      "Solo play, multi-model AI arena, voice acting, and classic roles — built for a modern browser experience.",
    url: "https://wolf-cha.com/features",
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

export default function FeaturesPage() {
  return (
    <MarketingPageWrapper>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-serif text-4xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
          Features
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]">
          Wolfcha is built for players who love deduction and dialogue, but don’t always have a group
          available. It’s the Werewolf (Mafia) party game reimagined as a solo experience.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Solo-first gameplay</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Start a game anytime. Every other player is AI, with unique personalities and playstyles.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">AI model arena</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Watch different models reason, bluff, and collaborate. Compare strategies and find your
              favorite.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Voice acting</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Optional narration and character speech to make the table feel alive.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Classic roles</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Werewolf, Seer, Witch, Hunter, Guard, Villager — with familiar night actions and day
              voting.
            </p>
          </div>
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
        </div>
      </div>
    </MarketingPageWrapper>
  );
}

