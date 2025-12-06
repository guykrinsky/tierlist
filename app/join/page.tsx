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
import { ArrowLeft, Loader2, Users, Hash, User, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!roomCode.trim()) {
      toast({
        title: "Room code required",
        description: "Please enter the room code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("join_room", {
        p_room_id: roomCode.trim().toUpperCase(),
        p_player_name: name.trim(),
      });

      if (error) {
        if (error.message.includes("Room not found")) {
          toast({
            title: "Room not found",
            description: "Check the room code and try again",
            variant: "destructive",
          });
        } else if (error.message.includes("Game already started")) {
          toast({
            title: "Game in progress",
            description: "This game has already started",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

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
      console.error("Error joining room:", err);
      toast({
        title: "Error",
        description: "Failed to join room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
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
            <p className="mt-2 text-muted-foreground">Join an existing game</p>
          </div>

          <Card className="game-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="icon-container-blue w-8 h-8">
                  <Users className="w-4 h-4" />
                </div>
                Join a Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  Room Code
                </Label>
                <Input
                  id="roomCode"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.2em] font-bold uppercase h-14 bg-muted/30 border-tierlist-blue/30 focus:border-tierlist-blue"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ask the host for the 6-letter room code
                </p>
              </div>

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
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="h-12"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full h-12">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <Button
                  onClick={handleJoin}
                  disabled={isJoining || !name.trim() || !roomCode.trim()}
                  className="flex-1 h-12 bg-tierlist-blue hover:bg-tierlist-blue-dark"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Room
                      <ArrowRight className="w-4 h-4 ml-2" />
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

