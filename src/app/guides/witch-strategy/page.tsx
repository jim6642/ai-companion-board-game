import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingDialogueExamples, type LandingDialogueExample } from "@/components/seo/landing/LandingDialogueExamples";

export const metadata: Metadata = {
  title: "Witch Strategy Guide: Master the Potions in Werewolf | Wolfcha",
  description:
    "Complete Witch strategy guide for Werewolf. Learn when to save, when to poison, potion timing, coordination with Seer, and avoid common mistakes that waste your powerful abilities.",
  keywords: [
    "werewolf witch strategy",
    "witch role werewolf",
    "when to use witch potion",
    "witch antidote strategy",
    "witch poison timing",
    "werewolf witch guide",
    "mafia doctor strategy",
  ],
  alternates: {
    canonical: "https://wolf-cha.com/guides/witch-strategy",
  },
  openGraph: {
    title: "Witch Strategy Guide: Master Your Potions | Wolfcha",
    description: "Learn optimal Witch strategy - when to save with antidote, when to poison, and how to maximize your impact on the game.",
    url: "https://wolf-cha.com/guides/witch-strategy",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Witch Strategy Guide" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Witch Strategy Guide: Master the Potions in Werewolf",
  description: "Complete strategy guide for playing the Witch role in Werewolf, including potion timing, save decisions, and poison targets.",
  image: "https://wolf-cha.com/og-image.png",
  author: { "@type": "Organization", name: "Wolfcha", url: "https://wolf-cha.com" },
  publisher: { "@type": "Organization", name: "Wolfcha", logo: { "@type": "ImageObject", url: "https://wolf-cha.com/logo.png" } },
  datePublished: "2024-01-15",
  dateModified: new Date().toISOString().split("T")[0],
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "Witch Reveals After Save",
    subtitle: "Day 2 - Confirming the save to gain trust",
    lines: [
      { speaker: { seed: "witch_reveal", name: "Riley", modelLogo: "/models/claude.svg", meta: "Witch" }, content: "I need to share something. I'm the Witch. Last night, Player 6 was attacked by wolves, and I used my antidote to save them. Player 6, can you confirm you're alive?" },
      { speaker: { seed: "saved_player", name: "Player 6", modelLogo: "/models/qwen.svg" }, content: "Yes! I was terrified when I saw I was targeted. Riley, thank you for saving me. I can confirm this makes sense." },
      { speaker: { seed: "skeptic", name: "Morgan", modelLogo: "/models/deepseek.svg" }, content: "How do we know you're not just claiming Witch because Player 6 wasn't actually attacked? Maybe the Guard saved them." },
    ],
  },
  {
    title: "Coordinating with Seer",
    subtitle: "Day 3 - Using poison on confirmed wolf",
    lines: [
      { speaker: { seed: "seer_info", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Seer" }, content: "I checked Player 8 last night - they're a wolf. But the votes aren't going their way. We need to convince more people." },
      { speaker: { seed: "witch_plan", name: "Riley", modelLogo: "/models/claude.svg", meta: "Witch (hidden)" }, content: "I trust Morgan's read. If we can't get the votes today, we should focus on a different target and... handle Player 8 another way." },
      { speaker: { seed: "smart_villager", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "Wait, Riley - are you implying you have a way to 'handle' someone? That sounds like you might be the Witch..." },
    ],
  },
];

const faqItems = [
  { question: "Should I save on Night 1?", answer: "Often yes! Night 1 saves are valuable because: (1) you deny the wolves a kill, (2) the saved player owes you, (3) you learn who wolves targeted (potential Seer/leader). However, if the target seems suspicious, consider passing." },
  { question: "Can the Witch save herself?", answer: "In most rulesets, yes - if you're the wolf target, you can use your antidote on yourself. However, some competitive variants prohibit self-saving. Check your game's rules. In Wolfcha, self-saving is allowed." },
  { question: "When should I use my poison?", answer: "Use poison when: (1) Seer confirmed a wolf but voting failed, (2) you're highly confident someone is wolf, (3) late game when it's now-or-never. Never poison on suspicion alone early game." },
  { question: "Can I use both potions in one night?", answer: "No, in standard rules you can only use ONE potion per night - either save OR poison, not both. This prevents the overpowered combo of saving and killing in the same night." },
  { question: "What if I poison the wrong person?", answer: "Poisoning a villager is devastating - you've essentially helped the wolves. This is why poison should only be used when you're very confident. If you make this mistake, you can still contribute through day discussions." },
  { question: "Should I reveal I'm the Witch?", answer: "Generally stay hidden longer than Seer. Your poison is most effective as a surprise. Reveal if: (1) you're about to be voted out, (2) you need to confirm a save, (3) late game when hiding serves no purpose." },
  { question: "What happens if I'm poisoned as Hunter?", answer: "If the Witch poisons the Hunter, the Hunter cannot use their shooting ability. The poison 'silences' them. This is why Witch should consider whether their target might be Hunter before poisoning." },
  { question: "How do I know who was attacked?", answer: "As Witch, when you wake at night, the moderator shows you who the wolves targeted. You then decide whether to save them. You always know the attack target, even if you choose not to save." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Full game mechanics" },
  { href: "/guides/werewolf-night-phase", label: "Night Phase", description: "Understand night actions" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Coordinate with Seer" },
  { href: "/guides/guard-strategy", label: "Guard Strategy", description: "Double protection tactics" },
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Win as the good team" },
  { href: "/roles/witch", label: "Witch Role", description: "Complete role overview" },
];

export default function WitchStrategyPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={articleJsonLd} />

      <LandingHero
        title="Witch Strategy: Master Your Potions"
        subtitle="ROLE STRATEGY GUIDE"
        description="The Witch holds two of the most powerful single-use abilities in Werewolf: the antidote that cheats death, and the poison that delivers it. Knowing when to use each - and when to hold back - separates good Witches from great ones."
        primaryCta={{ href: "/", label: "Practice as Witch" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Game Rules" }}
        image={{ src: "/roles/witch.png", alt: "Witch role" }}
      />

      {/* Role Overview */}
      <LandingSection
        id="overview"
        title="Understanding the Witch Role"
        subtitle="Two potions, infinite possibilities"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
              The Witch is a village-aligned power role with two one-time-use potions. Each night, you learn who the wolves attacked and can choose to intervene. 
              Your decisions can save crucial allies or eliminate confirmed threats - but mistakes are costly since each potion can only be used once.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-950/30 to-transparent p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                    <span className="text-xl">💚</span>
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)]">Antidote (Heal)</h3>
                </div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                  <li>• <strong className="text-green-400">One-time use</strong></li>
                  <li>• Saves tonight&apos;s wolf victim</li>
                  <li>• Can save yourself (most rulesets)</li>
                  <li>• Only works on wolf attacks, not poison</li>
                </ul>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-transparent p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                    <span className="text-xl">💀</span>
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)]">Poison (Kill)</h3>
                </div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                  <li>• <strong className="text-purple-400">One-time use</strong></li>
                  <li>• Kills any player you choose</li>
                  <li>• Bypasses Guard protection</li>
                  <li>• Disables Hunter&apos;s shot ability</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-6">
            <div className="relative h-40 w-full mb-4 overflow-hidden rounded-lg border border-green-500/20">
              <Image src="/roles/witch.png" alt="Witch" fill className="object-contain" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Witch Quick Stats</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li className="flex justify-between"><span>Team:</span><span className="text-blue-400 font-semibold">Village</span></li>
              <li className="flex justify-between"><span>Night Action:</span><span className="text-green-400 font-semibold">Save or Poison</span></li>
              <li className="flex justify-between"><span>Target Priority:</span><span className="text-orange-400 font-semibold">Medium-High</span></li>
              <li className="flex justify-between"><span>Difficulty:</span><span className="text-yellow-400 font-semibold">Intermediate</span></li>
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Antidote Strategy */}
      <LandingSection
        id="antidote"
        title="Antidote Strategy: When to Save"
        subtitle="Your heal can change the course of the game"
      >
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="text-green-400">✓</span> Save When...
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-green-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Night 1 (Usually)</div>
                  <p className="text-sm text-[var(--text-secondary)]">Early saves deny wolf kills, keep numbers up, and identify wolf targeting patterns. The person saved often becomes an ally.</p>
                </div>
                <div className="p-3 rounded-lg bg-green-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Confirmed Seer is Targeted</div>
                  <p className="text-sm text-[var(--text-secondary)]">If a revealed Seer with credibility is attacked, saving them is almost always correct - they&apos;re too valuable to lose.</p>
                </div>
                <div className="p-3 rounded-lg bg-green-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Key Village Leader Attacked</div>
                  <p className="text-sm text-[var(--text-secondary)]">Strong village players who organize votes and make good reads are worth saving to maintain village momentum.</p>
                </div>
                <div className="p-3 rounded-lg bg-green-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Yourself (If Allowed)</div>
                  <p className="text-sm text-[var(--text-secondary)]">If you&apos;re the target and you still have poison, self-saving keeps both your potions in play. Don&apos;t die with unused poison.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="text-red-400">✗</span> Don&apos;t Save When...
              </h3>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-red-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Target is Suspicious</div>
                  <p className="text-sm text-[var(--text-secondary)]">If the attacked player was already under suspicion for being a wolf, they might actually BE a wolf sacrificing themselves. Don&apos;t waste your save.</p>
                </div>
                <div className="p-3 rounded-lg bg-red-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Late Game with Confirmed Wolf</div>
                  <p className="text-sm text-[var(--text-secondary)]">If you know who a wolf is and have poison, you might need to hold your save in case you need to survive to use it.</p>
                </div>
                <div className="p-3 rounded-lg bg-red-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">Target is Likely to Die Anyway</div>
                  <p className="text-sm text-[var(--text-secondary)]">If the village is about to vote out the attacked player tomorrow anyway, saving them wastes your potion.</p>
                </div>
                <div className="p-3 rounded-lg bg-red-950/20">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">You Have Critical Poison Target</div>
                  <p className="text-sm text-[var(--text-secondary)]">Sometimes holding the save lets you survive long enough to use a game-winning poison. Weigh the trade-off.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6">
            <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span>💡</span> Night 1 Save Decision Framework
            </h4>
            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                <div className="font-semibold text-green-400 mb-2">Save (Default)</div>
                <p className="text-[var(--text-secondary)]">Unless the target is suspicious, Night 1 saves are generally good. You deny a kill with minimal information loss.</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                <div className="font-semibold text-yellow-400 mb-2">Consider Passing</div>
                <p className="text-[var(--text-secondary)]">If the target was quiet/unknown, passing lets you save antidote for a more critical moment later.</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card)]">
                <div className="font-semibold text-red-400 mb-2">Don&apos;t Save</div>
                <p className="text-[var(--text-secondary)]">If target was already under wolf suspicion from Day 1, letting them die avoids wasting your potion on a possible wolf.</p>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Poison Strategy */}
      <LandingSection
        id="poison"
        title="Poison Strategy: When to Kill"
        subtitle="The most powerful - and dangerous - ability in the game"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-transparent p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20">
                <span className="text-3xl">☠️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">The Poison Power</h3>
                <p className="text-sm text-purple-400">Used correctly, it wins games. Used wrong, it loses them.</p>
              </div>
            </div>
            <p className="text-[var(--text-secondary)]">
              Your poison is arguably the most impactful single action in Werewolf. It bypasses all protections, silences the Hunter, and eliminates any player instantly.
              But poisoning an innocent villager is catastrophic - you&apos;ve essentially given the wolves a free kill.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-green-400">✓</span> Good Poison Situations
              </h3>
              
              <div className="rounded-lg border border-green-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">Seer Confirmed a Wolf</div>
                <p className="text-sm text-[var(--text-secondary)]">If a trusted Seer identified someone as wolf but the village failed to vote them out, poisoning them is almost always correct.</p>
                <div className="mt-2 text-xs text-green-400">Confidence level: Very High ✓✓✓</div>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">Multiple Wolf Indicators</div>
                <p className="text-sm text-[var(--text-secondary)]">If voting patterns, behavior, and circumstantial evidence all point to one player, and they&apos;re likely to survive the vote...</p>
                <div className="mt-2 text-xs text-green-400">Confidence level: High ✓✓</div>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">Endgame Necessity</div>
                <p className="text-sm text-[var(--text-secondary)]">Late game when you&apos;re confident and wolves are about to win - even moderate certainty becomes acceptable.</p>
                <div className="mt-2 text-xs text-yellow-400">Confidence level: Medium ✓</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span className="text-red-400">✗</span> Bad Poison Situations
              </h3>
              
              <div className="rounded-lg border border-red-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">Early Game Suspicion</div>
                <p className="text-sm text-[var(--text-secondary)]">Day 1-2 gut feelings are notoriously unreliable. Poisoning based on early suspicion has a high misfire rate.</p>
                <div className="mt-2 text-xs text-red-400">Risk level: Very High ✗✗✗</div>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">No Corroborating Evidence</div>
                <p className="text-sm text-[var(--text-secondary)]">If only you suspect someone and no one else agrees, you might be missing something. Trust the crowd wisdom.</p>
                <div className="mt-2 text-xs text-red-400">Risk level: High ✗✗</div>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-[var(--bg-card)] p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-2">Emotional Decision</div>
                <p className="text-sm text-[var(--text-secondary)]">If someone accused you or annoyed you, that&apos;s not a reason to poison them. Emotions cloud judgment.</p>
                <div className="mt-2 text-xs text-red-400">Risk level: Very High ✗✗✗</div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Dialogue Examples */}
      <LandingSection id="examples" title="Witch Dialogue Examples" subtitle="Communication strategies in action">
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      {/* Revealing Strategy */}
      <LandingSection
        id="revealing"
        title="When to Reveal as Witch"
        subtitle="Staying hidden vs going public"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Stay Hidden When...</h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>You still have both potions - maximum flexibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Village is doing well without your input</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>No one suspects you - don&apos;t invite wolf attention</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Seer is still hidden - let them reveal first</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>You have a poison target in mind - surprise is valuable</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Reveal When...</h3>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>You&apos;re about to be voted out - save yourself</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>You can confirm a save that helps the village</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>A fake Witch claim needs to be countered</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Late game and hiding serves no purpose</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>You used both potions and have nothing to hide</span>
              </li>
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Common Mistakes */}
      <LandingSection
        id="mistakes"
        title="Common Witch Mistakes"
        subtitle="Learn from others' errors"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">💀</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Poisoning Too Early</h4>
            <p className="text-sm text-[var(--text-secondary)]">Using poison on Day 2 suspicion. Wait for confirmed info from Seer or overwhelming evidence. Early poison misfires lose games.</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">💚</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Hoarding the Antidote</h4>
            <p className="text-sm text-[var(--text-secondary)]">Saving antidote for the &quot;perfect moment&quot; that never comes. If in doubt on Night 1-2, using it is usually better than losing it.</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">📢</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Revealing Too Early</h4>
            <p className="text-sm text-[var(--text-secondary)]">Claiming Witch Day 1 &quot;for transparency&quot; makes you an immediate target and wastes the surprise factor of your poison.</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">😤</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Emotional Poisoning</h4>
            <p className="text-sm text-[var(--text-secondary)]">Poisoning someone because they accused you or annoyed you. Never let emotions drive your most powerful ability.</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🐺</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Saving Suspicious Players</h4>
            <p className="text-sm text-[var(--text-secondary)]">Using antidote on someone who was already suspected of being a wolf. Sometimes wolves sacrifice themselves to waste your potion.</p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">⏰</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Dying with Unused Potions</h4>
            <p className="text-sm text-[var(--text-secondary)]">Getting voted out or killed with both potions still available. If you suspect you&apos;re being targeted, consider using them preemptively.</p>
          </div>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" title="Witch Strategy FAQ" subtitle="Expert answers to common questions">
        <LandingFaq items={faqItems} />
      </LandingSection>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-950/30 to-purple-950/30 p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">
            Brew Your Perfect Strategy 🧪
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            Master the art of potion timing through practice. Play unlimited games as Witch against AI opponents 
            and learn when to save, when to poison, and when to hold.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Play as Witch
          </Link>
        </div>
      </section>

      {/* Related Links */}
      <LandingSection id="related" title="Related Guides" subtitle="Continue mastering Werewolf">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
