import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";

export const metadata: Metadata = {
  title: "Werewolf Game Guides: Complete Strategy & Rules Hub | Wolfcha",
  description: "Comprehensive Werewolf game guides covering rules, strategies, role tactics, and tips for both beginners and advanced players. Master every aspect of the game.",
  keywords: ["werewolf guides", "werewolf strategy", "mafia game guides", "werewolf tips", "how to play werewolf"],
  alternates: { canonical: "https://wolf-cha.com/guides" },
};

const guideCategories = [
  {
    title: "Getting Started",
    description: "New to Werewolf? Start here",
    guides: [
      { href: "/guides/werewolf-for-beginners", title: "Werewolf for Beginners", desc: "Complete beginner introduction" },
      { href: "/guides/werewolf-rules", title: "Complete Rules", desc: "Full game mechanics explained" },
      { href: "/guides/how-to-play-werewolf-with-ai", title: "Playing with AI", desc: "Solo play guide" },
    ],
  },
  {
    title: "Game Phases",
    description: "Master each phase of the game",
    guides: [
      { href: "/guides/werewolf-night-phase", title: "Night Phase", desc: "Night actions and timing" },
      { href: "/guides/werewolf-day-phase", title: "Day Phase", desc: "Discussion and voting" },
    ],
  },
  {
    title: "Role Strategies",
    description: "Deep dives into each role",
    guides: [
      { href: "/guides/seer-strategy", title: "Seer Strategy", desc: "Information gathering master" },
      { href: "/guides/witch-strategy", title: "Witch Strategy", desc: "Potion management tactics" },
      { href: "/guides/hunter-strategy", title: "Hunter Strategy", desc: "Death shot optimization" },
      { href: "/guides/guard-strategy", title: "Guard Strategy", desc: "Protection prediction" },
    ],
  },
  {
    title: "Team Strategies",
    description: "Win with your team",
    guides: [
      { href: "/guides/how-to-win-as-villager", title: "Village Strategy", desc: "Unite and eliminate wolves" },
      { href: "/guides/how-to-win-as-werewolf", title: "Werewolf Strategy", desc: "Deceive and dominate" },
    ],
  },
  {
    title: "Advanced Skills",
    description: "Level up your gameplay",
    guides: [
      { href: "/guides/how-to-spot-a-liar", title: "Spotting Liars", desc: "Detect deception" },
      { href: "/guides/how-to-bluff", title: "Bluffing", desc: "Master deception" },
      { href: "/guides/how-to-build-trust", title: "Building Trust", desc: "Establish credibility" },
      { href: "/guides/how-to-control-the-vote", title: "Vote Control", desc: "Lead eliminations" },
      { href: "/guides/common-werewolf-mistakes", title: "Common Mistakes", desc: "What to avoid" },
    ],
  },
  {
    title: "Game Knowledge",
    description: "Understand the genre",
    guides: [
      { href: "/guides/werewolf-vs-mafia", title: "Werewolf vs Mafia", desc: "Compare the classics" },
      { href: "/guides/social-deduction-games", title: "Social Deduction Games", desc: "The genre overview" },
    ],
  },
];

export default function GuidesIndexPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="website-jsonld" data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Werewolf Game Guides", description: "Complete guide hub for Werewolf game strategies and rules" }} />
      <LandingHero
        title="Werewolf Game Guides"
        subtitle="COMPLETE STRATEGY HUB"
        description="From beginner basics to advanced tactics, find everything you need to master Werewolf. Comprehensive guides for every role, phase, and strategy."
        primaryCta={{ href: "/", label: "Play Now" }}
        secondaryCta={{ href: "/guides/werewolf-for-beginners", label: "Start Learning" }}
      />

      {guideCategories.map((category) => (
        <LandingSection key={category.title} id={category.title.toLowerCase().replace(/\s+/g, "-")} title={category.title} subtitle={category.description}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {category.guides.map((guide) => (
              <Link key={guide.href} href={guide.href} className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--color-gold)]/50 transition-colors">
                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--color-gold)] transition-colors">{guide.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{guide.desc}</p>
              </Link>
            ))}
          </div>
        </LandingSection>
      ))}

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-gradient-to-r from-[var(--color-gold)]/10 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Ready to Apply Your Knowledge?</h2>
          <p className="text-[var(--text-secondary)] mb-6">Put these strategies into practice against AI opponents.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Start Playing</Link>
        </div>
      </section>
    </MarketingPageWrapper>
  );
}
