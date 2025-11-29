"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  isActive?: boolean;
  showWarning?: boolean; // show warning color when time is low
}

export function Timer({ 
  duration, 
  onTimeUp, 
  isActive = true,
  showWarning = true 
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  const resetTimer = useCallback(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    resetTimer();
  }, [duration, resetTimer]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 10 && showWarning;
  const isCriticalTime = timeLeft <= 5 && showWarning;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative flex items-center gap-3 px-4 py-2 rounded-full border ${
        isCriticalTime
          ? "border-red-500 bg-red-500/20"
          : isLowTime
          ? "border-yellow-500 bg-yellow-500/20"
          : "border-tierlist-blue/50 bg-tierlist-blue/10"
      }`}
    >
      <motion.div
        animate={isCriticalTime ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.5, repeat: isCriticalTime ? Infinity : 0 }}
      >
        <Clock className={`w-5 h-5 ${
          isCriticalTime
            ? "text-red-500"
            : isLowTime
            ? "text-yellow-500"
            : "text-tierlist-blue"
        }`} />
      </motion.div>
      
      <div className="flex flex-col">
        <span className={`text-lg font-mono font-bold ${
          isCriticalTime
            ? "text-red-500"
            : isLowTime
            ? "text-yellow-500"
            : "text-white"
        }`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        
        {/* Progress bar */}
        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              isCriticalTime
                ? "bg-red-500"
                : isLowTime
                ? "bg-yellow-500"
                : "bg-tierlist-blue"
            }`}
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

