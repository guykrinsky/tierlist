"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Trophy, ArrowRight, Star } from "lucide-react";

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
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-500 mb-3 sm:mb-4" />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Round Results</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
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
        {allPositionsCorrect !== undefined && (
          <div className="mt-3 pt-3 border-t border-tierlist-blue/30">
            {allPositionsCorrect ? (
              <p className="text-green-400 font-medium">
                🏆 Perfect ordering! Judge earned +1 bonus point
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Ordering incorrect - no bonus point for judge
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-semibold text-white">Player Results</h3>
        {sortedResults.map((result, index) => (
          <motion.div
            key={result.playerId}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="p-3 sm:p-4">
              {/* Mobile: Stacked layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full number-badge flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-white">
                      {result.secretNumber}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{result.playerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      &quot;{result.submission}&quot;
                    </p>
                  </div>
                  <p className={`text-lg font-bold shrink-0 ${result.playerPointsEarned > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {result.playerPointsEarned > 0 ? `+${result.playerPointsEarned}` : "0"}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-border pt-2">
                  {result.positionCorrect ? (
                    <span className="text-green-400">Position ✓</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Pos: {result.judgePositionGuess}→{result.actualPosition}
                    </span>
                  )}
                  {result.judgeNumberGuess !== null ? (
                    result.numberCorrect ? (
                      <span className="text-yellow-500 font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" /> #{result.judgeNumberGuess} EXACT!
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Guessed #{result.judgeNumberGuess} ✗
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">No guess</span>
                  )}
                </div>
              </div>

              {/* Desktop: Row layout */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="w-12 h-12 rounded-full number-badge flex items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    {result.secretNumber}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-white">{result.playerName}</p>
                  <p className="text-sm text-muted-foreground">
                    &quot;{result.submission}&quot;
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {result.positionCorrect ? (
                      <span className="text-sm text-green-400">
                        Position ✓
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Pos: {result.judgePositionGuess} → was {result.actualPosition}
                      </span>
                    )}
                  </div>
                  {result.judgeNumberGuess !== null ? (
                    <div className="flex items-center gap-2">
                      {result.numberCorrect ? (
                        <>
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm text-yellow-500 font-medium">
                            #{result.judgeNumberGuess} 🎯 EXACT!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            #{result.judgeNumberGuess} ✗
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No number guess</span>
                  )}
                  <p className={`text-lg font-bold ${result.playerPointsEarned > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {result.playerPointsEarned > 0 ? `+${result.playerPointsEarned} pts` : "0 pts"}
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

