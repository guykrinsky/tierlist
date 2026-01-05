"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Target, MessageSquare } from "lucide-react";

interface PlayerSubmission {
  playerId: string;
  playerName: string;
  submission: string;
  positionGuess: number;
}

interface JudgeRankingInterfaceProps {
  submissions: PlayerSubmission[];
  onRankingSubmit: (rankings: PlayerSubmission[]) => Promise<void>;
  isSubmitting: boolean;
}

export function JudgeRankingInterface({
  submissions,
  onRankingSubmit,
  isSubmitting,
}: JudgeRankingInterfaceProps) {
  const [rankings, setRankings] = useState<PlayerSubmission[]>([]);

  useEffect(() => {
    // Initialize rankings based on submission order
    setRankings(submissions.map((sub, index) => ({ ...sub, positionGuess: index + 1 })));
  }, [submissions]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newRankings = [...rankings];
    [newRankings[index - 1], newRankings[index]] = [newRankings[index], newRankings[index - 1]];
    // Update position guesses
    newRankings.forEach((ranking, i) => {
      ranking.positionGuess = i + 1;
    });
    setRankings(newRankings);
  };

  const handleMoveDown = (index: number) => {
    if (index === rankings.length - 1) return;
    const newRankings = [...rankings];
    [newRankings[index], newRankings[index + 1]] = [newRankings[index + 1], newRankings[index]];
    // Update position guesses
    newRankings.forEach((ranking, i) => {
      ranking.positionGuess = i + 1;
    });
    setRankings(newRankings);
  };

  const handleSubmit = async () => {
    await onRankingSubmit(rankings);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-3">
          <Target className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-yellow-500">RANK THE ANSWERS</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Drag & drop to rank from best to worst
        </h2>
        <p className="text-white/60 mt-2">
          Position 1 = Best (lowest number) • Position {rankings.length} = Worst (highest number)
        </p>
      </div>

      {/* Ranking Cards */}
      <div className="space-y-3">
        {rankings.map((ranking, index) => (
          <motion.div
            key={ranking.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 bg-card border-border">
              {/* Position Badge & Controls */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <span className="text-xl font-black text-white">#{ranking.positionGuess}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{ranking.playerName}</p>
                    <p className="text-white/50 text-xs">Position {ranking.positionGuess}</p>
                  </div>
                </div>

                {/* Move Controls */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === rankings.length - 1}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    ↓
                  </Button>
                </div>
              </div>

              {/* Answer - Large and Prominent */}
              <div className="bg-muted/30 rounded-lg p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-tierlist-blue mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-lg font-medium text-white leading-relaxed">
                      &ldquo;{ranking.submission}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-black"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Submitting Rankings...
          </>
        ) : (
          <>
            <Send className="w-6 h-6 mr-2" />
            Finalize Rankings
          </>
        )}
      </Button>
    </div>
  );
}
