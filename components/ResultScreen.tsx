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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={`p-5 border-2 transition-all duration-500 ${
          allPositionsCorrect
            ? "bg-green-500/10 border-green-500/50"
            : "bg-tierlist-blue/10 border-tierlist-blue/30"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Judge</p>
              <p className="text-xl font-bold text-white">{judgeName}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Points Earned</p>
              <p className={`text-3xl font-black ${
                allPositionsCorrect ? "text-green-400" : "text-tierlist-blue"
              }`}>
                +{judgePointsEarned}
              </p>
            </div>
          </div>

          {allPositionsCorrect !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              {allPositionsCorrect ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-bold">Perfect Ordering! 🎉</p>
                    <p className="text-green-400/80 text-sm">Got everyone's position exactly right (+1 bonus)</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <X className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <p className="text-white/80 font-medium">Ordering Incomplete</p>
                    <p className="text-white/60 text-sm">Some positions were ranked incorrectly</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </Card>
      </motion.div>

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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-4 bg-card border-border transition-all duration-300 ${
                result.positionCorrect
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}>
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
                <div className="text-right space-y-2">
                  {/* Position Accuracy */}
                  <div className="flex items-center justify-end gap-2">
                    {result.positionCorrect ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">Position ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                        <X className="w-3 h-3 text-red-400" />
                        <span className="text-red-400 text-xs font-medium">Wrong Position</span>
                      </div>
                    )}
                  </div>

                  {/* Real Position vs Judge's Guess */}
                  <div className="text-xs text-white/60">
                    <div>Real: #{result.actualPosition}</div>
                    <div>Judge: #{result.judgePositionGuess}</div>
                  </div>

                  {/* Points */}
                  <div className={`text-lg font-bold ${
                    result.playerPointsEarned > 0 ? "text-yellow-500" : "text-white/40"
                  }`}>
                    {result.playerPointsEarned > 0 ? `+${result.playerPointsEarned}` : "0"} pts
                  </div>
                </div>
              </div>
              </Card>
            </motion.div>
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
