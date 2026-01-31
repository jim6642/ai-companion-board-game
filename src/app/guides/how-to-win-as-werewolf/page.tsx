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
  title: "How to Win as Werewolf: Complete Strategy Guide | Wolfcha",
  description:
    "Master werewolf strategy with our comprehensive guide. Learn deception tactics, kill target selection, fake claiming, vote manipulation, and team coordination to dominate as the wolf team.",
  keywords: [
    "werewolf strategy",
    "how to win as werewolf",
    "werewolf tips",
    "mafia strategy",
    "werewolf deception",
    "wolf team strategy",
    "how to lie in werewolf",
    "werewolf fake claim",
  ],
  alternates: {
    canonical: "https://wolf-cha.com/guides/how-to-win-as-werewolf",
  },
  openGraph: {
    title: "How to Win as Werewolf: Master the Art of Deception | Wolfcha",
    description:
      "Complete werewolf strategy guide - deception tactics, kill selection, fake claiming, and coordination to ensure wolf victory.",
    url: "https://wolf-cha.com/guides/how-to-win-as-werewolf",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Strategy Guide" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to Win as Werewolf: Complete Strategy Guide",
  description: "Master the art of deception and dominate as the werewolf team with comprehensive strategies for kill selection, fake claiming, and team coordination.",
  image: "https://wolf-cha.com/og-image.png",
  author: { "@type": "Organization", name: "Wolfcha", url: "https://wolf-cha.com" },
  publisher: { "@type": "Organization", name: "Wolfcha", logo: { "@type": "ImageObject", url: "https://wolf-cha.com/logo.png" } },
  datePublished: "2024-01-15",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://wolf-cha.com/guides/how-to-win-as-werewolf" },
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "The Bus Driver",
    subtitle: "Sacrificing a teammate for credibility",
    lines: [
      { speaker: { seed: "wolf_bus", name: "Alex", modelLogo: "/models/deepseek.svg", meta: "Wolf" }, content: "I've been watching Player 5 closely. Their defense yesterday was weak, and they voted against the confirmed villager. I think they're a wolf." },
      { speaker: { seed: "wolf_victim", name: "Player 5", modelLogo: "/models/qwen.svg", meta: "Wolf (targeted)" }, content: "What? Alex, we've been agreeing all game! Why are you turning on me now? This is ridiculous!" },
      { speaker: { seed: "villager_trusting", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "Interesting... Alex has been making good reads. If they're willing to vote their ally, that seems like village behavior." },
    ],
  },
  {
    title: "The Fake Seer Claim",
    subtitle: "A risky but powerful gambit",
    lines: [
      { speaker: { seed: "wolf_fake_seer", name: "Alex", modelLogo: "/models/deepseek.svg", meta: "Wolf (fake Seer)" }, content: "I need to come forward. I'm the Seer. Night 1 I checked Player 3 - villager. Night 2 I checked Player 8 - WEREWOLF. We need to vote them out." },
      { speaker: { seed: "real_seer", name: "Morgan", modelLogo: "/models/kimi.svg", meta: "Real Seer" }, content: "That's a lie! I'm the real Seer. I checked Alex last night - they're a WOLF! This is a desperate fake claim!" },
      { speaker: { seed: "confused_villager", name: "Jordan", modelLogo: "/models/claude.svg" }, content: "Two Seer claims... One of you is definitely lying. Alex, what was your reasoning for checking Player 3 first?" },
    ],
  },
  {
    title: "Subtle Misdirection",
    subtitle: "Planting seeds of doubt",
    lines: [
      { speaker: { seed: "wolf_subtle", name: "Alex", modelLogo: "/models/deepseek.svg", meta: "Wolf" }, content: "I'm not saying Morgan is definitely a wolf, but doesn't it seem convenient that they always have 'reads' that turn out wrong? Just an observation." },
      { speaker: { seed: "villager_doubting", name: "Riley", modelLogo: "/models/glm.svg" }, content: "Now that you mention it... Morgan did push hard for Player 2 who turned out to be villager. That's worth considering." },
      { speaker: { seed: "real_seer_def", name: "Morgan", modelLogo: "/models/kimi.svg", meta: "Actual Seer" }, content: "Everyone makes wrong reads sometimes! I was following the evidence. Alex, why are you trying to discredit me specifically?" },
    ],
  },
];

