"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/Timer";
import { Send, CheckCircle2, Loader2 } from "lucide-react";

interface PlayerSpeechInputProps {
  category: string;
  onSubmit: (text: string) => Promise<void>;
  isSubmitted?: boolean;
  submittedText?: string;
  timerDuration?: number; // in seconds, default 60
  roundId?: string; // Used to reset timer only when round changes
}

export function PlayerSpeechInput({
  category,
  onSubmit,
  isSubmitted = false,
  submittedText,
  timerDuration = 60, // 60 seconds default
  roundId = "default",
}: PlayerSpeechInputProps) {
  const [text, setText] = useState(submittedText || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    // Auto-submit if they have text, otherwise submit "No answer"
    if (text.trim()) {
      handleSubmit();
    } else {
      onSubmit("(Time's up - no answer)");
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <Card className="p-6 border-green-500/50 bg-green-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Your answer:</p>
              <p className="text-xl font-bold text-white">{submittedText}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Waiting for other players...
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Enter a <span className="text-tierlist-blue">{category}</span> that matches your number
            </label>
            <Timer 
              duration={timerDuration} 
              onTimeUp={handleTimeUp}
              isActive={!isSubmitting}
              resetKey={roundId}
            />
          </div>

          <div className="flex gap-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Enter your ${category.toLowerCase()}...`}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={isSubmitting}
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
              className="px-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Tip: Pick something that hints at your number without being too obvious!
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

