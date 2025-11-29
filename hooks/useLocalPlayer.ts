"use client";

import { useState, useEffect } from "react";

interface LocalPlayerData {
  playerId: string;
  roomId: string;
  playerName: string;
}

export function useLocalPlayer(roomId: string) {
  const [playerData, setPlayerData] = useState<LocalPlayerData | null>(null);

  useEffect(() => {
    // Try to load player data from localStorage
    const storageKey = `tierlist_player_${roomId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const data = JSON.parse(stored) as LocalPlayerData;
        setPlayerData(data);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [roomId]);

  const savePlayer = (playerId: string, playerName: string) => {
    const storageKey = `tierlist_player_${roomId}`;
    const data: LocalPlayerData = { playerId, roomId, playerName };
    localStorage.setItem(storageKey, JSON.stringify(data));
    setPlayerData(data);
  };

  const clearPlayer = () => {
    const storageKey = `tierlist_player_${roomId}`;
    localStorage.removeItem(storageKey);
    setPlayerData(null);
  };

  return {
    playerId: playerData?.playerId || null,
    playerName: playerData?.playerName || null,
    savePlayer,
    clearPlayer,
    isLoaded: true,
  };
}

