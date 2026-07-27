-- ============================================
-- Patch 005: Activity Gamification
-- Adds gamification tracking to residents
-- ============================================

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS gamification_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- The 'activities' table was already created in 002_expanded_schema.sql, but we can ensure the points_earned triggers an update if we wanted to, or handle it in the application logic. 
-- In this case, we will handle the score incrementing directly in the Next.js application logic.
