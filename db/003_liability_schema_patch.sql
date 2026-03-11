-- Run this in your Supabase SQL Editor immediately

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS life_threatening_allergies TEXT,
  ADD COLUMN IF NOT EXISTS mobility_status TEXT CHECK (mobility_status IN ('Independent', 'Assisted', 'Bedridden')),
  ADD COLUMN IF NOT EXISTS critical_conditions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wandering_risk BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aggression_triggers TEXT,
  ADD COLUMN IF NOT EXISTS communication_barrier TEXT CHECK (communication_barrier IN ('Clear', 'Hard of Hearing', 'Non-Verbal', 'Dementia-Impaired'));
