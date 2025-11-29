# 🎮 TIERLIST - The Party Game

A multiplayer party game where players try to fool the judge by picking items that match their secret number!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)

## 🎯 How to Play

1. **Create or Join a Room** - One player creates a room and shares the code with friends
2. **Judge Picks Category** - Each round, one player becomes the Judge and picks a category (e.g., "Foods That Slap at 3 AM")
3. **Players Get Secret Numbers** - Non-judge players receive a random number from 1-10
4. **Submit Your Item** - Pick something from the category that matches your number (1 = worst, 10 = best)
5. **Judge Guesses** - The Judge orders players from lowest to highest and tries to guess their exact numbers
6. **Score Points** - Players earn points by FOOLING the judge!

## 🏆 Scoring

The Judge orders players from lowest to highest number, then can guess their **exact numbers**.

| Action | Points |
|--------|--------|
| Judge guesses your **exact number** | **Both** Player +1 AND Judge +1 |
| Position ordering | No points (just for fun!) |

**First to 10 points wins!**

> 💡 **Strategy Tip**: As a player, try to pick items that could match multiple numbers to confuse the Judge!

## ✨ Features

- 🎲 **250+ Categories** - From "Cereal Mascots You'd Trust with Your Life" to "Foods That Look Disgusting But Slap"
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
- **Drag & Drop**: dnd-kit

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
