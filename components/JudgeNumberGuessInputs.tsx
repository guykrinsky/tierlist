"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Sparkles, Target } from "lucide-react";

interface PlayerGuess {
  playerId: string;
  playerName: string;
  submission: string;
  numberGuess: number | null;
}

interface JudgeNumberGuessInputsProps {
  orderedPlayers: PlayerGuess[];
  onGuessChange: (playerId: string, numberGuess: number | null) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

const getColorForNumber = (num: number) => {
  if (num <= 2) return "from-red-600 to-red-700 border-red-500";
  if (num <= 4) return "from-orange-500 to-orange-600 border-orange-500";
  if (num <= 6) return "from-yellow-500 to-yellow-600 border-yellow-500";
  if (num <= 8) return "from-lime-500 to-lime-600 border-lime-500";
  return "from-emerald-500 to-emerald-600 border-emerald-500";
};

export function JudgeNumberGuessInputs({
  orderedPlayers,
  onGuessChange,
  onSubmit,
  isSubmitting,
}: JudgeNumberGuessInputsProps) {
  const [guesses, setGuesses] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const initial: Record<string, number | null> = {};
    orderedPlayers.forEach((p) => {
      initial[p.playerId] = p.numberGuess;
    });
    setGuesses(initial);
  }, [orderedPlayers]);

  const handleNumberClick = (playerId: string, num: number) => {
    const currentGuess = guesses[playerId];
    const newGuess = currentGuess === num ? null : num;
    setGuesses((prev) => ({ ...prev, [playerId]: newGuess }));
    onGuessChange(playerId, newGuess);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-tierlist-blue/20 border border-tierlist-blue/50">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-tierlist-blue" />
          <span className="font-bold text-tierlist-blue text-sm sm:text-base">GUESS THE NUMBERS</span>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-tierlist-blue" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          What number does each player have?
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Guess right = <span className="text-yellow-400 font-semibold">+1 for you</span> & <span className="text-emerald-400 font-semibold">+1 for them!</span>
        </p>
      </div>

      {/* Player guessing cards */}
      <div className="space-y-4">
        {orderedPlayers.map((player, index) => {
          const selectedNumber = guesses[player.playerId];
          
          return (
            <motion.div
              key={player.playerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-3 sm:p-4 border-2 border-border hover:border-tierlist-blue/50 transition-colors">
                <div className="space-y-3">
                  {/* Player info row */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark flex items-center justify-center shadow-lg shrink-0">
                      <span className="text-sm sm:text-lg font-black text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm sm:text-base truncate">{player.playerName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground italic truncate">
                        &quot;{player.submission}&quot;
                      </p>
                    </div>
                    {selectedNumber && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${getColorForNumber(selectedNumber)} flex items-center justify-center shadow-lg shrink-0`}
                      >
                        <span className="text-lg sm:text-xl font-black text-white">
                          {selectedNumber}
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* Number selection grid - 5x2 on mobile, 10x1 on desktop */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = selectedNumber === num;
                      const colorClass = getColorForNumber(num);
                      
                      return (
                        <motion.button
                          key={num}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleNumberClick(player.playerId, num)}
                          className={`
                            relative h-11 sm:h-10 rounded-lg font-bold text-base sm:text-sm transition-all
                            ${isSelected 
                              ? `bg-gradient-to-br ${colorClass} text-white shadow-lg ring-2 ring-white/50` 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-white active:bg-muted"
                            }
                          `}
                        >
                          {num}
                          {isSelected && (
                            <motion.div
                              layoutId={`selected-${player.playerId}`}
                              className="absolute inset-0 rounded-lg ring-2 ring-white/50"
                              initial={false}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Submit button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-bold"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Calculating Results...
            </>
          ) : (
            <>
              <Send className="w-6 h-6 mr-2" />
              Lock In My Guesses! 🎯
            </>
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Your guesses will determine their positions (sorted low→high). Correct position = +1 for you!
        </p>
      </motion.div>
    </motion.div>
  );
}
