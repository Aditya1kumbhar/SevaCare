-- Telemedicine sessions table
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  doctor_name TEXT,
  room_code TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  bandwidth_mode TEXT DEFAULT 'normal' CHECK (bandwidth_mode IN ('low', 'normal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage telemedicine sessions" ON telemedicine_sessions FOR ALL USING (auth.role() = 'authenticated');
