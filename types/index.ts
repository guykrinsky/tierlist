// Database types matching Supabase schema
export type RoomStatus = "waiting" | "playing" | "finished" | "category_selection";

export interface Room {
  id: string;
  host_id: string;
  name: string | null;
  status: RoomStatus;
  created_at: string;
  winning_score: number;
  current_round: number;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  score: number;
  is_judge: boolean;
  is_host: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  room_id: string;
  judge_id: string;
  category: string;
  is_active: boolean;
  phase: RoundPhase;
  created_at: string;
}

export type RoundPhase = 
  | "waiting"        // Waiting for round to start
  | "submitting"     // Players submitting their items
  | "judging"        // Judge ordering and guessing
  | "results"        // Showing results
  | "finished";      // Round complete

export interface Secret {
  id: string;
  round_id: string;
  player_id: string;
  value: number; // 1-10
}

export interface Submission {
  id: string;
  round_id: string;
  player_id: string;
  text: string;
  created_at: string;
}

export interface Guess {
  id: string;
  round_id: string;
  judge_id: string;
  player_id: string;
  position_guess: number;
  number_guess: number | null;
}

// Extended types for UI
export interface PlayerWithSecret extends Player {
  secret?: Secret;
  submission?: Submission;
}

export interface RoundWithData extends Round {
  secrets: Secret[];
  submissions: Submission[];
  guesses: Guess[];
}

export interface GameState {
  room: Room | null;
  players: Player[];
  currentRound: Round | null;
  secrets: Secret[];
  submissions: Submission[];
  guesses: Guess[];
  currentPlayer: Player | null;
  isJudge: boolean;
  mySecret: number | null;
}

export interface RoundResult {
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
}

export interface CreateRoomResponse {
  room: Room;
  player: Player;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
}

