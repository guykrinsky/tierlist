"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Crown, Trophy, Medal, Award, Home, RotateCcw } from "lucide-react";
import type { Player } from "@/types";

interface GameOverProps {
  players: Player[];
  onPlayAgain: () => void;
  onGoHome: () => void;
  isHost: boolean;
}

export function GameOver({ players, onPlayAgain, onGoHome, isHost }: GameOverProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti effect with CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: ["#2563eb", "#dc2626", "#fbbf24", "#22c55e"][
                Math.floor(Math.random() * 4)
              ],
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: "100vh",
              opacity: 0,
              rotate: Math.random() * 720 - 360,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="text-center">
          <Logo size="lg" />
        </div>

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
          </motion.div>
          <h2 className="text-4xl font-black text-white mb-2">
            Game Over!
          </h2>
          <p className="text-xl text-muted-foreground">
            <span className="text-tierlist-blue font-bold">{winner.name}</span> wins!
          </p>
        </motion.div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Final Standings
          </h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + 0.1 * index }}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/50"
                    : "bg-muted/30"
                }`}
              >
                <div className="w-12 flex justify-center">
                  {getRankIcon(index) || (
                    <span className="text-xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-white">{player.name}</span>
                </div>
                <div className="text-2xl font-black text-tierlist-blue">
                  {player.score}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onGoHome}
            className="flex-1"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
          {isHost && (
            <Button onClick={onPlayAgain} className="flex-1" size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
