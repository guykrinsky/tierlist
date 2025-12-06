"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameState } from "@/hooks/useGameState";
import { useLocalPlayer } from "@/hooks/useLocalPlayer";
import { WaitingRoom } from "@/components/WaitingRoom";
import { CategorySelector } from "@/components/CategorySelector";
import { NumberHintCard } from "@/components/NumberHintCard";
import { PlayerSpeechInput } from "@/components/PlayerSpeechInput";
import { JudgeNumberGuessInputs } from "@/components/JudgeNumberGuessInputs";
import { ResultScreen } from "@/components/ResultScreen";
import { Scoreboard } from "@/components/Scoreboard";
import { GameOver } from "@/components/GameOver";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Gavel, Users, LogOut, CheckCircle2, Clock, Eye } from "lucide-react";
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

  const getNextJudgeName = () => {
    const sortedPlayers = [...players].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const currentRoundNum = room?.current_round || 0;
    const nextJudgeIndex = currentRoundNum % sortedPlayers.length;
    return sortedPlayers[nextJudgeIndex]?.name || "";
  };

  const [playerGuesses, setPlayerGuesses] = useState<PlayerGuess[]>([]);
  const [isSubmittingGuesses, setIsSubmittingGuesses] = useState(false);

  useEffect(() => {
    if (currentRound?.phase === "judging" && submissions.length > 0) {
      const nonJudgePlayers = players.filter((p) => p.id !== currentRound.judge_id);
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

  useEffect(() => {
    if (!isLoading && !playerId) {
      router.push(`/join?room=${roomId}`);
    }
  }, [isLoading, playerId, roomId, router]);

  const handleStartGame = async () => {
    try {
      await prepareNextRound();
    } catch {
      toast({ title: "Error", description: "Failed to start", variant: "destructive" });
    }
  };

  const handleCategorySelect = async (category: string) => {
    try {
      await startGame(category);
    } catch {
      toast({ title: "Error", description: "Failed to start round", variant: "destructive" });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      router.push("/");
    } catch {
      toast({ title: "Error", description: "Failed to leave room", variant: "destructive" });
    }
  };

  const handleSubmitItem = async (text: string) => {
    try {
      await submitItem(text);
    } catch {
      toast({ title: "Error", description: "Failed to submit", variant: "destructive" });
    }
  };

  const handleGuessChange = (playerId: string, numberGuess: number | null) => {
    setPlayerGuesses((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, numberGuess } : p))
    );
  };

  const handleSubmitGuesses = async () => {
    setIsSubmittingGuesses(true);
    try {
      const sortedByGuess = [...playerGuesses].sort((a, b) => {
        if (a.numberGuess === null && b.numberGuess === null) return 0;
        if (a.numberGuess === null) return 1;
        if (b.numberGuess === null) return -1;
        return a.numberGuess - b.numberGuess;
      });

      const guessesData = playerGuesses.map((p) => {
        const position = sortedByGuess.findIndex((sp) => sp.playerId === p.playerId) + 1;
        return { player_id: p.playerId, position_guess: position, number_guess: p.numberGuess };
      });

      await submitGuesses(guessesData);
      await calculateResults();
    } catch {
      toast({ title: "Error", description: "Failed to submit guesses", variant: "destructive" });
    } finally {
      setIsSubmittingGuesses(false);
    }
  };

  const handleNextRound = async () => {
    const winner = players.find((p) => p.score >= (room?.winning_score || 10));
    if (winner) {
      toast({ title: "🎉 Winner!", description: `${winner.name} wins!` });
      return;
    }
    try {
      await prepareNextRound();
    } catch {
      toast({ title: "Error", description: "Failed to continue", variant: "destructive" });
    }
  };

  const handleNextRoundWithCategory = async (category: string) => {
    try {
      await nextRound(category);
    } catch {
      toast({ title: "Error", description: "Failed to start next round", variant: "destructive" });
    }
  };

  const handlePlayAgain = async () => {
    try {
      await resetGame();
    } catch {
      toast({ title: "Error", description: "Failed to reset", variant: "destructive" });
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-tierlist-blue mx-auto mb-3" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-8 text-center max-w-sm bg-card border-border">
          <h2 className="text-xl font-bold text-white mb-3">Room Not Found</h2>
          <p className="text-white/60 mb-4">This room doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/")} className="bg-tierlist-blue hover:bg-tierlist-blue-dark text-white">
            Go Home
          </Button>
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
        onGoHome={() => router.push("/")}
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

  // Category Selection
  if (room.status === "category_selection" && currentPlayer) {
    const nextJudgeName = getNextJudgeName();
    const isNextJudge = currentPlayer.name === nextJudgeName;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <Logo size="lg" />
            <p className="mt-3 text-lg text-white">
              <span className="text-tierlist-blue font-bold">{nextJudgeName}</span> is the Judge
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

  const getResults = () => {
    if (!currentRound || guesses.length === 0) return null;
    const nonJudgePlayersForResults = players.filter((p) => p.id !== currentRound.judge_id);
    const { results, totalJudgePoints, allPositionsCorrect } = calculateRoundResults(
      nonJudgePlayersForResults, secrets, submissions, guesses
    );
    return { results, totalJudgePoints, allPositionsCorrect };
  };

  // Show scoreboard only during results phase
  const showScoreboard = currentRound?.phase === "results";

  return (
    <main className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" animated={false} />
            <span className="text-white/50">|</span>
            <span className="text-white font-medium">{currentPlayer?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-white/50 text-sm">
              <Users className="w-4 h-4" />
              <span>{players.length}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ============ CATEGORY BANNER (Always visible during round) ============ */}
          {currentRound && currentRound.phase !== "results" && (
            <motion.div
              key="category-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-tierlist-blue/20 to-tierlist-blue/5 border border-tierlist-blue/30">
                <p className="text-tierlist-blue text-sm font-medium uppercase tracking-wider mb-2">
                  This Round&apos;s Category
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  {currentRound.category}
                </h1>
              </div>
            </motion.div>
          )}

          {/* ============ JUDGE INDICATOR ============ */}
          {currentRound && currentRound.phase !== "results" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-card border border-border">
                <Gavel className="w-5 h-5 text-yellow-500" />
                <span className="text-white">
                  Judge: <span className="font-bold text-yellow-500">{judge?.name}</span>
                  {isJudge && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">YOU</span>}
                </span>
              </div>
            </motion.div>
          )}

          {/* ============ PHASE: SUBMITTING - PLAYER VIEW ============ */}
          {currentRound?.phase === "submitting" && !isJudge && (
            <motion.div
              key="player-submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Your Number */}
              {mySecret && !mySubmission && (
                <NumberHintCard number={mySecret} category={currentRound.category} />
              )}

              {/* Submit Input or Confirmation */}
              {!mySubmission ? (
                <PlayerSpeechInput
                  category={currentRound.category}
                  onSubmit={handleSubmitItem}
                  isSubmitted={false}
                  roundId={currentRound.id}
                />
              ) : (
                <Card className="p-6 bg-green-500/10 border-green-500/30">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">Submitted!</h3>
                    <p className="text-white/80 text-lg mb-4">&quot;{mySubmission.text}&quot;</p>
                    <p className="text-white/50 text-sm">
                      Waiting for others... ({submissions.length}/{nonJudgePlayers.length})
                    </p>
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {/* ============ PHASE: SUBMITTING - JUDGE VIEW ============ */}
          {currentRound?.phase === "submitting" && isJudge && (
            <motion.div
              key="judge-wait"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 bg-card border-border">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-block mb-4"
                  >
                    <Clock className="w-16 h-16 text-tierlist-blue" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Players are answering...
                  </h3>
                  <p className="text-white/60 mb-6">
                    Wait for all players to submit their answers
                  </p>

                  {/* Progress */}
                  <div className="max-w-sm mx-auto mb-6">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-tierlist-blue rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(submissions.length / nonJudgePlayers.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-white/70 mt-2">
                      <span className="text-tierlist-blue font-bold text-lg">{submissions.length}</span>
                      <span className="text-white/50"> / {nonJudgePlayers.length}</span>
                    </p>
                  </div>

                  {/* Player List */}
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    {nonJudgePlayers.map((player) => {
                      const hasSubmitted = submissions.some((s) => s.player_id === player.id);
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            hasSubmitted
                              ? "bg-green-500/20 text-green-400"
                              : "bg-muted/30 text-white/50"
                          }`}
                        >
                          {hasSubmitted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <div className="w-4 h-4 border-2 border-current rounded-full animate-pulse" />
                          )}
                          <span>{player.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ============ PHASE: JUDGING - JUDGE VIEW ============ */}
          {currentRound?.phase === "judging" && isJudge && allSubmitted && (
            <motion.div
              key="judge-guess"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <JudgeNumberGuessInputs
                orderedPlayers={playerGuesses}
                onGuessChange={handleGuessChange}
                onSubmit={handleSubmitGuesses}
                isSubmitting={isSubmittingGuesses}
              />
            </motion.div>
          )}

          {/* ============ PHASE: JUDGING - PLAYER VIEW (All Submissions) ============ */}
          {currentRound?.phase === "judging" && !isJudge && (
            <motion.div
              key="player-wait-judge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Gavel className="w-6 h-6 text-yellow-500" />
                  </motion.div>
                  <p className="text-white">
                    <span className="font-bold text-yellow-500">{judge?.name}</span> is guessing numbers...
                  </p>
                </div>
              </Card>

              {/* All Submissions - Clean List */}
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-tierlist-blue" />
                  All Submissions
                </h3>
                <div className="space-y-3">
                  {submissions
                    .map((sub) => {
                      const player = players.find((p) => p.id === sub.player_id);
                      const secret = secrets.find((s) => s.player_id === sub.player_id);
                      const isMe = sub.player_id === playerId;
                      return { ...sub, player, secret, isMe };
                    })
                    .sort((a, b) => (a.secret?.value || 0) - (b.secret?.value || 0))
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          item.isMe
                            ? "bg-tierlist-blue/20 border border-tierlist-blue/30"
                            : "bg-muted/30"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-tierlist-blue flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">&quot;{item.text}&quot;</p>
                          <p className="text-white/50 text-sm">
                            {item.player?.name}
                            {item.isMe && (
                              <span className="ml-2 text-tierlist-blue">
                                (You - #{item.secret?.value})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ============ PHASE: RESULTS ============ */}
          {currentRound?.phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {(() => {
                const resultsData = getResults();
                if (!resultsData) return null;
                return (
                  <>
                    <ResultScreen
                      results={resultsData.results}
                      judgeName={judge?.name || "Judge"}
                      judgePointsEarned={resultsData.totalJudgePoints}
                      category={currentRound.category}
                      onNextRound={handleNextRound}
                      isHost={currentPlayer?.is_host || false}
                      allPositionsCorrect={resultsData.allPositionsCorrect}
                    />
                    
                    {/* Scoreboard - Only shown during results */}
                    {showScoreboard && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Scoreboard
                          players={players}
                          winningScore={room.winning_score}
                          currentRound={room.current_round}
                        />
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
