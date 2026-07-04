import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateRoundResults(
  players: { id: string; name: string }[],
  secrets: { player_id: string; value: number }[],
  submissions: { player_id: string; text: string }[],
  guesses: { player_id: string; position_guess: number; number_guess: number | null }[]
): {
  results: {
    playerId: string;
    playerName: string;
    secretNumber: number;
    submission: string;
    judgePositionGuess: number;
    judgeNumberGuess: number | null;
    actualPosition: number;
    positionCorrect: boolean;
    numberCorrect: boolean;
    playerPointsEarned: number;
    judgePointsEarned: number;
  }[];
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

  // First pass: calculate individual results and check if ALL positions are correct
  const resultsWithoutOrdering = players.map((player) => {
    const secret = secrets.find((s) => s.player_id === player.id);
    const submission = submissions.find((s) => s.player_id === player.id);
    const guess = guesses.find((g) => g.player_id === player.id);

    const secretNumber = secret?.value ?? 0;
    const actualPosition = actualPositions[player.id] ?? 0;
    const judgePositionGuess = guess?.position_guess ?? 0;
    const judgeNumberGuess = guess?.number_guess ?? null;

    const positionCorrect = judgePositionGuess === actualPosition;
    const numberCorrect = judgeNumberGuess !== null && judgeNumberGuess === secretNumber;

    // Track if any position is wrong
    if (!positionCorrect) {
      allPositionsCorrect = false;
    }

    return {
      playerId: player.id,
      playerName: player.name,
      secretNumber,
      submission: submission?.text ?? "",
      judgePositionGuess,
      judgeNumberGuess,
      actualPosition,
      positionCorrect,
      numberCorrect,
    };
  });

  // Second pass: calculate points with new scoring rules
  const results = resultsWithoutOrdering.map((result) => {
    let playerPointsEarned = 0;
    let judgePointsEarned = 0;

    // Scoring:
    // 1. ALL positions correct → Judge gets +1 total (not per-position)
    //    We'll add this to totalJudgePoints once after the loop

    // 2. Number correct → Both Judge +1 AND Player +1
    if (result.numberCorrect) {
      playerPointsEarned += 1;
      judgePointsEarned += 1;
    }

    totalJudgePoints += judgePointsEarned;

    return {
      ...result,
      playerPointsEarned,
      judgePointsEarned,
    };
  });

  // Add +1 for full correct ordering
  if (allPositionsCorrect && players.length > 0) {
    totalJudgePoints += 1;
  }

  return { results, totalJudgePoints, allPositionsCorrect };
}

