// Prints what bots would answer, without needing a game running.
//
//   npm run bots:preview                          # a spread of categories, numbers 1-10
//   npm run bots:preview "Tasty food"             # one category, numbers 1-10
//   npm run bots:preview "Tasty food" 1 5 8       # one category, specific numbers
//
// Needs ANTHROPIC_API_KEY in .env.local (or the environment). Without it you
// will see the fallback answers instead, which is also worth eyeballing.

import { readFileSync } from "node:fs";
import { generateBotAnswers, type BotTurn } from "../lib/bots/answers";

// tsx doesn't load .env.local the way `next dev` does.
function loadEnvLocal() {
  let contents: string;
  try {
    contents = readFileSync(".env.local", "utf8");
  } catch {
    return;
  }

  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const DEFAULT_CATEGORIES = [
  "Tasty food",
  "Things you bring to a funeral",
  "Cities to live in",
  "Superpowers to be stuck with",
  "Excuses for being late to work",
  "Animals you could take in a fight",
  "Songs to play at a wedding",
];

const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

async function preview(category: string, numbers: number[]) {
  const turns: BotTurn[] = numbers.map((value) => ({
    playerId: `preview-${value}`,
    playerName: `Bot ${value}`,
    value,
  }));

  const answers = await generateBotAnswers(category, turns);

  console.log(`\n${category}`);
  console.log("-".repeat(category.length));
  answers.forEach((answer, index) => {
    const marker = answer.source === "fallback" ? "  (fallback)" : "";
    console.log(`  ${String(numbers[index]).padStart(2)}  ${answer.text}${marker}`);
  });
}

async function main() {
  loadEnvLocal();

  const [category, ...rawNumbers] = process.argv.slice(2);
  const numbers = rawNumbers.length
    ? rawNumbers.map(Number).filter((n) => n >= 1 && n <= 10)
    : ALL_NUMBERS;

  if (category) {
    await preview(category, numbers);
    return;
  }

  for (const defaultCategory of DEFAULT_CATEGORIES) {
    await preview(defaultCategory, ALL_NUMBERS);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
