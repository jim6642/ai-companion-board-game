import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "Werewolf vs Mafia: What's the Difference? Complete Comparison | Wolfcha",
  description: "Compare Werewolf and Mafia party games. Learn the differences in rules, roles, themes, and gameplay. Understand which version is right for you.",
  keywords: ["werewolf vs mafia", "mafia vs werewolf", "werewolf mafia difference", "mafia game comparison"],
  alternates: { canonical: "https://wolf-cha.com/guides/werewolf-vs-mafia" },
};

const faqItems = [
  { question: "Are Werewolf and Mafia the same game?", answer: "Essentially yes. Mafia was created first (1986), and Werewolf is a re-themed version (1997). The core mechanics are identical - an informed minority vs uninformed majority." },
  { question: "Which version should I play?", answer: "Either works! Werewolf's fantasy theme often resonates more with modern players. Both have the same strategic depth." },
  { question: "Do the rules differ?", answer: "The base rules are the same. Some published versions add unique roles, but the core day/night cycle and voting mechanics are identical." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Werewolf Rules", description: "Complete rules" },
  { href: "/guides/social-deduction-games", label: "Social Deduction", description: "The genre" },
  { href: "/guides/werewolf-for-beginners", label: "Beginner Guide", description: "Start playing" },
];

export default function WerewolfVsMafiaPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "Werewolf vs Mafia Comparison" }} />
      <LandingHero title="Werewolf vs Mafia: Complete Comparison" subtitle="GAME COMPARISON" description="Two names, one legendary game. Learn the history, differences, and similarities between Werewolf and Mafia - the social deduction games that started it all." primaryCta={{ href: "/", label: "Play Werewolf" }} image={{ src: "/roles/werewolf.png", alt: "Werewolf vs Mafia" }} />
      
      <LandingSection id="history" title="History & Origins" subtitle="How it all began">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">🃏 Mafia (1986)</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Created by Dmitry Davidoff at Moscow State University. The original game pitted Mafia members against innocent townspeople.</p>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Urban crime theme</li>
              <li>• "Mafia" kills at night</li>
              <li>• "Citizens" vote by day</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">🐺 Werewolf (1997)</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Re-themed by Andrew Plotkin. He argued the werewolf concept better fit the &quot;hidden enemy among us&quot; idea.</p>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Fantasy/horror theme</li>
              <li>• &quot;Werewolves&quot; hunt at night</li>
              <li>• &quot;Villagers&quot; vote by day</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="comparison" title="Side-by-Side Comparison" subtitle="Key differences">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left p-4 text-[var(--text-primary)]">Aspect</th>
                <th className="text-left p-4 text-[var(--text-primary)]">Mafia</th>
                <th className="text-left p-4 text-[var(--text-primary)]">Werewolf</th>
              </tr>
            </thead>
            <tbody className="text-[var(--text-secondary)]">
              <tr className="border-b border-[var(--border-color)]/50">
                <td className="p-4 font-medium">Theme</td>
                <td className="p-4">Crime/Gangster</td>
                <td className="p-4">Fantasy/Horror</td>
              </tr>
              <tr className="border-b border-[var(--border-color)]/50">
                <td className="p-4 font-medium">Evil Team</td>
                <td className="p-4">Mafia</td>
                <td className="p-4">Werewolves</td>
              </tr>
              <tr className="border-b border-[var(--border-color)]/50">
                <td className="p-4 font-medium">Good Team</td>
                <td className="p-4">Citizens/Town</td>
                <td className="p-4">Villagers</td>
              </tr>
              <tr className="border-b border-[var(--border-color)]/50">
                <td className="p-4 font-medium">Investigator</td>
                <td className="p-4">Detective/Cop</td>
                <td className="p-4">Seer</td>
              </tr>
              <tr className="border-b border-[var(--border-color)]/50">
                <td className="p-4 font-medium">Core Mechanics</td>
                <td className="p-4">Identical</td>
                <td className="p-4">Identical</td>
              </tr>
              <tr>
                <td className="p-4 font-medium">Strategy Depth</td>
                <td className="p-4">Same</td>
                <td className="p-4">Same</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LandingSection>

      <LandingSection id="same" title="What's the Same" subtitle="Core gameplay is identical">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-green-400 mb-2">🌙 Night Phase</h4>
            <p className="text-sm text-[var(--text-secondary)]">Evil team secretly kills. Special roles perform actions.</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-green-400 mb-2">☀️ Day Phase</h4>
            <p className="text-sm text-[var(--text-secondary)]">Discussion and voting to eliminate suspects.</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-green-400 mb-2">🏆 Win Conditions</h4>
            <p className="text-sm text-[var(--text-secondary)]">Eliminate all evil OR achieve parity.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" title="FAQ"><LandingFaq items={faqItems} /></LandingSection>
      
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Experience the Classic</h2>
          <p className="text-[var(--text-secondary)] mb-6">Play Werewolf against AI opponents - no friends needed.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play Now</Link>
        </div>
      </section>

      <LandingSection id="related" title="Related"><LandingRelatedLinks title="Learn More" links={relatedLinks} /></LandingSection>
    </MarketingPageWrapper>
  );
}
