import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RoundResult } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ORDER_BONUS = 3;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// The judge must not be able to tell who submitted what, so submissions are
// shown in an order derived from the round id instead of join order. Stable
// across re-renders and identical for every client.
export function shuffleByKey<T>(items: T[], keyOf: (item: T) => string, seed: string): T[] {
  return [...items].sort((a, b) => hash(seed + keyOf(a)) - hash(seed + keyOf(b)));
}

// Display-side mirror of the scoring applied by the submit_guesses SQL
// function. Keep the rules in sync with supabase/schema.sql:
//   * Every player: bad points = |actual number - judge's guess|, given to the
//     player and to the judge.
//   * Judge got the relative order of every item right: judge -3 bad points
//     (needs at least two scored submissions).
// The judge's stored total is floored at 0 by SQL; this returns the raw round
// delta so the results screen can show how the round was earned.
export function calculateRoundResults(
  players: { id: string; name: string }[],
  secrets: { player_id: string; value: number }[],
  submissions: { player_id: string; text: string }[],
  guesses: { player_id: string; number_guess: number }[]
): {
  results: RoundResult[];
  judgeBadPoints: number;
  orderBonusEarned: boolean;
} {
  let judgeBadPoints = 0;

  const results: RoundResult[] = players.map((player) => {
    const secret = secrets.find((s) => s.player_id === player.id);
    const submission = submissions.find((s) => s.player_id === player.id);
    const guess = guesses.find((g) => g.player_id === player.id);

    const secretNumber = secret?.value ?? 0;
    const numberGuess = guess?.number_guess ?? null;
    const badPoints =
      secret && numberGuess !== null ? Math.abs(secretNumber - numberGuess) : 0;

    if (secret && numberGuess !== null) {
      judgeBadPoints += badPoints;
    }

    return {
      playerId: player.id,
      playerName: player.name,
      secretNumber,
      submission: submission?.text ?? "",
      numberGuess,
      badPoints,
    };
  });

  // Order bonus: no pair may be ranked the wrong way round.
  const scored = results.filter((r) => r.numberGuess !== null && r.secretNumber > 0);
  const orderBonusEarned =
    scored.length >= 2 &&
    scored.every((a) =>
      scored.every(
        (b) => a.secretNumber >= b.secretNumber || a.numberGuess! < b.numberGuess!
      )
    );

  if (orderBonusEarned) {
    judgeBadPoints -= ORDER_BONUS;
  }

  return { results, judgeBadPoints, orderBonusEarned };
}

