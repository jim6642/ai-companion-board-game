import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "How to Bluff in Werewolf: Master the Art of Deception | Wolfcha",
  description: "Learn bluffing techniques in Werewolf. Master fake claims, misdirection, and psychological manipulation to survive as a wolf or deceive as a villager.",
  keywords: ["werewolf bluffing", "how to lie in mafia", "werewolf deception", "fake claim werewolf"],
  alternates: { canonical: "https://wolf-cha.com/guides/how-to-bluff" },
};

const faqItems = [
  { question: "When should wolves fake claim a role?", answer: "When under heavy suspicion. Claiming Seer or other power role can buy time, but be ready to maintain the lie." },
  { question: "How do I bluff naturally?", answer: "Don't over-explain. Real villagers are uncertain too. Act naturally, participate in discussions, and don't panic." },
];

const relatedLinks = [
  { href: "/guides/how-to-win-as-werewolf", label: "Wolf Strategy", description: "Win as werewolf" },
  { href: "/guides/how-to-spot-a-liar", label: "Spot Liars", description: "Know the tells" },
  { href: "/guides/common-werewolf-mistakes", label: "Mistakes", description: "What to avoid" },
];

export default function HowToBluffPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "How to Bluff in Werewolf" }} />
      <LandingHero title="How to Bluff in Werewolf" subtitle="DECEPTION MASTERY" description="Deception is an art. Whether you're a wolf maintaining cover or a villager making a strategic play, master the techniques of convincing bluffs." primaryCta={{ href: "/", label: "Practice Bluffing" }} image={{ src: "/roles/werewolf.png", alt: "Bluffing" }} />
      <LandingSection id="basics" title="Bluffing Fundamentals" subtitle="The core principles">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🎭 Stay Consistent</h4>
            <p className="text-sm text-[var(--text-secondary)]">Track your story. Contradictions expose lies. Keep mental notes of what you&apos;ve claimed.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">😌 Stay Calm</h4>
            <p className="text-sm text-[var(--text-secondary)]">Panic reveals guilt. When accused, respond calmly as an innocent person would.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">🎯 Commit Fully</h4>
            <p className="text-sm text-[var(--text-secondary)]">Half-hearted bluffs fail. If you claim a role, act like you have it completely.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="techniques" title="Bluffing Techniques" subtitle="Advanced deception methods">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-purple-400 mb-2">Fake Claiming</h4>
            <p className="text-sm text-[var(--text-secondary)]">Claiming a power role you don&apos;t have. Requires preparation - know what checks you &quot;made&quot; and be ready to defend.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-purple-400 mb-2">Misdirection</h4>
            <p className="text-sm text-[var(--text-secondary)]">Shift attention to others. Accuse villagers confidently to make yourself look village-aligned.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-purple-400 mb-2">Pocket Players</h4>
            <p className="text-sm text-[var(--text-secondary)]">Build trust with key villagers who will defend you. Strategic allies are powerful shields.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-purple-400 mb-2">WIFOM</h4>
            <p className="text-sm text-[var(--text-secondary)]">&quot;Wine in Front of Me&quot; - create doubt by pointing out what wolves &quot;would&quot; or &quot;wouldn&apos;t&quot; do.</p>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Master Deception</h2>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
