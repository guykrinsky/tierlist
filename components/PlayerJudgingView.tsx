"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MessageSquare, Target } from "lucide-react";

interface PlayerJudgingViewProps {
  /** Anonymous submission texts, already shuffled for display. */
  submissionTexts: string[];
  mySecret: number | null;
  judgeName: string;
}

export function PlayerJudgingView({
  submissionTexts,
  mySecret,
  judgeName,
}: PlayerJudgingViewProps) {
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Target className="w-6 h-6 text-yellow-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-white font-semibold">
              <span className="text-yellow-500">{judgeName}</span> is guessing the numbers...
            </p>
            <p className="text-white/60 text-sm mt-1">
              Everyone&apos;s numbers stay secret until the results
            </p>
          </div>
        </div>
      </Card>

      {/* Your own number, as a reminder */}
      {mySecret !== null && (
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-center gap-3">
            <span className="text-white/50 text-sm uppercase tracking-wide">
              Your number
            </span>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tierlist-blue to-tierlist-blue-dark flex items-center justify-center">
              <span className="text-2xl font-black text-white">{mySecret}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Everyone's answers, anonymous and unordered */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-tierlist-blue" />
          <h3 className="text-lg font-bold text-white">
            The Answers ({submissionTexts.length})
          </h3>
        </div>
        <p className="text-white/60 text-sm mb-4">
          The same list {judgeName} is looking at &mdash; no names, no numbers.
        </p>

        <div className="space-y-3">
          {submissionTexts.map((text, index) => (
            <motion.div
              key={`${index}-${text}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl bg-muted/30 border border-white/10"
            >
              <p className="text-white/90 leading-relaxed">&ldquo;{text}&rdquo;</p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
