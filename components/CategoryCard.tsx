"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

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
      <Card className="relative overflow-hidden bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark p-1">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-tierlist-blue" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Category
            </span>
            <Sparkles className="w-5 h-5 text-tierlist-blue" />
          </div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isRevealed ? category : "???"}
          </motion.h2>
        </div>
      </Card>
    </motion.div>
  );
}

