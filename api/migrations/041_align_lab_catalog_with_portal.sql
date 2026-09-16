-- 041: Reconcile lab_catalog with the approved portal scope.
-- Deactivate duplicate/out-of-scope labs, deactivate hidden devices, and fix
-- BE6500C/ONT_BE6500C lab names to match the canonical portal titles.
-- Session history is preserved; only lab_name snapshots and is_active flags change.

-- 1. Deactivate hidden devices (removed from portal.html)
UPDATE device_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id IN ('DEV_VIGOR2927', 'DEV_MIKROTIK_HEXS')
   AND is_active = TRUE;

-- 2. Deactivate all labs for hidden devices
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id IN ('DEV_VIGOR2927', 'DEV_MIKROTIK_HEXS')
   AND is_active = TRUE;

-- 3. Deactivate out-of-scope labs for approved devices.
--    Approved portal scope: 6 labs per device (except be15000 = 1 lab).

-- AC1000F: keep 01-06, deactivate 07-10
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AC1000F'
   AND lab_id IN ('LAB_AC1000F_07','LAB_AC1000F_08','LAB_AC1000F_09','LAB_AC1000F_10')
   AND is_active = TRUE;

-- AX3000CV2: deactivate duplicate LAB_AX3000C_* rows (keep LAB_AX3000CV2_*).
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AX3000CV2'
   AND lab_id LIKE 'LAB_AX3000C_%'
   AND is_active = TRUE;

-- AX3000GZ: keep 01-06, deactivate 07-09
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AX3000GZ'
   AND lab_id IN ('LAB_AX3000GZ_07','LAB_AX3000GZ_08','LAB_AX3000GZ_09')
   AND is_active = TRUE;

-- AX3000S: deactivate 07
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AX3000S'
   AND lab_id = 'LAB_AX3000S_07'
   AND is_active = TRUE;

-- AC1000HI: deactivate 07-10
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AC1000HI'
   AND lab_id IN ('LAB_AC1000HI_07','LAB_AC1000HI_08','LAB_AC1000HI_09','LAB_AC1000HI_10')
   AND is_active = TRUE;

-- BE12000: deactivate 07
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_BE12000'
   AND lab_id = 'LAB_BE12000_07'
   AND is_active = TRUE;

-- BE15000: keep only be15-bai1
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_BE15000'
   AND lab_id != 'be15-bai1'
   AND is_active = TRUE;

-- 4. Fix BE6500C and ONT_BE6500C lab names to canonical portal titles.
--    These were overwritten by a prior dev migration with incorrect names.

UPDATE lab_catalog SET lab_name = 'Bài 1 - Cấu hình PPPoE',                          updated_at = NOW() WHERE lab_id = 'be6500c-bai1';
UPDATE lab_catalog SET lab_name = 'Bài 2 - Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)', updated_at = NOW() WHERE lab_id = 'be6500c-bai2';
UPDATE lab_catalog SET lab_name = 'Bài 3 - Cấu hình mạng Wi-Fi IoT',                  updated_at = NOW() WHERE lab_id = 'be6500c-bai3';
UPDATE lab_catalog SET lab_name = 'Bài 4 - Cấu hình DNS',                             updated_at = NOW() WHERE lab_id = 'be6500c-bai4';
UPDATE lab_catalog SET lab_name = 'Bài 5 - Cấu hình mạng LAN',                        updated_at = NOW() WHERE lab_id = 'be6500c-bai5';
UPDATE lab_catalog SET lab_name = 'Bài 6 - Cấu hình Port Forwarding',                  updated_at = NOW() WHERE lab_id = 'be6500c-bai6';

UPDATE lab_catalog SET lab_name = 'Bài 1 - Cấu hình PPPoE',                          updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai1';
UPDATE lab_catalog SET lab_name = 'Bài 2 - Cấu hình mạng Wi-Fi (Gộp sóng Band Steering)', updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai2';
UPDATE lab_catalog SET lab_name = 'Bài 3 - Cấu hình mạng Wi-Fi IoT',                  updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai3';
UPDATE lab_catalog SET lab_name = 'Bài 4 - Cấu hình DNS',                             updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai4';
UPDATE lab_catalog SET lab_name = 'Bài 5 - Cấu hình mạng LAN',                        updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai5';
UPDATE lab_catalog SET lab_name = 'Bài 6 - Cấu hình Port Forwarding',                  updated_at = NOW() WHERE lab_id = 'ONT_be6500c-bai6';

-- 5. Normalize timer_sessions lab_name snapshots for BE6500C/ONT_BE6500C
--    so historical exports reflect the corrected catalog names.

UPDATE timer_sessions session
   SET lab_name = lab.lab_name
  FROM lab_catalog lab
 WHERE session.lab_id = lab.lab_id
   AND lab.device_id IN ('DEV_BE6500C', 'DEV_ONT_BE6500C')
   AND session.lab_name IS DISTINCT FROM lab.lab_name;

-- 6. Register BE6500C/ONT_BE6500C in the legacy portal curriculum when
--    the assignment tables exist (same idempotent pattern as 036).

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
