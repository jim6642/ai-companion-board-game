/**
 * 游戏分析生成 Hook
 * 在 GAME_END 时自动触发分析数据生成
 */

import { useEffect, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  gameStateAtom,
  gameAnalysisAtom,
  analysisLoadingAtom,
  analysisErrorAtom,
} from "@/store/game-machine";
import { generateGameAnalysis } from "@/lib/game-analysis";
import { gameStatsTracker } from "@/hooks/useGameStats";

export function useGameAnalysis() {
  const gameState = useAtomValue(gameStateAtom);
  const [analysisData, setAnalysisData] = useAtom(gameAnalysisAtom);
  const [isLoading, setIsLoading] = useAtom(analysisLoadingAtom);
  const [error, setError] = useAtom(analysisErrorAtom);

  const triggerAnalysis = useCallback(async (model?: string) => {
    if (gameState.phase !== "GAME_END" || !gameState.winner) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const winner = gameState.winner === "wolf" ? "wolf" : "villager";
      const statsSummary = gameStatsTracker.getSummary(winner, true);
      const durationSeconds = statsSummary?.durationSeconds ?? 0;
      
      const data = await generateGameAnalysis(gameState, model, durationSeconds);
      setAnalysisData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "分析生成失败";
      setError(errorMessage);
      console.error("Game analysis generation failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [gameState, setAnalysisData, setIsLoading, setError]);

  useEffect(() => {
    if (gameState.phase === "GAME_END" && gameState.winner && !analysisData && !isLoading) {
      triggerAnalysis();
    }
  }, [gameState.phase, gameState.winner, analysisData, isLoading, triggerAnalysis]);

  const clearAnalysis = useCallback(() => {
    setAnalysisData(null);
    setError(null);
  }, [setAnalysisData, setError]);

  return {
    analysisData,
    isLoading,
    error,
    triggerAnalysis,
    clearAnalysis,
  };
}

export function useAnalysisData() {
  return useAtomValue(gameAnalysisAtom);
}

export function useAnalysisLoading() {
  return useAtomValue(analysisLoadingAtom);
}

export function useAnalysisError() {
  return useAtomValue(analysisErrorAtom);
}
