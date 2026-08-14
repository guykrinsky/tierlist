"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Target, MessageSquare } from "lucide-react";

export interface AnonymousSubmission {
  playerId: string;
  submission: string;
}

interface JudgeNumberGuessInterfaceProps {
  submissions: AnonymousSubmission[];
  onSubmitGuesses: (
    guesses: Array<{ playerId: string; numberGuess: number }>
  ) => Promise<void>;
  isSubmitting: boolean;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function JudgeNumberGuessInterface({
  submissions,
  onSubmitGuesses,
  isSubmitting,
}: JudgeNumberGuessInterfaceProps) {
  // playerId -> guessed number. Submissions stay anonymous: the id is only
  // ever used as a key, never rendered.
  const [guesses, setGuesses] = useState<Record<string, number>>({});

  const takenBy = (num: number) =>
    Object.entries(guesses).find(([, value]) => value === num)?.[0];

  const setGuess = (playerId: string, num: number) => {
    setGuesses((prev) => {
      const next: Record<string, number> = {};
      for (const [id, value] of Object.entries(prev)) {
        // A number can only be used once, so taking it frees the card that had it
        if (id !== playerId && value !== num) next[id] = value;
      }
      // Tapping the number a card already has clears it
      if (prev[playerId] !== num) next[playerId] = num;
      return next;
    });
  };

  const remaining = submissions.filter((s) => guesses[s.playerId] === undefined).length;
  const canSubmit = remaining === 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmitGuesses(
      submissions.map((s) => ({ playerId: s.playerId, numberGuess: guesses[s.playerId] }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-3">
          <Target className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-yellow-500">GUESS THE NUMBERS</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Give every answer the number you think it is
        </h2>
        <p className="text-foreground/60 mt-2">
          1 = worst &bull; 10 = best &bull; each number can only be used once
        </p>
      </div>

      {/* Answer Cards */}
      <div className="space-y-3">
        {submissions.map((item, index) => (
          <motion.div
            key={item.playerId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="p-4 bg-card border-border">
              {/* Answer - anonymous, no player name */}
              <div className="bg-muted/30 rounded-lg p-4 border border-white/10 mb-3">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-tierlist-blue mt-0.5 flex-shrink-0" />
                  <p className="text-lg font-medium text-foreground leading-relaxed flex-1">
                    &ldquo;{item.submission}&rdquo;
                  </p>
                </div>
              </div>

              {/* Number picker */}
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {NUMBERS.map((num) => {
                  const owner = takenBy(num);
                  const isMine = owner === item.playerId;
                  const isTaken = owner !== undefined && !isMine;
                  return (
                    <button
                      key={num}
                      onClick={() => setGuess(item.playerId, num)}
                      disabled={isTaken || isSubmitting}
                      className={`h-11 rounded-lg font-bold transition-all ${
                        isMine
                          ? "bg-tierlist-blue text-foreground"
                          : isTaken
                          ? "bg-muted/20 text-foreground/20 cursor-not-allowed"
                          : "bg-muted/40 text-foreground/70 hover:bg-muted/70 active:bg-muted"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-14 text-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-black"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Scoring the round...
          </>
        ) : remaining > 0 ? (
          <>
            {remaining} answer{remaining === 1 ? "" : "s"} still need a number
          </>
        ) : (
          <>
            <Send className="w-6 h-6 mr-2" />
            Lock In Guesses
          </>
        )}
      </Button>
    </div>
  );
}
