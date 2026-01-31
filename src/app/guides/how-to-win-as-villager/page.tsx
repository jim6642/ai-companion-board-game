import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingDialogueExamples, type LandingDialogueExample } from "@/components/seo/landing/LandingDialogueExamples";

export const metadata: Metadata = {
  title: "How to Win as Villager: Village Team Strategy Guide | Wolfcha",
  description: "Master village team strategy in Werewolf. Learn discussion tactics, voting coordination, wolf identification, and how to lead the village to victory.",
  keywords: ["werewolf villager strategy", "how to win as villager", "village team werewolf", "find werewolves", "mafia town strategy"],
  alternates: { canonical: "https://wolf-cha.com/guides/how-to-win-as-villager" },
  openGraph: { title: "How to Win as Villager: Complete Strategy | Wolfcha", url: "https://wolf-cha.com/guides/how-to-win-as-villager", type: "article" },
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "Building Village Consensus",
    subtitle: "Coordinating a successful wolf elimination",
    lines: [
      { speaker: { seed: "leader_v", name: "Morgan", modelLogo: "/models/qwen.svg" }, content: "Based on yesterday's voting pattern, Players 4 and 7 both voted against the confirmed villager. That's suspicious coordination." },
      { speaker: { seed: "support_v", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "I noticed that too. Player 4 also defended Player 9 before they were revealed as wolf. I think we should vote Player 4 today." },
      { speaker: { seed: "unite_v", name: "Jordan", modelLogo: "/models/kimi.svg" }, content: "I agree. Let's focus our votes on Player 4. Village needs to stay united - splitting votes helps wolves." },
    ],
  },
];

const faqItems = [
  { question: "How does the village team win?", answer: "The village wins by eliminating ALL werewolves. Use day discussions to identify wolves and coordinate votes. Power roles (Seer, Witch, Hunter, Guard) help gather information and protect the village." },
  { question: "What should I do as a basic Villager?", answer: "Observe carefully, note suspicious behavior, share your reads, ask good questions, and vote based on logic. Even without powers, your observations and vote are valuable." },
  { question: "How do I identify werewolves?", answer: "Watch for: defending eliminated wolves, inconsistent stories, knowing info they shouldn't, voting against confirmed villagers, being too quiet or too aggressive, and changing positions without reason." },
  { question: "Should power roles reveal themselves?", answer: "It depends. Seer should reveal when they have wolf info. Witch usually stays hidden. Hunter can reveal to deter attacks. Guard should stay hidden. Revealing makes you a target but shares valuable info." },
  { question: "What if I'm wrong about someone?", answer: "Everyone makes mistakes. The key is having logical reasoning. If you're wrong, analyze why and learn from it. Don't let one mistake stop you from participating." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Full game mechanics" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Information gathering" },
  { href: "/guides/how-to-spot-a-liar", label: "Spotting Liars", description: "Detect wolf deception" },
  { href: "/guides/how-to-win-as-werewolf", label: "Wolf Strategy", description: "Know your enemy" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase", description: "Discussion tactics" },
];

export default function HowToWinAsVillagerPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "How to Win as Villager" }} />
      <LandingHero
        title="How to Win as Villager: Unite & Conquer"
        subtitle="VILLAGE TEAM STRATEGY"
        description="The village has numbers but lacks information. Wolves know each other - you don't. Victory requires sharp observation, logical deduction, and coordinated action. Learn to lead the village to triumph."
        primaryCta={{ href: "/", label: "Practice Now" }}
        image={{ src: "/roles/seer.png", alt: "Village team" }}
      />

      <LandingSection id="win-condition" title="Village Win Condition" subtitle="Eliminate all werewolves">
        <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">🏘️</span>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Village Victory</h3>
              <p className="text-blue-400">Find and eliminate every werewolf</p>
            </div>
          </div>
          <p className="text-[var(--text-secondary)]">The village wins when ALL werewolves are eliminated through day votes, Hunter shots, or Witch poison. You don&apos;t need to keep everyone alive - just find the wolves before they achieve parity.</p>
        </div>
      </LandingSection>

      <LandingSection id="core-skills" title="Core Village Skills" subtitle="What every villager needs">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">👀</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Observation</h4>
            <p className="text-sm text-[var(--text-secondary)]">Watch behavior, voting patterns, reactions to deaths, and who defends whom.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🧠</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Logic</h4>
            <p className="text-sm text-[var(--text-secondary)]">Connect information pieces. If X is wolf, what does that imply about Y&apos;s behavior?</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🗣️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Communication</h4>
            <p className="text-sm text-[var(--text-secondary)]">Share your reads clearly. Help others understand your reasoning.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🤝</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Coordination</h4>
            <p className="text-sm text-[var(--text-secondary)]">Unite village votes. Split votes help wolves escape elimination.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Trust Assessment</h4>
            <p className="text-sm text-[var(--text-secondary)]">Identify trustworthy allies. Build coalitions of confirmed villagers.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">😤</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Pressure Resistance</h4>
            <p className="text-sm text-[var(--text-secondary)]">Stay calm when accused. Wolves will try to misdirect the village.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="wolf-signs" title="How to Identify Wolves" subtitle="Red flags to watch for">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-red-400 mb-3">🚨 Behavioral Red Flags</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Defending players who flip wolf</li>
              <li>• Knowing information they shouldn&apos;t have</li>
              <li>• Inconsistent stories across days</li>
              <li>• Voting against confirmed villagers</li>
              <li>• Being unusually quiet during key discussions</li>
              <li>• Changing positions without good reason</li>
            </ul>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-yellow-400 mb-3">⚠️ Subtle Signs</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li>• Never accusing certain players</li>
              <li>• Always voting with the majority (too safe)</li>
              <li>• Pushing hard on weak evidence</li>
              <li>• Deflecting when directly questioned</li>
              <li>• Relief when discussion moves away from them</li>
              <li>• Too-perfect alibis and explanations</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="examples" title="Village Coordination Example" subtitle="Working together to find wolves">
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      <LandingSection id="power-roles" title="Power Role Coordination" subtitle="Maximize your team's abilities">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-yellow-400 mb-3">🔮 Seer</h3>
            <p className="text-sm text-[var(--text-secondary)]">The village&apos;s information engine. When Seer reveals wolf info, the village should prioritize that vote. Protect the Seer after reveal.</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-green-400 mb-3">🧪 Witch</h3>
            <p className="text-sm text-[var(--text-secondary)]">Hidden assassin. If voting fails on a confirmed wolf, Witch can poison them. Save potion is valuable for key roles.</p>
          </div>
          <div className="rounded-xl border border-orange-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-orange-400 mb-3">🏹 Hunter</h3>
            <p className="text-sm text-[var(--text-secondary)]">Revenge role. Share your wolf suspicions so Hunter knows who to shoot. Hunter shot can secure victory.</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h3 className="font-bold text-blue-400 mb-3">🛡️ Guard</h3>
            <p className="text-sm text-[var(--text-secondary)]">Silent protector. After Seer reveals, Guard should protect them. Coordination can extend Seer&apos;s life.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" title="Village Strategy FAQ" subtitle="Common questions answered">
        <LandingFaq items={faqItems} />
      </LandingSection>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Lead the Village to Victory 🏆</h2>
          <p className="text-[var(--text-secondary)] mb-6">Practice finding wolves and coordinating the village against AI opponents.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Start Playing</Link>
        </div>
      </section>

      <LandingSection id="related" title="Related Guides">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
