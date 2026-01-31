import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "How to Spot a Liar in Werewolf: Deception Detection | Wolfcha",
  description: "Learn to detect lies in Werewolf. Master behavioral tells, speech patterns, and logical inconsistencies to identify werewolves.",
  keywords: ["spot a liar werewolf", "detect lies mafia", "werewolf tells"],
  alternates: { canonical: "https://wolf-cha.com/guides/how-to-spot-a-liar" },
};

const faqItems = [
  { question: "What's the most reliable way to spot a liar?", answer: "Track consistency. Liars contradict themselves because they're managing a false narrative." },
  { question: "Can good liars be detected?", answer: "Yes. Focus on logical inconsistencies rather than behavioral tells." },
];

const relatedLinks = [
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Use detection skills" },
  { href: "/guides/how-to-bluff", label: "Bluffing Guide", description: "Understand liars" },
];

export default function HowToSpotALiarPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "How to Spot a Liar" }} />
      <LandingHero title="How to Spot a Liar in Werewolf" subtitle="DECEPTION DETECTION" description="Werewolves survive by lying. Learn to see through deception using behavioral analysis and pattern recognition." primaryCta={{ href: "/", label: "Practice" }} image={{ src: "/roles/seer.png", alt: "Detection" }} />
      <LandingSection id="tells" title="Behavioral Tells" subtitle="What liars do wrong">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-red-400 mb-2">Speech Patterns</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Over-explaining simple things</li>
              <li>• Hedging language ("I think", "maybe")</li>
              <li>• Avoiding direct answers</li>
              <li>• Too-perfect alibis</li>
            </ul>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-yellow-400 mb-2">Behavioral Signs</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Defensive when questioned</li>
              <li>• Changing story details</li>
              <li>• Never accusing certain players</li>
              <li>• Relief when topic changes</li>
            </ul>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="logic" title="Logical Analysis" subtitle="Catch contradictions">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Track Claims:</span>
            <span className="text-[var(--text-secondary)]"> Note what each player says and compare across days</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Check Knowledge:</span>
            <span className="text-[var(--text-secondary)]"> Did they know something they shouldn&apos;t?</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <span className="font-bold text-[var(--text-primary)]">Follow Votes:</span>
            <span className="text-[var(--text-secondary)]"> Who voted with wolves? Who defended them?</span>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-950/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Sharpen Your Detection Skills</h2>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related Guides"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
