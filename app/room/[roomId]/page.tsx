"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import { WaitingRoom } from "@/components/WaitingRoom";
import { CategoryCard } from "@/components/CategoryCard";
import { CategorySelector } from "@/components/CategorySelector";
import { NumberHintCard } from "@/components/NumberHintCard";
import { PlayerSpeechInput } from "@/components/PlayerSpeechInput";
import { JudgeNumberGuessInputs } from "@/components/JudgeNumberGuessInputs";
import { AutomaticOrderingView } from "@/components/AutomaticOrderingView";
import { ResultScreen } from "@/components/ResultScreen";
import { Scoreboard } from "@/components/Scoreboard";
import { GameOver } from "@/components/GameOver";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel, Users, Clock, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { calculateRoundResults } from "@/lib/utils";

interface PlayerGuess {
  playerId: string;
  playerName: string;
  submission: string;
  numberGuess: number | null;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { playerId } = useLocalPlayer(roomId);

  const {
    room,
    players,
    currentRound,
    secrets,
    submissions,
    guesses,
    currentPlayer,
    isJudge,
    mySecret,
    isLoading,
    error,
    startGame,
    submitItem,
    submitGuesses,
    calculateResults,
    nextRound,
    prepareNextRound,
    resetGame,
    leaveRoom,
  } = useGameState(roomId, playerId);

