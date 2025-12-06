"use client";

import { motion } from "framer-motion";

interface CategoryCardProps {
  category: string;
  size?: "sm" | "lg";
}

export function CategoryCard({ category, size = "lg" }: CategoryCardProps) {
  const isLarge = size === "lg";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
      className={`text-center rounded-2xl bg-gradient-to-br from-tierlist-blue/20 to-tierlist-blue/5 border border-tierlist-blue/30 ${
        isLarge ? "py-8 px-6" : "py-4 px-4"
      }`}
    >
      <p className={`text-tierlist-blue font-medium uppercase tracking-wider mb-2 ${
        isLarge ? "text-sm" : "text-xs"
      }`}>
        Category
      </p>
      <h2 className={`font-black text-white ${
        isLarge ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"
      }`}>
        {category}
      </h2>
    </motion.div>
  );
}
