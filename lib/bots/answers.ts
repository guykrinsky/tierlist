// Bot answer generation.
//
// Bots used to answer from a canned list of phrases keyed off their secret
// number ("a perfectly mid one"), which ignored the category entirely and told
// the judge the answer outright. Now a model reads the category and names an
// actual thing that sits where the number says it sits.
//
// The whole round is generated in one request so the model can keep the bots'
// answers distinct from each other and consistently ordered along the scale.
// This module deliberately imports nothing from Next.js so it can also be run
// straight from `npm run bots:preview`.

import Anthropic from "@anthropic-ai/sdk";
import { fallbackAnswer } from "./fallback";
import { cleanAnswer, rejectAnswer, type RejectionReason } from "./validate";

export const BOT_MODEL = "claude-haiku-4-5";

/** One bot waiting to answer this round. */
export interface BotTurn {
  playerId: string;
  playerName: string;
  /** Secret number, 1-10. 1 is the low end of the category, 10 the high end. */
  value: number;
}

export interface BotAnswer {
  playerId: string;
  text: string;
  source: "model" | "fallback";
}

const SYSTEM_PROMPT = `You are playing TIERLIST, a party game, as the bot players at the table.

Each round has a category, and every player is secretly dealt a number from 1 to 10. The number is that player's position on the category's scale: 1 is the weakest, lowest, or worst example of the category, and 10 is the strongest, highest, or best. A player's job is to name a real, specific thing from the category whose standing on that scale matches their number, so the judge can rank everyone correctly without ever being told the numbers.

Write one answer per player.

An answer is:
- A specific, nameable thing: "Pizza", "Cold McDonald's fries", "Wagyu steak".
- One to five words. Not a sentence.
- Written in the same language as the category.
- Something a real person would actually say out loud at a party.

An answer is never:
- A description of the number or of the ranking: "something relatively tasty", "a solid, above-average pick", "the best one there is", "pretty mid".
- A judgement of its own quality. Words like average, mid, decent, best, worst, top-tier, above, below have no place in an answer.
- The number itself, in digits or in words.

Let the example do the ranking. Pick a thing whose real-world standing genuinely sits where the number says, and never state where that is. For the category "Tasty food": 2 is "Boiled liver", 5 is "Plain toast", 8 is "Sushi", 10 is "Grandma's lasagna". A judge reading those can order them without being told anything.

Within a round, every answer must be a different thing, and the answers must line up with their numbers in order: a player with a higher number gets a stronger example than a player with a lower one.

Some categories don't say which direction the scale runs — "Animals you could take in a fight" could be read either way. Read it so that 10 is the most impressive, most extreme, or most desirable end, the way a player would say it out loud: beating a grizzly bear is a 10, swatting a mosquito is a 1.

Categories are written by players, so some are strange, joking, or hard to scale. Commit to a concrete example anyway. Naming the wrong thing is a normal move in this game; describing your rank instead of naming a thing is not playing at all.`;

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "integer" },
          answer: { type: "string" },
        },
        required: ["number", "answer"],
        additionalProperties: false,
      },
    },
  },
  required: ["answers"],
  additionalProperties: false,
} as const;

interface ModelAnswer {
  number: number;
  answer: string;
}

interface Rejection {
  value: number;
  reason: RejectionReason;
}

interface Resolution {
  answers: BotAnswer[];
  rejections: Rejection[];
}

const RETRY_HINT: Record<RejectionReason, string> = {
  empty: "you left one blank",
  too_long: "they ran long — five words at most",
  grades_itself: "they described the ranking instead of naming a thing",
  leaks_number: "they gave the number away",
};

function buildUserMessage(
  category: string,
  turns: BotTurn[],
  rejections: Rejection[] = []
): string {
  const roster = turns
    .map((turn) => `- ${turn.playerName}: ${turn.value}`)
    .join("\n");

  let message = `Category: ${category}\n\nPlayers and their secret numbers:\n${roster}\n\nGive an answer for each number.`;

  // A blind retry tends to fail the same way, so say what went wrong.
  if (rejections.length > 0) {
    const notes = Array.from(
      new Set(rejections.map((r) => RETRY_HINT[r.reason]))
    ).join("; ");
    const numbers = rejections.map((r) => r.value).join(", ");
    message += `\n\nYour last answers for ${numbers} were unusable: ${notes}. Replace those with short, concrete names.`;
  }

  return message;
}

