"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Crown, Medal, Award, Trophy } from "lucide-react";
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
        return <span className="w-5 h-5 text-center text-white/40 text-sm font-bold">{index + 1}</span>;
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-white">Scoreboard</h3>
        </div>
        <div className="text-white/50 text-sm">
          Round {currentRound} • First to {winningScore}
        </div>
      </div>

      {/* Player List */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.05 * index }}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              index === 0 && player.score > 0
                ? "bg-yellow-500/10 border border-yellow-500/20"
                : "bg-muted/30"
            }`}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-white truncate block">
                {player.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{player.score}</span>
              <span className="text-white/40 text-sm">/{winningScore}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