const faqItems = [
  { question: "How do werewolves win the game?", answer: "Werewolves win when they equal or outnumber the remaining villagers. For example: 2 wolves vs 2 villagers = wolf win. This means wolves need to eliminate villagers through night kills and misdirected day votes while keeping their own numbers up." },
  { question: "Should I ever sacrifice a fellow wolf?", answer: "Yes, 'bussing' (voting against your teammate) can be a powerful strategy when: (1) they're already doomed and you can gain trust, (2) late game when 2 wolves aren't needed, or (3) to create a credible 'village' reputation. Never bus unnecessarily early." },
  { question: "Who should werewolves kill first?", answer: "Priority targets: (1) Confirmed/suspected Seer - they can expose you, (2) Strong village leaders who organize votes against wolves, (3) Players who correctly identified wolf behavior. Avoid killing: players who are already suspicious of villagers." },
  { question: "Should I fake claim a role as wolf?", answer: "Fake claiming is risky but can be game-winning. Claim Seer if: the real Seer revealed and you can counter-claim, or late game to create chaos. Claim Villager if pressed. Never claim Witch/Hunter unless desperate - those claims are easily tested." },
  { question: "How do I act village as a wolf?", answer: "Participate actively (silence is suspicious), make logical observations about non-wolf players, vote with the majority on non-wolves, show appropriate emotional reactions, and build relationships with trusted villagers early." },
  { question: "What if the Seer checks me?", answer: "If checked and exposed, immediately counter-claim Seer with fake results, or claim Seer made a mistake. Create enough doubt that the village hesitates. If you've built good trust, some may believe you over the real Seer." },
  { question: "How should wolves coordinate during the day?", answer: "Don't be obvious about defending each other. Spread your votes across different villagers. Take different positions to seem independent. One wolf can be aggressive while another plays passive. Never vote together unless it looks natural." },
  { question: "When should wolves lay low vs be aggressive?", answer: "Early game: blend in, build trust, gather information. Mid game: start controlling narratives, eliminate threats. Late game: be more aggressive if needed to secure the win. Adapt based on how much suspicion you're under." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules", description: "Understand the full game" },
  { href: "/guides/how-to-bluff", label: "Bluffing Guide", description: "Master the art of deception" },
  { href: "/guides/how-to-win-as-villager", label: "Villager Strategy", description: "Know your enemy" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Counter the Seer threat" },
  { href: "/guides/werewolf-night-phase", label: "Night Phase", description: "Optimize your kills" },
  { href: "/roles/werewolf", label: "Werewolf Role", description: "Complete role overview" },
];

export default function HowToWinAsWerewolfPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={articleJsonLd} />

      <LandingHero
        title="How to Win as Werewolf: The Art of Deception"
        subtitle="WOLF TEAM STRATEGY"
        description="Playing as a werewolf is Werewolf at its most thrilling. You know secrets the village doesn't. You coordinate kills with your pack. You deceive, manipulate, and outlast. Master these strategies to become the apex predator."
        primaryCta={{ href: "/", label: "Practice as Wolf" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Game Rules" }}
        image={{ src: "/roles/werewolf.png", alt: "Werewolf role" }}
      />

      {/* Win Condition */}
      <LandingSection
        id="win-condition"
        title="Understanding Wolf Victory"
        subtitle="Know exactly what you're working toward"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-950/40 to-transparent p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <span className="text-3xl">🐺</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Wolf Win Condition</h3>
                <p className="text-sm text-red-400">Achieve parity with villagers</p>
              </div>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">
              Werewolves win when they <strong className="text-[var(--text-primary)]">equal or outnumber</strong> the remaining village team members. 
              At this point, wolves control the vote and cannot be stopped.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-red-950/50 p-3">
                <div className="text-lg font-bold text-red-400">2v2</div>
                <div className="text-xs text-[var(--text-secondary)]">Wolf Win</div>
              </div>
              <div className="rounded-lg bg-red-950/50 p-3">
                <div className="text-lg font-bold text-red-400">1v1</div>
                <div className="text-xs text-[var(--text-secondary)]">Wolf Win</div>
              </div>
              <div className="rounded-lg bg-red-950/50 p-3">
                <div className="text-lg font-bold text-red-400">3v2</div>
                <div className="text-xs text-[var(--text-secondary)]">Wolf Win</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Paths to Victory</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-sm">1</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Night Eliminations</div>
                  <p className="text-sm text-[var(--text-secondary)]">Kill key village roles and reduce their numbers each night</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-sm">2</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Misdirected Votes</div>
                  <p className="text-sm text-[var(--text-secondary)]">Manipulate the village into voting out their own teammates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold text-sm">3</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Survive & Outlast</div>
                  <p className="text-sm text-[var(--text-secondary)]">Avoid detection while systematically achieving parity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Kill Target Selection */}
      <LandingSection
        id="kills"
        title="Night Kill Strategy"
        subtitle="Choose your targets wisely"
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Kill Priority Tier List</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-red-950/40 border border-red-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/30 text-red-300 font-bold">S</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Highest Priority: Confirmed Seer</div>
                  <p className="text-sm text-[var(--text-secondary)]">A revealed Seer with credibility is your biggest threat. They will expose you. Kill them before they check more wolves.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-orange-950/40 border border-orange-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/30 text-orange-300 font-bold">A</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">High Priority: Village Leaders</div>
                  <p className="text-sm text-[var(--text-secondary)]">Players who organize the village, make good reads, and unite votes against wolves. Their death creates chaos and confusion.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-yellow-950/40 border border-yellow-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/30 text-yellow-300 font-bold">B</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Medium Priority: Suspected Power Roles</div>
                  <p className="text-sm text-[var(--text-secondary)]">Players who might be Witch (still has poison) or Guard (can protect Seer). Even if wrong, eliminating potential threats helps.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-gray-950/40 border border-gray-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-500/30 text-gray-300 font-bold">C</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Low Priority: Quiet/Neutral Players</div>
                  <p className="text-sm text-[var(--text-secondary)]">Players who aren&apos;t affecting the game much. Safe kills but don&apos;t advance your position significantly.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-lg bg-blue-950/40 border border-blue-500/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/30 text-blue-300 font-bold">—</div>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Avoid Killing: Your Defenders</div>
                  <p className="text-sm text-[var(--text-secondary)]">Never kill someone who publicly defended you - it makes you look extremely suspicious. Also avoid killing players the village already suspects.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
              <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <span className="text-green-400">✓</span> Smart Kill Tactics
              </h4>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                <li>• Kill players who correctly read wolves</li>
                <li>• Eliminate the Sheriff to remove their voting power</li>
                <li>• Consider killing someone you publicly suspected (looks villagey)</li>
                <li>• Kill the player most likely to get Guard protection to waste it</li>
              </ul>
            </div>

            <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
              <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <span className="text-red-400">✗</span> Kill Mistakes to Avoid
              </h4>
              <ul className="text-sm text-[var(--text-secondary)] space-y-2">
                <li>• Don&apos;t kill your strong defenders</li>
                <li>• Don&apos;t kill players already under suspicion</li>
                <li>• Don&apos;t create obvious patterns (e.g., always seat 1&apos;s neighbor)</li>
                <li>• Don&apos;t kill the Hunter unless you&apos;re confident they&apos;ll shoot wrong</li>
              </ul>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Deception Techniques */}
      <LandingSection
        id="deception"
        title="Deception & Manipulation"
        subtitle="The core werewolf skills"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🎭</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Act Natural</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Participate in discussions as if you&apos;re genuinely trying to find wolves. Make observations, ask questions, and react naturally to events.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Show genuine curiosity about other players&apos; reasoning
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🎯</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Controlled Accusations</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Accuse villagers, but don&apos;t overdo it. One strong, well-reasoned accusation is more effective than scattered attacks on everyone.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Base accusations on real behavioral observations
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🤝</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Build Alliances</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Gain the trust of influential villagers early. If they vouch for you, it&apos;s much harder for others to accuse you later.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Agree with strong village reads to build rapport
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🌊</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Go With the Flow</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              If the village is united against a villager, join the vote. Resisting obvious momentum looks suspicious. Save your villager for another day.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Vote timing matters - don&apos;t always be first or last
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🔀</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Divide & Conquer</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Create conflict between villagers. If two villagers are fighting each other, they&apos;re not focused on finding you.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Subtly support both sides of village disputes
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">😇</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Emotional Authenticity</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              React appropriately to deaths and revelations. Seem genuinely upset when &quot;innocent&quot; villagers die. Celebrate wolf eliminations.
            </p>
            <div className="mt-3 p-2 rounded bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">
              Tip: Practice your &quot;surprised&quot; reaction for your own kill
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Advanced Tactics */}
      <LandingSection
        id="advanced"
        title="Advanced Wolf Tactics"
        subtitle="High-risk, high-reward strategies"
      >
        <div className="space-y-6">
          {/* Bussing */}
          <div className="rounded-xl border border-amber-500/30 bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-2xl">🚌</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Bussing (Sacrificing Teammates)</h3>
                <p className="text-sm text-amber-400">The ultimate trust-building maneuver</p>
              </div>
            </div>
            <p className="text-[var(--text-secondary)] mb-4">
              &quot;Bussing&quot; means voting against your wolf teammate to gain village trust. It&apos;s painful but incredibly effective when done right.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-green-950/20 p-4 border border-green-500/20">
                <div className="font-semibold text-green-400 mb-2">When to Bus</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• Teammate is already doomed - gain credit for the vote</li>
                  <li>• Late game when 2 wolves aren&apos;t needed</li>
                  <li>• When you desperately need village trust</li>
                  <li>• Teammate is playing badly and drawing attention to you</li>
                </ul>
              </div>
              <div className="rounded-lg bg-red-950/20 p-4 border border-red-500/20">
                <div className="font-semibold text-red-400 mb-2">When Not to Bus</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• Early game when you need numbers</li>
                  <li>• Teammate can still be saved</li>
                  <li>• You&apos;ll be obvious as the last wolf</li>
                  <li>• Your vote isn&apos;t needed (they&apos;re already dying)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fake Claiming */}
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <span className="text-2xl">🎭</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Fake Claiming Roles</h3>
                <p className="text-sm text-purple-400">Dangerous but game-winning</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
                <div className="font-semibold text-yellow-400 mb-2">🔮 Fake Seer</div>
                <p className="text-xs text-[var(--text-secondary)]">Claim Seer with fake wolf results on villagers. Risky if real Seer is alive. Best when counter-claiming a revealed Seer.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
                <div className="font-semibold text-gray-400 mb-2">👤 Fake Villager</div>
                <p className="text-xs text-[var(--text-secondary)]">The safest claim. Everyone expects villagers. Just don&apos;t claim too eagerly - real villagers don&apos;t feel the need to prove it.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-4">
                <div className="font-semibold text-green-400 mb-2">🧪 Fake Witch</div>
                <p className="text-xs text-[var(--text-secondary)]">Very risky - Witch claims can be tested (&quot;save tonight to prove it&quot;). Only use if desperate and confident.</p>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Dialogue Examples */}
      <LandingSection
        id="examples"
        title="Wolf Dialogue Examples"
        subtitle="See these tactics in action"
      >
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      {/* Team Coordination */}
      <LandingSection
        id="coordination"
        title="Wolf Team Coordination"
        subtitle="Working together without being obvious"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Daytime Coordination</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400">⚠️</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Don&apos;t Defend Each Other Obviously</div>
                  <p className="text-sm text-[var(--text-secondary)]">If your teammate is accused, don&apos;t jump to their defense immediately. Let others speak first, then offer mild support or stay neutral.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400">⚠️</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Spread Your Votes</div>
                  <p className="text-sm text-[var(--text-secondary)]">Don&apos;t always vote the same way. If one wolf votes Player A, another might vote Player B. Looking independent is crucial.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400">⚠️</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Take Different Positions</div>
                  <p className="text-sm text-[var(--text-secondary)]">One wolf can be aggressive, another passive. One analytical, another emotional. This makes it harder to link you together.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Night Coordination</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Agree on Kill Quickly</div>
                  <p className="text-sm text-[var(--text-secondary)]">In physical games, use pre-agreed signals. In online games like Wolfcha, discuss and reach consensus efficiently.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Plan Tomorrow&apos;s Strategy</div>
                  <p className="text-sm text-[var(--text-secondary)]">Decide who will push which agenda. Who will accuse who. Having a coordinated plan makes the day phase easier.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400">✓</span>
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Discuss Threats</div>
                  <p className="text-sm text-[var(--text-secondary)]">Share observations about who might be Seer, who suspects you, and who should be the next kill target.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Common Mistakes */}
      <LandingSection
        id="mistakes"
        title="Common Wolf Mistakes"
        subtitle="Avoid these game-losing errors"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🛡️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Over-Defending Teammates</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Jumping to defend your wolf buddy every time they&apos;re accused is the most common tell. Let them face some heat.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🤫</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Being Too Quiet</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Wolves who &quot;lay low&quot; by being silent stand out. Real villagers participate. Engage in discussions naturally.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">📢</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Overconfident Accusations</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Being too certain someone is a wolf when you &quot;shouldn&apos;t know&quot; is suspicious. Hedge your reads like villagers do.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">😰</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Panicking When Accused</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Getting defensive, angry, or making desperate claims when accused looks guilty. Stay calm and address points logically.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🎯</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Predictable Kills</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Always killing your accusers or obvious patterns (clockwise, neighbors) make it easy to trace kills back to you.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🗳️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Voting Identically</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              If all wolves vote the same way every round, observant players will notice the pattern and identify the wolf team.
            </p>
          </div>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" title="Wolf Strategy FAQ" subtitle="Expert answers to common questions">
        <LandingFaq items={faqItems} />
      </LandingSection>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 to-purple-950/40 p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">
            Embrace Your Inner Wolf 🐺
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            The best way to master wolf strategy is through practice. Play unlimited games in Wolfcha and 
            experience being a werewolf against AI opponents who will challenge your deception skills.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Hunt as Werewolf
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
