-- Canonical organization-unit catalog imported from DonVi-2026-09-15.xlsx.
-- region_code follows maVung; region_name/dashboard_group preserve the existing friendly labels.

CREATE TABLE IF NOT EXISTS org_units (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL,
    unit_code VARCHAR(100) NOT NULL UNIQUE,
    unit_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT org_units_region_fkey
        FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE RESTRICT,
    CONSTRAINT org_units_code_check CHECK (BTRIM(unit_code) <> ''),
    CONSTRAINT org_units_name_check CHECK (BTRIM(unit_name) <> '')
);

CREATE INDEX IF NOT EXISTS idx_org_units_region_active
    ON org_units (region_id, is_active, unit_code);

ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_unit_id_fkey;
ALTER TABLE users
    ADD CONSTRAINT users_unit_id_fkey
    FOREIGN KEY (unit_id) REFERENCES org_units(unit_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users (unit_id);

ALTER TABLE lab_assignments ADD COLUMN IF NOT EXISTS unit_id_snapshot UUID;
ALTER TABLE lab_assignments DROP CONSTRAINT IF EXISTS lab_assignments_unit_id_snapshot_fkey;
ALTER TABLE lab_assignments
    ADD CONSTRAINT lab_assignments_unit_id_snapshot_fkey
    FOREIGN KEY (unit_id_snapshot) REFERENCES org_units(unit_id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_lab_assignments_unit_snapshot
    ON lab_assignments (unit_id_snapshot, curriculum_lab_id, status)
    WHERE unit_id_snapshot IS NOT NULL;

INSERT INTO regions (
    region_code, region_name, dashboard_group, is_active, created_at, updated_at
)
VALUES
    ('PNCDNB', 'DNB', 'DNB', TRUE, NOW(), NOW()),
    ('PNCHCM', 'HCM', 'HCM', TRUE, NOW(), NOW()),
    ('PNCTDDT', 'TDDT - PNC', 'TDDT', TRUE, NOW(), NOW()),
    ('PNCTNB', 'TNB', 'TNB', TRUE, NOW(), NOW()),
    ('PNCTNMT', 'TNMT - PNC', 'TNMT', TRUE, NOW(), NOW()),
    ('TINDBB', 'DBB', 'DBB', TRUE, NOW(), NOW()),
    ('TINHNI', 'HNI', 'HNI', TRUE, NOW(), NOW()),
    ('TINTBB', 'TBB', 'TBB', TRUE, NOW(), NOW()),
    ('TINTDDT', 'TDDT - TIN', 'TDDT', TRUE, NOW(), NOW()),
    ('TINTNMT', 'TNMT - TIN', 'TNMT', TRUE, NOW(), NOW())
ON CONFLICT (region_code) DO UPDATE SET
    region_name = COALESCE(NULLIF(BTRIM(regions.region_name), ''), EXCLUDED.region_name),
    dashboard_group = COALESCE(NULLIF(BTRIM(regions.dashboard_group), ''), EXCLUDED.dashboard_group),
    is_active = TRUE,
    updated_at = NOW();

CREATE TEMP TABLE org_unit_catalog_source (
    unit_code VARCHAR(100) PRIMARY KEY,
    unit_name TEXT NOT NULL,
    region_code VARCHAR(80) NOT NULL
) ON COMMIT DROP;

INSERT INTO org_unit_catalog_source (unit_code, unit_name, region_code)
VALUES
    ('TYBIUSR', 'TYBIUSR', 'TINTBB'),
    ('TYBI', 'TYBI', 'TINTBB'),
    ('TVPCUSR', 'TVPCUSR', 'TINTBB'),
    ('TVPC', 'TVPC', 'TINTBB'),
    ('TTTN', 'TTTN', 'TINTBB'),
    ('TTQGUSR', 'TTQGUSR', 'TINTBB'),
    ('TTQG', 'TTQG', 'TINTBB'),
    ('TTNNUSR', 'TTNNUSR', 'TINTBB'),
    ('TTNN', 'TTNN', 'TINTBB'),
    ('TTHAUSR', 'TTHAUSR', 'TINDBB'),
    ('TTHA', 'TTHA', 'TINDBB'),
    ('TTBHUSR', 'TTBHUSR', 'TINDBB'),
    ('TTBH', 'TTBH', 'TINDBB'),
    ('TSLAUSR', 'TSLAUSR', 'TINDBB'),
    ('TSLA', 'TSLA', 'TINDBB'),
    ('TQTIUSR', 'TQTIUSR', 'TINTNMT'),
    ('TQTI', 'TQTI', 'TINTNMT'),
    ('TQNH3USR', 'TQNH3USR', 'TINTDDT'),
    ('TQNH3', 'TQNH3', 'TINTDDT'),
    ('TQNH2USR', 'TQNH2USR', 'TINTDDT'),
    ('TQNH2', 'TQNH2', 'TINTDDT'),
    ('TQNH1USR', 'TQNH1USR', 'TINTDDT'),
    ('TQNH1', 'TQNH1', 'TINTDDT'),
    ('TQBHUSR', 'TQBHUSR', 'TINTNMT'),
    ('TQBH', 'TQBH', 'TINTNMT'),
    ('TPTOUSR', 'TPTOUSR', 'TINTBB'),
    ('TPTO', 'TPTO', 'TINTBB'),
    ('TNDHUSR', 'TNDHUSR', 'TINDBB'),
    ('TNDH', 'TNDH', 'TINDBB'),
    ('TNBHUSR', 'TNBHUSR', 'TINDBB'),
    ('TNBH', 'TNBH', 'TINDBB'),
    ('TNANUSR', 'TNANUSR', 'TINDBB'),
    ('TNAN', 'TNAN', 'TINDBB'),
    ('TLSNUSR', 'TLSNUSR', 'TINTBB'),
    ('TLSN', 'TLSN', 'TINTBB'),
    ('TLCIUSR', 'TLCIUSR', 'TINTBB'),
    ('TLCI', 'TLCI', 'TINTBB'),
    ('TIN0403USR', 'TIN0403USR', 'TINHNI'),
    ('TIN0402USR', 'TIN0402USR', 'TINHNI'),
    ('THYNUSR2', 'THYNUSR2', 'TINDBB'),
    ('THYNUSR1', 'THYNUSR1', 'TINDBB'),
    ('THYN', 'THYN', 'TINDBB'),
    ('THUEUSR', 'THUEUSR', 'TINTNMT'),
    ('THUE', 'THUE', 'TINTNMT'),
    ('THTHUSR', 'THTHUSR', 'TINDBB'),
    ('THTH', 'THTH', 'TINDBB'),
    ('THPGUSR2', 'THPGUSR2', 'TINTDDT'),
    ('THPGUSR1', 'THPGUSR1', 'TINTDDT'),
    ('THPG', 'THPG', 'TINTDDT'),
    ('THNMUSR', 'THNMUSR', 'TINDBB'),
    ('THNM', 'THNM', 'TINDBB'),
    ('THN09USR2', 'THN09USR2', 'TINHNI'),
    ('THN09USR1', 'THN09USR1', 'TINHNI'),
    ('THN09', 'THN09', 'TINHNI'),
    ('THN08USR2', 'THN08USR2', 'TINHNI'),
    ('THN08USR1', 'THN08USR1', 'TINHNI'),
    ('THN08', 'THN08', 'TINHNI'),
    ('THN07USR2', 'THN07USR2', 'TINHNI'),
    ('THN07USR1', 'THN07USR1', 'TINHNI'),
    ('THN07', 'THN07', 'TINHNI'),
    ('THN06USR2', 'THN06USR2', 'TINHNI'),
    ('THN06USR1', 'THN06USR1', 'TINHNI'),
    ('THN06', 'THN06', 'TINHNI'),
    ('THN05USR3', 'THN05USR3', 'TINHNI'),
    ('THN05USR2', 'THN05USR2', 'TINHNI'),
    ('THN05USR1', 'THN05USR1', 'TINHNI'),
    ('THN05', 'THN05', 'TINHNI'),
    ('THN04USR3', 'THN04USR3', 'TINHNI'),
    ('THN04USR2', 'THN04USR2', 'TINHNI'),
    ('THN04USR1', 'THN04USR1', 'TINHNI'),
    ('THN04', 'THN04', 'TINHNI'),
    ('THN03USR2', 'THN03USR2', 'TINHNI'),
    ('THN03USR1', 'THN03USR1', 'TINHNI'),
    ('THN03', 'THN03', 'TINHNI'),
    ('THN02USR2', 'THN02USR2', 'TINHNI'),
    ('THN02USR1', 'THN02USR1', 'TINHNI'),
    ('THN02', 'THN02', 'TINHNI'),
    ('THN01USR2', 'THN01USR2', 'TINHNI'),
    ('THN01USR1', 'THN01USR1', 'TINHNI'),
    ('THN01', 'THN01', 'TINHNI'),
    ('THDGUSR2', 'THDGUSR2', 'TINTDDT'),
    ('THDGUSR1', 'THDGUSR1', 'TINTDDT'),
    ('THDG', 'THDG', 'TINTDDT'),
    ('THBHUSR', 'THBHUSR', 'TINTBB'),
    ('THBH', 'THBH', 'TINTBB'),
    ('THAGUSR', 'THAGUSR', 'TINTBB'),
    ('THAG', 'THAG', 'TINTBB'),
    ('TDNGUSR2', 'TDNGUSR2', 'TINTDDT'),
    ('TDNGUSR1', 'TDNGUSR1', 'TINTDDT'),
    ('TDNG', 'TDNG', 'TINTDDT'),
    ('TDBNUSR', 'TDBNUSR', 'TINDBB'),
    ('TDBN', 'TDBN', 'TINDBB'),
    ('TCBGUSR', 'TCBGUSR', 'TINTBB'),
    ('TCBG', 'TCBG', 'TINTBB'),
    ('TBNHUSR', 'TBNHUSR', 'TINTBB'),
    ('TBNH', 'TBNH', 'TINTBB'),
    ('TBGGUSR', 'TBGGUSR', 'TINTBB'),
    ('TBGG', 'TBGG', 'TINTBB'),
    ('PVTUUSR', 'PVTUUSR', 'PNCTDDT'),
    ('PVTU', 'PVTU', 'PNCTDDT'),
    ('PVLGUSR', 'PVLGUSR', 'PNCTNB'),
    ('PVLG', 'PVLG', 'PNCTNB'),
    ('PTVHUSR', 'PTVHUSR', 'PNCTNB'),
    ('PTVH', 'PTVH', 'PNCTNB'),
    ('PTNHUSR', 'PTNHUSR', 'PNCDNB'),
    ('PTNH', 'PTNH', 'PNCDNB'),
    ('PTGGUSR', 'PTGGUSR', 'PNCTNB'),
    ('PTGG', 'PTGG', 'PNCTNB'),
    ('PSTGUSR', 'PSTGUSR', 'PNCTNB'),
    ('PSTG', 'PSTG', 'PNCTNB'),
    ('PSG16USR', 'PSG16USR', 'PNCHCM'),
    ('PSG16', 'PSG16', 'PNCHCM'),
    ('PSG11USR', 'PSG11USR', 'PNCHCM'),
    ('PSG11', 'PSG11', 'PNCHCM'),
    ('PSG10USR', 'PSG10USR', 'PNCHCM'),
    ('PSG10', 'PSG10', 'PNCHCM'),
    ('PSG09USR', 'PSG09USR', 'PNCHCM'),
    ('PSG09', 'PSG09', 'PNCHCM'),
    ('PSG08USR', 'PSG08USR', 'PNCHCM'),
    ('PSG08', 'PSG08', 'PNCHCM'),
    ('PSG07USR', 'PSG07USR', 'PNCHCM'),
    ('PSG07', 'PSG07', 'PNCHCM'),
    ('PSG06USR', 'PSG06USR', 'PNCHCM'),
    ('PSG06', 'PSG06', 'PNCHCM'),
    ('PSG04USR1', 'PSG04USR1', 'PNCHCM'),
    ('PSG04USR', 'PSG04USR', 'PNCHCM'),
    ('PSG04', 'PSG04', 'PNCHCM'),
    ('PSG03USR', 'PSG03USR', 'PNCHCM'),
    ('PSG03', 'PSG03', 'PNCHCM'),
    ('PSG02USR1', 'PSG02USR1', 'PNCHCM'),
    ('PSG02USR', 'PSG02USR', 'PNCHCM'),
    ('PSG02', 'PSG02', 'PNCHCM'),
    ('PSG01USR2', 'PSG01USR2', 'PNCHCM'),
    ('PSG01USR1', 'PSG01USR1', 'PNCHCM'),
    ('PSG01USR', 'PSG01USR', 'PNCHCM'),
    ('PSG01', 'PSG01', 'PNCHCM'),
    ('PQNMUSR', 'PQNMUSR', 'PNCTNMT'),
    ('PQNM', 'PQNM', 'PNCTNMT'),
    ('PQNIUSR', 'PQNIUSR', 'PNCTNMT'),
    ('PQNI', 'PQNI', 'PNCTNMT'),
    ('PPYNUSR', 'PPYNUSR', 'PNCTNMT'),
    ('PPYN', 'PPYN', 'PNCTNMT'),
    ('PNTNUSR', 'PNTNUSR', 'PNCDNB'),
    ('PNTN', 'PNTN', 'PNCDNB'),
    ('PLDGUSR', 'PLDGUSR', 'PNCDNB'),
    ('PLDG', 'PLDG', 'PNCDNB'),
    ('PLANUSR', 'PLANUSR', 'PNCDNB'),
    ('PLAN', 'PLAN', 'PNCDNB'),
    ('PKTMUSR', 'PKTMUSR', 'PNCTNMT'),
    ('PKTM', 'PKTM', 'PNCTNMT'),
    ('PKHAUSR2', 'PKHAUSR2', 'PNCTDDT'),
    ('PKHAUSR1', 'PKHAUSR1', 'PNCTDDT'),
    ('PKHA', 'PKHA', 'PNCTDDT'),
    ('PKGGUSR', 'PKGGUSR', 'PNCTNB'),
    ('PKGG', 'PKGG', 'PNCTNB'),
    ('PHGGUSR', 'PHGGUSR', 'PNCTNB'),
    ('PHGG', 'PHGG', 'PNCTNB'),
    ('PGLIUSR', 'PGLIUSR', 'PNCTNMT'),
    ('PGLI', 'PGLI', 'PNCTNMT'),
    ('PDTPUSR', 'PDTPUSR', 'PNCTNB'),
    ('PDTP', 'PDTP', 'PNCTNB'),
    ('PDNI5USR', 'PDNI5USR', 'PNCTDDT'),
    ('PDNI5', 'PDNI5', 'PNCTDDT'),
    ('PDNI4USR', 'PDNI4USR', 'PNCTDDT'),
    ('PDNI4CUS', 'PDNI4CUS', 'PNCTDDT'),
    ('PDNI4', 'PDNI4', 'PNCTDDT'),
    ('PDNI3USR', 'PDNI3USR', 'PNCTDDT'),
    ('PDNI3', 'PDNI3', 'PNCTDDT'),
    ('PDNI2USR', 'PDNI2USR', 'PNCTDDT'),
    ('PDNI2', 'PDNI2', 'PNCTDDT'),
    ('PDNI1USR2', 'PDNI1USR2', 'PNCTDDT'),
    ('PDNI1USR1', 'PDNI1USR1', 'PNCTDDT'),
    ('PDNI1USR', 'PDNI1USR', 'PNCTDDT'),
    ('PDNI1', 'PDNI1', 'PNCTDDT'),
    ('PDLKUSR', 'PDLKUSR', 'PNCTNMT'),
    ('PDLK', 'PDLK', 'PNCTNMT'),
    ('PCTOUSR', 'PCTOUSR', 'PNCTNB'),
    ('PCTO', 'PCTO', 'PNCTNB'),
    ('PCMUUSR', 'PCMUUSR', 'PNCTNB'),
    ('PCMU', 'PCMU', 'PNCTNB'),
    ('PBTNUSR', 'PBTNUSR', 'PNCDNB'),
    ('PBTN', 'PBTN', 'PNCDNB'),
    ('PBTEUSR', 'PBTEUSR', 'PNCTNB'),
    ('PBTE', 'PBTE', 'PNCTNB'),
    ('PBPCUSR', 'PBPCUSR', 'PNCDNB'),
    ('PBPC', 'PBPC', 'PNCDNB'),
    ('PBLUUSR', 'PBLUUSR', 'PNCTNB'),
    ('PBLU', 'PBLU', 'PNCTNB'),
    ('PBDHUSR', 'PBDHUSR', 'PNCTNMT'),
    ('PBDH', 'PBDH', 'PNCTNMT'),
    ('PBDGUSR', 'PBDGUSR', 'PNCTDDT'),
    ('PBDG2USR', 'PBDG2USR', 'PNCTDDT'),
    ('PBDG2', 'PBDG2', 'PNCTDDT'),
    ('PBDG1USR', 'PBDG1USR', 'PNCTDDT'),
    ('PBDG1', 'PBDG1', 'PNCTDDT'),
    ('PBDG02USR', 'PBDG02USR', 'PNCTDDT'),
    ('PBDG02', 'PBDG02', 'PNCTDDT'),
    ('PBDG01USR', 'PBDG01USR', 'PNCTDDT'),
    ('PBDG01', 'PBDG01', 'PNCTDDT'),
    ('PBDG', 'PBDG', 'PNCTDDT'),
    ('PAGGUSR', 'PAGGUSR', 'PNCTNB'),
    ('PAGG', 'PAGG', 'PNCTNB'),
    ('DNGUSR1', 'DNGUSR1', 'TINTDDT'),
    ('DNG', 'DNG', 'TINTDDT'),
    ('BDG', 'BDG', 'PNCTDDT');

INSERT INTO org_units (
    region_id, unit_code, unit_name, is_active, created_at, updated_at
)
SELECT region.region_id,
       source.unit_code,
       source.unit_name,
       TRUE,
       NOW(),
       NOW()
  FROM org_unit_catalog_source source
  JOIN regions region ON region.region_code = source.region_code
ON CONFLICT (unit_code) DO UPDATE SET
    region_id = EXCLUDED.region_id,
    unit_name = EXCLUDED.unit_name,
    is_active = TRUE,
    updated_at = NOW();

UPDATE org_units unit
   SET is_active = FALSE,
       updated_at = NOW()
 WHERE unit.is_active = TRUE
   AND NOT EXISTS (
       SELECT 1
         FROM org_unit_catalog_source source
        WHERE source.unit_code = unit.unit_code
   );

UPDATE users roster
   SET unit_id = unit.unit_id,
       unit_code = unit.unit_code,
       unit_name = unit.unit_name,
       region_id = region.region_id,
       region_code = region.region_code,
       dashboard_region = COALESCE(region.dashboard_group, region.region_name),
       updated_at = NOW()
  FROM org_units unit
  JOIN regions region ON region.region_id = unit.region_id
 WHERE unit.is_active = TRUE
   AND UPPER(BTRIM(COALESCE(roster.unit_code, ''))) = unit.unit_code;

UPDATE users roster
   SET unit_id = NULL,
       unit_name = NULL,
       region_id = NULL,
       region_code = NULL,
       dashboard_region = NULL,
       updated_at = NOW()
 WHERE roster.role = 'KTV'
   AND NOT EXISTS (
       SELECT 1
         FROM org_units unit
        WHERE unit.is_active = TRUE
          AND unit.unit_code = UPPER(BTRIM(COALESCE(roster.unit_code, '')))
   );

UPDATE lab_assignments assignment
   SET unit_id_snapshot = roster.unit_id,
       region_id_snapshot = roster.region_id,
       updated_at = NOW()
  FROM class_enrollments enrollment
  JOIN users roster ON roster.user_id = enrollment.user_id
 WHERE enrollment.enrollment_id = assignment.enrollment_id
   AND (
       assignment.unit_id_snapshot IS DISTINCT FROM roster.unit_id
       OR assignment.region_id_snapshot IS DISTINCT FROM roster.region_id
   );

UPDATE training_classes training
   SET region_name = region.region_name,
       updated_at = NOW()
  FROM regions region
 WHERE region.region_id = training.region_id
   AND training.region_name IS DISTINCT FROM region.region_name;

CREATE OR REPLACE VIEW v_ktv_directory AS
SELECT u.user_id,
       u.email,
       u.display_name,
       u.role,
       u.last_login_at,
       u.iam_profile,
       u.employee_id,
       u.job_title,
       u.training_start_date,
       u.training_end_date,
       u.class_code,
       u.is_terminated,
       u.termination_date,
       u.termination_reason,
       CAST(unit.unit_code AS VARCHAR(50)) AS unit_code,
       unit.unit_name,
       region.region_id,
       CAST(region.region_code AS VARCHAR) AS region_code,
       region.region_name,
       COALESCE(region.dashboard_group, region.region_name) AS dashboard_region,
       region.dashboard_group,
       unit.unit_name AS branch_name,
       u.region_code AS source_region_code,
       u.dashboard_region AS source_dashboard_region,
       u.employee_source,
       u.employee_seed_batch,
       u.employee_synced_at,
       u.created_at,
       u.updated_at,
       (unit.unit_id IS NOT NULL AND region.region_id IS NOT NULL) AS location_assigned,
       unit.unit_id
  FROM users u
  LEFT JOIN org_units unit
    ON unit.unit_id = u.unit_id
   AND unit.is_active = TRUE
  LEFT JOIN regions region
    ON region.region_id = unit.region_id
   AND region.is_active = TRUE
 WHERE u.role = 'KTV';

COMMENT ON TABLE org_units IS
    'Canonical maDonVi/tenDonVi catalog. Every active unit belongs to one maVung region.';
COMMENT ON COLUMN users.unit_id IS
    'Canonical current unit. Legacy unit/region text columns are synchronized for compatibility.';
COMMENT ON COLUMN lab_assignments.unit_id_snapshot IS
    'Unit snapshot used by historical dashboard reporting.';
COMMENT ON VIEW v_ktv_directory IS
    'Canonical KTV directory. Region and branch are resolved through users.unit_id -> org_units -> regions.';
