"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export function Logo({ size = "md", animated = true }: LogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  };

  const content = (
    <div className={`font-black tracking-tighter ${sizeClasses[size]}`}>
      <span className="text-tierlist-blue">TIER</span>
      <span className="text-tierlist-red">LIST</span>
    </div>
  );

  if (!animated) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`font-black tracking-tighter ${sizeClasses[size]}`}
    >
      <motion.span
        className="text-tierlist-blue inline-block"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        TIER
      </motion.span>
      <motion.span
        className="text-tierlist-red inline-block"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        LIST
      </motion.span>
    </motion.div>
  );
}

