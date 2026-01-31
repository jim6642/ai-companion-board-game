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
  title: "Werewolf Night Phase Guide: All Night Actions Explained | Wolfcha",
  description:
    "Master the Werewolf night phase with our complete guide. Learn the action order, role abilities, strategic timing, and common mistakes. Guard → Werewolf → Witch → Seer explained.",
  keywords: [
    "werewolf night phase",
    "werewolf night actions",
    "mafia night round",
    "werewolf action order",
    "seer night action",
    "witch night action",
    "guard protection",
    "werewolf kill",
  ],
  alternates: {
    canonical: "https://wolf-cha.com/guides/werewolf-night-phase",
  },
  openGraph: {
    title: "Werewolf Night Phase Guide: Complete Action Order | Wolfcha",
    description:
      "Learn everything about the Werewolf night phase - action order, role abilities, and strategies for Guard, Werewolf, Witch, and Seer.",
    url: "https://wolf-cha.com/guides/werewolf-night-phase",
    type: "article",
    images: [{ url: "https://wolf-cha.com/og-image.png", width: 1200, height: 630, alt: "Werewolf Night Phase Guide" }],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Werewolf Night Phase Guide: All Night Actions Explained",
  description: "Complete guide to the Werewolf night phase including action order, role abilities, and strategic decisions.",
  image: "https://wolf-cha.com/og-image.png",
  author: { "@type": "Organization", name: "Wolfcha", url: "https://wolf-cha.com" },
  publisher: { "@type": "Organization", name: "Wolfcha", logo: { "@type": "ImageObject", url: "https://wolf-cha.com/logo.png" } },
  datePublished: "2024-01-15",
  dateModified: new Date().toISOString().split("T")[0],
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://wolf-cha.com/guides/werewolf-night-phase" },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How the Werewolf Night Phase Works",
  description: "Step-by-step guide to the Werewolf night phase action order and mechanics.",
  totalTime: "PT5M",
  step: [
    { "@type": "HowToStep", name: "Guard Acts First", text: "The Guard chooses one player to protect from the werewolf attack. They cannot protect the same player two nights in a row.", position: 1 },
    { "@type": "HowToStep", name: "Werewolves Choose Target", text: "All werewolves open their eyes and silently agree on one victim to kill. They must reach consensus.", position: 2 },
    { "@type": "HowToStep", name: "Witch Decides", text: "The Witch learns who was attacked and can save them with antidote or poison any player. Each potion is single-use.", position: 3 },
    { "@type": "HowToStep", name: "Seer Checks", text: "The Seer chooses one player and learns their alignment (werewolf or villager).", position: 4 },
    { "@type": "HowToStep", name: "Night Resolves", text: "The moderator calculates results: Guard protection cancels wolf kill, Witch potions apply, and deaths are recorded for morning announcement.", position: 5 },
  ],
};

const dialogueExamples: LandingDialogueExample[] = [
  {
    title: "Seer Reveals Check Result",
    subtitle: "Day 2 - After checking Player 5 last night",
    lines: [
      { speaker: { seed: "seer_player", name: "Morgan", modelLogo: "/models/qwen.svg", meta: "Claims Seer" }, content: "I checked Player 5 last night. They came back as a werewolf. I'm confident in my check - we need to vote them out today." },
      { speaker: { seed: "accused_wolf", name: "Player 5 (Alex)", modelLogo: "/models/deepseek.svg", meta: "Accused" }, content: "That's a lie! Morgan is obviously a wolf trying to frame me. Why didn't they reveal on Day 1 if they had information?" },
      { speaker: { seed: "villager_1", name: "Casey", modelLogo: "/models/gemini.svg", meta: "Observing" }, content: "Morgan, can you share who you checked Night 1? Having two checks would make your claim more credible." },
    ],
  },
  {
    title: "Witch Hints at Save",
    subtitle: "Day 2 - After a quiet night with no deaths",
    lines: [
      { speaker: { seed: "narrator_sys", name: "Narrator", modelLogo: "/models/glm.svg", meta: "System" }, content: "The sun rises on a peaceful morning. No one died last night." },
      { speaker: { seed: "villager_2", name: "Jordan", modelLogo: "/models/kimi.svg" }, content: "No deaths? Either the Guard got lucky, or the Witch used their antidote. This is valuable information." },
      { speaker: { seed: "witch_player", name: "Riley", modelLogo: "/models/claude.svg", meta: "Witch (hidden)" }, content: "Let's focus on finding wolves. A peaceful night doesn't tell us who the wolves are targeting." },
    ],
  },
];

