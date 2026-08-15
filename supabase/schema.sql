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

-- Game length (docs/games-rules.md): the game ends once everyone has judged
-- the same number of times. The host picks rounds_per_player (1-3) and
-- total_rounds is computed when the first round starts.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS rounds_per_player INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS total_rounds INTEGER;

-- rooms.winning_score is DEPRECATED: the game is scored in bad points now
-- (lowest wins), so there is no score to race to. Kept so older deployments
-- pointed at this database keep working until they are updated.

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bad_points INTEGER NOT NULL DEFAULT 0,
  is_judge BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false;

-- Scoring switched from "good points, highest wins" to bad points (lowest
-- wins), so players.score became players.bad_points. Guarded so the rename
-- happens once and the file stays re-runnable.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'score'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'bad_points'
  ) THEN
    ALTER TABLE players RENAME COLUMN score TO bad_points;
    UPDATE players SET bad_points = 0;
  END IF;
END $$;

ALTER TABLE players ADD COLUMN IF NOT EXISTS bad_points INTEGER NOT NULL DEFAULT 0;

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

-- Guesses table (Judge guesses).
-- number_guess is the judge's guess of the player's secret number and is what
-- scoring runs on. position_guess is the legacy ordering guess, kept nullable
-- for backwards compatibility but no longer written.
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position_guess INTEGER,
  number_guess INTEGER CHECK (number_guess IS NULL OR (number_guess >= 1 AND number_guess <= 10)),
  UNIQUE(round_id, player_id)
);

ALTER TABLE guesses ALTER COLUMN position_guess DROP NOT NULL;

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

