-- 046: Activate DrayTek Vigor2927 in learning catalog
INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active) VALUES
    ('DEV_VIGOR2927', 'Vigor2927', 'DrayTek Vigor2927', 9, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active) VALUES
    ('vg2927-bai1', 'DEV_VIGOR2927', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('vg2927-bai2', 'DEV_VIGOR2927', 'Bài 2 - Cấu hình giới hạn băng thông', 2, TRUE),
    ('vg2927-bai3', 'DEV_VIGOR2927', 'Bài 3 - Cấu hình Bind IP to MAC', 3, TRUE),
    ('vg2927-bai4', 'DEV_VIGOR2927', 'Bài 4 - Cấu hình DHCP', 4, TRUE),
    ('vg2927-bai5', 'DEV_VIGOR2927', 'Bài 5 - Cấu hình DNS', 5, TRUE),
    ('vg2927-bai6', 'DEV_VIGOR2927', 'Bài 6 - Cấu hình định tuyến Failover và Load Balancing', 6, TRUE),
    ('vg2927-bai7', 'DEV_VIGOR2927', 'Bài 7 - Cấu hình Policy Routing', 7, TRUE)
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
   AND lab.device_id = 'DEV_VIGOR2927';

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
               AND lab.device_id = 'DEV_VIGOR2927'
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
