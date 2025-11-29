"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Plus, Users, Sparkles, Trophy, Gavel, Hash, Loader2, RefreshCw, Trash2 } from "lucide-react";
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
  const supabase = createClient();

  const fetchActiveRooms = async () => {
    setIsLoadingRooms(true);
    try {
      // Fetch rooms that are waiting or playing
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("id, name, host_id, status, current_round, created_at")
        .in("status", ["waiting", "playing"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get player counts for each room
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

      // Save player data to localStorage
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

    // Subscribe to room changes
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

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-tierlist-blue/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-tierlist-red/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          <Logo size="xl" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-xl text-muted-foreground"
          >
            The ultimate party game where you guess the rankings!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-10 justify-center"
          >
            <Link href="/create">
              <Button size="xl" className="w-full sm:w-auto gap-2">
                <Plus className="w-6 h-6" />
                Create Room
              </Button>
            </Link>
            <Link href="/join">
              <Button
                size="xl"
                variant="outline"
                className="w-full sm:w-auto gap-2"
              >
                <Users className="w-6 h-6" />
                Join Room
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Active Rooms Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 w-full max-w-2xl mx-auto mt-12"
        >
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-tierlist-blue" />
                  Active Rooms
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchActiveRooms}
                  disabled={isLoadingRooms}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRooms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-tierlist-blue" />
                </div>
              ) : activeRooms.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active rooms. Create one to get started!
                </p>
              ) : (
                <div className="space-y-2">
                  {activeRooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-mono font-bold text-tierlist-blue shrink-0">
                          {room.id}
                        </span>
                        {room.name && (
                          <span className="text-white font-medium truncate">
                            {room.name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${
                          room.status === "waiting"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {room.status === "waiting" ? "Waiting" : `Round ${room.current_round}`}
                        </span>
                        <span className="text-sm text-muted-foreground shrink-0">
                          {room.player_count} player{room.player_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuickJoinRoom(room)}
                          disabled={room.status !== "waiting"}
                        >
                          {room.status === "waiting" ? "Join" : "In Progress"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRoom(room.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* How to Play Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="py-16 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            How to Play
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-tierlist-blue/20 flex items-center justify-center">
                  <Gavel className="w-7 h-7 text-tierlist-blue" />
                </div>
                <h3 className="font-bold text-white mb-2">1. Pick a Judge</h3>
                <p className="text-sm text-muted-foreground">
                  One player becomes the Judge and receives a category card
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-tierlist-red/20 flex items-center justify-center">
                  <Hash className="w-7 h-7 text-tierlist-red" />
                </div>
                <h3 className="font-bold text-white mb-2">2. Get Your Number</h3>
                <p className="text-sm text-muted-foreground">
                  Other players receive a secret number from 1-10
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-yellow-500" />
                </div>
                <h3 className="font-bold text-white mb-2">3. Say Your Item</h3>
                <p className="text-sm text-muted-foreground">
                  Pick something from the category that matches your ranking
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-green-500" />
                </div>
                <h3 className="font-bold text-white mb-2">4. Judge Guesses</h3>
                <p className="text-sm text-muted-foreground">
                  The Judge orders players and guesses their exact numbers
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block glass p-6">
              <h3 className="font-bold text-white mb-4">Scoring</h3>
              <div className="text-left space-y-2 text-sm">
                <p className="text-muted-foreground">
                  The Judge guesses each player's <span className="text-white">position</span> and <span className="text-white">exact number</span>
                </p>
                <p className="text-muted-foreground mt-3">
                  <span className="text-tierlist-blue font-medium">📊 Position Correct:</span>
                </p>
                <p className="text-muted-foreground pl-4">
                  <span className="text-tierlist-red font-medium">+1 point</span> to the Judge
                </p>
                <p className="text-muted-foreground mt-3">
                  <span className="text-yellow-500 font-medium">🎯 Exact Number Correct:</span>
                </p>
                <p className="text-muted-foreground pl-4">
                  <span className="text-tierlist-red font-medium">+1 point</span> to the Judge
                </p>
                <p className="text-muted-foreground pl-4">
                  <span className="text-tierlist-blue font-medium">+1 point</span> to the Player
                </p>
                <p className="text-muted-foreground mt-3">
                  First to <span className="text-yellow-500 font-medium">10 points</span> wins!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* Quick Join Dialog */}
      <Dialog open={!!quickJoinRoom} onOpenChange={(open) => !open && setQuickJoinRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
            <DialogDescription>
              {quickJoinRoom?.name ? (
                <>Joining <span className="text-white font-medium">{quickJoinRoom.name}</span> ({quickJoinRoom.id})</>
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
                className="flex-1"
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
    </main>
  );
}

