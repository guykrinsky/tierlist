"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Eye, Target, CheckCircle2 } from "lucide-react";
import type { Secret, Submission, Player } from "@/types";

interface PlayerJudgingViewProps {
  submissions: Submission[];
  secrets: Secret[];
  players: Player[];
  judgeName: string;
}

export function PlayerJudgingView({
  submissions,
  secrets,
  players,
  judgeName,
}: PlayerJudgingViewProps) {
  // Sort submissions by their real secret numbers (lowest to highest)
  const sortedSubmissions = submissions
    .map((sub) => {
      const secret = secrets.find((s) => s.player_id === sub.player_id);
      const player = players.find((p) => p.id === sub.player_id);
      return {
        ...sub,
        secretValue: secret?.value ?? 0,
        playerName: player?.name ?? "Unknown",
      };
    })
    .sort((a, b) => a.secretValue - b.secretValue);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Target className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-semibold">
              <span className="text-yellow-500">{judgeName}</span> is ranking the answers...
            </p>
            <p className="text-white/60 text-sm mt-1">
              You can see the real secret numbers now!
            </p>
          </div>
        </div>
      </Card>

      {/* Real Rankings */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-bold text-white">Real Rankings</h3>
        </div>
        <p className="text-white/60 text-sm mb-4">
          Here&apos;s how everyone really ranks (lowest number = best):
        </p>

        <div className="space-y-3">
          {sortedSubmissions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-white/10"
            >
              {/* Real Number Badge */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-white">{item.secretValue}</span>
              </div>

              {/* Player and Answer */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{item.playerName}</p>
                <p className="text-white/80 text-sm leading-relaxed">
                  &ldquo;{item.text}&rdquo;
                </p>
              </div>

              {/* Position Indicator */}
              <div className="text-right">
                <p className="text-white/50 text-xs">Position</p>
                <p className="text-white font-bold">#{index + 1}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <p className="text-blue-400 font-medium text-sm">Live Updates</p>
          </div>
          <p className="text-white/70 text-sm">
            Watch as <span className="text-yellow-500 font-medium">{judgeName}</span> tries to guess these rankings!
            You&apos;ll see how well they do in the results.
          </p>
        </div>
      </Card>
    </div>
  );
}
