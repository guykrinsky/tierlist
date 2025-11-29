"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRandomCategory } from "@/data/categories";
import type {
  Room,
  Player,
  Round,
  Secret,
  Submission,
  Guess,
  GameState,
  RoundPhase,
} from "@/types";

// Debounce helper
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useGameState(roomId: string, playerId: string | null) {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    players: [],
    currentRound: null,
    secrets: [],
    submissions: [],
    guesses: [],
    currentPlayer: null,
    isJudge: false,
    mySecret: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch initial data
  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch room
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;

      // Fetch players
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (playersError) throw playersError;

      // Find current player
      const currentPlayer = players?.find((p) => p.id === playerId) || null;

      // Fetch active round
      const { data: rounds, error: roundsError } = await supabase
        .from("rounds")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_active", true)
        .limit(1);

      if (roundsError) throw roundsError;

      const currentRound = rounds?.[0] || null;

      let secrets: Secret[] = [];
      let submissions: Submission[] = [];
      let guesses: Guess[] = [];
      let mySecret: number | null = null;

      if (currentRound) {
        // Fetch secrets (only for non-judge or during results)
        const isJudge = currentRound.judge_id === playerId;

        if (!isJudge || currentRound.phase === "results") {
          const { data: secretsData } = await supabase
            .from("secrets")
            .select("*")
            .eq("round_id", currentRound.id);

          secrets = secretsData || [];

          // Get current player's secret
          if (playerId) {
            const playerSecret = secrets.find((s) => s.player_id === playerId);
            mySecret = playerSecret?.value || null;
          }
        } else if (isJudge && playerId) {
          // Judge can only see their own non-existent secret
          mySecret = null;
        }

        // Fetch submissions
        const { data: submissionsData } = await supabase
          .from("submissions")
          .select("*")
          .eq("round_id", currentRound.id);

        submissions = submissionsData || [];

        // Fetch guesses
        const { data: guessesData } = await supabase
          .from("guesses")
          .select("*")
          .eq("round_id", currentRound.id);

        guesses = guessesData || [];
      }

      setGameState({
        room: room as Room,
        players: players as Player[],
        currentRound: currentRound as Round | null,
        secrets,
        submissions,
        guesses,
        currentPlayer: currentPlayer as Player | null,
        isJudge: currentRound?.judge_id === playerId,
        mySecret,
      });
    } catch (err) {
      console.error("Error fetching game data:", err);
      setError("Failed to load game data");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, playerId, supabase]);

  // Keep track of debounced fetch
  const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchGameData();

    // Create a debounced version of fetchGameData (300ms delay)
    // This prevents multiple rapid fetches when several changes happen at once
    const debouncedFetch = debounce(() => {
      fetchGameData();
    }, 300);
    debouncedFetchRef.current = debouncedFetch;

    // Set up realtime subscriptions - only fetch on important phase changes
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` },
        // Round changes are important - fetch immediately for phase transitions
        () => fetchGameData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        // Submissions should NOT trigger re-fetch for non-judges during submitting phase
        // to avoid disruption - use debounce
        () => debouncedFetch()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guesses" },
        // Guesses trigger results - fetch immediately
        () => fetchGameData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "secrets" },
        // Secrets are set at round start - debounce is fine
        () => debouncedFetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId, fetchGameData, supabase]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!playerId) return;

    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) {
      console.error("Error leaving room:", error);
      throw error;
    }

    // Clear local storage
    localStorage.removeItem(`tierlist_player_${roomId}`);
  }, [playerId, roomId, supabase]);

  // Start the game (for host in waiting room - goes to category selection)
  const startGame = useCallback(async (category: string) => {
    const { error } = await supabase.rpc("start_round", {
      p_room_id: roomId,
      p_category: category,
    });

    if (error) {
      console.error("Error starting game:", error);
      throw error;
    }
  }, [roomId, supabase]);

  // Submit an item (for non-judge players)
  const submitItem = useCallback(
    async (text: string) => {
      if (!gameState.currentRound || !playerId) return;

      const { error } = await supabase.rpc("submit_item", {
        p_round_id: gameState.currentRound.id,
        p_player_id: playerId,
        p_text: text,
      });

      if (error) {
        console.error("Error submitting item:", error);
        throw error;
      }

      // Check if all players have submitted
      const nonJudgePlayers = gameState.players.filter(
        (p) => p.id !== gameState.currentRound?.judge_id
      );
      const submissionCount = gameState.submissions.length + 1;

      if (submissionCount >= nonJudgePlayers.length) {
        // Move to judging phase
        await supabase
          .from("rounds")
          .update({ phase: "judging" })
          .eq("id", gameState.currentRound.id);
      }
    },
    [gameState, playerId, supabase]
  );

  // Submit judge guesses
  const submitGuesses = useCallback(
    async (
      guesses: Array<{
        player_id: string;
        position_guess: number;
        number_guess: number | null;
      }>
    ) => {
      if (!gameState.currentRound || !playerId) return;

      const { error } = await supabase.rpc("submit_guesses", {
        p_round_id: gameState.currentRound.id,
        p_judge_id: playerId,
        p_guesses: guesses,
      });

      if (error) {
        console.error("Error submitting guesses:", error);
        throw error;
      }
    },
    [gameState.currentRound, playerId, supabase]
  );

  // Calculate and apply round results
  const calculateResults = useCallback(async () => {
    if (!gameState.currentRound) return;

    const { error } = await supabase.rpc("calculate_round_results", {
      p_round_id: gameState.currentRound.id,
    });

    if (error) {
      console.error("Error calculating results:", error);
      throw error;
    }
  }, [gameState.currentRound, supabase]);

  // Start next round with category
  const nextRound = useCallback(async (category: string) => {
    const { error } = await supabase.rpc("start_round", {
      p_room_id: roomId,
      p_category: category,
    });

    if (error) {
      console.error("Error starting next round:", error);
      throw error;
    }
  }, [roomId, supabase]);

  // Prepare for category selection (set room to category_selection phase)
  const prepareNextRound = useCallback(async () => {
    // Deactivate current round and set room to category selection
    if (gameState.currentRound) {
      await supabase
        .from("rounds")
        .update({ is_active: false, phase: "finished" })
        .eq("id", gameState.currentRound.id);
    }
    
    // Update room to show we're selecting category
    await supabase
      .from("rooms")
      .update({ status: "category_selection" })
      .eq("id", roomId);
  }, [roomId, gameState.currentRound, supabase]);

  // Check for winner
  const checkWinner = useCallback(async () => {
    const { data, error } = await supabase.rpc("check_winner", {
      p_room_id: roomId,
    });

    if (error) {
      console.error("Error checking winner:", error);
      return null;
    }

    return data as Player | null;
  }, [roomId, supabase]);

  // Reset game for new round
  const resetGame = useCallback(async () => {
    // Reset all player scores and start fresh
    await supabase
      .from("players")
      .update({ score: 0, is_judge: false })
      .eq("room_id", roomId);

    await supabase
      .from("rooms")
      .update({ status: "waiting", current_round: 0 })
      .eq("id", roomId);
  }, [roomId, supabase]);

  return {
    ...gameState,
    isLoading,
    error,
    startGame,
    submitItem,
    submitGuesses,
    calculateResults,
    nextRound,
    prepareNextRound,
    checkWinner,
    resetGame,
    leaveRoom,
    refetch: fetchGameData,
  };
}

