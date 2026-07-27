-- ========================================================
-- 🪷 SevaCare Complete Platform — Consolidated Supabase Schema
-- Copy & paste this ENTIRE script into Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/pdzwxijuktpmcvnodnzn/sql/new
-- ========================================================

-- 1. Residents table
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  room_number TEXT,
  family_contact_name TEXT NOT NULL,
  family_phone_number TEXT NOT NULL,
  notes TEXT,
  life_threatening_allergies TEXT,
  mobility_status TEXT CHECK (mobility_status IN ('Independent', 'Assisted', 'Bedridden')),
  critical_conditions TEXT[] DEFAULT '{}',
  wandering_risk BOOLEAN DEFAULT false,
  aggression_triggers TEXT,
  communication_barrier TEXT CHECK (communication_barrier IN ('Clear', 'Hard of Hearing', 'Non-Verbal', 'Dementia-Impaired')),
  medications JSONB DEFAULT '[]'::jsonb,
  gamification_score INTEGER DEFAULT 0,
  activity_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read residents" ON residents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert residents" ON residents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update residents" ON residents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete residents" ON residents FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Daily Logs table
CREATE TABLE IF NOT EXISTS daily_logs (
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

CREATE POLICY "Authenticated users can read logs" ON daily_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Caretakers can insert own logs" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = caretaker_id);

-- 3. Health Records (detailed vitals tracking)
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  blood_pressure TEXT,
  heart_rate INTEGER,
  temperature DECIMAL,
  weight DECIMAL,
  blood_sugar DECIMAL,
  oxygen_level INTEGER,
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read health_records" ON health_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert health_records" ON health_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Inventory (medicine & equipment)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medicine', 'equipment', 'supplies')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  min_threshold INTEGER DEFAULT 5,
  expiry_date DATE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read inventory" ON inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert inventory" ON inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update inventory" ON inventory FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete inventory" ON inventory FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Staff members
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('nurse', 'caretaker', 'doctor', 'volunteer', 'admin')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read staff" ON staff FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert staff" ON staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update staff" ON staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can delete staff" ON staff FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Schedules / Shifts
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent')),
  notes TEXT
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read schedules" ON schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert schedules" ON schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update schedules" ON schedules FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Family members
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read family_members" ON family_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert family_members" ON family_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  prescribed_by TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read prescriptions" ON prescriptions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update prescriptions" ON prescriptions FOR UPDATE USING (auth.role() = 'authenticated');

-- 9. Activities & Engagement (gamification)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('exercise', 'game', 'social', 'learning', 'meditation')),
  activity_name TEXT NOT NULL,
  duration_minutes INTEGER,
  points_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read activities" ON activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert activities" ON activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. Emergency Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('medical', 'fall', 'missing', 'fire', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  triggered_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read emergency_alerts" ON emergency_alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can insert emergency_alerts" ON emergency_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth users can update emergency_alerts" ON emergency_alerts FOR UPDATE USING (auth.role() = 'authenticated');

-- 11. Telemedicine Sessions (AN319 Feature)
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

-- 12. Consent Records (AN319 Feature)
CREATE TABLE IF NOT EXISTS consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('medical_sharing', 'family_activity', 'research_data')),
  granted BOOLEAN DEFAULT false,
  granted_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage consent records" ON consent_records FOR ALL USING (auth.role() = 'authenticated');
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_unique ON consent_records(resident_id, consent_type);

-- 13. Enable Realtime on emergency_alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;

-- 14. Performance Indexes
CREATE INDEX IF NOT EXISTS daily_logs_resident_idx ON daily_logs(resident_id);
CREATE INDEX IF NOT EXISTS daily_logs_caretaker_idx ON daily_logs(caretaker_id);
CREATE INDEX IF NOT EXISTS daily_logs_logged_at_idx ON daily_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS health_records_resident_idx ON health_records(resident_id);
CREATE INDEX IF NOT EXISTS health_records_recorded_at_idx ON health_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS inventory_category_idx ON inventory(category);
CREATE INDEX IF NOT EXISTS schedules_date_idx ON schedules(shift_date);
CREATE INDEX IF NOT EXISTS prescriptions_resident_idx ON prescriptions(resident_id);
CREATE INDEX IF NOT EXISTS activities_resident_idx ON activities(resident_id);
CREATE INDEX IF NOT EXISTS emergency_alerts_resident_idx ON emergency_alerts(resident_id);
