"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Crown, Medal, Award, User, Gavel, Trophy, Target } from "lucide-react";
import type { Player } from "@/types";

interface ScoreboardProps {
  players: Player[];
  winningScore: number;
  currentRound: number;
}

export function Scoreboard({ players, winningScore, currentRound }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const leader = sortedPlayers[0];
  const isCloseToWinning = leader && leader.score >= winningScore - 2;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
      case 2:
        return <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />;
      default:
        return <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />;
    }
  };

  const getProgressWidth = (score: number) => {
    return Math.min((score / winningScore) * 100, 100);
  };

  return (
    <Card className="game-card p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <div className="icon-container-yellow w-8 h-8 sm:w-9 sm:h-9">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Scoreboard</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">First to {winningScore} wins</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-lg bg-muted/50 text-xs sm:text-sm text-muted-foreground">
            Round {currentRound}
          </div>
        </div>
      </div>

      {/* Close to winning alert */}
      <AnimatePresence>
        {isCloseToWinning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="px-3 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-center">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-xs sm:text-sm text-yellow-500 font-medium"
              >
                🏆 {leader.name} is close to winning!
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              layout
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30,
                delay: 0.03 * index 
              }}
            >
              <div
                className={`relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all overflow-hidden ${
                  player.is_judge
                    ? "border-tierlist-blue/50 bg-tierlist-blue/10"
                    : index === 0
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {/* Progress bar background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-tierlist-blue/20 to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressWidth(player.score)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />

                <div className="relative flex items-center gap-2 sm:gap-3">
                  {/* Rank */}
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: index === 0 ? [0, -10, 10, 0] : 0 }}
                    >
                      {getRankIcon(index)}
                    </motion.div>
                    <span className="text-xs sm:text-sm font-bold text-muted-foreground w-4 sm:w-5">
                      {index + 1}
                    </span>
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[120px]">
                        {player.name}
                      </span>
                      {player.is_host && (
                        <span className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] rounded bg-tierlist-red/20 text-tierlist-red shrink-0">
                          Host
                        </span>
                      )}
                      {player.is_judge && (
                        <span className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] rounded bg-tierlist-blue/20 text-tierlist-blue flex items-center gap-0.5 shrink-0">
                          <Gavel className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.div
                      key={player.score}
                      initial={{ scale: 1.3, color: "#fbbf24" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      className="text-lg sm:text-xl font-black"
                    >
                      {player.score}
                    </motion.div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      /{winningScore}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Goal reminder */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Target className="w-3 h-3" />
        <span>First to {winningScore} points wins!</span>
      </div>
    </Card>
  );
}

