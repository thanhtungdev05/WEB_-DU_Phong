-- 055: Add AX3000GZ V2 (ZTE F6201B) and the six standard AX3000GZ labs.
-- Idempotent data migration. Existing history is preserved.
INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active) VALUES
    ('DEV_AX3000GZ_V2', 'ZTE F6201B', 'ONT AX3000GZ V2', 13, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active) VALUES
    ('LAB_AX3000GZ_V2_01', 'DEV_AX3000GZ_V2', 'Bài 1 - Cấu hình WAN PPPoE', 1, TRUE),
    ('LAB_AX3000GZ_V2_02', 'DEV_AX3000GZ_V2', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AX3000GZ_V2_03', 'DEV_AX3000GZ_V2', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AX3000GZ_V2_04', 'DEV_AX3000GZ_V2', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AX3000GZ_V2_05', 'DEV_AX3000GZ_V2', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AX3000GZ_V2_06', 'DEV_AX3000GZ_V2', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE)
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
   AND lab.device_id = 'DEV_AX3000GZ_V2';

DO $migration$
BEGIN
    IF to_regclass('public.curricula') IS NOT NULL
       AND to_regclass('public.curriculum_labs') IS NOT NULL THEN
        EXECUTE $sql$
            INSERT INTO curriculum_labs (
                curriculum_id, lab_id, required_mode, is_required, sort_order, passing_score
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
               AND lab.device_id = 'DEV_AX3000GZ_V2'
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
