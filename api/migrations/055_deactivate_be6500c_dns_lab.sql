-- 055: Deactivate DNS lab for AP BE6500C and reorder subsequent labs (LAN: Bai 4, Port Forwarding: Bai 5).
-- AP BE6500C does not support independent DNS configuration; this feature is operated differently.
-- ONT BE6500C retains all 6 labs including DNS.

UPDATE lab_catalog
   SET lab_name = 'Bài 4 - Cấu hình mạng LAN',
       sort_order = 4,
       is_active = TRUE,
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai4';

UPDATE lab_catalog
   SET lab_name = 'Bài 5 - Cấu hình Port Forwarding',
       sort_order = 5,
       is_active = TRUE,
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai5';

UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE lab_id = 'be6500c-bai6';

UPDATE timer_sessions
   SET lab_name = 'Bài 4 - Cấu hình mạng LAN'
 WHERE lab_id = 'be6500c-bai4';

UPDATE timer_sessions
   SET lab_name = 'Bài 5 - Cấu hình Port Forwarding'
 WHERE lab_id = 'be6500c-bai5';

-- If legacy curriculum tables exist, keep sort orders and active status synced
DO $migration$
BEGIN
    IF to_regclass('public.curricula') IS NOT NULL
       AND to_regclass('public.curriculum_labs') IS NOT NULL THEN
        EXECUTE $sql$
            UPDATE curriculum_labs
               SET sort_order = 704,
                   is_required = TRUE,
                   updated_at = NOW()
             WHERE lab_id = 'be6500c-bai4';

            UPDATE curriculum_labs
               SET sort_order = 705,
                   is_required = TRUE,
                   updated_at = NOW()
             WHERE lab_id = 'be6500c-bai5';

            UPDATE curriculum_labs
               SET is_required = FALSE,
                   updated_at = NOW()
             WHERE lab_id = 'be6500c-bai6';
        $sql$;
    END IF;
END
$migration$;
