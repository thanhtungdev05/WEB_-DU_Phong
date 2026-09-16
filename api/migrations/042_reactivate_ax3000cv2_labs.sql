-- 042: Reactivate LAB_AX3000CV2_* labs incorrectly deactivated by 041.
-- Migration 041 used an unescaped LIKE pattern that matched both the
-- LAB_AX3000C_* duplicates AND the canonical LAB_AX3000CV2_* rows.
-- This fixes the immediate state; 041 is corrected for fresh deployments.

UPDATE lab_catalog
   SET is_active = TRUE,
       updated_at = NOW()
 WHERE device_id = 'DEV_AX3000CV2'
   AND lab_id LIKE 'LAB_AX3000CV2\_%' ESCAPE '\'
   AND is_active = FALSE;
