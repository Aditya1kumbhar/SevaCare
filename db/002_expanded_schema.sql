-- ============================================
-- SevaCare Full Platform — Supabase Schema
-- Run this AFTER the initial 2-table schema
-- Copy & paste into Supabase SQL Editor
-- ============================================

-- 1. Update residents table with strict liability & operational fields
ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS life_threatening_allergies TEXT,
  ADD COLUMN IF NOT EXISTS mobility_status TEXT CHECK (mobility_status IN ('Independent', 'Assisted', 'Bedridden')),
  ADD COLUMN IF NOT EXISTS critical_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wandering_risk BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aggression_triggers TEXT,
  ADD COLUMN IF NOT EXISTS communication_barrier TEXT CHECK (communication_barrier IN ('Clear', 'Hard of Hearing', 'Non-Verbal', 'Dementia-Impaired'));


-- 2. Health Records (detailed vitals tracking)
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

-- 3. Inventory (medicine & equipment)
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

-- 4. Staff members
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

-- 5. Schedules / Shifts
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

-- 6. Family members
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

-- 7. Prescriptions
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

-- 8. Activities & Engagement (gamification)
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

-- 9. Emergency Alerts
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

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS health_records_resident_idx ON health_records(resident_id);
CREATE INDEX IF NOT EXISTS health_records_recorded_at_idx ON health_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS inventory_category_idx ON inventory(category);
CREATE INDEX IF NOT EXISTS schedules_date_idx ON schedules(shift_date);
CREATE INDEX IF NOT EXISTS prescriptions_resident_idx ON prescriptions(resident_id);
CREATE INDEX IF NOT EXISTS activities_resident_idx ON activities(resident_id);
CREATE INDEX IF NOT EXISTS emergency_alerts_resident_idx ON emergency_alerts(resident_id);

-- ============================================
-- ✅ Schema expanded! Total tables: 10
-- residents, daily_logs, health_records, inventory,
-- staff, schedules, family_members, prescriptions,
-- activities, emergency_alerts
-- ============================================
