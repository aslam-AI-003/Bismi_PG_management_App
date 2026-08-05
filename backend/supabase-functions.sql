-- Bismi PG - Supabase RPC Functions
-- Run this AFTER running supabase-schema.sql in Supabase SQL Editor

-- Function to increment occupied_beds count for a room
CREATE OR REPLACE FUNCTION increment_occupied_beds(room_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE rooms SET occupied_beds = occupied_beds + 1 WHERE id = room_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement occupied_beds count for a room
CREATE OR REPLACE FUNCTION decrement_occupied_beds(room_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE rooms SET occupied_beds = GREATEST(0, occupied_beds - 1) WHERE id = room_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
