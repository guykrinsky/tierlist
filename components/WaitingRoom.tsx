"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Copy, CheckCircle2, Users, Play, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { Player, Room } from "@/types";

interface WaitingRoomProps {
  room: Room;
  players: Player[];
  currentPlayer: Player;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
}

export function WaitingRoom({
  room,
  players,
  currentPlayer,
  onStartGame,
  onLeaveRoom,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <Logo size="lg" />
          <p className="mt-2 text-muted-foreground">Waiting Room</p>
        </div>

        <Card className="border-tierlist-blue/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-muted-foreground">
              Room Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl font-black tracking-[0.3em] text-tierlist-blue">
                {room.id}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyRoomCode}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Share this code with friends to join!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === currentPlayer.id
                      ? "bg-tierlist-blue/20 border border-tierlist-blue/50"
                      : "bg-muted/30"
                  }`}
                >
                  <span className="font-medium text-white">{player.name}</span>
                  <div className="flex items-center gap-2">
                    {player.is_host && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-tierlist-red/20 text-tierlist-red">
                        Host
                      </span>
                    )}
                    {player.id === currentPlayer.id && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-tierlist-blue/20 text-tierlist-blue">
                        You
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {players.length < 3 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Need at least 3 players to start
              </p>
            )}
          </CardContent>
        </Card>

        {currentPlayer.is_host ? (
          <Button
            onClick={handleStartGame}
            disabled={players.length < 3 || isStarting}
            size="lg"
            className="w-full"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Game ({players.length} players)
              </>
            )}
          </Button>
        ) : (
          <div className="text-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center justify-center gap-2 text-muted-foreground"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Waiting for host to start the game...</span>
            </motion.div>
          </div>
        )}

        {/* Leave Room Button */}
        <Button
          variant="outline"
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="w-full text-red-400 border-red-400/50 hover:bg-red-400/10"
        >
          {isLeaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Leaving...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5 mr-2" />
              Leave Room
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

