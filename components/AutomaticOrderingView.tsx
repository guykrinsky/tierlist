"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ListOrdered, Eye, Clock, Users } from "lucide-react";
import type { Secret, Submission, Player } from "@/types";

interface AutomaticOrderingViewProps {
  submissions: Submission[];
  secrets: Secret[];
  players: Player[];
  myPlayerId: string;
  mySecret: number | null;
  isLive?: boolean;
  totalExpected?: number;
}

export function AutomaticOrderingView({
  submissions,
  secrets,
  players,
  myPlayerId,
  mySecret,
  isLive = false,
  totalExpected,
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

  const isComplete = totalExpected ? submissions.length >= totalExpected : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      <Card className={`p-4 sm:p-6 ${isLive ? "border-yellow-500/50 bg-yellow-500/5" : "border-tierlist-blue/50 bg-tierlist-blue/10"}`}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-yellow-500/20" : "bg-tierlist-blue/20"}`}>
            {isLive ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              </motion.div>
            ) : (
              <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5 text-tierlist-blue" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isLive ? "Live Ordering" : "Final Ordering"}
              </h3>
              {isLive && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-[10px] sm:text-xs font-medium animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {isLive 
                ? "Updates as players submit"
                : "All answers ranked low→high"
              }
            </p>
          </div>
          {isLive && totalExpected && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{submissions.length}/{totalExpected}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedSubmissions.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ x: -20, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 20, opacity: 0, scale: 0.9 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: isLive ? 0 : index * 0.1 
                }}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${
                  item.isMe
                    ? "bg-tierlist-blue/20 border border-tierlist-blue/50"
                    : "bg-muted/30"
                }`}
              >
                <motion.div 
                  layout
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark flex items-center justify-center shrink-0"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{index + 1}</span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm sm:text-base truncate">&ldquo;{item.text}&rdquo;</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {item.playerName}
                    {item.isMe && (
                      <span className="ml-1 sm:ml-2 text-tierlist-blue">(You #{mySecret})</span>
                    )}
                  </p>
                </div>
                {item.isMe && (
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-tierlist-blue shrink-0" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground text-center">
          {isLive 
            ? isComplete
              ? "✅ All submitted! Waiting for judging..."
              : "⏳ Waiting for others..."
            : "💡 Judge is guessing numbers!"
          }
        </p>
      </Card>
    </motion.div>
  );
}

