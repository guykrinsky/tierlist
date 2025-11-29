-- TIERLIST Game Database Schema
-- Run this in your Supabase SQL Editor

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on rounds" ON rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on secrets" ON secrets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guesses" ON guesses FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE secrets;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;

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
BEGIN
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

  -- Assign random numbers to non-judge players
  FOR v_player IN SELECT id FROM players WHERE room_id = p_room_id AND id != v_judge_id LOOP
    INSERT INTO secrets (round_id, player_id, value)
    VALUES (v_round_id, v_player.id, floor(random() * 10 + 1)::int);
  END LOOP;

  -- Get round data
  SELECT row_to_json(r) INTO v_round FROM rounds r WHERE r.id = v_round_id;

  RETURN v_round;
END;
$$ LANGUAGE plpgsql;

-- Function to submit an item
CREATE OR REPLACE FUNCTION submit_item(p_round_id UUID, p_player_id UUID, p_text TEXT)
RETURNS JSON AS $$
DECLARE
  v_submission JSON;
BEGIN
  INSERT INTO submissions (round_id, player_id, text)
  VALUES (p_round_id, p_player_id, p_text)
  ON CONFLICT (round_id, player_id) DO UPDATE SET text = p_text
  RETURNING row_to_json(submissions.*) INTO v_submission;

  RETURN v_submission;
END;
$$ LANGUAGE plpgsql;

-- Function to submit judge guesses
CREATE OR REPLACE FUNCTION submit_guesses(p_round_id UUID, p_judge_id UUID, p_guesses JSON)
RETURNS VOID AS $$
DECLARE
  v_guess JSON;
BEGIN
  -- Delete existing guesses for this round
  DELETE FROM guesses WHERE round_id = p_round_id AND judge_id = p_judge_id;

  -- Insert new guesses
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

  -- Update round phase to results
  UPDATE rounds SET phase = 'results' WHERE id = p_round_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and apply round results
CREATE OR REPLACE FUNCTION calculate_round_results(p_round_id UUID)
RETURNS JSON AS $$
DECLARE
  v_results JSON;
  v_player RECORD;
  v_secret RECORD;
  v_guess RECORD;
  v_actual_positions JSON;
  v_position INTEGER;
  v_player_points INTEGER;
  v_judge_points INTEGER := 0;
  v_judge_id UUID;
  v_room_id TEXT;
  v_all_positions_correct BOOLEAN := TRUE;
  v_player_count INTEGER := 0;
BEGIN
  -- Get judge_id and room_id
  SELECT judge_id, room_id INTO v_judge_id, v_room_id FROM rounds WHERE id = p_round_id;

  -- Build actual positions based on secret values
  WITH ranked AS (
    SELECT 
      s.player_id,
      s.value,
      ROW_NUMBER() OVER (ORDER BY s.value ASC) as actual_position
    FROM secrets s
    WHERE s.round_id = p_round_id
  )
  SELECT json_agg(json_build_object(
    'player_id', ranked.player_id,
    'value', ranked.value,
    'actual_position', ranked.actual_position
  )) INTO v_actual_positions
  FROM ranked;

  -- Calculate points for each player
  FOR v_player IN 
    SELECT p.id, p.name 
    FROM players p 
    WHERE p.room_id = v_room_id AND p.id != v_judge_id 
  LOOP
    v_player_points := 0;
    v_player_count := v_player_count + 1;
    
    -- Get secret and guess for this player
    SELECT value INTO v_secret FROM secrets WHERE round_id = p_round_id AND player_id = v_player.id;
    SELECT position_guess, number_guess INTO v_guess FROM guesses WHERE round_id = p_round_id AND player_id = v_player.id;
    
    -- Get actual position
    SELECT actual_position INTO v_position
    FROM json_to_recordset(v_actual_positions) AS x(player_id UUID, value INTEGER, actual_position INTEGER)
    WHERE x.player_id = v_player.id;

    -- Check if position is correct (for full ordering check)
    IF v_guess.position_guess != v_position THEN
      v_all_positions_correct := FALSE;
    END IF;

    -- Number correct → Both Judge +1 AND Player +1
    IF v_guess.number_guess IS NOT NULL AND v_guess.number_guess = v_secret.value THEN
      v_player_points := v_player_points + 1;
      v_judge_points := v_judge_points + 1;
    END IF;

    -- Update player score
    UPDATE players SET score = score + v_player_points WHERE id = v_player.id;
  END LOOP;

  -- Judge gets +1 only if ALL positions are correct (full ordering bonus)
  IF v_all_positions_correct AND v_player_count > 0 THEN
    v_judge_points := v_judge_points + 1;
  END IF;

  -- Update judge score
  UPDATE players SET score = score + v_judge_points WHERE id = v_judge_id;

  -- Keep the round active with 'results' phase so UI can display results
  -- The round will be deactivated when the next round starts
  -- (start_round already handles: UPDATE rounds SET is_active = false, phase = 'finished')

  RETURN v_actual_positions;
END;
$$ LANGUAGE plpgsql;

-- Function to check for winner
CREATE OR REPLACE FUNCTION check_winner(p_room_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_winner JSON;
  v_winning_score INTEGER;
BEGIN
  SELECT winning_score INTO v_winning_score FROM rooms WHERE id = p_room_id;

  SELECT row_to_json(p) INTO v_winner
  FROM players p
  WHERE p.room_id = p_room_id AND p.score >= v_winning_score
  ORDER BY p.score DESC
  LIMIT 1;

  IF v_winner IS NOT NULL THEN
    UPDATE rooms SET status = 'finished' WHERE id = p_room_id;
  END IF;

  RETURN v_winner;
END;
$$ LANGUAGE plpgsql;

