"use client";

import { useState } from "react";
import type { GameAnalysisData } from "@/types/analysis";
import { AnalysisHeader } from "./AnalysisHeader";
import { OverviewCard } from "./OverviewCard";
import { PersonalStatsCard } from "./PersonalStatsCard";
import { TimelineReview } from "./TimelineReview";
import { PlayerReviews } from "./PlayerReviews";
import { AnalysisFooter } from "./AnalysisFooter";
import { IdentityDashboard } from "./IdentityDashboard";

interface PostGameAnalysisPageProps {
  data: GameAnalysisData;
  onShare?: () => void;
  onReturn?: () => void;
}

export function PostGameAnalysisPage({
  data,
  onShare,
  onReturn,
}: PostGameAnalysisPageProps) {
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);

  return (
    <div className="analysis-page min-h-screen pb-24" data-theme="dark">
      <AnalysisHeader gameId={data.gameId} />

      <main className="max-w-md mx-auto px-4 py-8 space-y-8">
        <OverviewCard data={data} />
        <PersonalStatsCard stats={data.personalStats} />

        <section>
          <h3 className="text-center font-bold text-[var(--color-gold)]/40 text-xs mb-6 uppercase tracking-[0.3em] analysis-ornament-border pb-3">
            Identity Dashboard
          </h3>
          <IdentityDashboard
            roundStates={data.roundStates}
            onRoundChange={setSelectedRoundIndex}
          />
        </section>

        <TimelineReview
          timeline={data.timeline}
          selectedRoundIndex={selectedRoundIndex}
        />
        <PlayerReviews reviews={data.reviews} />
        <AnalysisFooter onShare={onShare} onReturn={onReturn} />
      </main>
    </div>
  );
}
