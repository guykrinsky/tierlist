import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBotAnswers, type BotTurn } from "@/lib/bots/answers";

// The model call plus the staggered writes take a few seconds.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface PendingBotTurn {
  player_id: string;
  player_name: string;
  value: number;
  category: string;
}

/** Bots pop in one at a time, the way a table of humans would answer. */
const MIN_GAP_MS = 500;
const MAX_GAP_MS = 1600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Answer for every bot that still owes a submission this round.
 *
 * The only input is a round id — the category, the bots and their secret
 * numbers all come from the database, so this can't be used to put arbitrary
 * text in front of players or to run arbitrary prompts. It's idempotent:
 * bots that already answered are skipped, so a retry is safe.
 */
export async function POST(request: Request) {
  let roundId: unknown;
  try {
    ({ roundId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof roundId !== "string" || !roundId) {
    return NextResponse.json({ error: "roundId is required" }, { status: 400 });
  }

  const supabase = createClient();

  const { data, error } = await supabase.rpc("pending_bot_turns", {
    p_round_id: roundId,
  });

  if (error) {
    console.error("[bots] could not load pending bot turns:", error);
    return NextResponse.json({ error: "Could not load bot turns" }, { status: 500 });
  }

  const pending = (data ?? []) as PendingBotTurn[];
  if (pending.length === 0) {
    return NextResponse.json({ answered: 0 });
  }

  const category = pending[0].category;
  const turns: BotTurn[] = pending.map((row) => ({
    playerId: row.player_id,
    playerName: row.player_name,
    value: row.value,
  }));

  const answers = await generateBotAnswers(category, turns);

  let answered = 0;
  for (let index = 0; index < answers.length; index++) {
    const answer = answers[index];
    if (index > 0) {
      await sleep(MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS));
    }

    const { error: writeError } = await supabase.rpc("submit_bot_answer", {
      p_round_id: roundId,
      p_player_id: answer.playerId,
      p_text: answer.text,
    });

    if (writeError) {
      console.error("[bots] could not record bot answer:", writeError);
      continue;
    }
    answered += 1;
  }

  return NextResponse.json({
    answered,
    fallbacks: answers.filter((a) => a.source === "fallback").length,
  });
}