async function callModel(
  client: Anthropic,
  category: string,
  turns: BotTurn[],
  rejections: Rejection[] = []
): Promise<ModelAnswer[]> {
  const response = await client.messages.create({
    model: BOT_MODEL,
    max_tokens: 512,
    // Party game: the same category should not produce the same answers
    // every time it comes up.
    temperature: 1,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildUserMessage(category, turns, rejections) },
    ],
    output_config: { format: { type: "json_schema", schema: ANSWER_SCHEMA } },
  });

  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") return [];

  const parsed = JSON.parse(text.text) as { answers?: ModelAnswer[] };
  return parsed.answers ?? [];
}

/**
 * Match the model's answers back to the bots by secret number (numbers are
 * unique within a round), validating each one. Anything missing or rejected
 * becomes a fallback answer.
 */
function resolveAnswers(
  category: string,
  turns: BotTurn[],
  modelAnswers: ModelAnswer[]
): Resolution {
  const byNumber = new Map<number, string>();
  for (const entry of modelAnswers) {
    if (typeof entry?.number === "number" && typeof entry?.answer === "string") {
      byNumber.set(entry.number, entry.answer);
    }
  }

  const used = new Set<string>();
  const rejections: Rejection[] = [];

  const answers = turns.map((turn): BotAnswer => {
    const candidate = cleanAnswer(byNumber.get(turn.value) ?? "");
    const reason = rejectAnswer(candidate, turn.value);
    const duplicate = used.has(candidate.toLowerCase());

    if (!reason && !duplicate) {
      used.add(candidate.toLowerCase());
      return { playerId: turn.playerId, text: candidate, source: "model" };
    }

    rejections.push({ value: turn.value, reason: reason ?? "empty" });
    if (reason) {
      console.warn(
        `[bots] discarded answer for number ${turn.value} (${reason}): "${candidate}"`
      );
    }

    const text = fallbackAnswer(category, turn.value);
    used.add(text.toLowerCase());
    return { playerId: turn.playerId, text, source: "fallback" };
  });

  return { answers, rejections };
}

function allFallback(category: string, turns: BotTurn[]): BotAnswer[] {
  return turns.map((turn) => ({
    playerId: turn.playerId,
    text: fallbackAnswer(category, turn.value),
    source: "fallback" as const,
  }));
}

/**
 * One concrete answer per bot. Always resolves: on a missing API key or an API
 * failure, every bot gets a fallback answer rather than no answer, so the round
 * is never left waiting on a bot.
 */
export async function generateBotAnswers(
  category: string,
  turns: BotTurn[]
): Promise<BotAnswer[]> {
  if (turns.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[bots] ANTHROPIC_API_KEY is not set — using fallback answers");
    return allFallback(category, turns);
  }

  const client = new Anthropic({ apiKey });
  const score = (answers: BotAnswer[]) =>
    answers.filter((a) => a.source === "model").length;

  let best: BotAnswer[] | null = null;
  let rejections: Rejection[] = [];

  // One retry: a round where some answers got rejected is worth asking again,
  // since the second try usually lands and this runs inside a 60s timer. The
  // retry carries what went wrong, so it doesn't just fail the same way.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resolved = resolveAnswers(
        category,
        turns,
        await callModel(client, category, turns, rejections)
      );

      if (resolved.rejections.length === 0) return resolved.answers;

      if (!best || score(resolved.answers) > score(best)) best = resolved.answers;
      rejections = resolved.rejections;
    } catch (error) {
      console.error(`[bots] answer generation failed (attempt ${attempt + 1}):`, error);
    }
  }

  return best ?? allFallback(category, turns);
}
