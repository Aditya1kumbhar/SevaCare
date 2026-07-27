-- ============================================
-- Patch 006: Enable Realtime on emergency_alerts
-- Required for Supabase Realtime subscriptions
-- Run this in your Supabase SQL Editor
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE emergency_alerts;
