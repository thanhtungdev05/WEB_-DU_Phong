-- 057: Correct the AP BE1500 display name to AP BE15000.
-- Migration 054 has already been applied in production and must remain immutable.
-- Stable device_id and lab_id values are intentionally preserved.

UPDATE device_catalog
   SET device_name = 'AP BE15000',
       model = 'BE15000',
       updated_at = NOW()
 WHERE device_id = 'DEV_BE15000';

UPDATE lab_catalog
   SET lab_name = 'Xem thiết bị AP BE15000',
       updated_at = NOW()
 WHERE lab_id = 'be15-bai1';

UPDATE timer_sessions
   SET device = 'AP BE15000',
       lab_name = 'Xem thiết bị AP BE15000'
 WHERE device_id = 'DEV_BE15000' OR lab_id = 'be15-bai1';
