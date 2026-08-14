# 🎮 TIERLIST - The Party Game

A multiplayer party game about understanding how other people think: everyone picks an item that represents their secret number, and the Judge tries to work out which number each item is.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## 🎯 How to Play

1. **Create or Join a Room** - One player creates a room and shares the code with friends (or adds bot players to fill seats)
2. **Judge Picks Category** - Each round, one player becomes the Judge and picks a category (e.g., "Foods That Slap at 3 AM")
3. **Players Get Unique Numbers** - Non-judge players receive a unique number from 1-10 (no duplicates!), hidden from everyone else
4. **Submit Your Item** - Pick something from the category that represents your number (1 = worst, 10 = best)
5. **Judge Guesses** - The Judge sees every answer without names, and gives each one the number they think it is
6. **Collect Bad Points** - The further off the guess, the more bad points for the player *and* the Judge

## 🏆 Scoring

The game is scored in **bad points**, and **lower is always better**.

| Action | Bad points |
|--------|-----------|
| Every answer | `\|actual number − Judge's guess\|`, given to the player **and** the Judge |
| Judge gets the **relative order** of every answer right (exact numbers don't matter) | Judge **−3** |

A player's total can never drop below 0.

**When the game ends** (everyone has judged the same number of times), the player with the
**fewest bad points wins**.

> 💡 **Strategy Tip**: Help the Judge see the scale without making your exact number obvious - and as Judge, remember that a perfect *order* is worth 3 bad points even when every number is wrong.

The canonical rules live in [`docs/games-rules.md`](docs/games-rules.md).

## ✨ Features

- 🎲 **250+ Categories** - From "Cereal Mascots You'd Trust with Your Life" to "Foods That Look Disgusting But Slap"
- 🤖 **Bot Players** - Short on friends? The host can add bots that answer with number-flavored hints. Add two bots and you can even play solo as the permanent judge!
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
```

### 4. Run the Game

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start playing!

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
- **Animation**: Framer Motion

## 📁 Project Structure

```
tierlist/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with room list
│   ├── create/            # Create room page
│   ├── join/              # Join room page
│   └── room/[roomId]/     # Game room page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── CategorySelector  # Judge's category picker
│   ├── PlayerSpeechInput # Player submission form
│   ├── JudgeNumberGuessInterface # Judge assigns 1-10 to each answer
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
│  Game Over  │◀────│    Results       │◀────┌──────────────┐
│(Fewest bad) │     │  (Bad points)    │     │   Judging    │
└─────────────┘     └──────────────────┘     │(Judge guesses│
                           │                 │ the numbers) │
                           │                 └──────────────┘
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
