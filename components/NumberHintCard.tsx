"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface NumberHintCardProps {
  number: number;
  category: string;
}

export function NumberHintCard({ number, category }: NumberHintCardProps) {
  const [isHidden, setIsHidden] = useState(false);

  const getHintText = (num: number): string => {
    if (num <= 2) return "Very Low (Bottom tier)";
    if (num <= 4) return "Low";
    if (num <= 6) return "Middle";
    if (num <= 8) return "High";
    return "Very High (Top tier)";
  };

  const getGradient = (num: number): string => {
    if (num <= 2) return "from-red-600 to-red-800";
    if (num <= 4) return "from-orange-500 to-orange-700";
    if (num <= 6) return "from-yellow-500 to-yellow-700";
    if (num <= 8) return "from-green-500 to-green-700";
    return "from-tierlist-blue to-tierlist-blue-dark";
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", delay: 0.2 }}
    >
      <Card className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(number)} opacity-20`} />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Your Secret Number
            </span>
            <button
              onClick={() => setIsHidden(!isHidden)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isHidden ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-center mb-4">
            <motion.div
              className={`number-badge w-24 h-24 rounded-full flex items-center justify-center ${
                isHidden ? "bg-muted" : ""
              }`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-5xl font-black text-white">
                {isHidden ? "?" : number}
              </span>
            </motion.div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-white">
              {isHidden ? "Hidden" : getHintText(number)}
            </p>
            <p className="text-sm text-muted-foreground">
              Pick a <span className="text-tierlist-blue font-medium">{category}</span> that matches this ranking!
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

