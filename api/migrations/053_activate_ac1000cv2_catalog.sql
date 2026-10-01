-- 053: Activate Internet Hub AC1000C V2 in learning catalog
-- Idempotent catalog upsert; no historical assignment rows are deleted.
-- NOTE: numbered after 052_db_guardian_cleanup_views so the forward-only runner
-- (api/migrate.php) does not mark this file as superseded.
INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active) VALUES
    ('DEV_AC1000CV2', 'G-97RG6W', 'Internet Hub AC1000C V2', 12, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active) VALUES
    ('ac1000cv2-bai1', 'DEV_AC1000CV2', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('ac1000cv2-bai2', 'DEV_AC1000CV2', 'Bài 2 - Cấu hình Wi-Fi (2.4G & 5G)', 2, TRUE),
    ('ac1000cv2-bai3', 'DEV_AC1000CV2', 'Bài 3 - Cấu hình Wi-Fi phụ (IoT / Khách)', 3, TRUE),
    ('ac1000cv2-bai4', 'DEV_AC1000CV2', 'Bài 4 - Cấu hình DNS thủ công', 4, TRUE),
    ('ac1000cv2-bai5', 'DEV_AC1000CV2', 'Bài 5 - Cấu hình địa chỉ mạng LAN & DHCP', 5, TRUE),
    ('ac1000cv2-bai6', 'DEV_AC1000CV2', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE)
ON CONFLICT (lab_id) DO UPDATE
SET device_id = EXCLUDED.device_id,
    lab_name = EXCLUDED.lab_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

UPDATE timer_sessions session
   SET device_id = lab.device_id,
       device = device.device_name,
       lab_name = lab.lab_name
  FROM lab_catalog lab
  JOIN device_catalog device ON device.device_id = lab.device_id
 WHERE session.lab_id = lab.lab_id
   AND lab.device_id = 'DEV_AC1000CV2';

DO $migration$
BEGIN
    IF to_regclass('public.curricula') IS NOT NULL
       AND to_regclass('public.curriculum_labs') IS NOT NULL THEN
        EXECUTE $sql$
            INSERT INTO curriculum_labs (
                curriculum_id,
                lab_id,
                required_mode,
                is_required,
                sort_order,
                passing_score
            )
            SELECT curriculum.curriculum_id,
                   lab.lab_id,
                   'practice',
                   TRUE,
                   (device.sort_order * 100) + lab.sort_order,
                   NULL
              FROM curricula curriculum
             CROSS JOIN lab_catalog lab
              JOIN device_catalog device ON device.device_id = lab.device_id
             WHERE curriculum.curriculum_code = 'LEGACY-PORTAL-LABS'
               AND curriculum.version = '1'
               AND lab.device_id = 'DEV_AC1000CV2'
               AND lab.is_active = TRUE
               AND device.is_active = TRUE
            ON CONFLICT (curriculum_id, lab_id, required_mode) DO UPDATE
            SET is_required = TRUE,
                sort_order = EXCLUDED.sort_order,
                passing_score = NULL,
                updated_at = NOW()
        $sql$;
    END IF;
END
$migration$;
