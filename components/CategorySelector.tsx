"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, RefreshCw, Loader2 } from "lucide-react";
import { getRandomCategories } from "@/data/categories";

interface CategorySelectorProps {
  onSelectCategory: (category: string) => Promise<void>;
  isJudge: boolean;
  judgeName: string;
}

export function CategorySelector({
  onSelectCategory,
  isJudge,
  judgeName,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isJoker, setIsJoker] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCategories(getRandomCategories(3));
  }, []);

  const refreshCategories = () => {
    setCategories(getRandomCategories(3));
    setSelectedCategory(null);
    setIsJoker(false);
  };

  const handleSubmit = async () => {
    const categoryToSubmit = isJoker ? customCategory : selectedCategory;
    if (!categoryToSubmit) return;

    setIsSubmitting(true);
    try {
      await onSelectCategory(categoryToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isJudge) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-yellow-500 mb-3 sm:mb-4" />
          </motion.div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Category Selection
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            <span className="text-tierlist-blue font-medium">{judgeName}</span> is choosing...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            Choose a Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pick a category or use Joker!
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshCategories}
              className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          <div className="grid gap-2 sm:gap-3">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setSelectedCategory(category);
                  setIsJoker(false);
                }}
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all ${
                  selectedCategory === category && !isJoker
                    ? "border-tierlist-blue bg-tierlist-blue/20"
                    : "border-border hover:border-tierlist-blue/50 hover:bg-muted/30 active:bg-muted/50"
                }`}
              >
                <p className="font-medium text-white text-sm sm:text-base">{category}</p>
              </motion.button>
            ))}

            {/* Joker Option */}
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                setIsJoker(true);
                setSelectedCategory(null);
              }}
              className={`p-3 sm:p-4 rounded-lg border text-left transition-all ${
                isJoker
                  ? "border-yellow-500 bg-yellow-500/20"
                  : "border-border hover:border-yellow-500/50 hover:bg-muted/30 active:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-bold text-yellow-500 text-sm sm:text-base">JOKER</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Create your own!
                  </p>
                </div>
              </div>
            </motion.button>
          </div>

          {isJoker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
            >
              <Input
                placeholder="Enter your custom category..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-3 sm:mt-4"
                autoFocus
              />
            </motion.div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (!selectedCategory && !isJoker) ||
              (isJoker && !customCategory.trim())
            }
            className="w-full mt-3 sm:mt-4"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="hidden sm:inline">Start Round with This Category</span>
                <span className="sm:hidden">Start Round</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

