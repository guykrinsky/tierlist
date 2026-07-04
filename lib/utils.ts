import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RoundResult } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Display-side mirror of the scoring applied by the submit_guesses SQL
// function. Keep the rules in sync with supabase/schema.sql:
//   * Player placed at their exactly-correct position: player +1, judge +1
//   * Judge orders everyone correctly: judge +2 bonus
export function calculateRoundResults(
  players: { id: string; name: string }[],
  secrets: { player_id: string; value: number }[],
  submissions: { player_id: string; text: string }[],
  guesses: { player_id: string; position_guess: number }[]
): {
  results: RoundResult[];
  totalJudgePoints: number;
  allPositionsCorrect: boolean;
} {
  // Sort players by their secret number to get actual positions
  const sortedBySecret = [...secrets].sort((a, b) => a.value - b.value);
  const actualPositions: Record<string, number> = {};
  sortedBySecret.forEach((secret, index) => {
    actualPositions[secret.player_id] = index + 1;
  });

  let totalJudgePoints = 0;
  let allPositionsCorrect = true;

  const results = players.map((player) => {
    const secret = secrets.find((s) => s.player_id === player.id);
    const submission = submissions.find((s) => s.player_id === player.id);
    const guess = guesses.find((g) => g.player_id === player.id);

    const secretNumber = secret?.value ?? 0;
    const actualPosition = actualPositions[player.id] ?? 0;
    const judgePositionGuess = guess?.position_guess ?? 0;

    const positionCorrect = judgePositionGuess === actualPosition;
    if (!positionCorrect) {
      allPositionsCorrect = false;
    }

    const playerPointsEarned = positionCorrect ? 1 : 0;
    const judgePointsEarned = positionCorrect ? 1 : 0;
    totalJudgePoints += judgePointsEarned;

    return {
      playerId: player.id,
      playerName: player.name,
      secretNumber,
      submission: submission?.text ?? "",
      judgePositionGuess,
      actualPosition,
      positionCorrect,
      playerPointsEarned,
      judgePointsEarned,
    };
  });

  // Perfect ordering bonus
  if (allPositionsCorrect && players.length > 0) {
    totalJudgePoints += 2;
  }

  return { results, totalJudgePoints, allPositionsCorrect };
}

