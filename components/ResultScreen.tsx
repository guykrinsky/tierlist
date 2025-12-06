"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Star, Check, X } from "lucide-react";

interface PlayerResult {
  playerId: string;
  playerName: string;
  secretNumber: number;
  submission: string;
  judgePositionGuess: number;
  judgeNumberGuess: number | null;
  actualPosition: number;
  positionCorrect: boolean;
  numberCorrect: boolean;
  playerPointsEarned: number;
  judgePointsEarned: number;
}

interface ResultScreenProps {
  results: PlayerResult[];
  judgeName: string;
  judgePointsEarned: number;
  category: string;
  onNextRound: () => void;
  isHost: boolean;
  allPositionsCorrect?: boolean;
}

export function ResultScreen({
  results,
  judgeName,
  judgePointsEarned,
  category,
  onNextRound,
  isHost,
  allPositionsCorrect,
}: ResultScreenProps) {
  const sortedResults = [...results].sort((a, b) => a.actualPosition - b.actualPosition);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2">Round Complete!</h2>
        <p className="text-white/60">
          Category: <span className="text-tierlist-blue font-medium">{category}</span>
        </p>
      </div>

      {/* Judge Score */}
      <Card className="p-5 bg-tierlist-blue/10 border-tierlist-blue/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Judge</p>
            <p className="text-xl font-bold text-white">{judgeName}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Points Earned</p>
            <p className="text-3xl font-black text-tierlist-blue">+{judgePointsEarned}</p>
          </div>
        </div>
        {allPositionsCorrect !== undefined && (
          <div className="mt-3 pt-3 border-t border-tierlist-blue/20">
            {allPositionsCorrect ? (
              <p className="text-green-400 font-medium flex items-center gap-2">
                <Check className="w-4 h-4" /> Perfect ordering! (+1 bonus)
              </p>
            ) : (
              <p className="text-white/50 text-sm">Ordering incorrect</p>
            )}
          </div>
        )}
      </Card>

      {/* Player Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Results</h3>
        {sortedResults.map((result, index) => (
          <motion.div
            key={result.playerId}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="p-4 bg-card border-border">
              <div className="flex items-center gap-4">
                {/* Number Badge */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{result.secretNumber}</span>
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{result.playerName}</p>
                  <p className="text-white/50 text-sm truncate">&quot;{result.submission}&quot;</p>
                </div>

                {/* Results */}
                <div className="text-right space-y-1">
                  {/* Number Guess */}
                  {result.judgeNumberGuess !== null && (
                    <div className="flex items-center justify-end gap-2">
                      {result.numberCorrect ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-yellow-500 text-sm font-medium">
                            #{result.judgeNumberGuess} ✓
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-white/40" />
                          <span className="text-white/40 text-sm">
                            #{result.judgeNumberGuess}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Points */}
                  <p className={`text-lg font-bold ${
                    result.playerPointsEarned > 0 ? "text-yellow-500" : "text-white/40"
                  }`}>
                    {result.playerPointsEarned > 0 ? `+${result.playerPointsEarned}` : "0"} pts
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Next Round Button */}
      {isHost ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onNextRound}
            size="lg"
            className="w-full h-14 text-lg bg-tierlist-blue hover:bg-tierlist-blue-dark text-white"
          >
            Next Round
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <p className="text-center text-white/50">
          Waiting for host to continue...
        </p>
      )}
    </div>
  );
}
