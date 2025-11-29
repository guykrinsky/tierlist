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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Scoreboard</h3>
        <div className="text-sm text-muted-foreground">
          Round {currentRound} • Goal: {winningScore} pts
        </div>
      </div>

      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index }}
          >
            <div
              className={`relative p-4 rounded-xl border-2 transition-all ${
                player.is_judge
                  ? "border-tierlist-blue bg-tierlist-blue/10"
                  : "border-border bg-card"
              }`}
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-tierlist-blue/20 to-transparent transition-all"
                style={{ width: `${getProgressWidth(player.score)}%` }}
              />

              <div className="relative flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(index)}
                  <span className="text-lg font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {player.name}
                    </span>
                    {player.is_host && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-tierlist-red/20 text-tierlist-red">
                        Host
                      </span>
                    )}
                    {player.is_judge && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-tierlist-blue/20 text-tierlist-blue flex items-center gap-1">
                        <Gavel className="w-3 h-3" />
                        Judge
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    {player.score}
                  </span>
                  <span className="text-sm text-muted-foreground">
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

