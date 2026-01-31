import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";

export const metadata: Metadata = {
  title: "Common Werewolf Mistakes: Avoid These Game-Losing Errors | Wolfcha",
  description: "Learn the most common mistakes in Werewolf and how to avoid them. Improve your gameplay by understanding what NOT to do as both village and wolf team.",
  keywords: ["werewolf mistakes", "werewolf tips", "common mafia errors", "werewolf beginner mistakes", "how to improve at werewolf"],
  alternates: { canonical: "https://wolf-cha.com/guides/common-werewolf-mistakes" },
  openGraph: { title: "Common Werewolf Mistakes to Avoid | Wolfcha", url: "https://wolf-cha.com/guides/common-werewolf-mistakes", type: "article" },
};

const faqItems = [
  { question: "What's the #1 mistake new players make?", answer: "Talking too little. Many beginners think staying quiet keeps them safe, but silence is actually suspicious. Participate actively regardless of your role." },
  { question: "How do I avoid being too obvious as wolf?", answer: "Act natural. Don't over-defend teammates, don't avoid eye contact with certain players, and participate in discussions as if you're genuinely trying to find wolves." },
  { question: "What should I do if I make a mistake?", answer: "Stay calm and adapt. Everyone makes mistakes. Analyze what went wrong after the game and learn from it. Don't let one error tilt you for the rest of the game." },
];

const relatedLinks = [
  { href: "/guides/werewolf-for-beginners", label: "Beginner Guide", description: "Start here" },
  { href: "/guides/how-to-win-as-villager", label: "Village Strategy", description: "Play better as village" },
  { href: "/guides/how-to-win-as-werewolf", label: "Wolf Strategy", description: "Master the dark side" },
  { href: "/guides/how-to-spot-a-liar", label: "Spotting Liars", description: "Detect deception" },
];

export default function CommonWerewolfMistakesPage() {
  return (
    <MarketingPageWrapper>
      <JsonLd id="article-jsonld" data={{ "@context": "https://schema.org", "@type": "Article", headline: "Common Werewolf Mistakes" }} />
      <LandingHero
        title="Common Werewolf Mistakes (And How to Avoid Them)"
        subtitle="IMPROVEMENT GUIDE"
        description="Even experienced players make these errors. Learn the most common game-losing mistakes for both village and wolf teams, and immediately improve your Werewolf gameplay."
        primaryCta={{ href: "/", label: "Practice Now" }}
        image={{ src: "/roles/werewolf.png", alt: "Werewolf mistakes" }}
      />

      <LandingSection id="village-mistakes" title="Village Team Mistakes" subtitle="Errors that help wolves win">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🤐</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Being Too Quiet</h4>
            <p className="text-sm text-[var(--text-secondary)]">Silence doesn&apos;t protect you - it makes you suspicious AND useless to the village. Share observations even if uncertain.</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🔀</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Splitting Votes</h4>
            <p className="text-sm text-[var(--text-secondary)]">When village can&apos;t coordinate, wolves escape. Focus on one target even if you&apos;re not 100% sure.</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🗣️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Revealing Too Early</h4>
            <p className="text-sm text-[var(--text-secondary)]">Power roles revealing Day 1 without information become instant wolf targets. Wait for valuable info.</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">😤</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Emotional Voting</h4>
            <p className="text-sm text-[var(--text-secondary)]">Voting based on personal feelings instead of logic. Wolves exploit emotional players easily.</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🙈</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Ignoring Seer Info</h4>
            <p className="text-sm text-[var(--text-secondary)]">When a credible Seer identifies a wolf, vote them out. Don&apos;t second-guess verified information.</p>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Tunneling on One Player</h4>
            <p className="text-sm text-[var(--text-secondary)]">Fixating on one suspect while ignoring others. Stay flexible and consider multiple possibilities.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="wolf-mistakes" title="Wolf Team Mistakes" subtitle="Errors that get wolves caught">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🛡️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Over-Defending Teammates</h4>
            <p className="text-sm text-[var(--text-secondary)]">Jumping to defend your wolf partner every time they&apos;re accused. Let them face some heat alone.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🗳️</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Voting Together</h4>
            <p className="text-sm text-[var(--text-secondary)]">Wolves who always vote the same way get linked together. Spread your votes to look independent.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">😰</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Panicking When Accused</h4>
            <p className="text-sm text-[var(--text-secondary)]">Getting defensive, angry, or making desperate claims. Stay calm - villagers get accused too.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">💀</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Killing Your Defenders</h4>
            <p className="text-sm text-[var(--text-secondary)]">Never kill someone who publicly defended you. It makes you extremely obvious as the killer.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">🎭</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Overacting Innocence</h4>
            <p className="text-sm text-[var(--text-secondary)]">Trying too hard to seem village. Real villagers don&apos;t constantly proclaim their innocence.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-[var(--bg-card)] p-5">
            <div className="text-2xl mb-2">📢</div>
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Accusing Too Confidently</h4>
            <p className="text-sm text-[var(--text-secondary)]">Being 100% certain about reads when villagers would be uncertain. It suggests you know something.</p>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="power-role-mistakes" title="Power Role Mistakes" subtitle="Wasting your special abilities">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-yellow-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-yellow-400 mb-2">🔮 Seer Mistakes</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Checking confirmed players</li>
              <li>• Revealing without wolf info</li>
              <li>• Not tracking check history</li>
            </ul>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-green-400 mb-2">🧪 Witch Mistakes</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Poisoning on weak suspicion</li>
              <li>• Saving suspicious players</li>
              <li>• Dying with unused potions</li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-[var(--bg-card)] p-5">
            <h4 className="font-bold text-blue-400 mb-2">🛡️ Guard Mistakes</h4>
            <ul className="text-sm text-[var(--text-secondary)] space-y-1">
              <li>• Protecting same person twice</li>
              <li>• Random protection choices</li>
              <li>• Not predicting wolf targets</li>
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection id="faq" title="Mistakes FAQ" subtitle="Common questions">
        <LandingFaq items={faqItems} />
      </LandingSection>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-2xl border border-[var(--color-gold)]/30 bg-gradient-to-r from-[var(--color-gold)]/10 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Learn From Your Mistakes</h2>
          <p className="text-[var(--text-secondary)] mb-6">Practice against AI opponents and improve your gameplay without pressure.</p>
          <Link href="/" className="inline-block rounded-full bg-[var(--color-gold)] px-8 py-4 font-bold text-black">Start Practicing</Link>
        </div>
      </section>

      <LandingSection id="related" title="Related Guides">
        <LandingRelatedLinks title="Learn More" links={relatedLinks} />
      </LandingSection>
    </MarketingPageWrapper>
  );
}
