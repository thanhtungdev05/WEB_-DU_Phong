-- 039: Chuan hoa thiet bi ONT BE15000 chi con duy nhat 1 bai: Xem thiet bi ONT BE15000.
-- Khong yeu cau cau hinh, an cac bai cu khoi danh muc hoc tap.

INSERT INTO device_catalog (
    device_id,
    model,
    device_name,
    sort_order,
    is_active
) VALUES
    ('DEV_BE15000', 'BE15000', 'ONT BE15000', 9, TRUE)
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
    ('be15-bai1', 'DEV_BE15000', 'Xem thiết bị ONT BE15000', 1, TRUE)
ON CONFLICT (lab_id) DO UPDATE
SET device_id = EXCLUDED.device_id,
    lab_name = EXCLUDED.lab_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

-- An cac bai lab cu cua BE15000
UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE device_id = 'DEV_BE15000'
   AND lab_id != 'be15-bai1';

-- Chuan hoa thong tin trong timer_sessions neu da co du lieu
UPDATE timer_sessions session
   SET device_id = lab.device_id,
       device = device.device_name,
       lab_name = lab.lab_name
  FROM lab_catalog lab
  JOIN device_catalog device ON device.device_id = lab.device_id
 WHERE session.lab_id = lab.lab_id
   AND session.lab_id = 'be15-bai1';
