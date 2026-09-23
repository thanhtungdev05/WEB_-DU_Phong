-- 049: Activate MikroTik hEX S in learning catalog
INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active) VALUES
    ('DEV_MIKROTIK_HEXS', 'hEX S', 'Router MikroTik', 11, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active) VALUES
    ('mikrotik_hexs-bai1', 'DEV_MIKROTIK_HEXS', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('mikrotik_hexs-bai2', 'DEV_MIKROTIK_HEXS', 'Bài 2 - Cấu hình giới hạn băng thông', 2, TRUE),
    ('mikrotik_hexs-bai3', 'DEV_MIKROTIK_HEXS', 'Bài 3 - Cấu hình Bind IP to MAC', 3, TRUE),
    ('mikrotik_hexs-bai4', 'DEV_MIKROTIK_HEXS', 'Bài 4 - Cấu hình DHCP', 4, TRUE),
    ('mikrotik_hexs-bai5', 'DEV_MIKROTIK_HEXS', 'Bài 5 - Cấu hình DNS', 5, TRUE),
    ('mikrotik_hexs-bai6', 'DEV_MIKROTIK_HEXS', 'Bài 6 - Cấu hình định tuyến Failover và Load Balancing', 6, TRUE),
    ('mikrotik_hexs-bai7', 'DEV_MIKROTIK_HEXS', 'Bài 7 - Cấu hình Policy Routing', 7, TRUE)
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
   AND lab.device_id = 'DEV_MIKROTIK_HEXS';

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
               AND lab.device_id = 'DEV_MIKROTIK_HEXS'
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
