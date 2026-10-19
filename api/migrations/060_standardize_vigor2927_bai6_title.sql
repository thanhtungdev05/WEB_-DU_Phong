-- 060: Standardize Vigor2927 Bài 6 title to "Bài 6 - Cấu hình Load Balancing"
UPDATE lab_catalog
   SET lab_name = 'Bài 6 - Cấu hình Load Balancing',
       updated_at = NOW()
 WHERE lab_id = 'vg2927-bai6';

UPDATE timer_sessions
   SET lab_name = 'Bài 6 - Cấu hình Load Balancing'
 WHERE lab_id = 'vg2927-bai6';
