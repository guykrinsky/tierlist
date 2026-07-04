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

  const currentPhaseRef = useRef<string | null>(null);

  // Subscribe to realtime updates - OPTIMIZED to prevent unnecessary refreshes
  useEffect(() => {
    fetchGameData();

    // Set up realtime subscriptions with smart filtering
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          // Only refetch on status changes, not every update
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus) {
            fetchGameData();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Only refetch on player join/leave, not score updates during game
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            fetchGameData();
          }
          // Score updates will be fetched when round ends
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` },
        (payload) => {
          // Round phase changes are critical - always fetch
          const newPhase = (payload.new as { phase?: string })?.phase;
          if (newPhase && newPhase !== currentPhaseRef.current) {
            currentPhaseRef.current = newPhase;
            fetchGameData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, playerId, fetchGameData, supabase]);

  // Per-round subscriptions, scoped with filters so events from other
  // rooms' rounds can't leak into this game's state.
  const currentRoundId = gameState.currentRound?.id ?? null;

  useEffect(() => {
    if (!currentRoundId) return;

    const channel = supabase
      .channel(`round:${currentRoundId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions", filter: `round_id=eq.${currentRoundId}` },
        (payload) => {
          const newSubmission = payload.new as Submission;
          // If this is MY submission, I already updated locally - skip
          if (newSubmission.player_id === playerId) return;
          setGameState(prev => {
            // Only add if not already present
            const exists = prev.submissions.some(s =>
              s.player_id === newSubmission.player_id
            );
            if (exists) return prev;
            return {
              ...prev,
              submissions: [...prev.submissions, newSubmission]
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guesses", filter: `round_id=eq.${currentRoundId}` },
        () => {
          // Guesses mean round is ending - fetch results
          fetchGameData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "secrets", filter: `round_id=eq.${currentRoundId}` },
        (payload) => {
          // Only fetch secrets for current player, not everyone
          const newSecret = payload.new as { player_id?: string };
          if (newSecret.player_id === playerId) {
            fetchGameData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentRoundId, playerId, fetchGameData, supabase]);

  // Leave room. The RPC reassigns the host, recovers the round if the
  // judge left, and deletes the room when the last player leaves.
  const leaveRoom = useCallback(async () => {
    if (!playerId) return;

    const { error } = await supabase.rpc("leave_room", {
      p_player_id: playerId,
    });

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

      // Optimistically update local state FIRST (no refresh for this player)
      const newSubmission: Submission = {
        id: crypto.randomUUID(),
        round_id: gameState.currentRound.id,
        player_id: playerId,
        text,
        created_at: new Date().toISOString(),
      };
      
      setGameState(prev => ({
        ...prev,
        submissions: [...prev.submissions, newSubmission]
      }));

      const { error } = await supabase.rpc("submit_item", {
        p_round_id: gameState.currentRound.id,
        p_player_id: playerId,
        p_text: text,
      });

      if (error) {
        console.error("Error submitting item:", error);
        // Revert optimistic update on error
        setGameState(prev => ({
          ...prev,
          submissions: prev.submissions.filter(s => s.id !== newSubmission.id)
        }));
        throw error;
      }
      // The submit_item RPC advances the round to 'judging' once all
      // non-judge players have submitted - no client-side check needed.
    },
    [gameState.currentRound, playerId, supabase]
  );

  // Submit judge guesses; the RPC also scores the round and marks the
  // game finished when someone reaches the winning score.
  const submitGuesses = useCallback(
    async (
      guesses: Array<{
        player_id: string;
        position_guess: number;
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
    nextRound,
    prepareNextRound,
    resetGame,
    leaveRoom,
    refetch: fetchGameData,
  };
}

