-- 043: Make the database catalog match the lessons that the public portal loads.
-- Historical catalog rows, assignments and timer sessions are preserved. Rows
-- outside the portal scope are only made inactive, never deleted.

INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active) VALUES
    ('DEV_AC1000F',     'AC1000F',   'ONT AC1000F',          1, TRUE),
    ('DEV_AX3000CV2',   'AX3000CV2', 'ONT AX3000CV2',        2, TRUE),
    ('DEV_AX3000GZ',    'AX3000GZ',  'ONT AX3000GZ',         3, TRUE),
    ('DEV_AX3000HV2',   'AX3000HV2', 'ONT AX3000HV2',        4, TRUE),
    ('DEV_AX3000S',     'AX3000S',   'Internet Hub AX3000S', 5, TRUE),
    ('DEV_AC1000HI',    'AC1000HI',  'ONT AC1000HI',         6, TRUE),
    ('DEV_BE6500C',     'BE6500C',   'AP BE6500C',           7, TRUE),
    ('DEV_ONT_BE6500C', 'BE6500C',   'ONT BE6500C',          8, TRUE),
    ('DEV_BE12000',     'BE12000',   'ONT BE12000',          9, TRUE),
    ('DEV_BE15000',     'BE15000',   'ONT BE15000',         10, TRUE)
ON CONFLICT (device_id) DO UPDATE
SET model = EXCLUDED.model,
    device_name = EXCLUDED.device_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

UPDATE device_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE is_active = TRUE
   AND device_id NOT IN (
       'DEV_AC1000F', 'DEV_AX3000CV2', 'DEV_AX3000GZ', 'DEV_AX3000HV2',
       'DEV_AX3000S', 'DEV_AC1000HI', 'DEV_BE6500C', 'DEV_ONT_BE6500C',
       'DEV_BE12000', 'DEV_BE15000'
   );

UPDATE lab_catalog
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE is_active = TRUE;

INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active) VALUES
    ('LAB_AC1000F_01', 'DEV_AC1000F', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AC1000F_02', 'DEV_AC1000F', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AC1000F_03', 'DEV_AC1000F', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AC1000F_04', 'DEV_AC1000F', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AC1000F_05', 'DEV_AC1000F', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AC1000F_06', 'DEV_AC1000F', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_AX3000CV2_01', 'DEV_AX3000CV2', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AX3000CV2_02', 'DEV_AX3000CV2', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AX3000CV2_03', 'DEV_AX3000CV2', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AX3000CV2_04', 'DEV_AX3000CV2', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AX3000CV2_05', 'DEV_AX3000CV2', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AX3000CV2_06', 'DEV_AX3000CV2', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_AX3000GZ_01', 'DEV_AX3000GZ', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AX3000GZ_02', 'DEV_AX3000GZ', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AX3000GZ_03', 'DEV_AX3000GZ', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AX3000GZ_04', 'DEV_AX3000GZ', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AX3000GZ_05', 'DEV_AX3000GZ', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AX3000GZ_06', 'DEV_AX3000GZ', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_AX3000HV2_01', 'DEV_AX3000HV2', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AX3000HV2_02', 'DEV_AX3000HV2', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AX3000HV2_03', 'DEV_AX3000HV2', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AX3000HV2_04', 'DEV_AX3000HV2', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AX3000HV2_05', 'DEV_AX3000HV2', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AX3000HV2_06', 'DEV_AX3000HV2', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_AX3000S_01', 'DEV_AX3000S', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AX3000S_02', 'DEV_AX3000S', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AX3000S_03', 'DEV_AX3000S', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AX3000S_04', 'DEV_AX3000S', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AX3000S_05', 'DEV_AX3000S', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AX3000S_06', 'DEV_AX3000S', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_AC1000HI_01', 'DEV_AC1000HI', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_AC1000HI_02', 'DEV_AC1000HI', 'Bài 2 - Cấu hình Wi-Fi', 2, TRUE),
    ('LAB_AC1000HI_03', 'DEV_AC1000HI', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_AC1000HI_04', 'DEV_AC1000HI', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_AC1000HI_05', 'DEV_AC1000HI', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_AC1000HI_06', 'DEV_AC1000HI', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

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
    ('ONT_be6500c-bai6', 'DEV_ONT_BE6500C', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('LAB_BE12000_01', 'DEV_BE12000', 'Bài 1 - Cấu hình PPPoE', 1, TRUE),
    ('LAB_BE12000_02', 'DEV_BE12000', 'Bài 2 - Cấu hình Wi-Fi MLO (Wi-Fi 7)', 2, TRUE),
    ('LAB_BE12000_03', 'DEV_BE12000', 'Bài 3 - Cấu hình Wi-Fi IoT', 3, TRUE),
    ('LAB_BE12000_04', 'DEV_BE12000', 'Bài 4 - Cấu hình DNS', 4, TRUE),
    ('LAB_BE12000_05', 'DEV_BE12000', 'Bài 5 - Cấu hình DHCP', 5, TRUE),
    ('LAB_BE12000_06', 'DEV_BE12000', 'Bài 6 - Cấu hình Port Forwarding', 6, TRUE),

    ('be15-bai1', 'DEV_BE15000', 'Xem thiết bị ONT BE15000', 1, TRUE)
ON CONFLICT (lab_id) DO UPDATE
SET device_id = EXCLUDED.device_id,
    lab_name = EXCLUDED.lab_name,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();

-- Keep denormalized session labels aligned for exports and audit screens. The
-- session identity, result and timestamps are not changed.
UPDATE timer_sessions session
   SET device_id = lab.device_id,
       device = device.device_name,
       lab_name = lab.lab_name
  FROM lab_catalog lab
  JOIN device_catalog device ON device.device_id = lab.device_id
 WHERE session.lab_id = lab.lab_id
   AND lab.is_active = TRUE
   AND device.is_active = TRUE
   AND (
       session.device_id IS DISTINCT FROM lab.device_id
       OR session.device IS DISTINCT FROM device.device_name
       OR session.lab_name IS DISTINCT FROM lab.lab_name
   );
