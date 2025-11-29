"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { GripVertical, Quote, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PlayerSubmission {
  playerId: string;
  playerName: string;
  submission: string;
}

interface SortableItemProps {
  player: PlayerSubmission;
  position: number;
  totalPlayers: number;
  isDraggingThis?: boolean;
}

const getTierInfo = (position: number, total: number) => {
  const percentage = ((position - 1) / (total - 1)) * 100;
  
  if (total <= 2) {
    if (position === 1) return { label: "LOW", color: "from-red-600 to-red-700", textColor: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/50", icon: TrendingDown };
    return { label: "HIGH", color: "from-emerald-600 to-emerald-700", textColor: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/50", icon: TrendingUp };
  }
  
  if (percentage <= 20) {
    return { label: "BOTTOM TIER", color: "from-red-600 to-red-700", textColor: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/50", icon: TrendingDown };
  } else if (percentage <= 40) {
    return { label: "LOW", color: "from-orange-500 to-orange-600", textColor: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/50", icon: TrendingDown };
  } else if (percentage <= 60) {
    return { label: "MID", color: "from-yellow-500 to-yellow-600", textColor: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/50", icon: Minus };
  } else if (percentage <= 80) {
    return { label: "HIGH", color: "from-lime-500 to-lime-600", textColor: "text-lime-400", bg: "bg-lime-500/20", border: "border-lime-500/50", icon: TrendingUp };
  } else {
    return { label: "GOD TIER", color: "from-emerald-500 to-emerald-600", textColor: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/50", icon: TrendingUp };
  }
};

function SortableItem({ player, position, totalPlayers, isDraggingThis }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.playerId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tierInfo = getTierInfo(position, totalPlayers);
  const TierIcon = tierInfo.icon;

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-40">
        <div className={`h-24 rounded-2xl border-2 border-dashed ${tierInfo.border} ${tierInfo.bg}`} />
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={isDraggingThis ? "z-50" : ""}
    >
      <Card
        className={`relative overflow-hidden border-2 transition-all duration-200 ${tierInfo.border} ${tierInfo.bg} hover:scale-[1.02] hover:shadow-xl`}
      >
        {/* Gradient accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${tierInfo.color}`} />
        
        <div className="p-4 pl-6">
          <div className="flex items-center gap-4">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-3 -m-2 rounded-xl hover:bg-white/10 transition-colors touch-none"
            >
              <GripVertical className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* Position number with tier gradient */}
            <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${tierInfo.color} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl font-black text-white drop-shadow-md">
                {position}
              </span>
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-white truncate">
                  {player.playerName}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierInfo.bg} ${tierInfo.textColor} border ${tierInfo.border}`}>
                  {tierInfo.label}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-base text-white/90 italic leading-snug">
                  {player.submission}
                </p>
              </div>
            </div>

            {/* Tier icon */}
            <div className={`p-3 rounded-xl ${tierInfo.bg}`}>
              <TierIcon className={`w-6 h-6 ${tierInfo.textColor}`} />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function DragOverlayContent({ player, position, totalPlayers }: { player: PlayerSubmission; position: number; totalPlayers: number }) {
  const tierInfo = getTierInfo(position, totalPlayers);

  return (
    <Card className={`border-2 ${tierInfo.border} ${tierInfo.bg} shadow-2xl rotate-2`}>
      <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${tierInfo.color}`} />
      <div className="p-4 pl-6">
        <div className="flex items-center gap-4">
          <div className="p-3 -m-2 rounded-xl">
            <GripVertical className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tierInfo.color} flex items-center justify-center shadow-lg`}>
            <span className="text-2xl font-black text-white">{position}</span>
          </div>
          <div className="flex-1">
            <span className="font-bold text-lg text-white">{player.playerName}</span>
            <div className="flex items-start gap-2 mt-1">
              <Quote className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-base text-white/90 italic">{player.submission}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface JudgeOrderingBoardProps {
  players: PlayerSubmission[];
  onOrderChange: (orderedPlayers: PlayerSubmission[]) => void;
}

export function JudgeOrderingBoard({
  players,
  onOrderChange,
}: JudgeOrderingBoardProps) {
  const [orderedPlayers, setOrderedPlayers] = useState(players);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedPlayers((items) => {
        const oldIndex = items.findIndex((i) => i.playerId === active.id);
        const newIndex = items.findIndex((i) => i.playerId === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onOrderChange(newOrder);
        return newOrder;
      });
    }
  };

  const activePlayer = activeId ? orderedPlayers.find(p => p.playerId === activeId) : null;
  const activeIndex = activeId ? orderedPlayers.findIndex(p => p.playerId === activeId) : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with scale visualization */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            🎯 Rank the Players
          </h3>
          <p className="text-muted-foreground">
            Drag to order from <span className="text-red-400 font-semibold">lowest (1)</span> to <span className="text-emerald-400 font-semibold">highest ({orderedPlayers.length})</span>
          </p>
        </div>

        {/* Visual scale */}
        <div className="relative h-8 rounded-full overflow-hidden bg-muted/30">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-red-600 to-red-500" />
            <div className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500" />
            <div className="flex-1 bg-gradient-to-r from-yellow-500 to-lime-500" />
            <div className="flex-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-white">
            <span className="drop-shadow-md">1 🗑️</span>
            <span className="drop-shadow-md">LOW</span>
            <span className="drop-shadow-md">MID</span>
            <span className="drop-shadow-md">HIGH</span>
            <span className="drop-shadow-md">10 👑</span>
          </div>
        </div>
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedPlayers.map((p) => p.playerId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            <AnimatePresence>
              {orderedPlayers.map((player, index) => (
                <SortableItem
                  key={player.playerId}
                  player={player}
                  position={index + 1}
                  totalPlayers={orderedPlayers.length}
                  isDraggingThis={activeId === player.playerId}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        <DragOverlay>
          {activePlayer && (
            <DragOverlayContent
              player={activePlayer}
              position={activeIndex + 1}
              totalPlayers={orderedPlayers.length}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Helper text */}
      <div className="text-center text-sm text-muted-foreground">
        💡 Think about it: who gave the most "1" energy? Who went full "10"?
      </div>
    </motion.div>
  );
}
