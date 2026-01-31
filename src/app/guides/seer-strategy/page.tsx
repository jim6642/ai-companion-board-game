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
  title: "Seer Strategy Guide: How to Play Seer in Werewolf | Wolfcha",
  description:
    "Master the Seer role in Werewolf with our comprehensive strategy guide. Learn who to check, when to reveal, how to share information, and avoid common mistakes that get Seers killed.",
  keywords: [
    "werewolf seer strategy",
    "seer role werewolf",
    "how to play seer",
    "seer tips werewolf",
    "werewolf seer guide",
    "when to reveal seer",
    "seer check order",
    "mafia cop strategy",
  ],
  alternates: {
    canonical: "https://wolf-cha.com/guides/seer-strategy",
  },
  openGraph: {
    title: "Seer Strategy Guide: Master the Most Powerful Village Role | Wolfcha",
    description:
      "Complete Seer strategy guide for Werewolf - who to check, when to reveal, and how to lead the village to victory.",
    url: "https://wolf-cha.com/guides/seer-strategy",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Seer Strategy Guide" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Seer Strategy Guide: How to Play Seer in Werewolf",
  description: "Complete strategy guide for playing the Seer role in Werewolf, including check priorities, reveal timing, and information management.",
  image: "https://wolf-cha.com/og-image.png",
  author: { "@type": "Organization", name: "Wolfcha", url: "https://wolf-cha.com" },
  publisher: { "@type": "Organization", name: "Wolfcha", logo: { "@type": "ImageObject", url: "https://wolf-cha.com/logo.png" } },
  datePublished: "2024-01-15",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://wolf-cha.com/guides/seer-strategy" },
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "Strong Seer Reveal",
    subtitle: "Day 2 - Revealing with wolf info",
    lines: [
      { speaker: { seed: "seer_reveal", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Seer" }, content: "I'm the Seer. Night 1, I checked Player 7 - they're a villager. Night 2, I checked Player 4 - they're a WEREWOLF. We need to vote out Player 4 today." },
      { speaker: { seed: "wolf_counter", name: "Player 4 (Wolf)", modelLogo: "/models/deepseek.svg" }, content: "That's convenient. Anyone can claim Seer when they want someone dead. I'm actually the Seer, and I checked Morgan - they came back wolf!" },
      { speaker: { seed: "villager_analyze", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "We have two Seer claims. Morgan, can you explain why you checked Player 7 first? And Player 4, who did YOU check Night 1?" },
    ],
  },
  {
    title: "Seer Leaving Breadcrumbs",
    subtitle: "Day 1 - Subtle information sharing",
    lines: [
      { speaker: { seed: "seer_subtle", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Hidden Seer" }, content: "I have a good feeling about Player 3. I think we can trust them. My reads are: Player 6 and Player 8 seem suspicious based on their behavior." },
      { speaker: { seed: "observer_subtle", name: "Jordan", modelLogo: "/models/kimi.svg" }, content: "Why do you trust Player 3 so much? You haven't interacted much." },
      { speaker: { seed: "seer_subtle", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Hidden Seer" }, content: "Just a feeling. Call it intuition. Let's focus on the suspicious ones - Player 6 defended Player 9 who was acting strange yesterday." },
    ],
  },
];

const faqItems = [
  { question: "Who should I check first as Seer?", answer: "Check the most suspicious players first, or players who are likely to be targeted by wolves (confirmed village roles). Avoid checking players who are already confirmed or likely to die soon. Priority: loud accusers, quiet players, or anyone the village is uncertain about." },
  { question: "When should I reveal as Seer?", answer: "Reveal when: (1) You have wolf information the village needs, (2) You're about to be voted out and need to defend yourself, (3) A fake Seer is misleading the village, or (4) Late game when hiding serves no purpose. Don't reveal early just to prove you're village." },
  { question: "What if I only find villagers?", answer: "Finding villagers is still valuable - it confirms who the village can trust. Share this information strategically. 2-3 confirmed villagers can work together effectively. However, prioritize checking suspicious players to find wolves faster." },
  { question: "Should I run for Sheriff as Seer?", answer: "Generally no. The Sheriff is a high-profile target, and revealing yourself as Seer during the campaign is risky. However, if another strong village player isn't running and wolves might take Sheriff, it can be worth the risk." },
  { question: "How do I deal with a fake Seer claim?", answer: "If someone fake-claims Seer when you're the real one, you must counter-claim immediately. Provide your check history with specific details. Ask the fake Seer questions about their checks. The village will decide who to trust based on logic and consistency." },
  { question: "What if wolves kill me before I can share info?", answer: "Use 'breadcrumbs' - hint at your checks without revealing you're Seer. Say things like 'I trust Player X' or 'Player Y seems suspicious to me.' If you die, attentive villagers may piece together your hints. Consider writing down checks if rules allow." },
  { question: "Should I check the Sheriff candidate?", answer: "Checking Sheriff candidates can be valuable - if you confirm a wolf is running for Sheriff, that's game-changing information. However, if the candidate seems genuinely village, your check might be wasted on someone already trusted." },
  { question: "How do I know if someone is lying about being checked?", answer: "If someone claims you checked them when you didn't, or claims a different result than what you saw, they're either a wolf or confused. Immediately clarify the true result. This often exposes wolves who are trying to discredit you." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules Guide", description: "Full game rules" },
  { href: "/guides/werewolf-night-phase", label: "Night Phase Guide", description: "Master night actions" },
  { href: "/guides/witch-strategy", label: "Witch Strategy", description: "Coordinate with Witch" },
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Win as the good team" },
  { href: "/guides/how-to-spot-a-liar", label: "Spotting Liars", description: "Detect wolf deception" },
  { href: "/roles/seer", label: "Seer Role Page", description: "Complete role overview" },
];

export default function SeerStrategyPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={articleJsonLd} />

      <LandingHero
        title="Seer Strategy: Master the Village's Greatest Weapon"
        subtitle="ROLE STRATEGY GUIDE"
        description="The Seer is the most powerful information role in Werewolf. Each night, you learn one player's true alignment. But with great power comes great responsibility - and a target on your back. Learn how to maximize your checks, reveal at the perfect moment, and lead the village to victory."
        primaryCta={{ href: "/", label: "Practice as Seer" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Game Rules" }}
        image={{ src: "/roles/seer.png", alt: "Seer role" }}
      />

      {/* Role Overview */}
      <LandingSection
        id="overview"
        title="Understanding the Seer Role"
        subtitle="The village's eyes in the darkness"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                The Seer (also called Detective, Cop, or Investigator in Mafia variants) is the village team&apos;s most valuable role. 
                Every night, you choose one player and learn their true alignment: <strong className="text-yellow-400">Werewolf</strong> or <strong className="text-blue-400">Villager</strong>.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                This information is incredibly powerful - but it&apos;s only useful if you survive long enough to share it, 
                and if the village trusts you when you do. Wolves will hunt you relentlessly, and fake Seer claims can muddy the waters.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-green-500/30 bg-green-950/20 p-4">
                <div className="font-semibold text-green-400 mb-2">✓ What You See</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• <strong className="text-[var(--text-primary)]">Werewolf:</strong> Target is on the evil team</li>
                  <li>• <strong className="text-[var(--text-primary)]">Villager:</strong> Target is on the village team</li>
                  <li>• All village roles (Witch, Hunter, Guard) show as Villager</li>
                </ul>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
                <div className="font-semibold text-red-400 mb-2">✗ What You Don&apos;t See</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• The specific role (can&apos;t tell Witch from Villager)</li>
                  <li>• Who other players checked</li>
                  <li>• Whether your target was protected or attacked</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-6">
            <div className="relative h-40 w-full mb-4 overflow-hidden rounded-lg border border-yellow-500/20">
              <Image src="/roles/seer.png" alt="Seer" fill className="object-contain" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] mb-2">Seer Quick Stats</h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li className="flex justify-between"><span>Team:</span><span className="text-blue-400 font-semibold">Village</span></li>
              <li className="flex justify-between"><span>Night Action:</span><span className="text-yellow-400 font-semibold">Check 1 player</span></li>
              <li className="flex justify-between"><span>Priority Target:</span><span className="text-red-400 font-semibold">Very High</span></li>
              <li className="flex justify-between"><span>Difficulty:</span><span className="text-orange-400 font-semibold">Advanced</span></li>
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Who to Check */}
      <LandingSection
        id="checks"
        title="Who to Check: Priority System"
        subtitle="Making every check count"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Check Priority Tiers</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-red-950/30 border border-red-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold">S</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Highest Priority: Suspicious & Influential</div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Players who are acting suspicious AND have significant influence on the village. If they&apos;re a wolf, exposing them swings the game.</p>
                  <div className="mt-2 text-xs text-red-300">Examples: Aggressive accusers who might be misdirecting, popular players others follow, Sheriff candidates</div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-orange-950/30 border border-orange-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold">A</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">High Priority: Behavioral Red Flags</div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Players showing wolf-like behavior but not yet under village suspicion. Catching them early prevents damage.</p>
                  <div className="mt-2 text-xs text-orange-300">Examples: Unusually quiet players, those avoiding eye contact with certain players, inconsistent story-tellers</div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-yellow-950/30 border border-yellow-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 font-bold">B</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Medium Priority: Uncertain Players</div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Players the village can&apos;t read. Confirming them as villager or wolf provides clarity.</p>
                  <div className="mt-2 text-xs text-yellow-300">Examples: Newcomers with unpredictable play styles, middle-of-the-road players, those who avoid taking strong positions</div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-gray-950/30 border border-gray-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-500/20 text-gray-400 font-bold">C</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Low Priority: Likely Villagers</div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Players who seem genuinely village. Checking them confirms trust but doesn&apos;t find wolves.</p>
                  <div className="mt-2 text-xs text-gray-300">Examples: Players making logical village arguments, those who correctly identified wolves, consistent behavior across days</div>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-blue-950/30 border border-blue-500/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold">—</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Never Check: Confirmed or Dead</div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Never waste a check on players already confirmed by other means or about to die.</p>
                  <div className="mt-2 text-xs text-blue-300">Examples: Someone the vote is already against, revealed power roles, players you already checked</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <h4 className="font-bold text-[var(--text-primary)] mb-3">Night 1 Strategy</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Your first check is crucial. You have no information yet, so rely on intuition from lobby behavior or check someone influential.
              </p>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>✓ Check someone who spoke a lot during setup</li>
                <li>✓ Check someone with a strong lobby presence</li>
                <li>✗ Don&apos;t random check - have a reason</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <h4 className="font-bold text-[var(--text-primary)] mb-3">Late Game Strategy</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                With fewer players, each check is more impactful. Focus on the 2-3 players the village is torn about.
              </p>
              <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                <li>✓ Check players the village will vote on tomorrow</li>
                <li>✓ Prioritize game-deciding information</li>
                <li>✗ Don&apos;t check already-suspected wolves (vote them)</li>
              </ul>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* When to Reveal */}
      <LandingSection
        id="reveal"
        title="When to Reveal as Seer"
        subtitle="Timing your reveal for maximum impact"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-green-400">✓</span> Good Times to Reveal
            </h3>
            
            <div className="space-y-3">
              <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">You Found a Wolf</div>
                <p className="text-sm text-[var(--text-secondary)]">When you have a confirmed wolf result, the village needs this information. Reveal with your full check history for credibility.</p>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">You&apos;re Being Voted Out</div>
                <p className="text-sm text-[var(--text-secondary)]">If you&apos;re about to be eliminated, reveal to save yourself. A dead Seer is useless. Even without wolf info, your villager checks have value.</p>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Fake Seer Appears</div>
                <p className="text-sm text-[var(--text-secondary)]">If someone else claims Seer, you must counter-claim immediately. Two Seer claims means at least one is a wolf - the village will analyze both.</p>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Late Game Clarity</div>
                <p className="text-sm text-[var(--text-secondary)]">When only 4-5 players remain, hiding serves little purpose. Your accumulated checks can guide the final votes.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-red-400">✗</span> Bad Times to Reveal
            </h3>
            
            <div className="space-y-3">
              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Day 1 with No Info</div>
                <p className="text-sm text-[var(--text-secondary)]">Revealing early just to &quot;prove you&apos;re village&quot; wastes your hidden advantage and makes you wolf target #1.</p>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Only Villager Checks</div>
                <p className="text-sm text-[var(--text-secondary)]">Revealing with only &quot;Player X is village&quot; results is weak. It&apos;s easy for wolves to fake and doesn&apos;t give actionable intel.</p>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Village Already United</div>
                <p className="text-sm text-[var(--text-secondary)]">If the village is already voting correctly and wolves are losing, revealing paints a target on you for no benefit.</p>
              </div>

              <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Sheriff Campaign</div>
                <p className="text-sm text-[var(--text-secondary)]">Claiming Seer while running for Sheriff is very risky. If you win, wolves know exactly who to kill. If you lose, you&apos;re exposed anyway.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reveal Strength Guide */}
        <div className="mt-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Reveal Strength Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Your Information</th>
                  <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Reveal Strength</th>
                  <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Recommendation</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)]">
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 px-4">1 wolf + 1 villager check</td>
                  <td className="py-2 px-4 text-green-400 font-semibold">Strong</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">Reveal now - actionable wolf info</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 px-4">2+ wolf checks</td>
                  <td className="py-2 px-4 text-green-400 font-semibold">Very Strong</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">Reveal immediately - game-winning</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 px-4">2-3 villager checks only</td>
                  <td className="py-2 px-4 text-yellow-400 font-semibold">Medium</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">Wait unless pressured</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-2 px-4">1 villager check only</td>
                  <td className="py-2 px-4 text-orange-400 font-semibold">Weak</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">Only reveal if being voted out</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">No checks yet (Night 1)</td>
                  <td className="py-2 px-4 text-red-400 font-semibold">Very Weak</td>
                  <td className="py-2 px-4 text-[var(--text-secondary)]">Never reveal - stay hidden</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </LandingSection>

      {/* Information Management */}
      <LandingSection
        id="info-management"
        title="Managing Your Information"
        subtitle="Sharing intel without revealing your role"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>🍞</span> The Breadcrumb Technique
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Breadcrumbs are hints about your checks without claiming Seer. If you die, attentive villagers can piece them together.
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Instead of saying:</div>
                <div className="text-sm text-red-400">&quot;I checked Player 5 and they&apos;re village&quot;</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">Say:</div>
                <div className="text-sm text-green-400">&quot;I have a really good feeling about Player 5. I think we can trust them completely.&quot;</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="text-xs text-[var(--text-muted)] mb-1">For wolf results:</div>
                <div className="text-sm text-green-400">&quot;Something about Player 8 really bothers me. I wouldn&apos;t be surprised if they flip wolf.&quot;</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>📋</span> Tracking Your Checks
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Always keep a mental or written record of every check. When you reveal, you need your full history.
            </p>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-4 font-mono text-sm">
              <div className="text-[var(--text-muted)] mb-2">Example Check Log:</div>
              <div className="space-y-1 text-[var(--text-secondary)]">
                <div>Night 1: Player 7 → <span className="text-blue-400">Villager</span></div>
                <div>Night 2: Player 4 → <span className="text-red-400">Werewolf</span></div>
                <div>Night 3: Player 2 → <span className="text-blue-400">Villager</span></div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Tip: In Wolfcha, your check history is tracked automatically in the UI!
            </p>
          </div>
        </div>
      </LandingSection>

      {/* Dialogue Examples */}
      <LandingSection
        id="examples"
        title="Seer Dialogue Examples"
        subtitle="How to communicate effectively as Seer"
      >
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      {/* Common Mistakes */}
      <LandingSection
        id="mistakes"
        title="Common Seer Mistakes"
        subtitle="Avoid these game-losing errors"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🗣️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Revealing Too Early</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Claiming Seer Day 1 or with only villager checks makes you an instant wolf target without giving the village useful info.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🎯</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Checking Random Players</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Every check is precious. Random checks waste your limited nights. Always have a strategic reason.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🤫</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Being Too Quiet</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Staying completely silent to &quot;hide&quot; actually looks suspicious. Participate normally without revealing your role.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">😱</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Panicking Under Pressure</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              When accused, some Seers reveal hastily with weak info. Stay calm, evaluate if revealing is truly necessary.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🔄</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Rechecking Players</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Never check the same player twice. Their alignment doesn&apos;t change. Use each night to gather new information.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🤥</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Not Counter-Claiming</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              If a wolf claims Seer, you MUST counter-claim immediately. Staying silent lets them control the narrative.
            </p>
          </div>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" title="Seer Strategy FAQ" subtitle="Expert answers to common Seer questions">
        <LandingFaq items={faqItems} />
      </LandingSection>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 to-amber-950/30 p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">
            Practice Your Seer Skills
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            The best Seers develop through experience. Play unlimited games as Seer against AI opponents in Wolfcha 
            and perfect your check strategy, reveal timing, and information management.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Play as Seer Now
          </Link>
        </div>
      </section>

      {/* Related Links */}
      <LandingSection id="related" title="Related Guides" subtitle="Continue improving your Werewolf skills">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