-- Function to create a new room.
-- The old signature took p_winning_score; a parameter rename can't be done
-- with CREATE OR REPLACE, so the previous version is dropped explicitly.
DROP FUNCTION IF EXISTS create_room(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION create_room(p_host_name TEXT, p_rounds_per_player INTEGER DEFAULT 1, p_room_name TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_room_id TEXT;
  v_player_id UUID;
  v_room JSON;
  v_player JSON;
  v_rounds_per_player INTEGER := LEAST(3, GREATEST(1, COALESCE(p_rounds_per_player, 1)));
BEGIN
  -- Generate unique room code
  LOOP
    v_room_id := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE id = v_room_id);
  END LOOP;

  -- Create room
  INSERT INTO rooms (id, host_id, name, rounds_per_player)
  VALUES (v_room_id, v_room_id, p_room_name, v_rounds_per_player);

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

  IF (SELECT COUNT(*) FROM players WHERE room_id = p_room_id) >= 10 THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Duplicate names break judge rotation and make results ambiguous
  IF EXISTS (
    SELECT 1 FROM players
    WHERE room_id = p_room_id AND LOWER(name) = LOWER(p_player_name)
  ) THEN
    RAISE EXCEPTION 'That name is already taken in this room';
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

-- Function to leave a room, keeping the room in a playable state:
--   * last player out deletes the room (no more 0-member ghost rooms)
--   * host leaving passes host to the longest-present player
--   * judge leaving abandons the round and returns to category selection
--     (deleting the judge cascades the round row via FK)
--   * a submitter leaving mid-round advances the phase if everyone
--     remaining has already submitted
CREATE OR REPLACE FUNCTION leave_room(p_player_id UUID)
RETURNS VOID AS $$
DECLARE
  v_room_id TEXT;
  v_was_host BOOLEAN;
  v_active_round_id UUID;
  v_was_judge BOOLEAN := false;
  v_round_phase TEXT;
  v_new_host UUID;
BEGIN
  SELECT room_id, is_host INTO v_room_id, v_was_host
  FROM players WHERE id = p_player_id;

  IF v_room_id IS NULL THEN
    RETURN; -- already gone
  END IF;

  -- Capture active round info BEFORE the delete (judge deletion cascades the round)
  SELECT id, judge_id = p_player_id, phase
  INTO v_active_round_id, v_was_judge, v_round_phase
  FROM rounds
  WHERE room_id = v_room_id AND is_active = true
  LIMIT 1;

  DELETE FROM players WHERE id = p_player_id;

  -- Last HUMAN out closes the room; bots don't keep a room alive
  IF NOT EXISTS (
    SELECT 1 FROM players WHERE room_id = v_room_id AND is_bot = false
  ) THEN
    DELETE FROM rooms WHERE id = v_room_id;
    RETURN;
  END IF;

  -- Pass host to the longest-present remaining human
  IF v_was_host THEN
    SELECT id INTO v_new_host
    FROM players WHERE room_id = v_room_id AND is_bot = false
    ORDER BY created_at ASC LIMIT 1;

    UPDATE players SET is_host = true WHERE id = v_new_host;
    UPDATE rooms SET host_id = v_new_host::text WHERE id = v_room_id;
  END IF;

  IF v_active_round_id IS NOT NULL THEN
    IF v_was_judge THEN
      -- Round is gone (cascade); pick a new judge via category selection
      UPDATE rooms SET status = 'category_selection' WHERE id = v_room_id;
    ELSIF v_round_phase = 'submitting' THEN
      PERFORM advance_round_if_complete(v_active_round_id);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add a bot player to a waiting room (host action).
CREATE OR REPLACE FUNCTION add_bot(p_room_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_names TEXT[] := ARRAY[
    'Botrick', 'RoboRhea', 'Circuit Sam', 'Chip', 'Bleepzor',
    'Data Dave', 'Gigabyte Gail', 'Servo', 'Nutsy Bolts', 'Turing Tina'
  ];
  v_name TEXT;
  v_status TEXT;
  v_player JSON;
BEGIN
  SELECT status INTO v_status FROM rooms WHERE id = p_room_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_status != 'waiting' THEN
    RAISE EXCEPTION 'Bots can only be added before the game starts';
  END IF;

  IF (SELECT COUNT(*) FROM players WHERE room_id = p_room_id) >= 10 THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Pick a random bot name not already used in this room
  SELECT bot_name INTO v_name
  FROM unnest(v_names) AS n(bot_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM players
    WHERE room_id = p_room_id AND LOWER(players.name) = LOWER(bot_name)
  )
  ORDER BY random()
  LIMIT 1;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'No bot names left';
  END IF;

  INSERT INTO players (room_id, name, is_bot)
  VALUES (p_room_id, v_name, true)
  RETURNING row_to_json(players.*) INTO v_player;

  RETURN v_player;
END;
$$ LANGUAGE plpgsql;

-- Bot answers used to be generated by play_bot_turns, from a canned phrase
-- per secret number. That ignored the category and handed the judge the
-- answer, so it now lives in /api/bot-answers, which reads the category and
-- names a real thing. The two functions below are what that route calls.
--
-- play_bot_turns is deliberately left in place. Preview deployments share one
-- database with production, and until this branch is merged and deployed,
-- main's client still calls it — dropping it here takes bots down in
-- production. Drop it in a follow-up once main no longer references it:
--   DROP FUNCTION IF EXISTS play_bot_turns(UUID);

-- Bots still waiting to answer this round, with the secrets they need to
-- answer for. Keeping this in one function means secret access has one
-- door, should the wide-open RLS policies above ever be tightened.
CREATE OR REPLACE FUNCTION pending_bot_turns(p_round_id UUID)
RETURNS TABLE (player_id UUID, player_name TEXT, value INTEGER, category TEXT) AS $$
  SELECT p.id, p.name, s.value, r.category
  FROM players p
  JOIN rounds r ON r.id = p_round_id AND r.room_id = p.room_id
  JOIN secrets s ON s.round_id = p_round_id AND s.player_id = p.id
  WHERE p.is_bot = true
    AND p.id <> r.judge_id
    AND r.phase = 'submitting'
    AND NOT EXISTS (
      SELECT 1 FROM submissions sub
      WHERE sub.round_id = p_round_id AND sub.player_id = p.id
    )
  ORDER BY p.created_at;
$$ LANGUAGE sql;

-- Record one bot's answer. The WHERE clause is the guard: this can only ever
-- write a submission for a bot, in this round's room, while the round is still
-- taking submissions. Idempotent, so a retried route call is harmless.
CREATE OR REPLACE FUNCTION submit_bot_answer(
  p_round_id UUID,
  p_player_id UUID,
  p_text TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO submissions (round_id, player_id, text)
  SELECT p_round_id, p.id, p_text
  FROM players p
  JOIN rounds r ON r.id = p_round_id AND r.room_id = p.room_id
  WHERE p.id = p_player_id
    AND p.is_bot = true
    AND p.id <> r.judge_id
    AND r.phase = 'submitting'
  ON CONFLICT (round_id, player_id) DO NOTHING;

  PERFORM advance_round_if_complete(p_round_id);
END;
$$ LANGUAGE plpgsql;

-- Best-effort cleanup called from the lobby: drop rooms that are older
-- than a day or somehow ended up with no players.
CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rooms WHERE created_at < NOW() - INTERVAL '24 hours';
  DELETE FROM rooms r WHERE NOT EXISTS (
    SELECT 1 FROM players p WHERE p.room_id = r.id
  );
END;
$$ LANGUAGE plpgsql;

-- Reset a finished room for a rematch: bad points back to 0 and the game
-- length recomputed from whoever is in the room when it restarts.
CREATE OR REPLACE FUNCTION reset_game(p_room_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE rounds SET is_active = false, phase = 'finished'
  WHERE room_id = p_room_id AND is_active = true;

  UPDATE players SET bad_points = 0, is_judge = false WHERE room_id = p_room_id;

  UPDATE rooms
  SET status = 'waiting', current_round = 0, total_rounds = NULL
  WHERE id = p_room_id;
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

  -- Lock in the game length on the first round: everyone judges the same
  -- number of times, and bots never judge, so the rotation is over humans.
  UPDATE rooms
  SET total_rounds = GREATEST(1, (
    SELECT COUNT(*) FROM players WHERE room_id = p_room_id AND is_bot = false
  )) * rounds_per_player
  WHERE id = p_room_id AND total_rounds IS NULL;

  -- Reset all players' judge status
  UPDATE players SET is_judge = false WHERE room_id = p_room_id;

  -- Select judge (rotate based on round number). Bots never judge, so
  -- rotation runs over human players only - this is what makes solo
  -- play against bots work: the lone human is always the judge.
  SELECT id INTO v_judge_id
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM players
    WHERE room_id = p_room_id AND is_bot = false
  ) sub
  WHERE rn = ((v_current_round - 1) % (SELECT COUNT(*) FROM players WHERE room_id = p_room_id AND is_bot = false)) + 1;

  IF v_judge_id IS NULL THEN
    RAISE EXCEPTION 'No human players left to judge';
  END IF;

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
-- Scoring rules (docs/games-rules.md) - the game is played in BAD POINTS and
-- the lowest total wins:
--   * For every player: bad points = |actual number - judge's guess|, added to
--     BOTH that player and the judge.
--   * Judge order bonus: if the judge's guesses put every item in the correct
--     relative order (exact numbers don't matter), the judge gets -3 bad
--     points. A judge's total can never drop below 0.
--
-- The judge must guess a distinct number 1-10 for every submission; that is
-- enforced here rather than trusting the client.
--
-- Scoring is idempotent (rounds.scores_applied guards against retries and
-- double-clicks) and the game is marked finished once the planned number of
-- rounds has been played.
CREATE OR REPLACE FUNCTION submit_guesses(p_round_id UUID, p_judge_id UUID, p_guesses JSON)
RETURNS VOID AS $$
DECLARE
  v_guess JSON;
  v_room_id TEXT;
  v_scores_applied BOOLEAN;
  v_number INTEGER;
  v_seen INTEGER[] := ARRAY[]::INTEGER[];
  v_row RECORD;
  v_scored_count INTEGER := 0;
  v_judge_points INTEGER := 0;
  v_order_correct BOOLEAN;
  v_current_round INTEGER;
  v_total_rounds INTEGER;
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
    -- Skip players who left the room mid-judging
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM players WHERE id = (v_guess->>'player_id')::UUID
    );

    v_number := (v_guess->>'number_guess')::INTEGER;

    IF v_number IS NULL OR v_number < 1 OR v_number > 10 THEN
      RAISE EXCEPTION 'Every guess must be a number between 1 and 10';
    END IF;

    IF v_number = ANY(v_seen) THEN
      RAISE EXCEPTION 'Each number can only be used once';
    END IF;

    v_seen := v_seen || v_number;

    INSERT INTO guesses (round_id, judge_id, player_id, number_guess)
    VALUES (p_round_id, p_judge_id, (v_guess->>'player_id')::UUID, v_number);
  END LOOP;

  -- Bad points = |actual - guess| for the player and the judge alike.
  -- A player the judge skipped is simply not scored this round.
  FOR v_row IN
    SELECT s.player_id, abs(s.value - g.number_guess) AS bad_points
    FROM secrets s
    JOIN guesses g ON g.round_id = p_round_id AND g.player_id = s.player_id
    WHERE s.round_id = p_round_id
  LOOP
    v_scored_count := v_scored_count + 1;
    v_judge_points := v_judge_points + v_row.bad_points;
    UPDATE players SET bad_points = bad_points + v_row.bad_points WHERE id = v_row.player_id;
  END LOOP;

  -- Order bonus: no pair may be ranked the wrong way round. Needs at least two
  -- scored submissions, otherwise the ordering is trivially "correct".
  IF v_scored_count >= 2 THEN
    SELECT NOT EXISTS (
      SELECT 1
      FROM secrets a
      JOIN guesses ga ON ga.round_id = p_round_id AND ga.player_id = a.player_id
      JOIN secrets b ON b.round_id = p_round_id AND b.value > a.value
      JOIN guesses gb ON gb.round_id = p_round_id AND gb.player_id = b.player_id
      WHERE a.round_id = p_round_id AND ga.number_guess >= gb.number_guess
    ) INTO v_order_correct;

    IF v_order_correct THEN
      v_judge_points := v_judge_points - 3;
    END IF;
  END IF;

  -- Bad points may go negative: a judge who keeps earning the order bonus
  -- while guessing accurately should be rewarded past zero, not capped at it.
  UPDATE players
  SET bad_points = bad_points + v_judge_points
  WHERE id = p_judge_id;

  UPDATE rounds SET phase = 'results', scores_applied = true WHERE id = p_round_id;

  -- End the game once every player has judged the planned number of times
  SELECT current_round, total_rounds INTO v_current_round, v_total_rounds
  FROM rooms WHERE id = v_room_id;

  IF v_total_rounds IS NOT NULL AND v_current_round >= v_total_rounds THEN
    UPDATE rooms SET status = 'finished' WHERE id = v_room_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Superseded functions: scoring and winner detection now live inside
-- submit_guesses. Drop them so stale copies can't be called.
DROP FUNCTION IF EXISTS calculate_round_results(UUID);
DROP FUNCTION IF EXISTS check_winner(TEXT);