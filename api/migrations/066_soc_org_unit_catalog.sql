-- 066: Add the SOC (customer-care / operations monitoring) regions and units.
--
-- Additive only: it never deactivates existing units, never touches users and
-- is safe to re-run. KTV rows for SOC are intentionally NOT embedded here; they
-- come from an approved workbook through scripts/seed_soc_ktv.php so personal
-- data stays out of the repository.

INSERT INTO regions (
    region_code, region_name, dashboard_group, is_active, created_at, updated_at
)
VALUES
    ('SOC', 'SOC', 'SOC', TRUE, NOW(), NOW()),
    ('TSOC', 'TSOC', 'TSOC', TRUE, NOW(), NOW()),
    ('PSOC', 'PSOC', 'PSOC', TRUE, NOW(), NOW())
ON CONFLICT (region_code) DO UPDATE SET
    region_name = COALESCE(NULLIF(BTRIM(regions.region_name), ''), EXCLUDED.region_name),
    dashboard_group = COALESCE(NULLIF(BTRIM(regions.dashboard_group), ''), EXCLUDED.dashboard_group),
    is_active = TRUE,
    updated_at = NOW();

CREATE TEMP TABLE soc_org_unit_source (
    unit_code VARCHAR(100) PRIMARY KEY,
    unit_name TEXT NOT NULL,
    region_code VARCHAR(80) NOT NULL
) ON COMMIT DROP;

INSERT INTO soc_org_unit_source (unit_code, unit_name, region_code)
VALUES
    ('SOCDHMB', 'SOCDHMB', 'SOC'),
    ('SOCDHMN', 'SOCDHMN', 'SOC'),
    ('SOCHT1', 'SOCHT1', 'SOC'),
    ('SOCHT2', 'SOCHT2', 'SOC'),
    ('SOCHT3', 'SOCHT3', 'SOC'),
    ('SOCHT4', 'SOCHT4', 'SOC'),
    ('SOCHT5', 'SOCHT5', 'SOC'),
    ('SOCHT6', 'SOCHT6', 'SOC'),
    ('SOCHT7', 'SOCHT7', 'SOC'),
    ('SOCHT8', 'SOCHT8', 'SOC'),
    ('TSOCHT1', 'TSOCHT1', 'TSOC'),
    ('TSOCHT3', 'TSOCHT3', 'TSOC'),
    ('TSOCHT5', 'TSOCHT5', 'TSOC'),
    ('TSOCHT7', 'TSOCHT7', 'TSOC'),
    ('PSOCHT2', 'PSOCHT2', 'PSOC'),
    ('PSOCHT4', 'PSOCHT4', 'PSOC'),
    ('PSOCHT6', 'PSOCHT6', 'PSOC'),
    ('PSOCHT8', 'PSOCHT8', 'PSOC');

INSERT INTO org_units (
    region_id, unit_code, unit_name, is_active, created_at, updated_at
)
SELECT region.region_id,
       source.unit_code,
       source.unit_name,
       TRUE,
       NOW(),
       NOW()
  FROM soc_org_unit_source source
  JOIN regions region ON region.region_code = source.region_code
ON CONFLICT (unit_code) DO UPDATE SET
    region_id = EXCLUDED.region_id,
    unit_name = EXCLUDED.unit_name,
    is_active = TRUE,
    updated_at = NOW();
