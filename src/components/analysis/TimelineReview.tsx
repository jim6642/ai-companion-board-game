"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Gavel, Star, Shield, Skull, Heart, Droplets, ChevronDown, ChevronUp, MessageSquare, Vote, X, Crown, Swords } from "lucide-react";
import type { TimelineEntry, PlayerSpeech, DayEvent, DayPhase, VoteRecord } from "@/types/analysis";
import { ROLE_ICONS, NIGHT_EVENT_COLORS } from "./constants";

interface TimelineReviewProps {
  timeline: TimelineEntry[];
  selectedRoundIndex?: number;
}

const NIGHT_ACTION_LABELS: Record<string, string> = {
  guard: "守护",
  kill: "刀",
  save: "救",
  poison: "毒",
  check: "查验",
};

function formatNightAction(type: string, source: string, target: string): string {
  // target already contains "号" (e.g., "7号"), so don't add extra "号"
  if (type === "kill") {
    return `狼人刀${target}`;
  }
  return `${source}${NIGHT_ACTION_LABELS[type]}${target}`;
}

function NightEventItem({
  event,
}: {
  event: TimelineEntry["nightEvents"][number];
}) {
  const roleIcon =
    event.type === "kill"
      ? ROLE_ICONS.Werewolf
      : event.type === "save"
        ? ROLE_ICONS.Witch
        : event.type === "poison"
          ? ROLE_ICONS.Witch
          : event.type === "check"
            ? ROLE_ICONS.Seer
            : ROLE_ICONS.Guard;

  const colors = NIGHT_EVENT_COLORS[event.type] || NIGHT_EVENT_COLORS.kill;
  const isCheck = event.type === "check";
  const isBlocked = event.blocked;
  const isSave = event.type === "save";
  const isPoison = event.type === "poison";
  const isGuard = event.type === "guard";

  const EventIcon = isCheck
    ? Eye
    : isSave
      ? Heart
      : isPoison
        ? Droplets
        : isGuard
          ? Shield
          : Skull;

  const actionText = formatNightAction(event.type, event.source, event.target);

  return (
    <div className="flex items-center gap-3">
      <Image
        src={roleIcon}
        alt={event.type}
        width={20}
        height={20}
        className={isBlocked ? "opacity-50" : "opacity-80"}
      />
      <span className={`font-medium text-sm ${colors.text}`}>
        {actionText}
      </span>
      {event.result && (
        <span className="text-[10px] text-[var(--text-muted)] border border-white/10 px-1.5 rounded">
          {event.result}
        </span>
      )}
      {isBlocked && (
        <span className="text-[10px] text-[#2f855a] ml-auto border border-[#2f855a]/30 px-1.5 rounded bg-[#2f855a]/10">
          已救
        </span>
      )}
      <EventIcon
        className={`w-4 h-4 ml-auto ${colors.text} ${isCheck ? "animate-pulse" : ""}`}
      />
    </div>
  );
}

