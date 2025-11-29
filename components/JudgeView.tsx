"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Clock, Users, MessageCircle } from "lucide-react";
import type { Player, Submission } from "@/types";

interface JudgeViewProps {
  players: Player[];
  submissions: Submission[];
  category: string;
}

export function JudgeView({ players, submissions, category }: JudgeViewProps) {
  const nonJudgePlayers = players.filter((p) => !p.is_judge);
  const submittedCount = submissions.length;
  const totalPlayers = nonJudgePlayers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tierlist-blue/20 mb-4">
          <Clock className="w-8 h-8 text-tierlist-blue" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          You are the Judge!
        </h3>
        <p className="text-muted-foreground">
          Wait for all players to submit their <span className="text-tierlist-blue font-medium">{category}</span>
        </p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-white">Submissions</span>
          </div>
          <span className="text-lg font-bold text-tierlist-blue">
            {submittedCount}/{totalPlayers}
          </span>
        </div>

        <div className="space-y-2">
          {nonJudgePlayers.map((player) => {
            const submission = submissions.find(
              (s) => s.player_id === player.id
            );
            const hasSubmitted = !!submission;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  hasSubmitted
                    ? "bg-green-500/10 border border-green-500/30"
                    : "bg-muted/30"
                }`}
              >
                <span className="font-medium text-white">{player.name}</span>
                {hasSubmitted ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Submitted</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-muted-foreground"
                    />
                    <span className="text-sm">Thinking...</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {submittedCount < totalPlayers && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Waiting for {totalPlayers - submittedCount} more player
            {totalPlayers - submittedCount > 1 ? "s" : ""}...
          </p>
        )}
      </Card>
    </motion.div>
  );
}

