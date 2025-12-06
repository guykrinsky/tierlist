"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Crown, Medal, Award, User, Gavel } from "lucide-react";
import type { Player } from "@/types";

interface ScoreboardProps {
  players: Player[];
  winningScore: number;
  currentRound: number;
}

export function Scoreboard({ players, winningScore, currentRound }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <User className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getProgressWidth = (score: number) => {
    return Math.min((score / winningScore) * 100, 100);
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-white">Scoreboard</h3>
        <div className="text-xs sm:text-sm text-muted-foreground">
          R{currentRound} • {winningScore}pts
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index }}
          >
            <div
              className={`relative p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                player.is_judge
                  ? "border-tierlist-blue bg-tierlist-blue/10"
                  : "border-border bg-card"
              }`}
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-tierlist-blue/20 to-transparent transition-all"
                style={{ width: `${getProgressWidth(player.score)}%` }}
              />

              <div className="relative flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {getRankIcon(index)}
                  <span className="text-sm sm:text-lg font-bold text-muted-foreground hidden sm:inline">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm sm:text-base truncate">
                      {player.name}
                    </span>
                    {player.is_host && (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-tierlist-red/20 text-tierlist-red shrink-0">
                        Host
                      </span>
                    )}
                    {player.is_judge && (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-tierlist-blue/20 text-tierlist-blue flex items-center gap-1 shrink-0">
                        <Gavel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Judge</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {player.score}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    /{winningScore}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

