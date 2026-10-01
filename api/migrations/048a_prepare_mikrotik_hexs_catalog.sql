-- 048a: Preserve an imported legacy MikroTik catalog row before 049 creates
-- the canonical hEX S device.  Some production databases contain an inactive
-- Firebase-imported device with the same display name but a different ID.
-- Keep that row (and all of its historical foreign-key references), changing
-- only its display name so the canonical device can satisfy the unique key.

UPDATE device_catalog
   SET device_name = device_name || ' (legacy ' || device_id || ')',
       updated_at = NOW()
 WHERE device_id <> 'DEV_MIKROTIK_HEXS'
   AND device_name = 'Router MikroTik'
   AND is_active = FALSE
   AND NOT EXISTS (
       SELECT 1
         FROM device_catalog canonical
        WHERE canonical.device_id = 'DEV_MIKROTIK_HEXS'
   );
