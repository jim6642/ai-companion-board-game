import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingAiSeats } from "@/components/seo/landing/LandingAiSeats";
import { LandingDialogueExamples } from "@/components/seo/landing/LandingDialogueExamples";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingCta } from "@/components/seo/landing/LandingCta";
import {
  getSoloLandingData,
  soloLandingKeys,
  type SoloLandingKey,
} from "@/components/seo/landing/soloLandingData";

export const dynamicParams = false;

export function generateStaticParams() {
  return soloLandingKeys.map((slug) => ({ slug }));
}

function buildFaqJsonLd({
  url,
  items,
}: {
  url: string;
  items: Array<{ question: string; answer: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url,
  };
}

function buildHowToJsonLd({
  url,
  title,
  description,
  steps,
}: {
  url: string;
  title: string;
  description: string;
  steps: Array<{ step: string; description: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    url,
    step: steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.step,
      text: s.description,
    })),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: SoloLandingKey }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getSoloLandingData(slug);
  if (!data) {
    return {};
  }

  const canonical = `https://wolf-cha.com/${data.slug}`;
  const title = `${data.title} — AI Werewolf (Mafia) Game | Wolfcha`;

  return {
    title,
    description: data.heroDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description: data.heroDescription,
      url: canonical,
      type: "website",
      images: [
        {
          url: "https://wolf-cha.com/og-image.png",
          width: 1200,
          height: 630,
          alt: "Wolfcha - AI Werewolf Game",
        },
      ],
    },
  };
}

export default async function SoloLandingPage({
  params,
}: {
  params: Promise<{ slug: SoloLandingKey }>;
}) {
  const { slug } = await params;
  const data = getSoloLandingData(slug);

  if (!data) {
    notFound();
  }

  const canonical = `https://wolf-cha.com/${data.slug}`;

  const relatedHub = data.related.hub;
  const relatedCluster = data.related.cluster.filter((l) => l.href !== `/${data.slug}`);

  return (
    <MarketingPageWrapper>
      <JsonLd id={`faq-jsonld-${data.key}`} data={buildFaqJsonLd({ url: canonical, items: data.faqs })} />
      <JsonLd
        id={`howto-jsonld-${data.key}`}
        data={buildHowToJsonLd({
          url: canonical,
          title: `How to ${data.title}`,
          description: data.heroDescription,
          steps: data.howItWorks,
        })}
      />

      <LandingHero
        title={data.title}
        subtitle={data.tagline}
        description={data.heroDescription}
        primaryCta={{ href: "/", label: "Play now — free" }}
        secondaryCta={{ href: "/how-to-play", label: "Learn the rules" }}
        aside={<LandingAiSeats seats={data.seats.slice(0, 6)} compact />}
      />

      <LandingSection
        id="problems-solved"
        title="Why solo Werewolf?"
        subtitle="Common reasons players choose Wolfcha over traditional group games."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.problemsSolved.map((problem) => (
            <div
              key={problem}
              className="flex items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-black">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-sm leading-relaxed text-[var(--text-secondary)]">{problem}</div>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="how-it-works"
        title="How it works"
        subtitle="Get from zero to playing in under a minute."
      >
        <div className="grid gap-4 md:grid-cols-5">
          {data.howItWorks.map((step, idx) => (
            <div
              key={step.step}
              className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"
            >
              <div className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-gold)] text-xs font-bold text-black">
                {idx + 1}
              </div>
              <div className="mt-2 text-[15px] font-bold text-[var(--text-primary)]">{step.step}</div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">{step.description}</div>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="unique-features"
        title="What makes Wolfcha different"
        subtitle="Features that set solo AI Werewolf apart from traditional play."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {data.uniqueFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
            >
              <div className="text-lg font-bold text-[var(--text-primary)]">{feature.title}</div>
              <div className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{feature.description}</div>
            </div>
          ))}
        </div>
      </LandingSection>

      <LandingSection
        id="comparison"
        title="Traditional vs Wolfcha"
        subtitle="See how solo AI play compares to organizing a human game."
      >
        <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[var(--text-primary)]">Feature</th>
                <th className="px-4 py-3 font-semibold text-[var(--text-secondary)]">Traditional</th>
                <th className="px-4 py-3 font-semibold text-[var(--color-gold)]">Wolfcha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
              {data.comparisonTable.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{row.feature}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{row.traditional}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{row.wolfcha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LandingSection>

      <LandingSection
        id="ai-seats"
        title="Meet your AI opponents"
        subtitle="Each seat at the table is an AI with a unique personality and reasoning style."
      >
        <LandingAiSeats seats={data.seats} />
      </LandingSection>

      <LandingSection
        id="dialogue-examples"
        title="Real dialogue examples"
        subtitle="See how AI opponents argue, pressure, and coordinate in actual games."
      >
        <LandingDialogueExamples examples={data.dialogues} />
      </LandingSection>

      <LandingSection id="faq" title="Frequently asked questions" subtitle="Common questions about playing Werewolf solo with AI.">
        <LandingFaq items={data.faqs} />
      </LandingSection>

      <LandingSection id="related" title="Explore more" subtitle="Hub pages for context, and related solo play options.">
        <div className="grid gap-10 lg:grid-cols-2">
          <LandingRelatedLinks title="Hub pages" links={relatedHub} />
          <LandingRelatedLinks title="More solo options" links={relatedCluster} />
        </div>
      </LandingSection>

      <LandingCta
        title="Ready to play Werewolf solo?"
        description="Start a game in your browser. No party required — just you vs a table of AI personalities."
        primary={{ href: "/", label: "Play now — free" }}
        secondary={{ href: "/ai-werewolf", label: "What is AI Werewolf?" }}
      />
    </MarketingPageWrapper>
  );
}
