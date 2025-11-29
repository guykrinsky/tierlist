"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Logo size="lg" animated={false} />
      </motion.div>
      <motion.div
        className="mt-8 flex gap-2"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-tierlist-blue"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

