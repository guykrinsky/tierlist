"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Gavel, EyeOff, Sparkles } from "lucide-react";

interface RulesWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** One example round, used by every slide so the story stays consistent. */
const EXAMPLE = [
  { item: "Lemon", secret: 2, guess: 1 },
  { item: "Apple", secret: 5, guess: 4 },
  { item: "Watermelon", secret: 8, guess: 7 },
];

const YOUR_NUMBER = 5;

function NumberBadge({
  value,
  tone = "blue",
  size = "md",
}: {
  value: ReactNode;
  tone?: "blue" | "hidden" | "yellow" | "green";
  size?: "sm" | "md";
}) {
  const tones = {
    blue: "number-badge text-foreground",
    hidden: "bg-muted/60 text-foreground/40 border border-white/10",
    yellow: "bg-gradient-to-br from-yellow-500 to-yellow-600 text-black",
    green: "bg-gradient-to-br from-green-500 to-green-600 text-foreground",
  };
  const sizes = {
    sm: "w-9 h-9 text-base rounded-lg",
    md: "w-12 h-12 text-xl rounded-xl",
  };
  return (
    <div
      className={`${tones[tone]} ${sizes[size]} flex items-center justify-center font-black shrink-0`}
    >
      {value}
    </div>
  );
}

function PlayerChip({ name, isJudge = false }: { name: string; isJudge?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
        isJudge
          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500 font-semibold"
          : "border-border bg-muted/30 text-foreground/80"
      }`}
    >
      {isJudge && <Gavel className="w-4 h-4" />}
      <span>{name}</span>
    </div>
  );
}

function SlideJudge() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2">
        <PlayerChip name="Maya" isJudge />
        <PlayerChip name="Ori" />
        <PlayerChip name="Dana" />
        <PlayerChip name="You" />
      </div>
      <div className="rounded-2xl border border-tierlist-blue/30 bg-gradient-to-br from-tierlist-blue/20 to-tierlist-blue/5 py-5 px-4 text-center">
        <p className="text-tierlist-blue text-xs font-medium uppercase tracking-wider mb-1">
          This round&apos;s category
        </p>
        <p className="text-2xl font-black text-foreground">Fruits</p>
      </div>
    </div>
  );
}

function SlideSecrets() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3">
        {["Ori", "Dana"].map((name) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <NumberBadge value={<EyeOff className="w-5 h-5" />} tone="hidden" />
            <span className="text-xs text-foreground/50">{name}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ rotateY: 180, scale: 0.8 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <NumberBadge value={YOUR_NUMBER} />
          </motion.div>
          <span className="text-xs text-tierlist-blue font-medium">You</span>
        </div>
      </div>
      <p className="text-center text-xs text-foreground/50">
        Every number 1-10 is used at most once. Maya judges, so she gets none.
      </p>
    </div>
  );
}

function SlideSubmit() {
  return (
    <div className="space-y-2">
      {EXAMPLE.map((row, i) => (
        <motion.div
          key={row.item}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            row.secret === YOUR_NUMBER
              ? "border-tierlist-blue/50 bg-tierlist-blue/10"
              : "border-border bg-muted/30"
          }`}
        >
          <NumberBadge value={row.secret} size="sm" />
          <ArrowRight className="w-4 h-4 text-foreground/30 shrink-0" />
          <span className="text-foreground font-medium">{row.item}</span>
          {row.secret === YOUR_NUMBER && (
            <span className="ml-auto text-xs text-tierlist-blue font-medium">yours</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function SlideGuess() {
  return (
    <div className="space-y-2">
      {EXAMPLE.map((row, i) => (
        <motion.div
          key={row.item}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
        >
          <span className="text-foreground font-medium flex-1">
            &ldquo;{row.item}&rdquo;
          </span>
          <span className="text-xs text-foreground/40">Maya says</span>
          <NumberBadge value={row.guess} tone="yellow" size="sm" />
        </motion.div>
      ))}
      <p className="text-center text-xs text-foreground/50 pt-1">
        No names, no order to read into &mdash; and she can&apos;t reuse a number.
      </p>
    </div>
  );
}

function SlideScoring() {
  const total = EXAMPLE.reduce((sum, r) => sum + Math.abs(r.secret - r.guess), 0);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {EXAMPLE.map((row) => {
          const bad = Math.abs(row.secret - row.guess);
          return (
            <div
              key={row.item}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30 text-sm"
            >
              <span className="text-foreground/80 flex-1 truncate">{row.item}</span>
              <NumberBadge value={row.secret} size="sm" />
              <span className="text-foreground/30 text-xs">vs</span>
              <NumberBadge value={row.guess} tone="yellow" size="sm" />
              <span className="w-16 text-right font-bold text-red-400">+{bad} bad</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-foreground/70">
          <span>Maya collects the same</span>
          <span className="font-bold text-foreground">+{total} bad</span>
        </div>
        <div className="flex justify-between text-green-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Every answer in the right order
          </span>
          <span className="font-bold">&minus;3 bad</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-1.5 text-foreground">
          <span className="font-medium">Maya&apos;s round</span>
          <span className="font-black">{total - 3} bad</span>
        </div>
      </div>

      <p className="text-center text-xs text-foreground/60">
        Once everyone has judged, the{" "}
        <span className="text-yellow-500 font-bold">fewest bad points wins</span>. A total
        never drops below 0.
      </p>
    </div>
  );
}

const SLIDES: Array<{ title: string; caption: string; art: ReactNode }> = [
  {
    title: "One player judges",
    caption: "The Judge rotates every round and announces the category.",
    art: <SlideJudge />,
  },
  {
    title: "Everyone else gets a secret number",
    caption: "1 is the worst of the category, 10 is the best. Nobody sees yours.",
    art: <SlideSecrets />,
  },
  {
    title: "Answer so your number shows",
    caption: "Clear enough to be read, vague enough to be missed by one.",
    art: <SlideSubmit />,
  },
  {
    title: "The Judge guesses the numbers",
    caption: "She sees the answers without names and gives each one a number.",
    art: <SlideGuess />,
  },
  {
    title: "How far off was she?",
    caption: "That gap is bad points - for the answer's owner and for the Judge.",
    art: <SlideScoring />,
  },
];

export function RulesWalkthrough({ open, onOpenChange }: RulesWalkthroughProps) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep(0); // always reopen at the beginning
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Plain <p>: two DialogDescriptions would share one id */}
          <p className="text-sm text-tierlist-blue font-medium">
            Step {step + 1} of {SLIDES.length}
          </p>
          <DialogTitle>{slide.title}</DialogTitle>
          <DialogDescription>{slide.caption}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-2"
          >
            {slide.art}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-tierlist-blue" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {isLast ? (
            <Button
              onClick={() => handleOpenChange(false)}
              className="flex-1 bg-tierlist-blue hover:bg-tierlist-blue-dark"
            >
              Got it
            </Button>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 bg-tierlist-blue hover:bg-tierlist-blue-dark"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
