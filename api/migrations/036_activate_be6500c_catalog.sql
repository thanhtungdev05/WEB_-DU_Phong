-- 036: Activate the AP BE6500C and ONT BE6500C learning catalogs.
-- This is a forward-only data migration. Existing devices, labs, sessions, and
-- assignments are preserved; only these two devices and their twelve labs are
-- inserted or reactivated.

INSERT INTO device_catalog (
    device_id,
    model,
    device_name,
    sort_order,
    is_active
) VALUES
    ('DEV_BE6500C',     'BE6500C', 'AP BE6500C',  7, TRUE),
    ('DEV_ONT_BE6500C', 'BE6500C', 'ONT BE6500C', 8, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO lab_catalog (
    lab_id,
    device_id,
    lab_name,
    sort_order,
    is_active
) VALUES
    ('be6500c-bai1', 'DEV_BE6500C', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('be6500c-bai2', 'DEV_BE6500C', 'Bài 2 - Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)', 2, TRUE),
    ('be6500c-bai3', 'DEV_BE6500C', 'Bài 3 - Cấu hình mạng Wi-Fi IoT', 3, TRUE),
    ('be6500c-bai4', 'DEV_BE6500C', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('be6500c-bai5', 'DEV_BE6500C', 'Bài 5 - Cấu hình mạng LAN', 5, TRUE),
    ('be6500c-bai6', 'DEV_BE6500C', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('ONT_be6500c-bai1', 'DEV_ONT_BE6500C', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('ONT_be6500c-bai2', 'DEV_ONT_BE6500C', 'Bài 2 - Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)', 2, TRUE),
    ('ONT_be6500c-bai3', 'DEV_ONT_BE6500C', 'Bài 3 - Cấu hình mạng Wi-Fi IoT', 3, TRUE),
    ('ONT_be6500c-bai4', 'DEV_ONT_BE6500C', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('ONT_be6500c-bai5', 'DEV_ONT_BE6500C', 'Bài 5 - Cấu hình mạng LAN', 5, TRUE),
    ('ONT_be6500c-bai6', 'DEV_ONT_BE6500C', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE)
ON CONFLICT (lab_id) DO UPDATE
SET device_id = EXCLUDED.device_id,
    lab_name = EXCLUDED.lab_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

-- Normalize only historical facts for the twelve labs activated above.
UPDATE timer_sessions session
   SET device_id = lab.device_id,
       device = device.device_name,
       lab_name = lab.lab_name
  FROM lab_catalog lab
  JOIN device_catalog device ON device.device_id = lab.device_id
 WHERE session.lab_id = lab.lab_id
   AND lab.device_id IN ('DEV_BE6500C', 'DEV_ONT_BE6500C')
   AND (
       session.device_id IS DISTINCT FROM lab.device_id
       OR session.device IS DISTINCT FROM device.device_name
       OR session.lab_name IS DISTINCT FROM lab.lab_name
   );

-- The normalized assignment model is optional in older deployments. Register
-- these labs in the legacy portal curriculum when those tables are available.
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
               AND lab.device_id IN ('DEV_BE6500C', 'DEV_ONT_BE6500C')
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
