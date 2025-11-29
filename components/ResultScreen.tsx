"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, ArrowRight, Star, ShieldCheck, ShieldX } from "lucide-react";

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
}

export function ResultScreen({
  results,
  judgeName,
  judgePointsEarned,
  category,
  onNextRound,
  isHost,
}: ResultScreenProps) {
  // Sort results by actual position (secret number)
  const sortedResults = [...results].sort((a, b) => a.actualPosition - b.actualPosition);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2">Round Results</h2>
        <p className="text-muted-foreground">
          Category: <span className="text-tierlist-blue font-medium">{category}</span>
        </p>
      </div>

      <Card className="p-6 border-tierlist-blue/50 bg-tierlist-blue/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Judge</p>
            <p className="text-xl font-bold text-white">{judgeName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Points Earned</p>
            <p className="text-3xl font-black text-tierlist-blue">
              +{judgePointsEarned}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Player Results</h3>
        {sortedResults.map((result, index) => (
          <motion.div
            key={result.playerId}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full number-badge flex items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    {result.secretNumber}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-white">{result.playerName}</p>
                  <p className="text-sm text-muted-foreground">
                    "{result.submission}"
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {result.positionCorrect ? (
                      // Judge was correct - bad for player
                      <ShieldX className="w-5 h-5 text-red-400" />
                    ) : (
                      // Player fooled judge - good for player!
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Pos: {result.judgePositionGuess} {result.positionCorrect ? "✓" : `→ was ${result.actualPosition}`}
                    </span>
                  </div>
                  {result.judgeNumberGuess !== null && (
                    <div className="flex items-center gap-2">
                      {result.numberCorrect ? (
                        // Judge guessed number - bad for player
                        <Star className="w-5 h-5 text-yellow-500" />
                      ) : (
                        // Player fooled judge on number - good for player!
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        #{result.judgeNumberGuess} {result.numberCorrect ? "✓" : "✗"}
                      </span>
                    </div>
                  )}
                  {result.judgeNumberGuess === null && (
                    <span className="text-xs text-muted-foreground">No # guess (+1)</span>
                  )}
                  <p className="text-lg font-bold text-green-500">
                    +{result.playerPointsEarned} pts
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {isHost && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button onClick={onNextRound} size="lg" className="w-full">
            Next Round
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      )}

      {!isHost && (
        <p className="text-center text-muted-foreground">
          Waiting for host to start next round...
        </p>
      )}
    </motion.div>
  );
}

