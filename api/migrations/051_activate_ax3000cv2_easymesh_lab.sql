-- 051: Activate the seventh AX3000CV2 lesson exposed by firmware 0.5.3.
-- Idempotent catalog upsert; no historical assignment or session rows are rewritten.

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active)
VALUES (
    'LAB_AX3000CV2_07',
    'DEV_AX3000CV2',
    'Bài 7 - Cấu hình EasyMesh',
    7,
    TRUE
)
ON CONFLICT (lab_id) DO UPDATE
SET device_id = EXCLUDED.device_id,
    lab_name = EXCLUDED.lab_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();