  // Calculate who is the next judge based on room state
  const getNextJudgeName = () => {
    const sortedPlayers = [...players].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const currentRoundNum = room?.current_round || 0;
    // For category selection before first round, it's player 0
    // For between rounds, it's currentRoundNum % count
    const nextJudgeIndex = currentRoundNum % sortedPlayers.length;
    return sortedPlayers[nextJudgeIndex]?.name || "";
  };

  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);
  const [isSubmittingGuesses, setIsSubmittingGuesses] = useState(false);

  // Initialize player guesses when submissions come in
  useEffect(() => {
    if (currentRound?.phase === "judging" && submissions.length > 0) {
      const nonJudgePlayers = players.filter(
        (p) => p.id !== currentRound.judge_id
      );
      const initialGuesses = nonJudgePlayers.map((player) => {
        const submission = submissions.find((s) => s.player_id === player.id);
        return {
          playerId: player.id,
          playerName: player.name,
          submission: submission?.text || "",
          numberGuess: null,
        };
      });
      setPlayerGuesses(initialGuesses);
    }
  }, [currentRound?.phase, submissions, players, currentRound?.judge_id]);

  // Redirect if no player data
  useEffect(() => {
    if (!isLoading && !playerId) {
      router.push(`/join?room=${roomId}`);
    }
  }, [isLoading, playerId, roomId, router]);

  // Check for winner
  useEffect(() => {
    if (room?.status === "finished") {
      // Game is over
    }
  }, [room?.status]);

  const handleStartGame = async () => {
    // Update room status to category_selection - all players will see this
    try {
      await prepareNextRound();
    } catch {
      toast({
        title: "Error",
        description: "Failed to start category selection",
        variant: "destructive",
      });
    }
  };

  const handleCategorySelect = async (category: string) => {
    try {
      await startGame(category);
      toast({
        title: "Round Started!",
        description: "Let the fun begin!",
        variant: "default",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      router.push("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  const handleSubmitItem = async (text: string) => {
    try {
      await submitItem(text);
      toast({
        title: "Submitted!",
        description: "Your answer has been submitted",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive",
      });
    }
  };

  const handleGuessChange = (playerId: string, numberGuess: number | null) => {
    setPlayerGuesses((prev) =>
      prev.map((p) =>
        p.playerId === playerId ? { ...p, numberGuess } : p
      )
    );
  };

  const handleSubmitGuesses = async () => {
    setIsSubmittingGuesses(true);
    try {
      // Calculate positions based on number guesses
      // Sort by guessed number (null guesses go to end), then assign positions
      const sortedByGuess = [...playerGuesses].sort((a, b) => {
        if (a.numberGuess === null && b.numberGuess === null) return 0;
        if (a.numberGuess === null) return 1;
        if (b.numberGuess === null) return -1;
        return a.numberGuess - b.numberGuess;
      });

      const guessesData = playerGuesses.map((p) => {
        // Find position based on where this player is in the sorted list
        const position = sortedByGuess.findIndex(sp => sp.playerId === p.playerId) + 1;
        return {
          player_id: p.playerId,
          position_guess: position,
          number_guess: p.numberGuess,
        };
      });

      await submitGuesses(guessesData);
      
      // Calculate results and update scores
      await calculateResults();
      
      toast({
        title: "Guesses Submitted!",
        description: "Results are in!",
      });
    } catch (err) {
      console.error("Error submitting guesses:", err);
      toast({
        title: "Error",
        description: "Failed to submit guesses",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingGuesses(false);
    }
  };

  const handleNextRound = async () => {
    // Check if someone won
    const winner = players.find((p) => p.score >= (room?.winning_score || 10));
    if (winner) {
      toast({
        title: "🎉 We have a winner!",
        description: `${winner.name} wins the game!`,
      });
      return;
    }

    // Update room status to category_selection - all players will see this
    try {
      await prepareNextRound();
    } catch {
      toast({
        title: "Error",
        description: "Failed to prepare next round",
        variant: "destructive",
      });
    }
  };

  const handleNextRoundWithCategory = async (category: string) => {
    try {
      await nextRound(category);
      toast({
        title: "Next Round!",
        description: "Get ready for a new category",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to start next round",
        variant: "destructive",
      });
    }
  };

  const handlePlayAgain = async () => {
    try {
      await resetGame();
      toast({
        title: "Game Reset!",
        description: "Starting a new game",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to reset game",
        variant: "destructive",
      });
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-tierlist-blue mx-auto mb-4" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Room Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This room doesn't exist or has been closed.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    );
  }

  // Game Over
  if (room.status === "finished" || players.some((p) => p.score >= room.winning_score)) {
    return (
      <GameOver
        players={players}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
        isHost={currentPlayer?.is_host || false}
      />
    );
  }

  // Waiting Room
  if (room.status === "waiting" && currentPlayer) {
    return (
      <WaitingRoom
        room={room}
        players={players}
        currentPlayer={currentPlayer}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // Category Selection (before game starts or between rounds)
  // This is synced via database - all players see this!
  if (room.status === "category_selection" && currentPlayer) {
    const nextJudgeName = getNextJudgeName();
    const isNextJudge = currentPlayer.name === nextJudgeName;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-6"
        >
          <div className="text-center">
            <Logo size="lg" />
            <p className="mt-2 text-muted-foreground">
              {nextJudgeName ? `${nextJudgeName}'s turn to be Judge!` : "Category Selection"}
            </p>
          </div>
          
          <CategorySelector
            onSelectCategory={room.current_round === 0 ? handleCategorySelect : handleNextRoundWithCategory}
            isJudge={isNextJudge}
            judgeName={nextJudgeName || "Judge"}
          />
        </motion.div>
      </div>
    );
  }

  // Game in progress
  const judge = players.find((p) => p.is_judge);
  const mySubmission = submissions.find((s) => s.player_id === playerId);
  const nonJudgePlayers = players.filter((p) => !p.is_judge);
  const allSubmitted = submissions.length >= nonJudgePlayers.length;

  // Calculate results for result screen
  const getResults = () => {
    if (!currentRound || guesses.length === 0) return null;

    const nonJudgePlayersForResults = players.filter(
      (p) => p.id !== currentRound.judge_id
    );

    const { results, totalJudgePoints, allPositionsCorrect } = calculateRoundResults(
      nonJudgePlayersForResults,
      secrets,
      submissions,
      guesses
    );

    return { results, totalJudgePoints, allPositionsCorrect };
  };

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Logo size="sm" animated={false} />
            {currentPlayer && (
              <div className="hidden md:block">
                <span className="text-xs text-muted-foreground">Playing as</span>
                <p className="text-sm font-bold text-white">{currentPlayer.name}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Show name on mobile/tablet */}
            {currentPlayer && (
              <span className="md:hidden text-xs sm:text-sm font-medium text-white truncate max-w-[80px] sm:max-w-none">
                {currentPlayer.name}
              </span>
            )}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{players.length}</span>
            </div>
            <div className="text-xs sm:text-sm font-medium text-tierlist-blue truncate max-w-[60px] sm:max-w-none">
              {room.name || room.id}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:px-3"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Category Card */}
              {currentRound && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CategoryCard category={currentRound.category} />
                </motion.div>
              )}

              {/* Judge Banner */}
              {currentRound && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className={`game-card p-4 ${isJudge ? "game-card-blue" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`icon-container w-10 h-10 ${isJudge ? "icon-container-yellow" : "icon-container-blue"}`}>
                          <Gavel className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Current Judge
                          </p>
                          <p className="font-bold text-white">
                            {judge?.name}
                            {isJudge && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
                                YOU
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Phase</p>
                        <p className="text-sm font-medium text-tierlist-blue capitalize">
                          {currentRound.phase}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Phase: Submitting - Non-Judge View */}
              {currentRound?.phase === "submitting" && !isJudge && (
                <>
                  {mySecret && (
                    <NumberHintCard
                      number={mySecret}
                      category={currentRound.category}
                    />
                  )}
                  <PlayerSpeechInput
                    category={currentRound.category}
                    onSubmit={handleSubmitItem}
                    isSubmitted={!!mySubmission}
                    submittedText={mySubmission?.text}
                    roundId={currentRound.id}
                  />
                  
                  {/* Show live ordering after player has submitted */}
                  {mySubmission && submissions.length > 0 && (
                    <div className="mt-4">
                      <AutomaticOrderingView
                        submissions={submissions}
                        secrets={secrets}
                        players={players}
                        myPlayerId={currentPlayer?.id || ""}
                        mySecret={mySecret}
                        isLive={true}
                        totalExpected={nonJudgePlayers.length}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Phase: Submitting - Judge View */}
              {currentRound?.phase === "submitting" && isJudge && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="phase-enter"
                >
                  <Card className="game-card p-6">
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="icon-container-blue w-16 h-16 mx-auto mb-4"
                      >
                        <Clock className="w-8 h-8" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Waiting for Players
                      </h3>
                      
                      {/* Progress bar */}
                      <div className="max-w-xs mx-auto mb-4">
                        <div className="progress-bar">
                          <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${(submissions.length / nonJudgePlayers.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="text-tierlist-blue font-bold">{submissions.length}</span>
                          <span className="mx-1">/</span>
                          <span>{nonJudgePlayers.length}</span>
                          <span className="ml-1">players submitted</span>
                        </p>
                      </div>
                      
                      {/* Player status grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto">
                        {nonJudgePlayers.map((player, index) => {
                          const hasSubmitted = submissions.some(
                            (s) => s.player_id === player.id
                          );
                          return (
                            <motion.div
                              key={player.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                hasSubmitted
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : "bg-muted/30 border border-transparent"
                              }`}
                            >
                              <div className={`status-dot ${hasSubmitted ? "submitted" : "waiting"}`} />
                              <span className={hasSubmitted ? "text-green-400" : "text-muted-foreground"}>
                                {player.name}
                              </span>
                              {hasSubmitted && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-auto text-green-400"
                                >
                                  ✓
                                </motion.span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Phase: Judging - Judge View */}
              {currentRound?.phase === "judging" && isJudge && allSubmitted && (
                <JudgeNumberGuessInputs
                  orderedPlayers={playerGuesses}
                  onGuessChange={handleGuessChange}
                  onSubmit={handleSubmitGuesses}
                  isSubmitting={isSubmittingGuesses}
                />
              )}

              {/* Phase: Judging - Non-Judge View: Show automatic ordering */}
              {currentRound?.phase === "judging" && !isJudge && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 phase-enter"
                >
                  <Card className="game-card-blue p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="icon-container-blue w-12 h-12"
                        >
                          <Gavel className="w-6 h-6" />
                        </motion.div>
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          Judge is Deliberating
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-tierlist-blue"
                          >
                            ...
                          </motion.span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="text-tierlist-blue font-medium">{judge?.name}</span> is guessing everyone&apos;s numbers
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Show the automatic ordering to non-judge players */}
                  <AutomaticOrderingView
                    submissions={submissions}
                    secrets={secrets}
                    players={players}
                    myPlayerId={currentPlayer?.id || ""}
                    mySecret={mySecret}
                  />
                </motion.div>
              )}

              {/* Phase: Results */}
              {currentRound?.phase === "results" && (
                <>
                  {(() => {
                    const resultsData = getResults();
                    if (!resultsData) return null;
                    return (
                      <ResultScreen
                        results={resultsData.results}
                        judgeName={judge?.name || "Judge"}
                        judgePointsEarned={resultsData.totalJudgePoints}
                        category={currentRound.category}
                        onNextRound={handleNextRound}
                        isHost={currentPlayer?.is_host || false}
                        allPositionsCorrect={resultsData.allPositionsCorrect}
                      />
                    );
                  })()}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Scoreboard */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Scoreboard
                players={players}
                winningScore={room.winning_score}
                currentRound={room.current_round}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

