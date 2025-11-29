# TIERLIST - The Party Game 🎮

A real-time multiplayer party game where players guess rankings! Built with Next.js 14, Supabase, and TailwindCSS.

## 🎯 Game Rules

1. **Judge Selection**: At the start of each turn, one player becomes the "Judge"
2. **Category Card**: The Judge receives a category (e.g., "Animals", "Sports", "Snacks")
3. **Secret Numbers**: Each non-Judge player receives a secret number from 1-10
4. **Submit Items**: Players say an item from the category that matches their number's ranking
5. **Judge Guesses**: The Judge orders players from lowest to highest and tries to guess exact numbers

### Scoring
- **+1 point** to player if Judge places them in the correct position
- **+1 point** to both Judge AND player if Judge guesses the exact number
- First to reach the winning score (default: 10) wins!

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo>
cd tierlist
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## 📁 Project Structure

```
tierlist/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── create/page.tsx    # Create room page
│   ├── join/page.tsx      # Join room page
│   └── room/[roomId]/     # Game room page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Logo.tsx
│   ├── CategoryCard.tsx
│   ├── NumberHintCard.tsx
│   ├── PlayerSpeechInput.tsx
│   ├── JudgeOrderingBoard.tsx
│   ├── JudgeNumberGuessInputs.tsx
│   ├── ResultScreen.tsx
│   ├── Scoreboard.tsx
│   ├── WaitingRoom.tsx
│   └── GameOver.tsx
├── hooks/                # Custom React hooks
│   ├── useGameState.ts   # Main game state management
│   └── useLocalPlayer.ts # Local storage for player data
├── lib/                  # Utility functions
│   ├── utils.ts
│   └── supabase/        # Supabase clients
├── data/
│   └── categories.ts    # 200+ game categories
├── types/
│   └── index.ts         # TypeScript types
└── supabase/
    └── schema.sql       # Database schema
```

## 🗄️ Database Schema

- **rooms** - Game rooms with status and settings
- **players** - Players in each room with scores
- **rounds** - Each round with category and judge
- **secrets** - Secret numbers for non-judge players
- **submissions** - Player item submissions
- **guesses** - Judge position and number guesses

## 🎨 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Animations**: Framer Motion
- **Drag & Drop**: dnd-kit

## 🎮 Features

- ✅ Create and join rooms with codes
- ✅ Real-time multiplayer updates
- ✅ Drag-and-drop ordering interface
- ✅ Automatic scoring
- ✅ 200+ categories
- ✅ Mobile-friendly design
- ✅ Dark theme with blue/red brand colors
- ✅ Animated UI transitions

## 📱 Screenshots

The game features a modern, dark-themed UI with:
- Clean waiting room with room code sharing
- Category reveal cards
- Secret number hints for players
- Drag-and-drop judge interface
- Animated result screens
- Live scoreboard

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📄 License

MIT License - feel free to use this for your own party games!

## 🤝 Contributing

Pull requests welcome! Please follow the existing code style and add tests for new features.

---

Made with ❤️ for game nights everywhere!

