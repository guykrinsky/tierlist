"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";
import { Copy, CheckCircle2, Users, Loader2, LogOut, Share2, Sparkles, Bot, X } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { Player, Room } from "@/types";

interface WaitingRoomProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onAddBot: () => Promise<void>;
  onRemoveBot: (botId: string) => Promise<void>;
}

export function WaitingRoom({
  room,
  players,
  currentPlayer,
  onStartGame,
  onLeaveRoom,
  onAddBot,
  onRemoveBot,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAddingBot, setIsAddingBot] = useState(false);

  const handleAddBot = async () => {
    setIsAddingBot(true);
    try {
      await onAddBot();
    } catch {
      toast({
        title: "Error",
        description: "Failed to add bot",
        variant: "destructive",
      });
    } finally {
      setIsAddingBot(false);
    }
  };

  const handleRemoveBot = async (botId: string) => {
    try {
      await onRemoveBot(botId);
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove bot",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      await onLeaveRoom();
    } catch {
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
      setIsLeaving(false);
    }
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (players.length < 3) {
      toast({
        title: "Not enough players",
        description: "You need at least 3 players to start the game",
        variant: "destructive",
      });
      return;
    }
    setIsStarting(true);
    try {
      await onStartGame();
    } finally {
      setIsStarting(false);
    }
  };

  const minPlayers = 3;
  const maxPlayers = 10;
  const canStart = players.length >= minPlayers;
  // Bots never judge, so the game length follows the human players
  const humanCount = players.filter((p) => !p.is_bot).length;
  const plannedRounds = Math.max(1, humanCount) * room.rounds_per_player;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-5"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Logo size="lg" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3"
            >
              {room.name ? (
                <p className="text-lg font-medium text-foreground">{room.name}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">Waiting Room</p>
            </motion.div>
          </div>

          {/* Room Code Card */}
          <Card className="game-card-blue overflow-hidden">
            <CardHeader className="text-center pb-2 pt-4">
              <CardTitle className="text-xs sm:text-sm text-tierlist-blue-light uppercase tracking-wider flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" />
                Room Code
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <div className="flex items-center justify-center gap-3">
                <motion.div 
                  className="text-2xl sm:text-4xl font-black tracking-[0.15em] sm:tracking-[0.2em] text-foreground bg-tierlist-blue/20 px-4 py-2 rounded-xl border border-tierlist-blue/30"
                  whileHover={{ scale: 1.02 }}
                >
                  {room.id}
                </motion.div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyRoomCode}
                  className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 border-tierlist-blue/30 hover:bg-tierlist-blue/20"
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-tierlist-blue" />
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Share this code with friends to join!
              </p>
            </CardContent>
          </Card>

          {/* Players Card */}
          <Card className="game-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="icon-container-blue w-8 h-8">
                    <Users className="w-4 h-4" />
                  </div>
                  Players
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${canStart ? "text-green-400" : "text-yellow-500"}`}>
                    {players.length}
                  </span>
                  <span className="text-xs text-muted-foreground">/ {maxPlayers}</span>
                </div>
              </div>
              {/* Progress bar for players */}
              <div className="progress-bar mt-2">
                <motion.div
                  className={`progress-bar-fill ${canStart ? "from-green-500 to-green-400" : "from-yellow-500 to-yellow-400"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(players.length / maxPlayers) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {!canStart && (
                <p className="text-xs text-yellow-500 mt-2">
                  Need {minPlayers - players.length} more player{minPlayers - players.length !== 1 ? "s" : ""} to start
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      player.id === currentPlayer.id
                        ? "bg-tierlist-blue/20 border border-tierlist-blue/50"
                        : "bg-muted/30 border border-transparent hover:border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {player.is_bot ? (
                        <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <div className="status-dot online" />
                      )}
                      <span className="font-medium text-foreground text-sm">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.is_bot && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-400 font-medium">
                          BOT
                        </span>
                      )}
                      {player.is_host && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-tierlist-red/20 text-tierlist-red font-medium">
                          HOST
                        </span>
                      )}
                      {player.id === currentPlayer.id && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-tierlist-blue/20 text-tierlist-blue font-medium">
                          YOU
                        </span>
                      )}
                      {player.is_bot && currentPlayer.is_host && (
                        <button
                          onClick={() => handleRemoveBot(player.id)}
                          className="p-1 rounded-full text-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label={`Remove ${player.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Bot (host only) */}
              {currentPlayer.is_host && (
                <Button
                  variant="outline"
                  onClick={handleAddBot}
                  disabled={isAddingBot || players.length >= maxPlayers}
                  className="w-full mt-3 border-dashed border-purple-500/40 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  {isAddingBot ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  Add Bot Player
                </Button>
              )}
              {currentPlayer.is_host && players.length < minPlayers && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Playing alone? Add {minPlayers - players.length} bot{minPlayers - players.length !== 1 ? "s" : ""} and you&apos;ll be the judge every round.
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                {plannedRounds} round{plannedRounds !== 1 ? "s" : ""} &bull; everyone judges{" "}
                {room.rounds_per_player === 1 ? "once" : `${room.rounds_per_player} times`} &bull;
                fewest bad points wins
              </p>
            </CardContent>
          </Card>

          {/* Start Game / Waiting */}
          {currentPlayer.is_host ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                size="lg"
                className="w-full h-14 text-lg bg-tierlist-blue hover:bg-tierlist-blue-dark disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <Card className="p-4 border-dashed">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-2"
                >
                  <Loader2 className="w-6 h-6 text-tierlist-blue" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Waiting for host to start the game...
                </p>
              </div>
            </Card>
          )}

          {/* Leave Room Button */}
          <Button
            variant="ghost"
            onClick={handleLeaveRoom}
            disabled={isLeaving}
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            {isLeaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Leave Room
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

