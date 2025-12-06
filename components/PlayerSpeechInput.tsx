"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/Timer";
import { Send, Loader2 } from "lucide-react";

interface PlayerSpeechInputProps {
  category: string;
  onSubmit: (text: string) => Promise<void>;
  isSubmitted?: boolean;
  submittedText?: string;
  timerDuration?: number;
  roundId?: string;
}

export function PlayerSpeechInput({
  category,
  onSubmit,
  isSubmitted = false,
  submittedText,
  timerDuration = 60,
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
    if (text.trim()) {
      handleSubmit();
    } else {
      onSubmit("(Time's up)");
    }
  };

  if (isSubmitted) {
    return null; // Handled in parent
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Your Answer</h3>
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
            placeholder={`Enter a ${category.toLowerCase()}...`}
            className="flex-1 h-12 bg-muted/30 border-border text-white placeholder:text-white/40"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isSubmitting}
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="h-12 px-6 bg-tierlist-blue hover:bg-tierlist-blue-dark text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-white/40 text-xs mt-3">
          💡 Pick something that hints at your number!
        </p>
      </Card>
    </motion.div>
  );
}
