
-- ROLLBACK SCRIPT
-- Run this if you need to revert the migration

-- Revert brand IDs
UPDATE brands SET id = 'iphone' WHERE id = 'BR20250111000002';
UPDATE brands SET id = 'samsung' WHERE id = 'BR020250120000001';

-- Revert phone_models foreign keys
UPDATE phone_models SET brand_id = 'iphone' WHERE brand_id = 'BR20250111000002';
UPDATE phone_models SET brand_id = 'samsung' WHERE brand_id = 'BR020250120000001';

-- Revert orders foreign keys
UPDATE orders SET brand_id = 'iphone' WHERE brand_id = 'BR20250111000002';
UPDATE orders SET brand_id = 'samsung' WHERE brand_id = 'BR020250120000001';

-- Re-enable Google
UPDATE brands SET is_available = true WHERE id = 'google';
