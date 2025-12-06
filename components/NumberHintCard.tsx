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
    if (num <= 2) return "Bottom Tier";
    if (num <= 4) return "Low";
    if (num <= 6) return "Middle";
    if (num <= 8) return "High";
    return "Top Tier";
  };

  const getColor = (num: number): string => {
    if (num <= 2) return "from-red-500 to-red-600";
    if (num <= 4) return "from-orange-500 to-orange-600";
    if (num <= 6) return "from-yellow-500 to-yellow-600";
    if (num <= 8) return "from-green-500 to-green-600";
    return "from-tierlist-blue to-tierlist-blue-dark";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring" }}
    >
      <Card className="p-6 bg-card border-border text-center">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/50 text-sm uppercase tracking-wide">
            Your Secret Number
          </span>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <motion.div
          className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${
            isHidden ? "from-gray-600 to-gray-700" : getColor(number)
          } flex items-center justify-center shadow-lg mb-4`}
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-5xl font-black text-white">
            {isHidden ? "?" : number}
          </span>
        </motion.div>

        <p className="text-white font-semibold text-lg mb-1">
          {isHidden ? "Hidden" : getHintText(number)}
        </p>
        <p className="text-white/50 text-sm">
          Pick a <span className="text-tierlist-blue">{category}</span> that matches!
        </p>
      </Card>
    </motion.div>
  );
}
