-- 062: Synchronize all active devices and active labs into curriculum_labs for all active curricula.
-- Previous migrations (036, 046, 049, 053, 055, 061) scoped their curriculum_labs insertion
-- to curriculum_code = 'LEGACY-PORTAL-LABS'. However, the default operational curriculum
-- active in production is 'FTC-PORTAL-LABS' (introduced in migration 033).
-- This left active devices (such as DEV_AX3000GZ_V2, DEV_AC1000Z, DEV_MIKROTIK_HEXS,
-- DEV_VIGOR2927, DEV_BE6500C, DEV_AC1000CV2, DEV_BE12000, DEV_BE15000) without practice
-- labs in FTC-PORTAL-LABS, causing training class creation to fail with:
-- "Device <device_id> has no practice labs in the class curriculum."

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
                passing_score,
                created_at,
                updated_at
            )
            SELECT curriculum.curriculum_id,
                   lab.lab_id,
                   'practice',
                   TRUE,
                   (device.sort_order * 100) + lab.sort_order,
                   NULL,
                   NOW(),
                   NOW()
              FROM curricula curriculum
             CROSS JOIN lab_catalog lab
              JOIN device_catalog device ON device.device_id = lab.device_id
             WHERE curriculum.status = 'active'
               AND lab.is_active = TRUE
               AND device.is_active = TRUE
            ON CONFLICT (curriculum_id, lab_id, required_mode) DO UPDATE
            SET is_required = TRUE,
                sort_order = EXCLUDED.sort_order,
                passing_score = NULL,
                updated_at = NOW();
        $sql$;
    END IF;
END
$migration$;
