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
  title: "Werewolf Day Phase Guide: Discussion, Voting & Strategy | Wolfcha",
  description:
    "Master the Werewolf day phase with our complete guide. Learn discussion strategies, voting tactics, sheriff elections, speech patterns, and how to identify wolves through behavior analysis.",
  keywords: [
    "werewolf day phase",
    "werewolf voting",
    "werewolf discussion",
    "mafia day round",
    "werewolf sheriff election",
    "how to find werewolves",
    "werewolf speech strategy",
    "social deduction tips",
  ],
  alternates: {
    canonical: "https://wolf-cha.com/guides/werewolf-day-phase",
  },
  openGraph: {
    title: "Werewolf Day Phase Guide: Discussion & Voting Strategy | Wolfcha",
    description:
      "Complete guide to the Werewolf day phase - discussion tactics, voting strategies, sheriff elections, and how to identify wolves.",
    url: "https://wolf-cha.com/guides/werewolf-day-phase",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Day Phase Guide" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Werewolf Day Phase Guide: Discussion, Voting & Strategy",
  description: "Complete guide to the Werewolf day phase including discussion strategies, voting tactics, and behavioral analysis.",
  image: "https://wolf-cha.com/og-image.png",
  author: { "@type": "Organization", name: "Wolfcha", url: "https://wolf-cha.com" },
  publisher: { "@type": "Organization", name: "Wolfcha", logo: { "@type": "ImageObject", url: "https://wolf-cha.com/logo.png" } },
  datePublished: "2024-01-15",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://wolf-cha.com/guides/werewolf-day-phase" },
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "Aggressive Accusation",
    subtitle: "A classic wolf-hunting approach",
    lines: [
      { speaker: { seed: "accuser_1", name: "Morgan", modelLogo: "/models/qwen.svg" }, content: "Player 7, you've been really quiet since the game started. When Player 3 died, you didn't react at all. That's suspicious to me." },
      { speaker: { seed: "accused_1", name: "Player 7 (Alex)", modelLogo: "/models/deepseek.svg" }, content: "I was listening and gathering information. Not everyone needs to be loud to contribute. Actually, YOUR aggressive style seems like wolf behavior trying to control the narrative." },
      { speaker: { seed: "observer_1", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "Let's hear both sides. Morgan, what specific evidence do you have? Alex, can you share any reads you've developed?" },
    ],
  },
  {
    title: "Role Claim Under Pressure",
    subtitle: "When to reveal information",
    lines: [
      { speaker: { seed: "voter_1", name: "Jordan", modelLogo: "/models/kimi.svg" }, content: "The votes are against you, Riley. You have 4 votes with 3 remaining voters. Do you have anything to say before we finalize?" },
      { speaker: { seed: "witch_claim", name: "Riley", modelLogo: "/models/claude.svg", meta: "Under pressure" }, content: "Wait - I'm the Witch. I still have my poison. If you vote me out, you're losing a valuable village role and the ability to kill a confirmed wolf later." },
      { speaker: { seed: "skeptic_1", name: "Taylor", modelLogo: "/models/glm.svg" }, content: "Anyone can claim Witch when they're about to die. Do you have any proof? Did you save anyone last night?" },
    ],
  },
  {
    title: "Sheriff Campaign Speech",
    subtitle: "Day 1 election rhetoric",
    lines: [
      { speaker: { seed: "sheriff_cand", name: "Alex", modelLogo: "/models/deepseek.svg", meta: "Candidate" }, content: "I'm running for Sheriff because I have strong reads and can help organize our voting. I'll use my weighted vote responsibly and pass the badge wisely if I die." },
      { speaker: { seed: "counter_cand", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Candidate" }, content: "I'm also running. Unlike Alex, I have information to share. I'm a power role and can help guide the village. Vote for me and I'll prove my worth." },
      { speaker: { seed: "voter_2", name: "Casey", modelLogo: "/models/gemini.svg" }, content: "Morgan, claiming a power role in sheriff election is risky. If you win and die tonight, wolves know our Seer/Witch is gone." },
    ],
  },
];

const faqItems = [
  { question: "What happens during the day phase?", answer: "The day phase consists of three main parts: death announcement (who died at night), discussion round (players speak in order, sharing information and accusations), and voting (majority vote eliminates one player). On Day 1, there's also a sheriff election before regular discussion." },
  { question: "How does voting work in Werewolf?", answer: "Each player votes for one other player they want to eliminate. The player with the most votes is eliminated. If there's a tie, rules vary - common approaches include a runoff vote between tied players, or no elimination. The Sheriff's vote counts as 1.5 votes." },
  { question: "What should I talk about during discussion?", answer: "Share observations about suspicious behavior, voting patterns, reaction to deaths, and logical inconsistencies. If you're a power role with information, decide strategically when to share it. Ask questions to test other players' stories." },
  { question: "How do I identify a werewolf?", answer: "Look for: defending eliminated wolves, staying silent during key discussions, inconsistent stories, knowing information they shouldn't, voting against confirmed villagers, and being too eager to vote out specific players without good reason." },
  { question: "Should I reveal my role during day phase?", answer: "It depends. Seers should reveal when they have wolf information AND the village needs it. Witches usually stay hidden unless targeted. Hunters can reveal to deter wolf attacks. Villagers should generally not fake-claim power roles as it causes confusion." },
  { question: "What is the sheriff election?", answer: "On Day 1, players can choose to run for Sheriff. Candidates give speeches, then all players vote. The winner gets the Sheriff badge (1.5x voting power) and can transfer it upon death. Being Sheriff is powerful but also makes you a target." },
  { question: "What are 'last words' in Werewolf?", answer: "When a player is eliminated (by vote or night kill), they typically get to speak final words before leaving the game. This is your last chance to share information, point fingers, or misdirect. Last words can significantly impact the game." },
  { question: "How do I defend myself when accused?", answer: "Stay calm, provide logical explanations for your behavior, point out the accuser's potential motives, ask what evidence they have, and if desperate, consider revealing your role. Don't get emotional or personal - it looks guilty." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules Guide", description: "Full game rules and mechanics" },
  { href: "/guides/werewolf-night-phase", label: "Night Phase Guide", description: "Master night actions" },
  { href: "/guides/how-to-spot-a-liar", label: "Spotting Liars", description: "Detect deception in speech" },
  { href: "/guides/how-to-bluff", label: "Bluffing Guide", description: "Deceive without getting caught" },
  { href: "/guides/how-to-win-as-villager", label: "Villager Strategy", description: "Win as the good team" },
  { href: "/guides/how-to-win-as-werewolf", label: "Werewolf Strategy", description: "Dominate as the wolf team" },
];

export default function WerewolfDayPhasePage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={articleJsonLd} />

      <LandingHero
        title="Werewolf Day Phase: The Art of Discussion"
        subtitle="VOTING & STRATEGY GUIDE"
        description="The day phase is where Werewolf truly comes alive. Accusations fly, alliances form, and deception runs deep. Master the art of discussion, learn to read your opponents, and lead the village to victory - or engineer their downfall."
        primaryCta={{ href: "/", label: "Play Now" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Full Rules" }}
        image={{ src: "/roles/hunter.png", alt: "Hunter ready for confrontation" }}
      />

      {/* Day Phase Overview */}
      <LandingSection
        id="overview"
        title="The Day Phase Structure"
        subtitle="Understanding each step of the day cycle"
      >
        <div className="space-y-6">
          {/* Timeline visualization */}
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-orange-950/30 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20">
                <span className="text-2xl">☀️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Day Phase Timeline</h3>
                <p className="text-sm text-amber-300">From dawn announcement to evening vote</p>
              </div>
            </div>

            <div className="relative">
              {/* Progress line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-amber-500/30 hidden md:block" />
              
              <div className="space-y-6">
                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold z-10">1</div>
                  <div className="pt-2">
                    <h4 className="font-bold text-[var(--text-primary)]">Death Announcement</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">The moderator announces who died during the night. Pay attention to reactions - wolves may show relief if their kill succeeded, or act surprised by deaths they caused.</p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold z-10">2</div>
                  <div className="pt-2">
                    <h4 className="font-bold text-[var(--text-primary)]">Sheriff Election (Day 1 Only)</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Players can volunteer to run for Sheriff. Candidates give campaign speeches, then everyone votes. The winner gets 1.5x voting power and badge transfer rights.</p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold z-10">3</div>
                  <div className="pt-2">
                    <h4 className="font-bold text-[var(--text-primary)]">Discussion Round</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Players speak in order (typically clockwise from a designated starting player). Each player shares observations, accusations, defenses, or role claims. This is the heart of the game.</p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold z-10">4</div>
                  <div className="pt-2">
                    <h4 className="font-bold text-[var(--text-primary)]">Voting Phase</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Players vote to eliminate one suspect. Voting is usually public and sequential. The player with the most votes is eliminated. Ties may trigger a runoff (PK speech).</p>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold z-10">5</div>
                  <div className="pt-2">
                    <h4 className="font-bold text-[var(--text-primary)]">Last Words & Resolution</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">The eliminated player may give last words and their role is revealed. If they&apos;re a Hunter, they can shoot. Then night falls and the cycle continues.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Discussion Strategies */}
      <LandingSection
        id="discussion"
        title="Mastering the Discussion Round"
        subtitle="What to say, when to say it, and how to read others"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>🎤</span> What to Talk About
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Behavioral Observations</div>
                <p className="text-sm text-[var(--text-secondary)]">&quot;Player 5 was very quick to vote against the confirmed villager yesterday. That&apos;s worth noting.&quot;</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Logical Analysis</div>
                <p className="text-sm text-[var(--text-secondary)]">&quot;If Player 3 was really the Seer like they claimed, why would wolves kill Player 2 instead?&quot;</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Vote Pattern Analysis</div>
                <p className="text-sm text-[var(--text-secondary)]">&quot;I noticed Players 4, 7, and 9 have voted together every round. That seems coordinated.&quot;</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
                <div className="font-semibold text-[var(--text-primary)] mb-1">Role Information (Strategic)</div>
                <p className="text-sm text-[var(--text-secondary)]">&quot;I checked Player 8 last night. They&apos;re a wolf. We need to vote them out today.&quot;</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>👀</span> What to Watch For
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20">
                <div className="font-semibold text-red-300 mb-1">🚨 Wolf Red Flags</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• Defending players who turn out to be wolves</li>
                  <li>• Knowing info they shouldn&apos;t have (e.g., &quot;the kill was...&quot;)</li>
                  <li>• Pushing hard to eliminate confirmed villagers</li>
                  <li>• Changing story when pressed with questions</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/20">
                <div className="font-semibold text-green-300 mb-1">✓ Village Indicators</div>
                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                  <li>• Consistent behavior across multiple days</li>
                  <li>• Willing to vote against friends if logic demands</li>
                  <li>• Providing useful analysis that helps the village</li>
                  <li>• Appropriate emotional reactions to deaths</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Sheriff Election */}
      <LandingSection
        id="sheriff"
        title="The Sheriff Election"
        subtitle="Day 1's most important decision"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-gold)]/30 bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⭐</span>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Sheriff Benefits</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold)]">•</span>
                <span><strong className="text-[var(--text-primary)]">1.5x Voting Power:</strong> Your vote counts 50% more than others</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold)]">•</span>
                <span><strong className="text-[var(--text-primary)]">Badge Transfer:</strong> Pass power to a trusted ally if you die</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-gold)]">•</span>
                <span><strong className="text-[var(--text-primary)]">Leadership Role:</strong> Often controls speech order and focus</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Sheriff Risks</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Target on Your Back:</strong> Wolves may prioritize killing you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Early Exposure:</strong> Running reveals you as active player</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Responsibility:</strong> Bad decisions are amplified with more power</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Campaign Tips</h3>
            </div>
            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Show Competence:</strong> Demonstrate logical thinking ability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Build Trust:</strong> Explain your thought process clearly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-[var(--text-primary)]">Be Cautious:</strong> Don&apos;t claim power roles unless necessary</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-6">
          <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span>🤔</span> Should You Run for Sheriff?
          </h4>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <div className="font-semibold text-green-400 mb-2">Good candidates:</div>
              <ul className="text-[var(--text-secondary)] space-y-1">
                <li>• Villagers who are confident speakers</li>
                <li>• Players who can handle pressure</li>
                <li>• Those willing to take calculated risks</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-red-400 mb-2">Should avoid running:</div>
              <ul className="text-[var(--text-secondary)] space-y-1">
                <li>• Seers (too valuable to expose)</li>
                <li>• Witches (better hidden for poison use)</li>
                <li>• Wolves (unless extremely confident)</li>
              </ul>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Voting Strategies */}
      <LandingSection
        id="voting"
        title="Voting Strategy & Tactics"
        subtitle="Your vote is your most powerful tool"
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">For Village Team</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">1</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Trust Verified Info</div>
                    <p className="text-sm text-[var(--text-secondary)]">If a confirmed Seer identifies a wolf, prioritize that over hunches</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">2</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Follow the Logic</div>
                    <p className="text-sm text-[var(--text-secondary)]">Vote based on evidence and behavior patterns, not emotions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">3</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Unite the Village</div>
                    <p className="text-sm text-[var(--text-secondary)]">Coordinate with other villagers to ensure majority</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">For Wolf Team</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold">1</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Split Village Votes</div>
                    <p className="text-sm text-[var(--text-secondary)]">Create confusion to prevent unified voting against wolves</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold">2</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Sacrifice if Necessary</div>
                    <p className="text-sm text-[var(--text-secondary)]">Sometimes voting against a doomed wolf teammate builds trust</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-xs font-bold">3</span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Blend with Majority</div>
                    <p className="text-sm text-[var(--text-secondary)]">Don&apos;t always be the lone dissenter - look like a villager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vote Counting */}
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Understanding Vote Counts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Scenario</th>
                    <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Votes Needed</th>
                    <th className="py-2 px-4 text-left text-[var(--text-secondary)]">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-primary)]">
                  <tr className="border-b border-[var(--border-color)]/50">
                    <td className="py-2 px-4">8 players alive</td>
                    <td className="py-2 px-4">5 votes</td>
                    <td className="py-2 px-4 text-[var(--text-secondary)]">Simple majority</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]/50">
                    <td className="py-2 px-4">8 players + Sheriff</td>
                    <td className="py-2 px-4">4 + Sheriff (5.5)</td>
                    <td className="py-2 px-4 text-[var(--text-secondary)]">Sheriff vote = 1.5</td>
                  </tr>
                  <tr className="border-b border-[var(--border-color)]/50">
                    <td className="py-2 px-4">6 players alive</td>
                    <td className="py-2 px-4">4 votes</td>
                    <td className="py-2 px-4 text-[var(--text-secondary)]">Simple majority</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Tie situation</td>
                    <td className="py-2 px-4">PK Round</td>
                    <td className="py-2 px-4 text-[var(--text-secondary)]">Tied players give speeches, then revote</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Example Dialogues */}
      <LandingSection
        id="examples"
        title="Discussion Examples"
        subtitle="Real scenarios from Werewolf games"
      >
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      {/* Reading People */}
      <LandingSection
        id="reads"
        title="How to Read Other Players"
        subtitle="Behavioral analysis techniques for identifying wolves"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🎭</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Watch Speech Patterns</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Wolves often speak more carefully, avoiding absolute statements. They may hedge with phrases like &quot;I think&quot; or &quot;probably&quot; when they actually know the truth.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🔄</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Track Consistency</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Note each player&apos;s stated reads and positions. Wolves may change their opinions without good reason, or conveniently &quot;discover&quot; suspicions after their target is already doomed.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">😰</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Observe Reactions</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Watch how players react to deaths and accusations. Genuine surprise differs from acted surprise. Note who seems relieved when certain topics end.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🗳️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Analyze Vote Timing</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Who votes early vs. late? Wolves often wait to see the vote trend before committing. Sudden vote changes near the end can be telling.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🤐</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Note Selective Silence</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Some wolves avoid commenting on their teammates. If someone never accuses a particular player, consider why. Strategic silence can be revealing.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-3">🧠</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Follow the Information</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Who seems to know things they shouldn&apos;t? Wolves know each other and the kill target. Slips like &quot;when Player 3 dies&quot; before death is announced are huge tells.
            </p>
          </div>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" title="Day Phase FAQ" subtitle="Common questions about discussion and voting">
        <LandingFaq items={faqItems} />
      </LandingSection>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 to-orange-950/30 p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">
            Put Your Skills to the Test
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            The best way to improve at Werewolf is through practice. Play against AI opponents in Wolfcha 
            and experience realistic discussions, accusations, and voting without needing to gather a group.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Play Free Now
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
