"use client";

import { useEffect, useRef, useState } from "react";
import { Scroll, Quote, ThumbsUp, Brain } from "lucide-react";
import Image from "next/image";
import type { PersonalStats } from "@/types/analysis";
import { RADAR_LABELS_VILLAGE, RADAR_LABELS_WOLF } from "@/types/analysis";

const TAG_ILLUSTRATIONS: Record<string, string> = {
  "洞悉之眼": "/lihui/analysis_bg.png",
  "初露锋芒": "/lihui/analysis_bg.png",
  "天妒英才": "/lihui/analysis_bg.png",
  "default": "/lihui/analysis_bg.png",
};

const TAG_CONDITIONS: Record<string, string> = {
  // 预言家
  "洞悉之眼": "作为预言家查杀两只狼或以上",
  "初露锋芒": "作为预言家查杀一只狼",
  "天妒英才": "作为预言家首夜被刀",
  // 女巫
  "致命毒药": "作为女巫毒死狼人",
  "妙手回春": "作为女巫救对人（救了好人）",
  "助纣为虐": "作为女巫救错人（救了狼）",
  "误入歧途": "作为女巫毒错人（毒了好人）",
  "药物冲突": "同守同救导致奶穿",
  // 守卫
  "铜墙铁壁": "作为守卫成功守卫两人或以上",
  "坚实盾牌": "作为守卫成功守卫一人",
  "生锈盾牌": "作为守卫从未成功守卫",
  "致命守护": "同守同救导致奶穿",
  // 猎人
  "一枪致命": "作为猎人带走狼人",
  "擦枪走火": "作为猎人带走好人",
  "仁慈之枪": "作为猎人未开枪",
  // 狼人
  "孤狼啸月": "狼队友全部出局仅自己存活获胜",
  "完美猎杀": "没有狼队友出局赢得胜利",
  "演技大师": "悍跳拿到警徽",
  "绝命赌徒": "首夜自刀骗药",
  "绝地反击": "被预言家查杀后抗推好人",
  "出师未捷": "被首验查杀",
  "嗜血猎手": "狼人阵营获胜",
  "长夜难明": "狼人阵营失败",
  // 平民/通用
  "明察秋毫": "投票准确率≥50%",
  "随波逐流": "投票准确率在35%~50%之间",
  "全场划水": "投票准确率≤35%",
  // 默认
  "待评估": "完成一局游戏即可获得称号",
};

interface PersonalStatsCardProps {
  stats: PersonalStats;
}

export function PersonalStatsCard({ stats }: PersonalStatsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const isWolf = stats.alignment === "wolf";
  const radarLabels = isWolf ? RADAR_LABELS_WOLF : RADAR_LABELS_VILLAGE;
  const primaryTag = stats.tags[0] || "待评估";
  const illustrationSrc = TAG_ILLUSTRATIONS[primaryTag] || TAG_ILLUSTRATIONS["default"];
  const tagCondition = TAG_CONDITIONS[primaryTag] || TAG_CONDITIONS["待评估"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    const dataValues = [
      stats.radarStats.logic,
      stats.radarStats.speech,
      stats.radarStats.survival,
      stats.radarStats.skillOrHide,
      stats.radarStats.voteOrTicket,
    ];

    ctx.clearRect(0, 0, width, height);

    const goldColor = "#c5a059";
    const goldAlpha = "rgba(197, 160, 89, 0.1)";

    for (let level = 5; level >= 1; level--) {
      const levelRadius = (radius * level) / 5;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = goldAlpha;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = goldAlpha;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(197, 160, 89, 0.5)");
    gradient.addColorStop(1, "rgba(197, 160, 89, 0.1)");

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const value = dataValues[i] / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const value = dataValues[i] / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1614";
      ctx.fill();
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.font = "bold 11px 'Noto Serif SC', serif";
    ctx.fillStyle = goldColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // Draw label with score
      const score = dataValues[i];
      ctx.fillText(`${radarLabels[i]} ${score}`, x, y);
    }
  }, [stats.radarStats, radarLabels]);

  return (
    <section className="analysis-card rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-start border-b border-[var(--color-gold)]/10 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Scroll className="w-5 h-5 text-[var(--color-gold)]/80" />
            个人战绩
          </h3>

          <div
            onClick={() => illustrationSrc && setIsFlipped(!isFlipped)}
            className={`mt-3 relative w-28 h-8 bg-black/30 border border-[var(--color-gold)]/20 rounded flex items-center justify-center group overflow-hidden ${
              illustrationSrc ? "cursor-pointer hover:border-[var(--color-gold)]/50" : ""
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-20 transition-opacity">
              <span className="text-[10px] text-[var(--color-gold)]/40 tracking-widest">
                TITLE
              </span>
            </div>
            <span className="relative z-10 text-[var(--color-gold)] text-xs font-bold tracking-widest drop-shadow-md">
              {primaryTag}
            </span>
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[shine_3s_infinite]" />
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-[var(--color-gold)] drop-shadow-lg">
            {stats.totalScore}
            <span className="text-sm text-[var(--color-gold)]/60 ml-0.5">
              pts
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Evaluation
          </div>
        </div>
      </div>

      <div
        className={`relative w-full aspect-square max-h-[260px] mx-auto py-2 ${illustrationSrc ? "cursor-pointer" : ""}`}
        style={{ perspective: "1000px" }}
        onClick={() => illustrationSrc && setIsFlipped(!isFlipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 正面 - 雷达图 */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(197,160,89,0.03)_0%,transparent_70%)] pointer-events-none" />
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          {/* 背面 - 立绘 */}
          <div
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {illustrationSrc && (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <div 
                  className="relative w-56 h-56 rounded-lg overflow-hidden border-2 border-[var(--color-gold)]/30 shadow-[0_0_30px_rgba(197,160,89,0.2)]"
                  style={{ animation: "analysis-float 4s ease-in-out infinite" }}
                >
                  <Image
                    src={illustrationSrc}
                    alt={primaryTag}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="mt-5 text-center relative">
                  {/* Ribbon Style Container */}
                  <div className="relative inline-flex items-center justify-center min-w-[180px] py-2 px-6">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-gold)]/15 to-transparent" />
                    
                    {/* Decorative lines */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gold)]/60 to-transparent" />
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gold)]/60 to-transparent" />
                    
                    {/* Text with shadow effects */}
                    <span 
                      className="text-xl font-black text-[var(--color-gold)] tracking-[0.3em] relative z-10"
                      style={{ 
                        textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(197,160,89,0.4)",
                        fontFamily: "'Noto Serif SC', serif"
                      }}
                    >
                      {primaryTag}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-[var(--text-muted)]/60 mt-2 px-4 text-center leading-relaxed">
                    {tagCondition}
                  </div>
                  
                  <div className="text-[10px] text-[var(--text-muted)]/40 mt-3 tracking-widest uppercase">
                    Click to flip
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.highlightQuote && (
        <div className="bg-[#141210] border border-[var(--color-gold)]/10 rounded-lg p-4 relative mt-2">
          <Quote className="absolute top-3 left-3 w-6 h-6 text-[var(--color-gold)]/20" />
          <p className="text-sm text-[var(--text-secondary)] italic text-center px-4 py-2 leading-relaxed">
            &ldquo;{stats.highlightQuote}&rdquo;
          </p>
          <div className="flex justify-center mt-3 gap-4 text-[10px] text-[var(--color-gold)]/60 tracking-wider">
            <span className="flex items-center gap-1.5">
              <ThumbsUp className="w-3 h-3" /> HIGHLIGHT
            </span>
            <span className="flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> BEST LOGIC
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