function VoteModal({ 
  isOpen, 
  onClose, 
  votes, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  votes?: VoteRecord[]; 
  title: string;
}) {
  if (!isOpen || !votes) return null;

  const votesByTarget = votes.reduce((acc, vote) => {
    if (!acc[vote.targetSeat]) acc[vote.targetSeat] = [];
    acc[vote.targetSeat].push(vote.voterSeat);
    return acc;
  }, {} as Record<number, number[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div 
        className="bg-[var(--bg-card)] border border-white/10 rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(votesByTarget)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([target, voters]) => (
              <div key={target} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--color-gold)] font-bold text-sm">{target}号</span>
                  <span className="text-xs text-[var(--text-muted)]">{voters.length}票</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {voters.map((voter) => (
                    <span key={voter} className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                      {voter}号
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function DayEventItem({ event, onShowVotes }: { event: DayEvent; onShowVotes?: () => void }) {
  const isBadge = event.type === "badge";
  const isExile = event.type === "exile";
  const hasVotes = event.votes && event.votes.length > 0;

  if (isBadge) {
    return (
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-gold)]/10">
        <span className="text-[var(--text-muted)] text-xs">警长竞选</span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-gold)] font-bold flex items-center gap-1.5 text-xs">
            <Star className="w-3 h-3" /> {event.target}号 ({event.voteCount}票)
          </span>
          {hasVotes && (
            <button 
              onClick={onShowVotes}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--color-gold)] border border-white/10 px-1.5 py-0.5 rounded transition-colors"
            >
              <Vote className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isExile) {
    return (
      <div className="mt-2 bg-[var(--color-blood)]/10 border border-[var(--color-blood)]/20 rounded px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-[var(--color-blood)]/70" />
          <span className="text-xs text-[var(--color-blood)]/80">放逐投票</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--color-blood)]">
            {event.target}号 ({event.voteCount}票)
          </span>
          {hasVotes && (
            <button 
              onClick={onShowVotes}
              className="text-[10px] text-[var(--color-blood)]/60 hover:text-[var(--color-blood)] border border-[var(--color-blood)]/20 px-1.5 py-0.5 rounded transition-colors"
            >
              <Vote className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[var(--text-muted)]">{event.type}</span>
      <span className="font-bold text-[var(--text-primary)]">{event.target}号</span>
    </div>
  );
}

function SpeechesSection({ speeches }: { speeches?: PlayerSpeech[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!speeches || speeches.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          发言详情 ({speeches.length}条)
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2.5">
          {speeches.map((speech, idx) => (
            <div
              key={idx}
              className="bg-white/5 rounded-lg p-2.5 text-xs"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[var(--color-gold)] font-bold">
                  {speech.seat}号
                </span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {speech.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PHASE_LABELS: Record<string, { label: string; icon: typeof Crown }> = {
  election: { label: "竞选阶段", icon: Crown },
  discussion: { label: "发言阶段", icon: MessageSquare },
  pk: { label: "PK阶段", icon: Swords },
};

function DayPhaseCard({ 
  phase, 
  day,
  onShowVotes 
}: { 
  phase: DayPhase; 
  day: number;
  onShowVotes: (votes: VoteRecord[], title: string) => void;
}) {
  const phaseInfo = PHASE_LABELS[phase.type];
  const PhaseIcon = phaseInfo.icon;

  return (
    <div className="analysis-card p-4 rounded-lg text-sm space-y-3 bg-[var(--bg-card)]/80 border-[var(--color-gold)]/30 mb-4">
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <PhaseIcon className="w-3.5 h-3.5 text-[var(--color-gold)]" />
        <span className="text-xs font-bold text-[var(--color-gold)]">{phaseInfo.label}</span>
      </div>
      
      {phase.summary && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {phase.summary}
        </p>
      )}
      
      {phase.event && (
        <DayEventItem 
          event={phase.event} 
          onShowVotes={() => {
            if (phase.event?.votes) {
              const title = phase.event.type === "badge" ? "警长竞选投票详情" : "放逐投票详情";
              onShowVotes(phase.event.votes, title);
            }
          }}
        />
      )}
      
      <SpeechesSection speeches={phase.speeches} />
    </div>
  );
}

export function TimelineReview({ timeline, selectedRoundIndex }: TimelineReviewProps) {
  const [voteModal, setVoteModal] = useState<{ isOpen: boolean; votes?: VoteRecord[]; title: string }>({
    isOpen: false,
    title: "",
  });

  const isRoundSelected = selectedRoundIndex !== undefined && selectedRoundIndex > 0;
  const selectedDay = isRoundSelected ? selectedRoundIndex : undefined;

  const filteredTimeline = isRoundSelected
    ? timeline.filter((entry) => entry.day === selectedDay)
    : timeline;

  const handleShowVotes = (votes: VoteRecord[], title: string) => {
    setVoteModal({ isOpen: true, votes, title });
  };

  return (
    <section className="relative">
      <h3 className="text-center font-bold text-[var(--color-gold)]/40 text-xs mb-8 uppercase tracking-[0.3em] analysis-ornament-border pb-3">
        Timeline Review
      </h3>

      <div className="space-y-6 pl-4 relative">
        <div className="analysis-nav-line left-[21px]" />

        {filteredTimeline.map((entry, idx) => (
          <div key={idx}>
            {/* 夜晚 */}
            {entry.nightEvents.length > 0 && (
              <div className="flex gap-5 relative z-10 mb-6">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--bg-main)] border-2 border-indigo-900 shadow-[0_0_10px_rgba(49,46,129,0.5)] transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-indigo-300/80 mb-2 tracking-wider">
                    NIGHT {String(entry.day).padStart(2, "0")}
                  </div>
                  <div className="analysis-card p-4 rounded-lg text-sm space-y-3 bg-[var(--bg-card)]/80">
                    {entry.nightEvents.map((event, eventIdx) => (
                      <div key={eventIdx}>
                        <NightEventItem event={event} />
                        {eventIdx < entry.nightEvents.length - 1 && (
                          <div className="w-full h-px bg-white/5 my-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 白天 - 使用 dayPhases */}
            {entry.dayPhases && entry.dayPhases.length > 0 ? (
              <div className="flex gap-5 relative z-10">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--bg-main)] border-2 border-[var(--color-gold)]/60 shadow-[0_0_10px_rgba(197,160,89,0.3)] transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[var(--color-gold)]/80 mb-2 tracking-wider">
                    DAY {String(entry.day).padStart(2, "0")}
                  </div>
                  {entry.dayPhases.map((phase, phaseIdx) => (
                    <DayPhaseCard 
                      key={phaseIdx} 
                      phase={phase} 
                      day={entry.day}
                      onShowVotes={handleShowVotes}
                    />
                  ))}
                </div>
              </div>
            ) : entry.dayEvents.length > 0 && (
              <div className="flex gap-5 relative z-10">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3 h-3 rounded-full bg-[var(--bg-main)] border-2 border-[var(--color-gold)]/60 shadow-[0_0_10px_rgba(197,160,89,0.3)] transition-all duration-300" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[var(--color-gold)]/80 mb-2 tracking-wider">
                    DAY {String(entry.day).padStart(2, "0")}
                  </div>
                  <div className="analysis-card p-4 rounded-lg text-sm space-y-3 bg-[var(--bg-card)]/80 border-[var(--color-gold)]/30">
                    {entry.summary && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {entry.summary}
                      </p>
                    )}
                    {entry.dayEvents.map((event, eventIdx) => (
                      <DayEventItem 
                        key={eventIdx} 
                        event={event}
                        onShowVotes={() => {
                          if (event.votes) {
                            const title = event.type === "badge" ? "警长竞选投票详情" : "放逐投票详情";
                            handleShowVotes(event.votes, title);
                          }
                        }}
                      />
                    ))}
                    <SpeechesSection speeches={entry.speeches} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <VoteModal 
        isOpen={voteModal.isOpen}
        onClose={() => setVoteModal({ isOpen: false, title: "" })}
        votes={voteModal.votes}
        title={voteModal.title}
      />
    </section>
  );
}
