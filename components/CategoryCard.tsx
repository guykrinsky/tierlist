"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles, Tag } from "lucide-react";

interface CategoryCardProps {
  category: string;
  isRevealed?: boolean;
}

export function CategoryCard({ category, isRevealed = true }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, rotateY: 180 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        rotateY: isRevealed ? 0 : 180 
      }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-tierlist-blue via-tierlist-blue-dark to-tierlist-blue p-1 shadow-lg shadow-tierlist-blue/20">
        {/* Animated shine effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        <div className="relative bg-card/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-tierlist-blue-light" />
            </motion.div>
            <span className="text-xs sm:text-sm font-medium text-tierlist-blue-light uppercase tracking-wider">
              This Round&apos;s Category
            </span>
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-tierlist-blue-light" />
            </motion.div>
          </div>
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isRevealed ? category : "???"}
          </motion.h2>
        </div>
      </Card>
    </motion.div>
  );
}

