# 🎮 TIERLIST - The Party Game

A multiplayer party game where players try to fool the judge by picking items that match their secret number!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## 🎯 How to Play

1. **Create or Join a Room** - One player creates a room and shares the code with friends (or adds bot players to fill seats)
2. **Judge Picks Category** - Each round, one player becomes the Judge and picks a category (e.g., "Foods That Slap at 3 AM")
3. **Players Get Unique Numbers** - Non-judge players receive a unique number from 1-10 (no duplicates!)
4. **Submit Your Item** - Pick something from the category that matches your number (1 = worst, 10 = best)
5. **Watch Live Ordering** - As players submit, non-judges see the live sorted list update in real-time
6. **Judge Ranks** - The Judge puts everyone's answers in order from lowest to highest
7. **Score Points** - You earn a point every time the Judge places you at your true position!

## 🏆 Scoring

The Judge ranks each player's answer by **position** (lowest number → highest number).

| Action | Points |
|--------|--------|
| Judge places a player at their **correct position** | Player +1 AND Judge +1 |
| Judge gets **ALL positions correct** | Judge +2 bonus |

**First to 10 points wins!**

> 💡 **Strategy Tip**: As a player, try to pick items that could match multiple numbers to confuse the Judge!

## ✨ Features

- 🎲 **250+ Categories** - From "Cereal Mascots You'd Trust with Your Life" to "Foods That Look Disgusting But Slap"
- 🤖 **Bot Players** - Short on friends? The host can add bots that play like real players: they read the category and name an actual thing that matches their secret number. Add two bots and you can even play solo as the permanent judge!
- 🃏 **Joker Category** - Judge can create custom categories
- ⏱️ **60-Second Timer** - Keep the game moving
- 🎵 **Background Music** - Add your own theme song
- 📱 **Mobile Friendly** - Play on any device
- 🔄 **Real-time Sync** - Instant updates for all players
- 🏠 **Room Browser** - See and join active games

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works!)

### 1. Clone the Repository

```bash
git clone https://github.com/guykrinsky/tierlist.git
cd tierlist
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy your credentials

> ♻️ **Updating?** `supabase/schema.sql` is idempotent — whenever you pull a version of the game that changed it, just re-run the whole file in the SQL Editor.

### 3. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional, but needed for good bot players — see "How bots answer" below.
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run the Game

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

## 🤖 How Bots Answer

A bot has the same job as a human player: it gets a secret number from 1 to 10 and has to name something from the category that sits at that spot on the scale, without giving the number away.

When the host's browser sees bots still owing a submission, it calls `POST /api/bot-answers` with the round id. That route is the only place bot answers are produced:

1. `pending_bot_turns` returns the category, the bots waiting to answer, and their secret numbers — so secrets never reach any browser.
2. All of the round's answers are generated in **one** Claude call (`claude-haiku-4-5`), which lets the model keep them distinct and correctly ordered relative to each other.
3. Every answer is validated (`lib/bots/validate.ts`): kept short, no self-grading language like "something relatively tasty" or "above average", and no leaking of the number. A rejected answer costs one retry, then a fallback.
4. `submit_bot_answer` records each one, a beat apart, so bots trickle in like people rather than appearing all at once.

The route takes nothing but a round id — the category and numbers come from the database, so it can't be used to run arbitrary prompts.

**Without `ANTHROPIC_API_KEY`**, or if the API call fails, bots fall back to a small hand-written list of concrete items in `lib/bots/fallback.ts`. They'll still name a real thing rather than describe their number, but the item only loosely matches the category — this is a safety net, not the intended experience.

To see what bots would say without starting a game:

```bash
npm run bots:preview                       # a spread of categories, numbers 1-10
npm run bots:preview "Tasty food"          # one category, numbers 1-10
npm run bots:preview "Tasty food" 1 5 10   # one category, specific numbers
```

## 🎵 Adding Background Music

1. Add your music file to `public/music/theme.mp3`
2. The music player will appear in the bottom-right corner
3. Click to play/pause, adjust volume as needed

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY` (server-side only — do **not** prefix it with `NEXT_PUBLIC_`)
4. Deploy!

### Configure Supabase for Production

1. Go to **Authentication → URL Configuration**
2. Add your Vercel URL to **Site URL**
3. Add your Vercel URL to **Redirect URLs**

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Drag & Drop**: dnd-kit

## 📁 Project Structure

```
tierlist/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with room list
│   ├── create/            # Create room page
│   ├── join/              # Join room page
│   ├── room/[roomId]/     # Game room page
│   └── api/bot-answers/   # Generates bot submissions for a round
├── lib/
│   └── bots/              # Bot answer generation, validation, fallbacks
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── CategorySelector  # Judge's category picker
│   ├── PlayerSpeechInput # Player submission form
│   ├── JudgeOrderingBoard # Drag-to-order interface
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useGameState.ts   # Main game state management
│   └── useLocalPlayer.ts # Player identification
├── data/
│   └── categories.ts     # 250+ game categories
├── supabase/
│   └── schema.sql        # Database schema & functions
└── public/
    └── music/            # Background music files
```

## 🎮 Game Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Waiting    │────▶│ Category Select  │────▶│  Submitting │
│   Room      │     │   (Judge picks)  │     │  (Players)  │
└─────────────┘     └──────────────────┘     └─────────────┘
                                                    │
┌─────────────┐     ┌──────────────────┐            ▼
│  Game Over  │◀────│    Results       │◀────┌─────────────┐
│  (Winner!)  │     │  (Show scores)   │     │   Judging   │
└─────────────┘     └──────────────────┘     │(Judge orders)│
                           │                 └─────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │   Next Round     │
                    │ (New judge picks)│
                    └──────────────────┘
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest new features
- 🎨 Add new categories
- 🔧 Submit pull requests

## 📜 License

MIT License - feel free to use this for your own party games!

---

**Made with ❤️ for game nights everywhere**
