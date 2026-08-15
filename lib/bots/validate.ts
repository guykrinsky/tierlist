// Guardrails for bot answers. The model is told to name a concrete thing, but
// a party game shows every answer to a human judge, so nothing reaches the
// table without being checked. Anything rejected here falls back to a
// hand-written concrete item instead.

// The prompt asks for one to five words. The guard allows one more: some
// categories ("Superpowers to be stuck with") genuinely need a sixth word, and
// rejecting a good answer costs a worse fallback than letting it through.
const MAX_WORDS = 6;
const MAX_CHARS = 48;

// The failure we're guarding against: an answer that grades itself instead of
// naming something ("something relatively tasty, above average").
//
// Vocabulary whose job is to rate the answer rather than name it. Words that
// often belong to a legitimate answer instead ("Perfect balance", "Amazing
// Grace") are deliberately absent — the phrases and structural rules below
// still catch the self-grading uses of them.
const GRADING_WORDS =
  // "mid" needs the lookahead: a hyphen counts as a word boundary, so a bare
  // \bmid\b would reject "Interrupting a spell mid-cast".
  /\b(something|somewhat|relatively|fairly|kinda|average|mid(?!-)|mediocre|decent|respectable|awful|terrible|perfection|best|worst|weak|disappointing|above|below|number|top[-\s](tier|shelf)|bottom[-\s]tier)\b/i;

const GRADING_PHRASES =
  /\b(sort of|kind of|middle of the pack|bottom of the barrel|nothing special|for sure|in existence|imaginable)\b/i;

// A description standing in for a name: "a really bad one", "a solid pick".
// Requires both a leading article and a placeholder noun, so titles like
// "Sophie's Choice" still pass. "The Chosen One" would not — a rare miss, and
// it costs a fallback answer rather than a broken one.
const PLACEHOLDER_NOUN = /^(a|an|the)\b.*\b(one|ones|pick|picks|choice|option|thing|stuff)\b/i;

export type RejectionReason = "empty" | "too_long" | "grades_itself" | "leaks_number";

/** Trim the model's formatting habits: wrapping quotes, trailing punctuation. */
export function cleanAnswer(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[.,;:!]+$/, "")
    .trim();
}

/**
 * Returns null when the answer is usable, or the reason it isn't.
 * `value` is the bot's secret number, which the answer must never reveal.
 */
export function rejectAnswer(text: string, value: number): RejectionReason | null {
  if (!text) return "empty";
  if (text.length > MAX_CHARS) return "too_long";
  if (text.split(" ").length > MAX_WORDS) return "too_long";
  if (GRADING_WORDS.test(text)) return "grades_itself";
  if (GRADING_PHRASES.test(text)) return "grades_itself";
  if (PLACEHOLDER_NOUN.test(text)) return "grades_itself";
  if (new RegExp(`(^|\\D)${value}(\\D|$)`).test(text)) return "leaks_number";
  return null;
}
