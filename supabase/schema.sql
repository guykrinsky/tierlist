-- TIERLIST Game Database Schema
-- Run this in your Supabase SQL Editor. Safe to re-run: the whole file is idempotent.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY DEFAULT upper(substring(md5(random()::text) from 1 for 6)),
  host_id TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'category_selection')),
  winning_score INTEGER NOT NULL DEFAULT 10,
  current_round INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  is_judge BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phase TEXT NOT NULL DEFAULT 'waiting' CHECK (phase IN ('waiting', 'submitting', 'judging', 'results', 'finished')),
  scores_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Columns added after initial release (no-ops on fresh installs)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS scores_applied BOOLEAN NOT NULL DEFAULT false;

-- Secrets table (player secret numbers)
CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 10),
  UNIQUE(round_id, player_id)
);

-- Submissions table (player spoken items)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id, player_id)
);

-- Guesses table (Judge guesses)
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position_guess INTEGER NOT NULL,
  number_guess INTEGER CHECK (number_guess IS NULL OR (number_guess >= 1 AND number_guess <= 10)),
  UNIQUE(round_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_rounds_room_id ON rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_secrets_round_id ON secrets(round_id);
CREATE INDEX IF NOT EXISTS idx_submissions_round_id ON submissions(round_id);
CREATE INDEX IF NOT EXISTS idx_guesses_round_id ON guesses(round_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now - in production, you'd want more restrictive policies)
DROP POLICY IF EXISTS "Allow all on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow all on players" ON players;
DROP POLICY IF EXISTS "Allow all on rounds" ON rounds;
DROP POLICY IF EXISTS "Allow all on secrets" ON secrets;
DROP POLICY IF EXISTS "Allow all on submissions" ON submissions;
DROP POLICY IF EXISTS "Allow all on guesses" ON guesses;

CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rounds" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on secrets" ON secrets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guesses" ON guesses FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for tables (skip if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE secrets;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
  EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, skip
  END;
END $$;

-- Function to generate a room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new room
CREATE OR REPLACE FUNCTION create_room(p_host_name TEXT, p_winning_score INTEGER DEFAULT 10, p_room_name TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_room_id TEXT;
  v_player_id UUID;
  v_room JSON;
  v_player JSON;
BEGIN
  -- Generate unique room code
  LOOP
    v_room_id := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE id = v_room_id);
  END LOOP;

  -- Create room
  INSERT INTO rooms (id, host_id, name, winning_score)
  VALUES (v_room_id, v_room_id, p_room_name, p_winning_score);

  -- Create host player
  INSERT INTO players (room_id, name, is_host)
  VALUES (v_room_id, p_host_name, true)
  RETURNING id INTO v_player_id;

  -- Update room with actual host_id
  UPDATE rooms SET host_id = v_player_id::text WHERE id = v_room_id;

  -- Get room and player data
  SELECT row_to_json(r) INTO v_room FROM rooms r WHERE r.id = v_room_id;
  SELECT row_to_json(p) INTO v_player FROM players p WHERE p.id = v_player_id;

  RETURN json_build_object('room', v_room, 'player', v_player);
END;
$$ LANGUAGE plpgsql;

-- Function to join a room
CREATE OR REPLACE FUNCTION join_room(p_room_id TEXT, p_player_name TEXT)
RETURNS JSON AS $$
DECLARE
  v_player_id UUID;
  v_room JSON;
  v_player JSON;
  v_room_status TEXT;
BEGIN
  -- Check if room exists and is in waiting status
  SELECT status INTO v_room_status FROM rooms WHERE id = p_room_id;

  IF v_room_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_room_status != 'waiting' THEN
    RAISE EXCEPTION 'Game already started';
  END IF;

  -- Create player
  INSERT INTO players (room_id, name)
  VALUES (p_room_id, p_player_name)
  RETURNING id INTO v_player_id;

  -- Get room and player data
  SELECT row_to_json(r) INTO v_room FROM rooms r WHERE r.id = p_room_id;
  SELECT row_to_json(p) INTO v_player FROM players p WHERE p.id = v_player_id;

  RETURN json_build_object('room', v_room, 'player', v_player);
END;
$$ LANGUAGE plpgsql;

-- Function to start a new round
CREATE OR REPLACE FUNCTION start_round(p_room_id TEXT, p_category TEXT)
RETURNS JSON AS $$
DECLARE
  v_round_id UUID;
  v_judge_id UUID;
  v_round JSON;
  v_player RECORD;
  v_player_count INTEGER;
  v_current_round INTEGER;
  v_numbers INTEGER[] := ARRAY[1,2,3,4,5,6,7,8,9,10];
  v_shuffled INTEGER[];
  v_index INTEGER := 1;
BEGIN
  -- Count non-judge players
  SELECT COUNT(*) INTO v_player_count FROM players WHERE room_id = p_room_id;

  -- Check max 10 non-judge players (11 total with judge)
  IF v_player_count > 11 THEN
    RAISE EXCEPTION 'Too many players. Maximum 10 non-judge players allowed per round.';
  END IF;

  -- Deactivate all previous rounds for this room
  UPDATE rounds SET is_active = false, phase = 'finished' WHERE room_id = p_room_id AND is_active = true;

  -- Get current round number
  SELECT current_round INTO v_current_round FROM rooms WHERE id = p_room_id;
  v_current_round := COALESCE(v_current_round, 0) + 1;

  -- Update room status and round number
  UPDATE rooms SET status = 'playing', current_round = v_current_round WHERE id = p_room_id;

  -- Reset all players' judge status
  UPDATE players SET is_judge = false WHERE room_id = p_room_id;

  -- Select judge (rotate based on round number)
  SELECT id INTO v_judge_id
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM players
    WHERE room_id = p_room_id
  ) sub
  WHERE rn = ((v_current_round - 1) % (SELECT COUNT(*) FROM players WHERE room_id = p_room_id)) + 1;

  -- Set the judge
  UPDATE players SET is_judge = true WHERE id = v_judge_id;

  -- Create the round
  INSERT INTO rounds (room_id, judge_id, category, phase)
  VALUES (p_room_id, v_judge_id, p_category, 'submitting')
  RETURNING id INTO v_round_id;

  -- Shuffle the numbers array using Fisher-Yates algorithm
  v_shuffled := v_numbers;
  FOR i IN REVERSE 10..2 LOOP
    DECLARE
      j INTEGER := floor(random() * i + 1)::int;
      temp INTEGER := v_shuffled[i];
    BEGIN
      v_shuffled[i] := v_shuffled[j];
      v_shuffled[j] := temp;
    END;
  END LOOP;

  -- Assign UNIQUE random numbers to non-judge players from shuffled array
  FOR v_player IN SELECT id FROM players WHERE room_id = p_room_id AND id != v_judge_id ORDER BY created_at LOOP
    INSERT INTO secrets (round_id, player_id, value)
    VALUES (v_round_id, v_player.id, v_shuffled[v_index]);
    v_index := v_index + 1;
  END LOOP;

  -- Get round data
  SELECT row_to_json(r) INTO v_round FROM rounds r WHERE r.id = v_round_id;

  RETURN v_round;
END;
$$ LANGUAGE plpgsql;

-- Function to submit an item.
-- Also advances the round to 'judging' once every non-judge player has
-- submitted, so the phase transition is authoritative and race-free.
CREATE OR REPLACE FUNCTION submit_item(p_round_id UUID, p_player_id UUID, p_text TEXT)
RETURNS JSON AS $$
DECLARE
  v_submission JSON;
BEGIN
  INSERT INTO submissions (round_id, player_id, text)
  VALUES (p_round_id, p_player_id, p_text)
  ON CONFLICT (round_id, player_id) DO UPDATE SET text = EXCLUDED.text
  RETURNING row_to_json(submissions.*) INTO v_submission;

  PERFORM advance_round_if_complete(p_round_id);

  RETURN v_submission;
END;
$$ LANGUAGE plpgsql;

-- Move a round from 'submitting' to 'judging' when all expected
-- submissions are in. Shared by submit_item and leave_room.
CREATE OR REPLACE FUNCTION advance_round_if_complete(p_round_id UUID)
RETURNS VOID AS $$
DECLARE
  v_room_id TEXT;
  v_judge_id UUID;
  v_expected INTEGER;
  v_submitted INTEGER;
BEGIN
  SELECT room_id, judge_id INTO v_room_id, v_judge_id
  FROM rounds WHERE id = p_round_id AND phase = 'submitting';

  IF v_room_id IS NULL THEN
    RETURN; -- round not in submitting phase
  END IF;

  SELECT COUNT(*) INTO v_expected
  FROM players WHERE room_id = v_room_id AND id != v_judge_id;

  SELECT COUNT(*) INTO v_submitted
  FROM submissions WHERE round_id = p_round_id;

  IF v_expected > 0 AND v_submitted >= v_expected THEN
    UPDATE rounds SET phase = 'judging' WHERE id = p_round_id AND phase = 'submitting';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to submit judge guesses and score the round in one shot.
--
-- Scoring rules:
--   * Player placed at their exactly-correct position: player +1, judge +1
--   * Judge orders EVERYONE correctly: judge +2 bonus
--
-- Scoring is idempotent (rounds.scores_applied guards against retries and
-- double-clicks) and the game is marked finished when someone reaches the
-- room's winning score.
CREATE OR REPLACE FUNCTION submit_guesses(p_round_id UUID, p_judge_id UUID, p_guesses JSON)
RETURNS VOID AS $$
DECLARE
  v_guess JSON;
  v_room_id TEXT;
  v_scores_applied BOOLEAN;
  v_row RECORD;
  v_player_count INTEGER := 0;
  v_correct_count INTEGER := 0;
  v_judge_points INTEGER;
  v_winning_score INTEGER;
BEGIN
  SELECT room_id, scores_applied INTO v_room_id, v_scores_applied
  FROM rounds WHERE id = p_round_id;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Round not found';
  END IF;

  IF v_scores_applied THEN
    RETURN; -- already scored; ignore duplicate submissions
  END IF;

  -- Replace any existing guesses for this round
  DELETE FROM guesses WHERE round_id = p_round_id AND judge_id = p_judge_id;

  FOR v_guess IN SELECT * FROM json_array_elements(p_guesses) LOOP
    INSERT INTO guesses (round_id, judge_id, player_id, position_guess, number_guess)
    VALUES (
      p_round_id,
      p_judge_id,
      (v_guess->>'player_id')::UUID,
      (v_guess->>'position_guess')::INTEGER,
      (v_guess->>'number_guess')::INTEGER
    );
  END LOOP;

  -- Compare guessed positions against the true ordering by secret number.
  -- A player the judge skipped counts as incorrect (LEFT JOIN + COALESCE).
  FOR v_row IN
    WITH actual AS (
      SELECT player_id, ROW_NUMBER() OVER (ORDER BY value ASC) AS pos
      FROM secrets
      WHERE round_id = p_round_id
    )
    SELECT a.player_id, COALESCE(g.position_guess = a.pos, false) AS is_correct
    FROM actual a
    LEFT JOIN guesses g ON g.round_id = p_round_id AND g.player_id = a.player_id
  LOOP
    v_player_count := v_player_count + 1;
    IF v_row.is_correct THEN
      v_correct_count := v_correct_count + 1;
      UPDATE players SET score = score + 1 WHERE id = v_row.player_id;
    END IF;
  END LOOP;

  v_judge_points := v_correct_count;
  IF v_player_count > 0 AND v_correct_count = v_player_count THEN
    v_judge_points := v_judge_points + 2; -- perfect ordering bonus
  END IF;
  UPDATE players SET score = score + v_judge_points WHERE id = p_judge_id;

  UPDATE rounds SET phase = 'results', scores_applied = true WHERE id = p_round_id;

  -- End the game when someone reaches the winning score
  SELECT winning_score INTO v_winning_score FROM rooms WHERE id = v_room_id;
  IF EXISTS (
    SELECT 1 FROM players WHERE room_id = v_room_id AND score >= v_winning_score
  ) THEN
    UPDATE rooms SET status = 'finished' WHERE id = v_room_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Superseded functions: scoring and winner detection now live inside
-- submit_guesses. Drop them so stale copies can't be called.
DROP FUNCTION IF EXISTS calculate_round_results(UUID);
DROP FUNCTION IF EXISTS check_winner(TEXT);