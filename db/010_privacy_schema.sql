-- Consent records table
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

-- Add unique constraint to prevent duplicate consent entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_unique ON consent_records(resident_id, consent_type);
