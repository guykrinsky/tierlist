"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Target } from "lucide-react";

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
  if (num <= 2) return "bg-red-500";
  if (num <= 4) return "bg-orange-500";
  if (num <= 6) return "bg-yellow-500";
  if (num <= 8) return "bg-green-500";
  return "bg-tierlist-blue";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tierlist-blue/20 border border-tierlist-blue/30 mb-3">
          <Target className="w-5 h-5 text-tierlist-blue" />
          <span className="font-bold text-tierlist-blue">GUESS THE NUMBERS</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          What number does each player have?
        </h2>
        <p className="text-white/60 mt-2">
          Correct guess = <span className="text-yellow-500 font-medium">+1 for you</span> & <span className="text-green-500 font-medium">+1 for them</span>
        </p>
      </div>

      {/* Player Cards */}
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
              <Card className="p-4 bg-card border-border">
                {/* Player Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-tierlist-blue flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{player.playerName}</p>
                    <p className="text-white/50 text-sm truncate">&quot;{player.submission}&quot;</p>
                  </div>
                  {selectedNumber && (
                    <div className={`w-12 h-12 rounded-xl ${getColorForNumber(selectedNumber)} flex items-center justify-center`}>
                      <span className="text-xl font-black text-white">{selectedNumber}</span>
                    </div>
                  )}
                </div>

                {/* Number Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const isSelected = selectedNumber === num;
                    return (
                      <button
                        key={num}
                        onClick={() => handleNumberClick(player.playerId, num)}
                        className={`h-10 rounded-lg font-bold text-sm transition-all ${
                          isSelected
                            ? `${getColorForNumber(num)} text-white ring-2 ring-white/50`
                            : "bg-muted/50 text-white/60 hover:bg-muted hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full h-14 text-lg font-bold bg-tierlist-blue hover:bg-tierlist-blue-dark text-white"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Send className="w-6 h-6 mr-2" />
            Submit Guesses
          </>
        )}
      </Button>
    </div>
  );
}
