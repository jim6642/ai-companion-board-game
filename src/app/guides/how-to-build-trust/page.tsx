import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "How to Build Trust in Werewolf: Establish Credibility | Wolfcha",
  description: "Learn to build trust and establish credibility in Werewolf. Master techniques for creating alliances, proving your alignment, and becoming a village leader.",
  keywords: ["werewolf trust building", "mafia credibility", "werewolf alliances", "prove innocent werewolf"],
  alternates: { canonical: "https://wolf-cha.com/guides/how-to-build-trust" },
};

const faqItems = [
  { question: "How do I prove I'm village?", answer: "Consistent helpful behavior over time. Make accurate reads, support good votes, and share useful observations." },
  { question: "Should I trust someone who claims a power role?", answer: "Verify if possible. Check if their claims make sense with known information. Trust but verify." },
];

const relatedLinks = [
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Lead the village" },
  { href: "/guides/how-to-control-the-vote", label: "Vote Control", description: "Use your trust" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase", description: "Build trust here" },
];

export default function HowToBuildTrustPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "How to Build Trust in Werewolf" }} />
      <LandingHero title="How to Build Trust in Werewolf" subtitle="CREDIBILITY GUIDE" description="Trust is your greatest asset. Learn to establish credibility, build alliances, and become someone the village follows. Trusted players control the game." primaryCta={{ href: "/", label: "Practice" }} image={{ src: "/roles/seer.png", alt: "Trust" }} />
      <LandingSection id="methods" title="Trust-Building Methods" subtitle="Become credible">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-blue-400 mb-2">🎯 Accurate Reads</h4>
            <p className="text-sm text-[var(--text-secondary)]">When your suspicions prove correct, you gain credibility. Track your reads and remind others of your accuracy.</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-blue-400 mb-2">🗣️ Clear Reasoning</h4>
            <p className="text-sm text-[var(--text-secondary)]">Always explain your logic. People trust those who show their thinking process, not just conclusions.</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-blue-400 mb-2">🤝 Consistent Behavior</h4>
            <p className="text-sm text-[var(--text-secondary)]">Act the same way throughout. Sudden changes in behavior create suspicion, not trust.</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-blue-400 mb-2">📢 Take Stands</h4>
            <p className="text-sm text-[var(--text-secondary)]">Commit to positions. Fence-sitters seem untrustworthy. Having opinions (right or wrong) shows engagement.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="alliances" title="Building Alliances" subtitle="Find your team">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Identify Reliable Players:</span>
            <span className="text-[var(--text-secondary)]"> Find those making good reads and support them publicly</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Mutual Defense:</span>
            <span className="text-[var(--text-secondary)]"> Defend allies when attacked, they&apos;ll defend you</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Share Information:</span>
            <span className="text-[var(--text-secondary)]"> Coordinate reads with trusted allies for stronger cases</span>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Build Your Reputation</h2>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
