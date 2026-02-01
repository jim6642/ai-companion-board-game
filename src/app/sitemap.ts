import { MetadataRoute } from "next";
import { roleLandingKeys } from "@/components/seo/landing/roleLandingData";
import { soloLandingKeys } from "@/components/seo/landing/soloLandingData";
import { modelLandingKeys } from "@/components/seo/landing/modelLandingData";

// Guide pages for SEO (18 individual guides + index)
const guidePages = [
  "", // guides index
  "werewolf-rules",
  "werewolf-night-phase",
  "werewolf-day-phase",
  "werewolf-for-beginners",
  "seer-strategy",
  "witch-strategy",
  "hunter-strategy",
  "guard-strategy",
  "how-to-win-as-werewolf",
  "how-to-win-as-villager",
  "common-werewolf-mistakes",
  "how-to-spot-a-liar",
  "how-to-bluff",
  "how-to-build-trust",
  "how-to-control-the-vote",
  "werewolf-vs-mafia",
  "social-deduction-games",
  "how-to-play-werewolf-with-ai",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://wolf-cha.com";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/ai-werewolf`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-to-play`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/ai-models`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...roleLandingKeys.map((role) => ({
      url: `${baseUrl}/roles/${role}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    // Guide pages
    ...guidePages.map((guide) => ({
      url: guide ? `${baseUrl}/guides/${guide}` : `${baseUrl}/guides`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: guide ? 0.7 : 0.8, // index gets higher priority
    })),
    // Solo landing pages
    ...soloLandingKeys.map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    // Model landing pages
    ...modelLandingKeys.map((model) => ({
      url: `${baseUrl}/models/${model}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
