import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "How to Control the Vote in Werewolf: Voting Strategy | Wolfcha",
  description: "Master voting strategy in Werewolf. Learn to lead votes, build consensus, counter wolf manipulation, and ensure the village eliminates the right target.",
  keywords: ["werewolf voting strategy", "control vote mafia", "werewolf vote manipulation", "lead werewolf vote"],
  alternates: { canonical: "https://wolf-cha.com/guides/how-to-control-the-vote" },
};

const faqItems = [
  { question: "How do I get people to vote my target?", answer: "Present clear evidence, explain your reasoning, and be confident. Ask others for their reads and address their concerns." },
  { question: "What if the vote is splitting?", answer: "Identify the main factions and make a case for consolidation. Split votes help wolves escape." },
];

const relatedLinks = [
  { href: "/guides/how-to-build-trust", label: "Build Trust", description: "Get people to follow" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase", description: "When votes happen" },
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Coordinate the team" },
];

export default function HowToControlTheVotePage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "How to Control the Vote" }} />
      <LandingHero title="How to Control the Vote in Werewolf" subtitle="VOTING MASTERY" description="Votes decide who lives and dies. Learn to lead the village vote, build consensus, and ensure wolves can't escape elimination through chaos." primaryCta={{ href: "/", label: "Practice" }} image={{ src: "/roles/hunter.png", alt: "Voting" }} />
      <LandingSection id="lead" title="Leading the Vote" subtitle="Take charge">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-orange-400 mb-2">🎯 Be First</h4>
            <p className="text-sm text-[var(--text-secondary)]">Propose a target early with clear reasoning. First movers often set the agenda.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-orange-400 mb-2">📋 Present Evidence</h4>
            <p className="text-sm text-[var(--text-secondary)]">List specific behaviors, statements, and voting patterns that make your target suspicious.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-orange-400 mb-2">🤝 Build Coalition</h4>
            <p className="text-sm text-[var(--text-secondary)]">Get 2-3 players to agree publicly. Momentum attracts more votes.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-orange-400 mb-2">🔄 Address Objections</h4>
            <p className="text-sm text-[var(--text-secondary)]">Listen to counterarguments and respond thoughtfully. Dismissing concerns loses support.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="prevent-split" title="Preventing Split Votes" subtitle="Unite the village">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30">
            <span className="font-bold text-red-400">Problem:</span>
            <span className="text-[var(--text-secondary)]"> Split votes let wolves survive when village has majority</span>
          </div>
          <div className="p-4 rounded-lg bg-green-950/20 border border-green-500/30">
            <span className="font-bold text-green-400">Solution:</span>
            <span className="text-[var(--text-secondary)]"> Call for vote count, identify main options, argue for consolidation</span>
          </div>
          <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30">
            <span className="font-bold text-blue-400">Compromise:</span>
            <span className="text-[var(--text-secondary)]"> If your target isn&apos;t winning, support the next-best option over a split</span>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Master Vote Leadership</h2>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
