-- 058: Standardize device display names to ONT AX3000S, ONT AC1000C V2, ONT BE1200Z, AP BE1500Z.
-- Stable device_id and lab_id values are intentionally preserved.
-- Forward-only updates to catalog and historical timer session labels.

UPDATE device_catalog
   SET device_name = 'ONT AX3000S',
       updated_at = NOW()
 WHERE device_id = 'DEV_AX3000S';

UPDATE device_catalog
   SET device_name = 'ONT AC1000C V2',
       updated_at = NOW()
 WHERE device_id = 'DEV_AC1000CV2';

UPDATE device_catalog
   SET device_name = 'ONT BE1200Z',
       model = 'BE1200Z',
       updated_at = NOW()
 WHERE device_id = 'DEV_BE12000';

UPDATE device_catalog
   SET device_name = 'AP BE1500Z',
       model = 'BE1500Z',
       updated_at = NOW()
 WHERE device_id = 'DEV_BE15000';

UPDATE lab_catalog
   SET lab_name = 'Xem thiết bị AP BE1500Z',
       updated_at = NOW()
 WHERE lab_id = 'be15-bai1';

UPDATE timer_sessions
   SET device = 'ONT AX3000S'
 WHERE device_id = 'DEV_AX3000S';

UPDATE timer_sessions
   SET device = 'ONT AC1000C V2'
 WHERE device_id = 'DEV_AC1000CV2';

UPDATE timer_sessions
   SET device = 'ONT BE1200Z'
 WHERE device_id = 'DEV_BE12000';

UPDATE timer_sessions
   SET device = 'AP BE1500Z',
       lab_name = 'Xem thiết bị AP BE1500Z'
 WHERE device_id = 'DEV_BE15000' OR lab_id = 'be15-bai1';
