-- 065: Update MikroTik hEX S labs
-- 1. Deactivate old DNS and Failover/PCC labs by re-assigning:
--    - 'mikrotik_hexs-bai5' becomes 'Bài 5 - Cấu hình Policy Routing' (formerly Bài 7)
--    - 'mikrotik_hexs-bai6' becomes 'Bài 6 - Cấu hình NAT Port' (new lab)
--    - 'mikrotik_hexs-bai7' is deactivated (is_active = FALSE) as its content moved to Bài 5.

UPDATE lab_catalog
   SET lab_name = 'Bài 5 - Cấu hình Policy Routing',
       sort_order = 5,
       is_active = TRUE,
       updated_at = NOW()
 WHERE lab_id = 'mikrotik_hexs-bai5';

UPDATE lab_catalog
   SET lab_name = 'Bài 6 - Cấu hình NAT Port',
       sort_order = 6,
       is_active = TRUE,
       updated_at = NOW()
 WHERE lab_id = 'mikrotik_hexs-bai6';

UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE lab_id = 'mikrotik_hexs-bai7';

UPDATE timer_sessions
   SET lab_name = 'Bài 5 - Cấu hình Policy Routing'
 WHERE lab_id = 'mikrotik_hexs-bai5';

UPDATE timer_sessions
   SET lab_name = 'Bài 6 - Cấu hình NAT Port'
 WHERE lab_id = 'mikrotik_hexs-bai6';

-- Sync curriculum_labs if exists
DO $migration$
BEGIN
    IF to_regclass('public.curricula') IS NOT NULL
       AND to_regclass('public.curriculum_labs') IS NOT NULL THEN
        EXECUTE $sql$
            UPDATE curriculum_labs
               SET sort_order = 1105,
                   is_required = TRUE,
                   updated_at = NOW()
             WHERE lab_id = 'mikrotik_hexs-bai5';

            UPDATE curriculum_labs
               SET sort_order = 1106,
                   is_required = TRUE,
                   updated_at = NOW()
             WHERE lab_id = 'mikrotik_hexs-bai6';

            UPDATE curriculum_labs
               SET is_required = FALSE,
                   updated_at = NOW()
             WHERE lab_id = 'mikrotik_hexs-bai7';
        $sql$;
    END IF;
END
$migration$;
