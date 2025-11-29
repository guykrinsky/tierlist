"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Gavel } from "lucide-react";
import type { Player, Submission } from "@/types";

interface PlayerListProps {
  players: Player[];
  submissions: Submission[];
  judgeId: string | null;
  currentPlayerId: string | null;
  showSubmissionStatus?: boolean;
}

export function PlayerList({
  players,
  submissions,
  judgeId,
  currentPlayerId,
  showSubmissionStatus = false,
}: PlayerListProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        Players
      </h3>
      <div className="space-y-2">
        {players.map((player, index) => {
          const isJudge = player.id === judgeId;
          const isCurrentPlayer = player.id === currentPlayerId;
          const hasSubmitted = submissions.some(
            (s) => s.player_id === player.id
          );

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isCurrentPlayer
                  ? "bg-tierlist-blue/10 border border-tierlist-blue/30"
                  : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{player.name}</span>
                {isJudge && (
                  <Gavel className="w-4 h-4 text-tierlist-blue" />
                )}
                {isCurrentPlayer && (
                  <span className="text-xs text-tierlist-blue">(You)</span>
                )}
              </div>

              {showSubmissionStatus && !isJudge && (
                <div>
                  {hasSubmitted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

