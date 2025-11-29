"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Users } from "lucide-react";
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <Logo size="lg" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-tierlist-blue" />
              Join a Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="roomCode">Room Code</Label>
              <Input
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                maxLength={6}
                className="text-center text-2xl tracking-[0.3em] font-bold uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Button
                onClick={handleJoin}
                disabled={isJoining || !name.trim() || !roomCode.trim()}
                className="flex-1"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}

