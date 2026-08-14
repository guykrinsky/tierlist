// Database types matching Supabase schema
export type RoomStatus = "waiting" | "playing" | "finished" | "category_selection";

export interface Room {
  id: string;
  host_id: string;
  name: string | null;
  status: RoomStatus;
  created_at: string;
  current_round: number;
  /** How many times each player judges before the game ends (1-3). */
  rounds_per_player: number;
  /** humans x rounds_per_player, locked in when the first round starts. */
  total_rounds: number | null;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  /** Lower is better - the player with the fewest bad points wins. */
  bad_points: number;
  is_judge: boolean;
  is_host: boolean;
  is_bot: boolean;
  created_at: string;
}

export interface Round {
  id: string;
  room_id: string;
  judge_id: string;
  category: string;
  is_active: boolean;
  phase: RoundPhase;
  scores_applied: boolean;
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
  /** The judge's guess of this player's secret number (1-10). */
  number_guess: number;
  /** Legacy ordering guess, no longer written. */
  position_guess: number | null;
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
  /** The judge's guess for this player, or null if they were never scored. */
  numberGuess: number | null;
  /** |secretNumber - numberGuess|, given to the player and the judge alike. */
  badPoints: number;
}

export interface CreateRoomResponse {
  room: Room;
  player: Player;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
}

