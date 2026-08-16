import type { Metadata } from "next";
import { MarketingPageWrapper } from "@/components/seo/MarketingPageWrapper";
import { LandingHero } from "@/components/seo/landing/LandingHero";
import { LandingSection } from "@/components/seo/landing/LandingSection";
import { LandingRelatedLinks } from "@/components/seo/landing/LandingRelatedLinks";
import { LandingCta } from "@/components/seo/landing/LandingCta";
import { roleLandingDataByKey, roleLandingKeys } from "@/components/seo/landing/roleLandingData";

export const metadata: Metadata = {
  title: "Werewolf Roles — Seer, Witch, Hunter, Guard | AI Companion Board Game",
  description:
    "Explore classic Werewolf (Mafia) roles in AI Companion Board Game: Seer, Witch, Hunter, Guard, and Werewolf. Each role page includes strategy tips, AI dialogue examples, and an instant Play CTA.",
  alternates: {
    canonical: "https://github.com/jim6642/ai-companion-board-game/roles",
  },
  openGraph: {
    title: "Werewolf Roles — AI Companion Board Game",
    description:
      "Role guides for Seer, Witch, Hunter, Guard, and Werewolf — with solo vs AI strategy and dialogue examples.",
    url: "https://github.com/jim6642/ai-companion-board-game/roles",
    type: "website",
    images: [
      {
        url: "https://github.com/jim6642/ai-companion-board-game/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Companion Board Game - AI Werewolf Game",
      },
    ],
  },
};

export default function RolesIndexPage() {
  const roleLinks = roleLandingKeys.map((key) => {
    const data = roleLandingDataByKey[key];
    return {
      href: `/roles/${key}`,
      label: data.roleName,
      description: data.tagline,
    };
  });

  return (
    <MarketingPageWrapper>
      <LandingHero
        title="Werewolf role guides"
        subtitle="Role Cluster"
        description="Browse role guides for solo play vs AI opponents. Each page includes an overview, beginner mistakes, advanced tips, AI dialogue examples, internal links, and a Play now CTA."
        primaryCta={{ href: "/", label: "Play now" }}
        secondaryCta={{ href: "/how-to-play", label: "How to play" }}
      />

      <LandingSection
        title="Pick a role"
        subtitle="Start with the role you get most often—or the one you struggle to read when the table is full of AI personalities."
      >
        <LandingRelatedLinks title="Roles" links={roleLinks} />
      </LandingSection>

      <LandingCta
        title="Want a faster start?"
        description="If you're new, open the How to play hub first. Then jump back to a role guide when you need tactics."
        primary={{ href: "/how-to-play", label: "How to play" }}
        secondary={{ href: "/", label: "Play now" }}
      />
    </MarketingPageWrapper>
  );
}
