"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Users, 
  Sparkles, 
  Trophy, 
  Gavel, 
  Hash, 
  Loader2, 
  RefreshCw, 
  Trash2,
  Target,
  Brain,
  TrendingUp,
  Zap,
  Play,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ActiveRoom {
  id: string;
  name: string | null;
  host_id: string;
  status: string;
  current_round: number;
  player_count: number;
  created_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [quickJoinRoom, setQuickJoinRoom] = useState<ActiveRoom | null>(null);
  const [quickJoinName, setQuickJoinName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const supabase = createClient();

  const fetchActiveRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("id, name, host_id, status, current_round, created_at")
        .in("status", ["waiting", "playing"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const roomsWithCounts = await Promise.all(
        (rooms || []).map(async (room) => {
          const { count } = await supabase
            .from("players")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id);
          return {
            ...room,
            player_count: count || 0,
          };
        })
      );

      setActiveRooms(roomsWithCounts);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);

      if (error) throw error;

      toast({
        title: "Room Deleted",
        description: "The room has been closed",
      });

      fetchActiveRooms();
    } catch (err) {
      console.error("Error deleting room:", err);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const handleQuickJoin = async () => {
    if (!quickJoinRoom || !quickJoinName.trim()) return;

    setIsJoining(true);
    try {
      const { data, error } = await supabase.rpc("join_room", {
        p_room_id: quickJoinRoom.id,
        p_player_name: quickJoinName.trim(),
      });

      if (error) throw error;

      const result = data as { room: { id: string }; player: { id: string } };

      const storageKey = `tierlist_player_${result.room.id}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          playerId: result.player.id,
          roomId: result.room.id,
          playerName: quickJoinName.trim(),
        })
      );

      setQuickJoinRoom(null);
      setQuickJoinName("");
      router.push(`/room/${result.room.id}`);
    } catch (err) {
      console.error("Error joining room:", err);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    fetchActiveRooms();

    const channel = supabase
      .channel("rooms-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchActiveRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const ruleSteps = [
    {
      icon: Gavel,
      title: "Pick a Judge",
      description: "One player becomes the Judge and announces a category",
      color: "blue",
    },
    {
      icon: Hash,
      title: "Get Your Number",
      description: "Each player receives a unique secret number from 1-10",
      color: "red",
    },
    {
      icon: Brain,
      title: "Submit Your Answer",
      description: "Pick something from the category that hints at your number",
      color: "yellow",
    },
    {
      icon: Target,
      title: "Judge Guesses",
      description: "The Judge tries to guess everyone's exact numbers",
      color: "green",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute top-20 left-10 w-72 h-72 bg-tierlist-blue/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute bottom-20 right-10 w-96 h-96 bg-tierlist-red/15 rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Logo size="xl" />
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto"
              >
                Real-time party game of ranking and intuition.
                <br className="hidden sm:block" />
                <span className="text-white font-medium">Guess the numbers, outsmart your friends!</span>
              </motion.p>

              {/* Animated demo preview */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex justify-center"
              >
                <div className="flex gap-2 p-4 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                  {[1, 4, 7, 10].map((num, i) => (
                    <motion.div
                      key={num}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.1, type: "spring" }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl number-badge flex items-center justify-center"
                    >
                      <span className="text-xl sm:text-2xl font-black text-white">{num}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mt-10 justify-center"
              >
                <Link href="/create">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-tierlist-blue hover:bg-tierlist-blue-dark">
                    <Play className="w-5 h-5" />
                    Start New Game
                  </Button>
                </Link>
                <Link href="/join">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 h-14 px-8 text-lg border-2"
                  >
                    <Users className="w-5 h-5" />
                    Join Existing Game
                  </Button>
                </Link>
              </motion.div>

              {/* Scroll indicator */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={() => setShowRules(true)}
                className="mt-12 flex flex-col items-center gap-2 text-muted-foreground hover:text-white transition-colors mx-auto"
              >
                <span className="text-sm">Learn how to play</span>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* Active Rooms Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="game-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="icon-container-blue w-8 h-8">
                        <Users className="w-4 h-4" />
                      </div>
                      Active Rooms
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchActiveRooms}
                      disabled={isLoadingRooms}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingRooms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-tierlist-blue" />
                    </div>
                  ) : activeRooms.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="icon-container-blue w-12 h-12 mx-auto mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <p className="text-muted-foreground">No active rooms</p>
                      <p className="text-sm text-muted-foreground mt-1">Create one to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeRooms.map((room, index) => (
                        <motion.div
                          key={room.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-tierlist-blue/20"
                        >
                          {/* Mobile layout */}
                          <div className="flex flex-col gap-2 sm:hidden">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-tierlist-blue">
                                {room.id}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                room.status === "waiting"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {room.status === "waiting" ? "Waiting" : `Round ${room.current_round}`}
                              </span>
                            </div>
                            {room.name && (
                              <span className="text-white font-medium truncate text-sm">
                                {room.name}
                              </span>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>{room.player_count}/10</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setQuickJoinRoom(room)}
                                  disabled={room.status !== "waiting"}
                                  className="h-8 px-4 bg-tierlist-blue hover:bg-tierlist-blue-dark"
                                >
                                  {room.status === "waiting" ? "Join" : "Playing"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteRoom(room.id)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Desktop layout */}
                          <div className="hidden sm:flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="font-mono font-bold text-tierlist-blue shrink-0">
                                {room.id}
                              </span>
                              {room.name && (
                                <span className="text-white font-medium truncate">
                                  {room.name}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium shrink-0 ${
                                room.status === "waiting"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {room.status === "waiting" ? "Waiting" : `Round ${room.current_round}`}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                                <Users className="w-4 h-4" />
                                <span>{room.player_count}/10</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => setQuickJoinRoom(room)}
                                disabled={room.status !== "waiting"}
                                className="bg-tierlist-blue hover:bg-tierlist-blue-dark"
                              >
                                {room.status === "waiting" ? "Join" : "In Progress"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteRoom(room.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* How to Play Section */}
        <section className="py-12 sm:py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                How to Play
              </h2>
              <p className="text-muted-foreground">
                Master the game in 4 simple steps
              </p>
            </motion.div>

            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              {ruleSteps.map((step, index) => {
                const Icon = step.icon;
                const colorClasses = {
                  blue: "icon-container-blue",
                  red: "icon-container-red",
                  yellow: "icon-container-yellow",
                  green: "icon-container-green",
                };
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="game-card h-full">
                      <CardContent className="p-4 sm:p-6 text-center">
                        <div className={`${colorClasses[step.color as keyof typeof colorClasses]} w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4`}>
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-tierlist-blue mb-1">
                          Step {index + 1}
                        </div>
                        <h3 className="font-bold text-white mb-2 text-sm sm:text-base">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Scoring Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10"
            >
              <Card className="game-card-blue">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
                    <div className="flex-shrink-0">
                      <div className="icon-container-yellow w-16 h-16">
                        <Trophy className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="flex-1 text-center lg:text-left">
                      <h3 className="text-xl font-bold text-white mb-4">Scoring System</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-tierlist-blue/20 flex items-center justify-center shrink-0 mt-0.5">
                            <TrendingUp className="w-4 h-4 text-tierlist-blue" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-white text-sm">Perfect Ordering</p>
                            <p className="text-xs text-muted-foreground">Judge gets +1 if all positions correct</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-tierlist-red/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Target className="w-4 h-4 text-tierlist-red" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-white text-sm">Exact Number Guess</p>
                            <p className="text-xs text-muted-foreground">+1 for Judge AND +1 for Player</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">
                          First to <span className="text-yellow-500 font-bold">10 points</span> wins the game!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Play?
              </h2>
              <p className="text-muted-foreground mb-6">
                Gather 3-10 players and start guessing!
              </p>
              <Link href="/create">
                <Button size="lg" className="gap-2 bg-tierlist-blue hover:bg-tierlist-blue-dark">
                  Create Your Room
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-border/50">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <Logo size="sm" animated={false} />
          <p className="mt-2">A real-time party game of ranking and intuition</p>
        </div>
      </footer>

      {/* Quick Join Dialog */}
      <Dialog open={!!quickJoinRoom} onOpenChange={(open) => !open && setQuickJoinRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-tierlist-blue" />
              Join Room
            </DialogTitle>
            <DialogDescription>
              {quickJoinRoom?.name ? (
                <>Joining <span className="text-white font-medium">{quickJoinRoom.name}</span></>
              ) : (
                <>Joining room <span className="text-tierlist-blue font-mono">{quickJoinRoom?.id}</span></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="quickJoinName">Your Name</Label>
              <Input
                id="quickJoinName"
                value={quickJoinName}
                onChange={(e) => setQuickJoinName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleQuickJoin()}
                autoFocus
                className="h-12"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setQuickJoinRoom(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickJoin}
                disabled={isJoining || !quickJoinName.trim()}
                className="flex-1 bg-tierlist-blue hover:bg-tierlist-blue-dark"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Game"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
