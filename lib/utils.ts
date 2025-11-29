import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateRandomNumber(min: number = 1, max: number = 10): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getNextJudgeIndex(
  currentJudgeIndex: number,
  totalPlayers: number
): number {
  return (currentJudgeIndex + 1) % totalPlayers;
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
} {
  // Sort players by their secret number to get actual positions
  const sortedBySecret = [...secrets].sort((a, b) => a.value - b.value);
  const actualPositions: Record<string, number> = {};
  sortedBySecret.forEach((secret, index) => {
    actualPositions[secret.player_id] = index + 1;
  });

  let totalJudgePoints = 0;

  const results = players.map((player) => {
    const secret = secrets.find((s) => s.player_id === player.id);
    const submission = submissions.find((s) => s.player_id === player.id);
    const guess = guesses.find((g) => g.player_id === player.id);

    const secretNumber = secret?.value ?? 0;
    const actualPosition = actualPositions[player.id] ?? 0;
    const judgePositionGuess = guess?.position_guess ?? 0;
    const judgeNumberGuess = guess?.number_guess ?? null;

    const positionCorrect = judgePositionGuess === actualPosition;
    const numberCorrect = judgeNumberGuess !== null && judgeNumberGuess === secretNumber;

    let playerPointsEarned = 0;
    let judgePointsEarned = 0;

    // Scoring: Players earn points by FOOLING the judge
    // If judge gets position WRONG, player earns 1 point
    if (!positionCorrect) {
      playerPointsEarned += 1;
    } else {
      // Judge gets 1 point for correct position guess
      judgePointsEarned += 1;
    }

    // If judge gets number WRONG or doesn't guess, player earns 1 point
    if (!numberCorrect) {
      playerPointsEarned += 1;
    } else {
      // Judge gets 1 point for correct number guess
      judgePointsEarned += 1;
    }

    totalJudgePoints += judgePointsEarned;

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
      playerPointsEarned,
      judgePointsEarned,
    };
  });

  return { results, totalJudgePoints };
}

