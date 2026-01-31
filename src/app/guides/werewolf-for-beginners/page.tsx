import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingAiSeats } from "@/components/seo/landing/LandingAiSeats";

export const metadata: Metadata = {
  title: "Werewolf for Beginners: Learn to Play in 5 Minutes | Wolfcha",
  description:
    "New to Werewolf? Learn the basics in 5 minutes with our beginner-friendly guide. Understand roles, phases, voting, and start playing immediately.",
  keywords: ["werewolf for beginners", "learn werewolf", "werewolf beginner guide", "how to play werewolf first time", "werewolf tutorial"],
  alternates: { canonical: "https://wolf-cha.com/guides/werewolf-for-beginners" },
  openGraph: {
    title: "Werewolf for Beginners: Start Playing in 5 Minutes | Wolfcha",
    description: "The simplest Werewolf guide for new players. Learn roles, phases, and basic strategy.",
    url: "https://wolf-cha.com/guides/werewolf-for-beginners",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Beginner Guide" }],
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Play Werewolf for Beginners",
  description: "Learn the basics of Werewolf in 5 minutes.",
  totalTime: "PT5M",
  step: [
    { "@type": "HowToStep", name: "Understand the Goal", text: "Village wants to eliminate all wolves. Wolves want to equal villagers.", position: 1 },
    { "@type": "HowToStep", name: "Get Your Role", text: "Receive a secret role: Werewolf, Seer, Witch, Hunter, Guard, or Villager.", position: 2 },
    { "@type": "HowToStep", name: "Night Phase", text: "Special roles act secretly at night.", position: 3 },
    { "@type": "HowToStep", name: "Day Phase", text: "Discuss and vote to eliminate suspects.", position: 4 },
  ],
};

const sampleSeats = [
  { seed: "beginner_1", name: "Alex", persona: "Friendly Helper", modelLogo: "/models/deepseek.svg" },
  { seed: "beginner_2", name: "Morgan", persona: "Patient Teacher", modelLogo: "/models/qwen.svg" },
  { seed: "beginner_3", name: "Riley", persona: "Encouraging Coach", modelLogo: "/models/gemini.svg" },
  { seed: "beginner_4", name: "Jordan", persona: "Calm Guide", modelLogo: "/models/claude.svg" },
];

const faqItems = [
  { question: "How long does a game take?", answer: "A typical game lasts 15-30 minutes. Shorter with fewer players, longer with experienced groups." },
  { question: "What if I don't know what to say?", answer: "Start by observing. Ask questions like 'Why do you think that?' or share gut feelings about suspicious players." },
  { question: "What if I get killed early?", answer: "It happens! Watch how the game unfolds to learn. In Wolfcha, you can immediately start a new game." },
  { question: "Is it okay to lie?", answer: "If you're a werewolf, yes! Villagers generally tell the truth but may hide their role for safety." },
  { question: "What's the easiest role?", answer: "Villager is easiest - just observe and vote. Seer and Werewolf are more challenging." },
  { question: "Can I play Werewolf alone?", answer: "Yes! Wolfcha lets you play against AI opponents, perfect for learning without pressure." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Full detailed rules" },
  { href: "/guides/werewolf-night-phase", label: "Night Phase Guide", description: "Deep dive into night" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase Guide", description: "Master discussions" },
  { href: "/how-to-play", label: "Quick Start", description: "Start playing now" },
];

export default function WerewolfForBeginnersPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="howto-jsonld" data={howToJsonLd} />

      <LandingHero
        title="Werewolf for Beginners: Your First Game"
        subtitle="LEARN IN 5 MINUTES"
        description="Never played Werewolf before? No problem! This beginner-friendly guide teaches you everything to start playing immediately."
        primaryCta={{ href: "/", label: "Start Your First Game" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Full Rules" }}
        image={{ src: "/roles/seer.png", alt: "Welcome to Werewolf" }}
        aside={<LandingAiSeats seats={sampleSeats} compact />}
      />

      <LandingSection id="big-picture" title="What is Werewolf?" subtitle="Understand the game in 30 seconds">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
          <div className="text-center mb-8">
            <p className="text-xl text-[var(--text-primary)] font-medium">
              Werewolf is a game of <span className="text-red-400">hidden identities</span> and <span className="text-blue-400">social deduction</span>.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
              <div className="text-4xl mb-3">🐺</div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Werewolves (Bad Guys)</h3>
              <p className="text-sm text-[var(--text-secondary)]">A small group who know each other. They secretly kill one villager each night and try to blend in during the day.</p>
              <div className="mt-4 p-3 rounded-lg bg-red-950/30 text-xs text-red-300">Win by: Equaling or outnumbering villagers</div>
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-6 text-center">
              <div className="text-4xl mb-3">🏘️</div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">Villagers (Good Guys)</h3>
              <p className="text-sm text-[var(--text-secondary)]">The majority who don&apos;t know who the wolves are. They must figure it out through discussion and vote to eliminate suspects.</p>
              <div className="mt-4 p-3 rounded-lg bg-blue-950/30 text-xs text-blue-300">Win by: Eliminating all werewolves</div>
            </div>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="phases" title="Night & Day Phases" subtitle="The game alternates between these">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">🌙</span>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Night Phase</h3>
                <p className="text-sm text-indigo-300">Secret actions</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>🐺 <strong>Werewolves</strong> choose someone to kill</li>
              <li>🔮 <strong>Seer</strong> checks if someone is a wolf</li>
              <li>🧪 <strong>Witch</strong> can save or poison someone</li>
              <li>🛡️ <strong>Guard</strong> protects someone</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-orange-950/40 p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">☀️</span>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Day Phase</h3>
                <p className="text-sm text-amber-300">Discussion and voting</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>📢 Announcement of who died</li>
              <li>💬 Discussion - share thoughts and suspicions</li>
              <li>🗳️ Voting - choose who to eliminate</li>
              <li>👋 Most votes = out of the game</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="roles" title="The Roles" subtitle="You'll get one randomly">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">👤</span>
              <div><h3 className="font-bold text-[var(--text-primary)]">Villager</h3><p className="text-xs text-gray-400">Good Team • Easy</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">No special powers. Observe, discuss, vote wisely.</p>
            <div className="mt-2 text-xs text-green-400">✨ Great for beginners!</div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full"><Image src="/roles/werewolf.png" alt="Werewolf" fill className="object-cover" /></div>
              <div><h3 className="font-bold text-[var(--text-primary)]">Werewolf</h3><p className="text-xs text-red-400">Evil Team • Medium</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Know other wolves. Kill at night. Pretend innocent by day.</p>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full"><Image src="/roles/seer.png" alt="Seer" fill className="object-cover" /></div>
              <div><h3 className="font-bold text-[var(--text-primary)]">Seer</h3><p className="text-xs text-yellow-400">Good Team • Advanced</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Check one player each night to see if they&apos;re a wolf.</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full"><Image src="/roles/witch.png" alt="Witch" fill className="object-cover" /></div>
              <div><h3 className="font-bold text-[var(--text-primary)]">Witch</h3><p className="text-xs text-green-400">Good Team • Medium</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">One save potion, one kill potion. Each usable once.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full"><Image src="/roles/hunter.png" alt="Hunter" fill className="object-cover" /></div>
              <div><h3 className="font-bold text-[var(--text-primary)]">Hunter</h3><p className="text-xs text-orange-400">Good Team • Easy</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">When you die, take someone with you!</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full"><Image src="/roles/guard.png" alt="Guard" fill className="object-cover" /></div>
              <div><h3 className="font-bold text-[var(--text-primary)]">Guard</h3><p className="text-xs text-blue-400">Good Team • Medium</p></div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">Protect one player from wolves each night.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="tips" title="Beginner Tips" subtitle="Start strong with these basics">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-3">🎯 As Villager</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Listen carefully to everyone&apos;s arguments</li>
              <li>• Note who accuses whom and why</li>
              <li>• Trust your gut feelings</li>
              <li>• Don&apos;t be afraid to ask questions</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-[var(--text-primary)] mb-3">🐺 As Werewolf</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Act like a normal villager</li>
              <li>• Don&apos;t defend your wolf teammates too hard</li>
              <li>• Participate in discussions actively</li>
              <li>• Stay calm when accused</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" title="Beginner FAQ" subtitle="Common questions answered">
        <LandingFaq items={faqItems} />
      </LandingSection>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-gradient-to-r from-[var(--color-gold)]/10 to-transparent p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">Ready to Play?</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            The best way to learn is by playing! Start a game against AI opponents - no pressure, unlimited practice.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Start Your First Game
          </Link>
        </div>
      </section>

      <LandingSection id="related" title="Next Steps" subtitle="Continue learning">
        <LandingRelatedLinks title="Related Guides" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
