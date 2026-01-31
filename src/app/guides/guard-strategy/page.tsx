import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "Guard Strategy Guide: Protect the Village in Werewolf | Wolfcha",
  description: "Master the Guard role in Werewolf. Learn who to protect, prediction strategies, and avoid common mistakes.",
  keywords: ["werewolf guard strategy", "guard role werewolf", "who to protect werewolf"],
  alternates: { canonical: "https://wolf-cha.com/guides/guard-strategy" },
};

const faqItems = [
  { question: "Can I protect the same person two nights in a row?", answer: "No! You must switch targets each night, then can return to protecting them." },
  { question: "Does Guard protection block Witch poison?", answer: "No. Guard protection ONLY blocks werewolf attacks." },
  { question: "Should I reveal I'm the Guard?", answer: "Generally stay hidden. Reveal late game or when under vote pressure." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Full game mechanics" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Coordinate protection" },
  { href: "/guides/witch-strategy", label: "Witch Strategy", description: "Double-save scenarios" },
];

export default function GuardStrategyPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "Guard Strategy Guide" }} />
      <LandingHero
        title="Guard Strategy: The Village's Shield"
        subtitle="ROLE STRATEGY GUIDE"
        description="The Guard protects one player each night from werewolf attacks. Master prediction to save key village roles."
        primaryCta={{ href: "/", label: "Practice as Guard" }}
        image={{ src: "/roles/guard.png", alt: "Guard role" }}
      />
      <LandingSection id="overview" title="Understanding the Guard" subtitle="Your shield saves lives">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
            <div className="font-semibold text-blue-400 mb-2">✓ Can Do</div>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Protect any living player including yourself</li>
              <li>• Switch targets each night</li>
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
            <div className="font-semibold text-red-400 mb-2">✗ Cannot Do</div>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Protect same player two nights in a row</li>
              <li>• Block Witch poison</li>
            </ul>
          </div>
        </div>
      </LandingSection>
      <LandingSection id="priority" title="Protection Priority" subtitle="Who to protect">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-yellow-950/30 border border-yellow-500/20">
            <span className="font-bold text-yellow-400">S-Tier:</span> Revealed Seer - wolves will target them
          </div>
          <div className="p-4 rounded-lg bg-orange-950/30 border border-orange-500/20">
            <span className="font-bold text-orange-400">A-Tier:</span> Sheriff / Village Leaders
          </div>
          <div className="p-4 rounded-lg bg-green-950/30 border border-green-500/20">
            <span className="font-bold text-green-400">B-Tier:</span> Suspected Power Roles
          </div>
        </div>
      </LandingSection>
      <LandingSection id="faq" title="Guard FAQ" subtitle="Common questions">
        <LandingFaq items={faqItems} />
      </LandingSection>
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Practice Guard Skills</h2>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play as Guard</Link>
        </div>
      </section>
      <LandingSection id="related" title="Related Guides">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
