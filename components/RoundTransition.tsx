"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface RoundTransitionProps {
  roundNumber: number;
  category: string;
  judgeName: string;
}

export function RoundTransition({
  roundNumber,
  category,
  judgeName,
}: RoundTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Sparkles className="w-16 h-16 mx-auto text-tierlist-blue mb-4" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-black text-white mb-2"
        >
          Round {roundNumber}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-muted-foreground mb-6"
        >
          Category: <span className="text-tierlist-blue font-bold">{category}</span>
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-muted-foreground"
        >
          Judge: <span className="text-tierlist-red font-bold">{judgeName}</span>
        </motion.p>
      </div>
    </motion.div>
  );
}

