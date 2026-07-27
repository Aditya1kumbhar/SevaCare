-- ============================================
-- Patch 007: Add blood_group column to residents
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER TABLE residents
  ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
