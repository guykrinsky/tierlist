"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles, Plus, User, Trophy, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [winningScore, setWinningScore] = useState("10");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("create_room", {
        p_host_name: name.trim(),
        p_winning_score: parseInt(winningScore) || 10,
        p_room_name: roomName.trim() || null,
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
          playerName: name.trim(),
        })
      );

      router.push(`/room/${result.room.id}`);
    } catch (err) {
      console.error("Error creating room:", err);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Logo size="lg" />
            </motion.div>
            <p className="mt-2 text-muted-foreground">Start a new game</p>
          </div>

          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="icon-container-blue w-8 h-8">
                  <Plus className="w-4 h-4" />
                </div>
                Create a Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName" className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  Room Name <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Friday Night Games"
                  maxLength={30}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Give your room a fun name so friends can find it!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="winningScore" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  Winning Score
                </Label>
                <Input
                  id="winningScore"
                  type="number"
                  value={winningScore}
                  onChange={(e) => setWinningScore(e.target.value)}
                  min={5}
                  max={50}
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  First player to reach this score wins (default: 10)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-12">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !name.trim()}
                  className="flex-1 h-12 bg-tierlist-blue hover:bg-tierlist-blue-dark"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

