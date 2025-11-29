"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackgroundMusicProps {
  src?: string;
  autoPlay?: boolean;
}

export function BackgroundMusic({ 
  src = "/music/theme.mp3", // Add your own music file to public/music/theme.mp3
  autoPlay = false 
}: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    setHasInteracted(true);

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log("Audio playback failed:", err);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (volume > 0) {
        setVolume(0);
      } else {
        setVolume(0.3);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-full px-3 py-2 shadow-lg">
        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className={`rounded-full p-2 ${
            isPlaying ? "text-tierlist-blue" : "text-muted-foreground"
          }`}
          title={isPlaying ? "Pause music" : "Play music"}
        >
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          >
            <Music className="w-5 h-5" />
          </motion.div>
        </Button>

        {/* Volume Control */}
        {hasInteracted && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="rounded-full p-2"
              title={volume > 0 ? "Mute" : "Unmute"}
            >
              {volume > 0 ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-tierlist-blue"
            />
          </motion.div>
        )}

        {!hasInteracted && (
          <span className="text-xs text-muted-foreground pr-2">
            Click to play music
          </span>
        )}
      </div>
    </motion.div>
  );
}

