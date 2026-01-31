import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "Hunter Strategy Guide: Death Shot Tactics in Werewolf | Wolfcha",
  description: "Master the Hunter role in Werewolf. Learn when to reveal, who to shoot, timing your death shot, and turning elimination into victory.",
  keywords: ["werewolf hunter strategy", "hunter role werewolf", "hunter shot tactics", "mafia vigilante"],
  alternates: { canonical: "https://wolf-cha.com/guides/hunter-strategy" },
  openGraph: { title: "Hunter Strategy: Turn Death Into Victory | Wolfcha", url: "https://wolf-cha.com/guides/hunter-strategy", type: "article" },
};

const faqItems = [
  { question: "When can the Hunter shoot?", answer: "The Hunter can shoot when eliminated by village vote OR killed by werewolves at night. However, if poisoned by the Witch, the Hunter CANNOT shoot - poison silences the ability." },
  { question: "Should I reveal I'm the Hunter?", answer: "Revealing deters wolf attacks (they fear your shot) but you lose the element of surprise. Reveal if: under heavy suspicion, or late game when deterrence is valuable." },
  { question: "Who should I shoot when I die?", answer: "Priority: (1) Confirmed wolf if known, (2) Player the Seer identified as wolf, (3) Your strongest personal suspicion. Never shoot randomly - your death shot is too valuable." },
  { question: "What if I don't know who's a wolf?", answer: "Shoot your best guess based on behavior. Even a 50/50 shot at a suspected wolf is valuable. Trust your reads - you've observed the game." },
  { question: "Can wolves target me safely?", answer: "No! If wolves kill you at night, you still get to shoot. This makes Hunter a risky target for wolves, which is part of your value." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Full game mechanics" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Get wolf info for your shot" },
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Team coordination" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase", description: "Master discussions" },
];

export default function HunterStrategyPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "Hunter Strategy Guide", description: "Master the Hunter role death shot tactics." }} />
      <LandingHero
        title="Hunter Strategy: Death Brings Vengeance"
        subtitle="ROLE STRATEGY GUIDE"
        description="The Hunter turns death into opportunity. When eliminated, you take one player with you. A well-aimed shot can eliminate a wolf and swing the entire game."
        primaryCta={{ href: "/", label: "Practice as Hunter" }}
        image={{ src: "/roles/hunter.png", alt: "Hunter role" }}
      />

      <LandingSection id="overview" title="Understanding the Hunter" subtitle="Your death is your power">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="prose prose-invert max-w-none">
            <p className="text-[var(--text-secondary)]">The Hunter is a village-aligned role with a powerful revenge ability. When you die (by vote or wolf attack), you immediately shoot one player of your choice, eliminating them too.</p>
            <p className="text-[var(--text-secondary)]">This makes wolves hesitant to target you, and gives the village a potential 2-for-1 trade if you can identify a wolf before dying.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Hunter Quick Stats</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li className="flex justify-between"><span>Team:</span><span className="text-blue-400 font-semibold">Village</span></li>
              <li className="flex justify-between"><span>Ability:</span><span className="text-orange-400 font-semibold">Shoot on death</span></li>
              <li className="flex justify-between"><span>Blocked by:</span><span className="text-purple-400 font-semibold">Witch poison</span></li>
              <li className="flex justify-between"><span>Difficulty:</span><span className="text-green-400 font-semibold">Easy-Medium</span></li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="when-shoot" title="When You Can (and Can't) Shoot" subtitle="Know your trigger conditions">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-5">
            <h3 className="font-bold text-green-400 mb-3">✓ You CAN Shoot When:</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Eliminated by village vote during the day</li>
              <li>• Killed by werewolves during the night</li>
              <li>• In any situation where you die "normally"</li>
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5">
            <h3 className="font-bold text-red-400 mb-3">✗ You CANNOT Shoot When:</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Poisoned by the Witch (poison silences you)</li>
              <li>• This is why Witch often targets suspected Hunters</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="shot-priority" title="Who to Shoot: Priority List" subtitle="Make your death count">
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-red-950/30 border border-red-500/20">
            <span className="font-bold text-red-400">Priority 1:</span> <span className="text-[var(--text-primary)]">Confirmed wolf</span> - If Seer verified someone as wolf, shoot them
          </div>
          <div className="p-4 rounded-lg bg-orange-950/30 border border-orange-500/20">
            <span className="font-bold text-orange-400">Priority 2:</span> <span className="text-[var(--text-primary)]">Strong suspicion</span> - Your best behavioral read on who's a wolf
          </div>
          <div className="p-4 rounded-lg bg-yellow-950/30 border border-yellow-500/20">
            <span className="font-bold text-yellow-400">Priority 3:</span> <span className="text-[var(--text-primary)]">Your accuser</span> - If voted out unfairly, the person who led the charge may be a wolf
          </div>
          <div className="p-4 rounded-lg bg-gray-950/30 border border-gray-500/20">
            <span className="font-bold text-gray-400">Never:</span> <span className="text-[var(--text-primary)]">Random shot</span> - Better to shoot your weak read than waste on pure random
          </div>
        </div>
      </LandingSection>

      <LandingSection id="reveal" title="To Reveal or Not to Reveal" subtitle="Strategic identity management">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Benefits of Revealing</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Wolves may avoid killing you (fear your shot)</li>
              <li>• Can save yourself from misdirected vote</li>
              <li>• Allows coordination ("tell me who to shoot")</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-3">Benefits of Staying Hidden</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Witch may poison you (wasting her poison)</li>
              <li>• Surprise factor if wolves do target you</li>
              <li>• Can't be used by wolves to verify claims</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" title="Hunter FAQ" subtitle="Common questions answered">
        <LandingFaq items={faqItems} />
      </LandingSection>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/30 to-red-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Practice Your Aim 🎯</h2>
          <p className="text-[var(--text-secondary)] mb-6">Learn to read wolves and make game-winning shots against AI opponents.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Play as Hunter</Link>
        </div>
      </section>

      <LandingSection id="related" title="Related Guides">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
