export const CATEGORIES = [
  // Real-Life Chaos
  "Things you bring to a funeral",
  "Things you’d bring to a desert island",
  "Things you say when you're late",
  "Things you buy when you're sad",
  "Things you regret ordering online",
  "Things you hide before guests arrive",
  "Things that fall out of your pocket",
  "Things you google before bed",
  "Things you pretend to understand",
  "Things you say when you stub your toe",
  "Things you accidentally leave in the car",
  "Things that magically disappear at home",
  "Things you clean only when people come over",

  // Israel-Themed
  "Cities in Israel",
  "Places in Israel people pretend to like",
  "Israeli foods your grandmother makes",
  "Israeli slang words",
  "Things you hear at an Israeli family dinner",
  "Things someone yells in Tel Aviv traffic",
  "Things people bring to a barbecue",
  "Things you hear from your madrich in the army",
  "Things people say while waiting for a bus",
  "Things you regret eating after 1 AM in Israel",

  // Grandma & Family Comedy
  "Things to say at your grandmother’s birthday",
  "Gifts you give your grandmother",
  "Things your grandmother keeps 'just in case'",
  "Things your grandmother cooks in ridiculous amounts",
  "Things your grandmother thinks are dangerous",
  "Things your mom warns you about",
  "Things your dad explains too aggressively",

  // Awkward Social Situations
  "Things to say on a first date",
  "Things NOT to say on a first date",
  "Things you say when you forget someone's name",
  "Things you say when someone shows you their baby",
  "Things people say at parties to sound interesting",
  "Things you say when the group photo is bad",
  "Things you pretend you’ve watched",
  "Things you say to avoid helping someone move",
  "Things you say when you don’t want dessert",

  // Chaotic Behavior
  "Things you do when you're bored",
  "Things you do when you’re angry",
  "Things you do when no one is watching",
  "Things you eat because you're too lazy to cook",
  "Things you do during a Zoom call",
  "Things you say when WiFi stops working",
  "Things you keep in your car for no reason",
  "Things you do in the shower while thinking",
  "Things you do instead of sleeping",

  // Objects & Randomness
  "Items in your bag you forgot existed",
  "Items you keep but never use",
  "Items you 'borrow' and never return",
  "Things you lose weekly",
  "Things you find under your bed",
  "Things on your desk right now",
  "Things you save even though they're broken",

  // Public Situations
  "Things people do in the gym that annoy you",
  "Things people do on airplanes",
  "Things people argue about on WhatsApp groups",
  "Things people forget in taxis",
  "Things people do in movie theaters",
  "Things you hear in the supermarket",

  // Food & Eating Chaos
  "Foods that cause instant regret",
  "Snacks you bring to a long drive",
  "Foods you order when you’re drunk",
  "Foods you eat out of politeness",
  "Foods that are suspiciously cheap",
  "Things you dip in hummus",
  "Things you put on toast",

  // Work & School Comedy
  "Excuses for being late to work",
  "Things you say in a meeting when you’re clueless",
  "Things people pretend to be busy with",
  "Things you procrastinate",
  "Things you cheat on in school",
  "Things you doodle during class",
  "Things teachers say way too often",

  // Hypothetical Fun
  "Things you'd take if aliens abducted you",
  "Things you'd say if you met your future self",
  "Things you'd bring to meet the president",
  "Things that would cause instant chaos if you said them out loud",
  "Things you'd do if you were invisible for a day"
];

export function getRandomCategory(): string {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

export function getRandomCategories(count: number): string[] {
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
