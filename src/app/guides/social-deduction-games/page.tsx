import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "Social Deduction Games: The Complete Genre Guide | Wolfcha",
  description: "Explore social deduction games like Werewolf, Mafia, and more. Learn about the genre, popular titles, and why hidden role games are so engaging.",
  keywords: ["social deduction games", "hidden role games", "games like werewolf", "party deception games"],
  alternates: { canonical: "https://wolf-cha.com/guides/social-deduction-games" },
};

const faqItems = [
  { question: "What defines a social deduction game?", answer: "Hidden roles, incomplete information, and players trying to deduce others' identities through discussion and behavior analysis." },
  { question: "Why are social deduction games popular?", answer: "They create intense social interactions, memorable moments, and test skills like reading people and persuasion." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Werewolf Rules", description: "The classic" },
  { href: "/guides/werewolf-vs-mafia", label: "Werewolf vs Mafia", description: "Compare origins" },
  { href: "/guides/werewolf-for-beginners", label: "Beginner Guide", description: "Start here" },
];

export default function SocialDeductionGamesPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "Social Deduction Games Guide" }} />
      <LandingHero title="Social Deduction Games: The Ultimate Guide" subtitle="GENRE OVERVIEW" description="Hidden roles. Secret alliances. Lies and deduction. Discover the fascinating world of social deduction games - where trust is a weapon and anyone could be the enemy." primaryCta={{ href: "/", label: "Play Werewolf" }} image={{ src: "/roles/werewolf.png", alt: "Social Deduction" }} />
      <LandingSection id="what" title="What Are Social Deduction Games?" subtitle="The core concept">
        <div className="prose prose-invert max-w-none">
          <p className="text-[var(--text-secondary)]">Social deduction games pit players against each other in a battle of wits where some players have secret evil roles. The majority must identify and eliminate the hidden threats through discussion, voting, and behavioral analysis - while the minority tries to stay hidden and achieve their goals.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🎭 Hidden Roles</h4>
            <p className="text-sm text-[var(--text-secondary)]">Each player has a secret identity with different goals and abilities.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🗣️ Discussion</h4>
            <p className="text-sm text-[var(--text-secondary)]">Players debate, accuse, defend, and try to uncover the truth.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🗳️ Elimination</h4>
            <p className="text-sm text-[var(--text-secondary)]">Voting removes suspected enemies until one team wins.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="examples" title="Popular Social Deduction Games" subtitle="Beyond Werewolf">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🐺 Werewolf / Mafia</h4>
            <p className="text-sm text-[var(--text-secondary)]">The original. Werewolves vs Villagers with night kills and day voting.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🚀 Among Us</h4>
            <p className="text-sm text-[var(--text-secondary)]">Video game adaptation. Imposters sabotage and kill crewmates.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🕵️ The Resistance</h4>
            <p className="text-sm text-[var(--text-secondary)]">No elimination. Spies try to fail missions without being caught.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🗡️ Blood on the Clocktower</h4>
            <p className="text-sm text-[var(--text-secondary)]">Complex Werewolf variant with many unique roles and abilities.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Experience Social Deduction</h2>
          <p className="text-[var(--text-secondary)] mb-6">Play Werewolf against AI - practice your deduction skills anytime.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
