-- 056: Standardize lab display titles across AC1000CV2, BE6500C, and ONT_BE6500C
-- Unifies naming format to "Bài X - Cấu hình <Tên ngắn gọn>" matching other ONT devices.

-- 1. AC1000C V2
UPDATE lab_catalog
   SET lab_name = 'Bài 1 - Cấu hình PPPoE',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai1';

UPDATE lab_catalog
   SET lab_name = 'Bài 2 - Cấu hình Wi-Fi',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai2';

UPDATE lab_catalog
   SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai3';

UPDATE lab_catalog
   SET lab_name = 'Bài 4 - Cấu hình DNS',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai4';

UPDATE lab_catalog
   SET lab_name = 'Bài 5 - Cấu hình DHCP',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai5';

UPDATE lab_catalog
   SET lab_name = 'Bài 6 - Cấu hình Port Forwarding',
       updated_at = NOW()
 WHERE lab_id = 'ac1000cv2-bai6';

UPDATE timer_sessions SET lab_name = 'Bài 1 - Cấu hình PPPoE' WHERE lab_id = 'ac1000cv2-bai1';
UPDATE timer_sessions SET lab_name = 'Bài 2 - Cấu hình Wi-Fi' WHERE lab_id = 'ac1000cv2-bai2';
UPDATE timer_sessions SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT' WHERE lab_id = 'ac1000cv2-bai3';
UPDATE timer_sessions SET lab_name = 'Bài 4 - Cấu hình DNS' WHERE lab_id = 'ac1000cv2-bai4';
UPDATE timer_sessions SET lab_name = 'Bài 5 - Cấu hình DHCP' WHERE lab_id = 'ac1000cv2-bai5';
UPDATE timer_sessions SET lab_name = 'Bài 6 - Cấu hình Port Forwarding' WHERE lab_id = 'ac1000cv2-bai6';

-- 2. AP BE6500C
UPDATE lab_catalog
   SET lab_name = 'Bài 1 - Cấu hình PPPoE',
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai1';

UPDATE lab_catalog
   SET lab_name = 'Bài 2 - Cấu hình Wi-Fi',
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai2';

UPDATE lab_catalog
   SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT',
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai3';

UPDATE lab_catalog
   SET lab_name = 'Bài 4 - Cấu hình DHCP',
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai4';

UPDATE lab_catalog
   SET lab_name = 'Bài 5 - Cấu hình Port Forwarding',
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai5';

UPDATE timer_sessions SET lab_name = 'Bài 1 - Cấu hình PPPoE' WHERE lab_id = 'be6500c-bai1';
UPDATE timer_sessions SET lab_name = 'Bài 2 - Cấu hình Wi-Fi' WHERE lab_id = 'be6500c-bai2';
UPDATE timer_sessions SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT' WHERE lab_id = 'be6500c-bai3';
UPDATE timer_sessions SET lab_name = 'Bài 4 - Cấu hình DHCP' WHERE lab_id = 'be6500c-bai4';
UPDATE timer_sessions SET lab_name = 'Bài 5 - Cấu hình Port Forwarding' WHERE lab_id = 'be6500c-bai5';

-- 3. ONT BE6500C
UPDATE lab_catalog
   SET lab_name = 'Bài 1 - Cấu hình PPPoE',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai1';

UPDATE lab_catalog
   SET lab_name = 'Bài 2 - Cấu hình Wi-Fi',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai2';

UPDATE lab_catalog
   SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai3';

UPDATE lab_catalog
   SET lab_name = 'Bài 4 - Cấu hình DNS',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai4';

UPDATE lab_catalog
   SET lab_name = 'Bài 5 - Cấu hình DHCP',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai5';

UPDATE lab_catalog
   SET lab_name = 'Bài 6 - Cấu hình Port Forwarding',
       updated_at = NOW()
 WHERE lab_id = 'ONT_be6500c-bai6';

UPDATE timer_sessions SET lab_name = 'Bài 1 - Cấu hình PPPoE' WHERE lab_id = 'ONT_be6500c-bai1';
UPDATE timer_sessions SET lab_name = 'Bài 2 - Cấu hình Wi-Fi' WHERE lab_id = 'ONT_be6500c-bai2';
UPDATE timer_sessions SET lab_name = 'Bài 3 - Cấu hình Wi-Fi IoT' WHERE lab_id = 'ONT_be6500c-bai3';
UPDATE timer_sessions SET lab_name = 'Bài 4 - Cấu hình DNS' WHERE lab_id = 'ONT_be6500c-bai4';
UPDATE timer_sessions SET lab_name = 'Bài 5 - Cấu hình DHCP' WHERE lab_id = 'ONT_be6500c-bai5';
UPDATE timer_sessions SET lab_name = 'Bài 6 - Cấu hình Port Forwarding' WHERE lab_id = 'ONT_be6500c-bai6';
