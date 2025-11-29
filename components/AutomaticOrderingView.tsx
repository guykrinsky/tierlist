"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ListOrdered, Eye } from "lucide-react";
import type { Secret, Submission, Player } from "@/types";

interface AutomaticOrderingViewProps {
  submissions: Submission[];
  secrets: Secret[];
  players: Player[];
  myPlayerId: string;
  mySecret: number | null;
}

export function AutomaticOrderingView({
  submissions,
  secrets,
  players,
  myPlayerId,
  mySecret,
}: AutomaticOrderingViewProps) {
  // Sort submissions by their secret numbers (lowest to highest)
  const sortedSubmissions = useMemo(() => {
    return [...submissions]
      .map((sub) => {
        const secret = secrets.find((s) => s.player_id === sub.player_id);
        const player = players.find((p) => p.id === sub.player_id);
        return {
          ...sub,
          secretValue: secret?.value ?? 0,
          playerName: player?.name ?? "Unknown",
          isMe: sub.player_id === myPlayerId,
        };
      })
      .sort((a, b) => a.secretValue - b.secretValue);
  }, [submissions, secrets, players, myPlayerId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="p-6 border-tierlist-blue/50 bg-tierlist-blue/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-tierlist-blue/20 flex items-center justify-center">
            <ListOrdered className="w-5 h-5 text-tierlist-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Automatic Ordering</h3>
            <p className="text-sm text-muted-foreground">
              This is how everyone's answers rank (lowest → highest)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {sortedSubmissions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                item.isMe
                  ? "bg-tierlist-blue/20 border border-tierlist-blue/50"
                  : "bg-muted/30"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark flex items-center justify-center">
                <span className="text-sm font-bold text-white">{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">"{item.text}"</p>
                <p className="text-xs text-muted-foreground">
                  {item.playerName}
                  {item.isMe && (
                    <span className="ml-2 text-tierlist-blue">(You - #{mySecret})</span>
                  )}
                </p>
              </div>
              {item.isMe && (
                <Eye className="w-4 h-4 text-tierlist-blue" />
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          💡 The judge is now guessing everyone's numbers based on their answers!
        </p>
      </Card>
    </motion.div>
  );
}

