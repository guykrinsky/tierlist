// Emergency answers, used only when the model can't be reached (no
// ANTHROPIC_API_KEY, API error, or an answer that failed validation twice).
//
// Each bank is ten concrete items ordered from weakest to strongest, so the
// bot's secret number indexes straight into it. These are deliberately plain:
// they exist so a bot never falls back to describing its number, not to be
// the good answers. Real answers come from the model, which actually reads
// the category.

interface FallbackBank {
  /** Matched against the lowercased category text. */
  match: RegExp;
  /** Ten items, worst (number 1) to best (number 10). */
  items: readonly string[];
}

const BANKS: readonly FallbackBank[] = [
  {
    match: /\b(food|eat|eating|dish|meal|snack|breakfast|lunch|dinner|dessert|cook|kitchen|restaurant|pizza|taste|tasty)\b/,
    items: [
      "Boiled liver",
      "Cold canned peas",
      "Plain rice cakes",
      "Instant noodles",
      "Plain toast",
      "Grilled cheese",
      "Fried chicken",
      "Sushi",
      "Ribeye steak",
      "Grandma's lasagna",
    ],
  },
  {
    match: /\b(drink|drinks|beverage|coffee|tea|soda|juice|cocktail|beer|wine|thirsty)\b/,
    items: [
      "Warm tap water",
      "Flat cola",
      "Powdered lemonade",
      "Gas station coffee",
      "Iced tea",
      "Orange juice",
      "Cold brew",
      "Fresh lemonade",
      "Espresso martini",
      "Ice-cold water",
    ],
  },
  {
    match: /\b(movie|movies|film|films|cinema|show|shows|series|tv|netflix|watch)\b/,
    items: [
      "The Room",
      "Cats",
      "Jaws 3",
      "A hotel pay-per-view",
      "Twilight",
      "Shrek 2",
      "Jurassic Park",
      "Inception",
      "The Godfather",
      "Spirited Away",
    ],
  },
  {
    match: /\b(animal|animals|pet|pets|dog|dogs|cat|cats|bird|creature)\b/,
    items: [
      "Mosquito",
      "Pigeon",
      "Goldfish",
      "Hamster",
      "House cat",
      "Golden retriever",
      "Horse",
      "Dolphin",
      "Snow leopard",
      "Blue whale",
    ],
  },
  {
    match: /\b(city|cities|country|countries|place|places|travel|vacation|trip|destination|visit)\b/,
    items: [
      "An airport parking lot",
      "A highway rest stop",
      "A strip mall",
      "The suburbs",
      "A small beach town",
      "Lisbon",
      "Barcelona",
      "Kyoto",
      "Rome",
      "The Amalfi Coast",
    ],
  },
  {
    match: /\b(song|songs|music|band|bands|album|artist|singer|concert)\b/,
    items: [
      "A ringtone",
      "Hold music",
      "The Macarena",
      "A jingle",
      "Happy Birthday",
      "Sweet Caroline",
      "Mr. Brightside",
      "Billie Jean",
      "Bohemian Rhapsody",
      "Hey Jude",
    ],
  },
  {
    // Deliberately not "work": categories like "Excuses for being late to
    // work" aren't about jobs, and a confidently wrong answer reads worse
    // than a generic one.
    match: /\b(job|jobs|career|careers|profession|professions|coworker|coworkers)\b/,
    items: [
      "Telemarketer",
      "Parking attendant",
      "Data entry clerk",
      "Night security guard",
      "Bank teller",
      "Schoolteacher",
      "Carpenter",
      "Airline pilot",
      "Surgeon",
      "Astronaut",
    ],
  },
  {
    match: /\b(superpowers?|superheroe?s?|heroe?s?|villains?|comics?|marvel|powers?)\b/,
    items: [
      "Glowing faintly",
      "Talking to pigeons",
      "Always finding parking",
      "Perfect balance",
      "Super strength",
      "Invisibility",
      "Super speed",
      "Flight",
      "Teleportation",
      "Time travel",
    ],
  },
];

// Used when nothing matches. Ordinary objects nobody has to know a category to
// rank — a weak answer, but a concrete one.
const GENERIC: readonly string[] = [
  "A wet sock",
  "A bent paperclip",
  "A plastic fork",
  "A ballpoint pen",
  "An umbrella",
  "A good hoodie",
  "A pocket knife",
  "Noise-cancelling headphones",
  "A new laptop",
  "A set of house keys",
];

/**
 * A concrete stand-in for `value` (1-10) on `category`'s scale.
 * Never returns a description of the number.
 */
export function fallbackAnswer(category: string, value: number): string {
  const haystack = category.toLowerCase();
  const bank = BANKS.find((b) => b.match.test(haystack));
  const items = bank ? bank.items : GENERIC;
  const index = Math.min(Math.max(value, 1), 10) - 1;
  return items[index];
}
