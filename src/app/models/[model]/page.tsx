import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingDialogueExamples } from "@/components/seo/landing/LandingDialogueExamples";
import { LandingFaq } from "@/components/seo/landing/LandingFaq";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingCta } from "@/components/seo/landing/LandingCta";
import {
  getModelLandingData,
  modelLandingKeys,
  type ModelLandingKey,
} from "@/components/seo/landing/modelLandingData";

export const dynamicParams = false;

export function generateStaticParams() {
  return modelLandingKeys.map((model) => ({ model }));
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

function buildSoftwareAppJsonLd({
  url,
  name,
  description,
}: {
  url: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${name} AI in Wolfcha`,
    description,
    url,
    applicationCategory: "Game",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: ModelLandingKey }>;
}): Promise<Metadata> {
  const { model } = await params;
  const data = getModelLandingData(model);
  if (!data) {
    return {};
  }

  const canonical = `https://wolf-cha.com/models/${data.key}`;
  const title = `${data.displayName} AI in Werewolf — Personality & Play Style | Wolfcha`;

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
      type: "article",
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

export default async function ModelLandingPage({
  params,
}: {
  params: Promise<{ model: ModelLandingKey }>;
}) {
  const { model } = await params;
  const data = getModelLandingData(model);

  if (!data) {
    notFound();
  }

  const canonical = `https://wolf-cha.com/models/${data.key}`;

  const relatedHub = data.related.hub;
  const relatedModels = data.related.models.filter((l) => l.href !== `/models/${data.key}`);

  return (
    <MarketingPageWrapper>
      <JsonLd id={`faq-jsonld-${data.key}`} data={buildFaqJsonLd({ url: canonical, items: data.faqs })} />
      <JsonLd
        id={`software-jsonld-${data.key}`}
        data={buildSoftwareAppJsonLd({
          url: canonical,
          name: data.displayName,
          description: data.heroDescription,
        })}
      />

      <LandingHero
        title={`${data.displayName} in AI Werewolf`}
        subtitle={data.tagline}
        description={data.heroDescription}
        primaryCta={{ href: "/", label: "Play now — free" }}
        secondaryCta={{ href: "/ai-models", label: "All AI models" }}
        image={{ src: data.logo, alt: `${data.displayName} logo` }}
      />

      <LandingSection
        id="personality"
        title="Personality profile"
        subtitle={`How ${data.displayName} approaches social deduction games.`}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-3">
              <Image src={data.logo} alt={data.displayName} width={40} height={40} />
              <div>
                <div className="text-lg font-bold text-[var(--text-primary)]">{data.displayName}</div>
                <div className="text-sm text-[var(--text-secondary)]">{data.company}</div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {data.personalityTraits.map((trait) => (
                <div key={trait.trait}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--text-primary)]">{trait.trait}</span>
                    <span className="text-[var(--text-muted)]">{trait.strength}/5</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-gold)]"
                      style={{ width: `${(trait.strength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{trait.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
              <div className="text-lg font-bold text-[var(--text-primary)]">Play style</div>
              <div className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{data.playStyle}</div>
            </div>
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
              <div className="text-lg font-bold text-[var(--text-primary)]">Recommended roles</div>
              <div className="mt-3 space-y-3">
                {data.recommendedRoles.map((rec) => (
                  <div key={rec.role} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-xs font-bold text-black">
                      ★
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">{rec.role}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{rec.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LandingSection>

      <LandingSection
        id="strengths-weaknesses"
        title="Strengths & weaknesses"
        subtitle={`What makes ${data.displayName} effective—and where it struggles.`}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-green-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Strengths
            </div>
            <ul className="mt-4 space-y-2">
              {data.strengths.map((s) => (
                <li key={s} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <div className="flex items-center gap-2 text-lg font-bold text-red-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Weaknesses
            </div>
            <ul className="mt-4 space-y-2">
              {data.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LandingSection>

      <LandingSection
        id="dialogue-examples"
        title="Dialogue examples"
        subtitle={`See how ${data.displayName} communicates during actual Werewolf games.`}
      >
        <LandingDialogueExamples examples={data.dialogues} />
      </LandingSection>

      <LandingSection id="faq" title="Frequently asked questions" subtitle={`Common questions about ${data.displayName} in Wolfcha.`}>
        <LandingFaq items={data.faqs} />
      </LandingSection>

      <LandingSection id="related" title="Explore more" subtitle="Hub pages and other AI model profiles.">
        <div className="grid gap-10 lg:grid-cols-2">
          <LandingRelatedLinks title="Hub pages" links={relatedHub} />
          <LandingRelatedLinks title="Other models" links={relatedModels.slice(0, 6)} />
        </div>
      </LandingSection>

      <LandingCta
        title={`Ready to play against ${data.displayName}?`}
        description="Start a game and see how this AI model reasons, argues, and plays Werewolf."
        primary={{ href: "/", label: "Play now — free" }}
        secondary={{ href: "/ai-models", label: "Compare all models" }}
      />
    </MarketingPageWrapper>
  );
}
