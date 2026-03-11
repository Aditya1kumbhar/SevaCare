-- ============================================
-- SevaCare MVP — Supabase Schema
-- ZERO-COST stack: Supabase Auth + wa.me links
-- Copy & paste this into Supabase SQL Editor
-- ============================================

-- 1. Residents table
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  room_number TEXT,
  family_contact_name TEXT NOT NULL,
  family_phone_number TEXT NOT NULL,  -- WhatsApp number with country code (e.g., +919876543210)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read residents"
  ON residents FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert residents"
  ON residents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update residents"
  ON residents FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete residents"
  ON residents FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Daily Logs table
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  caretaker_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('good', 'fair', 'poor', 'critical')),
  meal_taken BOOLEAN DEFAULT false,
  medication_taken BOOLEAN DEFAULT false,
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'sad', 'agitated')),
  notes TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read logs"
  ON daily_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Caretakers can insert own logs"
  ON daily_logs FOR INSERT WITH CHECK (auth.uid() = caretaker_id);

-- 3. Indexes for performance
CREATE INDEX daily_logs_resident_idx ON daily_logs(resident_id);
CREATE INDEX daily_logs_caretaker_idx ON daily_logs(caretaker_id);
CREATE INDEX daily_logs_logged_at_idx ON daily_logs(logged_at DESC);

-- ============================================
-- ✅ Done! 2 tables: residents, daily_logs
-- Auth handled by Supabase Auth (no extra table)
-- WhatsApp via wa.me links (zero cost)
-- ============================================