const faqItems = [
  { question: "What is the night action order in Werewolf?", answer: "The standard order is: Guard → Werewolves → Witch → Seer. This order matters because the Guard's protection is determined before the wolf attack, and the Witch learns who was attacked before deciding whether to save." },
  { question: "What happens if the Guard protects the wolf's target?", answer: "If the Guard successfully protects the werewolves' target, that player survives the night. The wolves' attack is nullified, and the Witch will be informed no one was killed (in some rule variants) or may still see who was targeted." },
  { question: "Can the Witch save herself if attacked?", answer: "In most rule variants, yes - the Witch can use her antidote to save herself if she is the wolf's target. However, some competitive rulesets prohibit self-saving to balance the Witch's power." },
  { question: "What does the Seer see when checking a player?", answer: "The Seer learns the target's alignment: either 'Werewolf' (evil team) or 'Villager' (good team). All village roles (Seer, Witch, Hunter, Guard, Villager) show as 'Villager' to the Seer." },
  { question: "Can werewolves communicate during the night?", answer: "In traditional play, werewolves can only use silent gestures during night. In online/AI versions like Wolfcha, they may have private chat. They must agree on a single target to kill." },
  { question: "What happens if the Witch uses both potions on the same night?", answer: "In standard rules, the Witch can only use ONE potion per night - either save or poison, not both. This prevents the powerful combo of saving and poisoning in a single night." },
  { question: "Does the Guard's protection work against the Witch's poison?", answer: "No, the Guard's protection only blocks werewolf attacks. It does not protect against the Witch's poison, which is a separate action that bypasses protection." },
  { question: "What if the Seer checks a protected player?", answer: "The Seer's check is completely independent of protection. They still learn the target's alignment regardless of whether that player was protected or attacked." },
];

const relatedLinks = [
  { href: "/guides/werewolf-rules", label: "Complete Rules Guide", description: "Full game rules and mechanics" },
  { href: "/guides/werewolf-day-phase", label: "Day Phase Guide", description: "Master discussion and voting" },
  { href: "/guides/seer-strategy", label: "Seer Strategy", description: "Maximize your checks" },
  { href: "/guides/witch-strategy", label: "Witch Strategy", description: "When to use your potions" },
  { href: "/guides/guard-strategy", label: "Guard Strategy", description: "Protect the right players" },
  { href: "/guides/how-to-win-as-werewolf", label: "Werewolf Strategy", description: "Coordinate night kills" },
];

