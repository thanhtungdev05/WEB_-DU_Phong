-- 054: Rename BE15000 to AP BE1500 in device_catalog and lab_catalog.
-- Idempotent name update; device_id / lab_id are preserved.
-- NOTE: numbered after 052_db_guardian_cleanup_views so the forward-only runner
-- (api/migrate.php) does not mark this file as superseded.

UPDATE device_catalog
   SET device_name = 'AP BE1500',
       model = 'BE1500',
       updated_at = NOW()
 WHERE device_id = 'DEV_BE15000';

UPDATE lab_catalog
   SET lab_name = 'Xem thiết bị AP BE1500',
       updated_at = NOW()
 WHERE lab_id = 'be15-bai1';

UPDATE timer_sessions
   SET device = 'AP BE1500',
       lab_name = 'Xem thiết bị AP BE1500'
 WHERE device_id = 'DEV_BE15000' OR lab_id = 'be15-bai1';