export default function WerewolfNightPhasePage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={articleJsonLd} />
      <JsonLd id="howto-jsonld" data={howToJsonLd} />

      <LandingHero
        title="Werewolf Night Phase: Complete Guide"
        subtitle="NIGHT ACTIONS & STRATEGY"
        description="The night phase is when the real magic happens in Werewolf. Hidden actions, secret kills, and crucial information gathering all occur under the cover of darkness. Master the night, and you'll have a massive advantage when day breaks."
        primaryCta={{ href: "/", label: "Play Now" }}
        secondaryCta={{ href: "/guides/werewolf-rules", label: "Full Rules" }}
        image={{ src: "/roles/seer.png", alt: "Seer using night ability" }}
      />

      {/* Night Phase Overview */}
      <LandingSection
        id="overview"
        title="Understanding the Night Phase"
        subtitle="Every night, special roles perform actions that shape the game's outcome"
      >
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
            The night phase is the heartbeat of Werewolf. While the village sleeps, werewolves hunt, protectors guard, and investigators gather intel. 
            What happens at night directly determines the day&apos;s discussions, votes, and ultimately who wins the game.
          </p>
          
          <div className="mt-8 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>🌙</span> Key Night Phase Concepts
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-[var(--bg-card)] p-4 border border-[var(--border-color)]">
                <div className="font-semibold text-indigo-300 mb-2">Sequential Actions</div>
                <p className="text-sm text-[var(--text-secondary)]">Night actions happen in a specific order: Guard → Werewolves → Witch → Seer. This order affects game mechanics and strategy.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-card)] p-4 border border-[var(--border-color)]">
                <div className="font-semibold text-indigo-300 mb-2">Hidden Information</div>
                <p className="text-sm text-[var(--text-secondary)]">All night actions are secret. Players must deduce what happened based on morning announcements and behavioral analysis.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-card)] p-4 border border-[var(--border-color)]">
                <div className="font-semibold text-indigo-300 mb-2">Role Awareness</div>
                <p className="text-sm text-[var(--text-secondary)]">Werewolves know each other, but village roles act alone. The Witch learns the wolf target, the Seer learns alignments.</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-card)] p-4 border border-[var(--border-color)]">
                <div className="font-semibold text-indigo-300 mb-2">Resolution</div>
                <p className="text-sm text-[var(--text-secondary)]">Deaths are announced at dawn. Multiple factors can affect who dies: wolf attack, witch poison, guard protection, witch save.</p>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Action Order Deep Dive */}
      <LandingSection
        id="action-order"
        title="Night Action Order Explained"
        subtitle="Understanding the sequence is crucial for strategic play"
      >
        <div className="space-y-6">
          {/* Guard */}
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-blue-500/30">
                  <Image src="/roles/guard.png" alt="Guard" fill className="object-cover" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">STEP 1</span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Guard Protection</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">
                  The Guard opens their eyes first and silently points to one player to protect. This player will be immune to werewolf attacks for this night.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-blue-950/30 p-3 border border-blue-500/20">
                    <div className="text-sm font-semibold text-blue-300 mb-1">✓ Can Do</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Protect any living player including themselves</li>
                      <li>• Change target every night</li>
                      <li>• Protect the same person on non-consecutive nights</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red-950/30 p-3 border border-red-500/20">
                    <div className="text-sm font-semibold text-red-300 mb-1">✗ Cannot Do</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Protect the same player two nights in a row</li>
                      <li>• Block witch poison (only blocks wolf kills)</li>
                      <li>• Know if their protection was successful</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Werewolves */}
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-red-500/30">
                  <Image src="/roles/werewolf.png" alt="Werewolf" fill className="object-cover" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">STEP 2</span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Werewolf Kill</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">
                  All werewolves open their eyes, recognize each other, and must silently agree on one victim. They point to their target and confirm through nods or gestures.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-red-950/30 p-3 border border-red-500/20">
                    <div className="text-sm font-semibold text-red-300 mb-1">Strategic Considerations</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Target suspected Seer early to deny information</li>
                      <li>• Kill loud accusers to silence opposition</li>
                      <li>• Consider killing quiet players to frame them as wolves</li>
                      <li>• Avoid killing players you publicly defended</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-red-950/30 p-3 border border-red-500/20">
                    <div className="text-sm font-semibold text-red-300 mb-1">Kill Can Be Blocked By</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Guard protection on the target</li>
                      <li>• Witch&apos;s antidote save</li>
                      <li>• Both can apply (double-save scenario)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Witch */}
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-green-500/30">
                  <Image src="/roles/witch.png" alt="Witch" fill className="object-cover" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">STEP 3</span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Witch Action</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">
                  The Witch opens their eyes and learns who the werewolves targeted. They then decide whether to use their one-time antidote to save, or their one-time poison to kill any player.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-green-950/30 p-3 border border-green-500/20">
                    <div className="text-sm font-semibold text-green-300 mb-1">💚 Antidote</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• One-time use per game</li>
                      <li>• Saves tonight&apos;s wolf target</li>
                      <li>• Can self-save in most rulesets</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-purple-950/30 p-3 border border-purple-500/20">
                    <div className="text-sm font-semibold text-purple-300 mb-1">💀 Poison</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• One-time use per game</li>
                      <li>• Kill any player (bypasses guard)</li>
                      <li>• Cannot self-poison</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-950/30 p-3 border border-gray-500/20">
                    <div className="text-sm font-semibold text-gray-300 mb-1">⏭️ Pass</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Choose to do nothing</li>
                      <li>• Save potions for later</li>
                      <li>• Can only use ONE potion per night</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seer */}
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-yellow-500/30">
                  <Image src="/roles/seer.png" alt="Seer" fill className="object-cover" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400">STEP 4</span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Seer Check</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-4">
                  The Seer opens their eyes and points to one player. The moderator indicates whether that player is a werewolf or villager (all village team roles show as villager).
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-yellow-950/30 p-3 border border-yellow-500/20">
                    <div className="text-sm font-semibold text-yellow-300 mb-1">Check Results</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• 🐺 <strong>Werewolf</strong> = Target is on the wolf team</li>
                      <li>• 👤 <strong>Villager</strong> = Target is on the village team</li>
                      <li>• Seer, Witch, Hunter, Guard all show as Villager</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-yellow-950/30 p-3 border border-yellow-500/20">
                    <div className="text-sm font-semibold text-yellow-300 mb-1">Strategic Tips</div>
                    <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                      <li>• Check suspicious players first</li>
                      <li>• Finding a wolf early is game-changing</li>
                      <li>• Keep track of all your checks</li>
                      <li>• Don&apos;t waste checks on obvious villagers</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* Night Resolution */}
      <LandingSection
        id="resolution"
        title="How Night Resolution Works"
        subtitle="Understanding how multiple night actions interact"
      >
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Possible Night Outcomes</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="py-3 px-4 text-left text-[var(--text-secondary)] font-semibold">Scenario</th>
                  <th className="py-3 px-4 text-left text-[var(--text-secondary)] font-semibold">Guard</th>
                  <th className="py-3 px-4 text-left text-[var(--text-secondary)] font-semibold">Wolf Target</th>
                  <th className="py-3 px-4 text-left text-[var(--text-secondary)] font-semibold">Witch</th>
                  <th className="py-3 px-4 text-left text-[var(--text-secondary)] font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)]">
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 px-4 font-medium">Normal Kill</td>
                  <td className="py-3 px-4 text-gray-400">Wrong target</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-gray-400">Pass</td>
                  <td className="py-3 px-4 text-red-400">Player A dies</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 px-4 font-medium">Guard Save</td>
                  <td className="py-3 px-4 text-blue-400">Player A</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-gray-400">Pass</td>
                  <td className="py-3 px-4 text-green-400">No deaths</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 px-4 font-medium">Witch Save</td>
                  <td className="py-3 px-4 text-gray-400">Wrong target</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-green-400">Antidote</td>
                  <td className="py-3 px-4 text-green-400">No deaths</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 px-4 font-medium">Double Death</td>
                  <td className="py-3 px-4 text-gray-400">Wrong target</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-purple-400">Poison B</td>
                  <td className="py-3 px-4 text-red-400">A and B die</td>
                </tr>
                <tr className="border-b border-[var(--border-color)]/50">
                  <td className="py-3 px-4 font-medium">Witch Only Kill</td>
                  <td className="py-3 px-4 text-blue-400">Player A</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-purple-400">Poison B</td>
                  <td className="py-3 px-4 text-red-400">Player B dies</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Peaceful Night</td>
                  <td className="py-3 px-4 text-blue-400">Player A</td>
                  <td className="py-3 px-4 text-red-400">Player A</td>
                  <td className="py-3 px-4 text-gray-400">Pass</td>
                  <td className="py-3 px-4 text-green-400">No deaths</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-lg bg-amber-950/30 p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-300 font-semibold mb-2">
              <span>⚠️</span> Important Interaction Rules
            </div>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Guard protection does NOT block Witch poison</li>
              <li>• If Guard and Witch both protect the same person, the person survives (redundant protection)</li>
              <li>• If a player is poisoned and attacked on the same night, they die once (from poison, can&apos;t be saved)</li>
              <li>• Hunter cannot shoot if killed by poison (poison disables abilities)</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      {/* Example Dialogues */}
      <LandingSection
        id="examples"
        title="Day Discussion Examples"
        subtitle="How night events influence day-time conversations"
      >
        <LandingDialogueExamples examples={dialogueExamples} />
      </LandingSection>

      {/* Strategic Timing */}
      <LandingSection
        id="timing"
        title="Strategic Night Decisions"
        subtitle="When to use abilities for maximum impact"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>💚</span> When to Use Witch Antidote
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-950/20">
                <span className="text-green-400 font-bold">✓</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Save confirmed roles:</strong> If a revealed Seer or Sheriff is attacked, save them</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-950/20">
                <span className="text-green-400 font-bold">✓</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Night 1 save:</strong> Often worth it to gain information and deny wolf kill</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20">
                <span className="text-red-400 font-bold">✗</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Don&apos;t save:</strong> If the target is already suspicious of being a wolf</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20">
                <span className="text-red-400 font-bold">✗</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Don&apos;t save late:</strong> If only 1-2 wolves remain, poison is more valuable</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span>💀</span> When to Use Witch Poison
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-950/20">
                <span className="text-purple-400 font-bold">✓</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Confirmed wolf:</strong> If Seer has verified someone as wolf and voting failed</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-950/20">
                <span className="text-purple-400 font-bold">✓</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Late game:</strong> When you&apos;re confident and need to end the game</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20">
                <span className="text-red-400 font-bold">✗</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Don&apos;t poison early:</strong> Unless 100% certain, poisoning villagers loses games</div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20">
                <span className="text-red-400 font-bold">✗</span>
                <div className="text-sm text-[var(--text-secondary)]"><strong className="text-[var(--text-primary)]">Don&apos;t poison on suspicion:</strong> Wait for Seer info or obvious wolf behavior</div>
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      {/* FAQ */}
      <LandingSection id="faq" title="Night Phase FAQ" subtitle="Common questions about Werewolf night mechanics">
        <LandingFaq items={faqItems} />
      </LandingSection>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-8 md:p-12 text-center">
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] md:text-3xl mb-4">
            Practice Night Actions with AI
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            The best way to master the night phase is through practice. Play unlimited games against AI opponents in Wolfcha 
            and experience every role&apos;s night actions firsthand.
          </p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black hover:bg-[var(--color-gold-dark)]">
            Start Playing Free
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
