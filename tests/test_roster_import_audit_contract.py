import re
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]


class RosterImportAuditContractTests(unittest.TestCase):
    def test_template_contains_only_the_snapshot_sheet(self):
        workbook = ROOT / "templates" / "Mau_Import_KTV.xlsx"
        with zipfile.ZipFile(workbook) as archive:
            document = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        sheets = [
            node.attrib["name"]
            for node in document.iter()
            if node.tag.endswith("}sheet")
        ]
        self.assertEqual(sheets, ["Danh sách KTV"])

    def test_sync_uses_all_active_ktv_as_snapshot_scope(self):
        source = (ROOT / "api" / "lib" / "ktv_roster_import.php").read_text(encoding="utf-8")
        self.assertIn("WHERE UPPER(BTRIM(role)) = :role", source)
        self.assertIn("$result['unchanged']++", source)
        self.assertIn("ktv_roster_field_changes($existing, $row, $unit)", source)
        self.assertNotIn("WHERE employee_source = :employee_source", source)

    def test_audit_schema_and_history_expose_status_errors_and_changes(self):
        migration = (ROOT / "api" / "migrations" / "059_roster_import_audit_details.sql").read_text(encoding="utf-8")
        for column in ("unchanged", "status", "change_details"):
            self.assertRegex(migration, rf"ADD COLUMN IF NOT EXISTS {column}\b")

        api = (ROOT / "api" / "index.php").read_text(encoding="utf-8")
        self.assertIn("roster_log_failed_import", api)
        self.assertIn("'changes' => is_array($changes) ? $changes : []", api)

        frontend = (ROOT / "dashboard-authen" / "js" / "app.js").read_text(encoding="utf-8")
        self.assertIn("renderRosterFieldChanges", frontend)
        self.assertIn("Xem chi tiết", frontend)
        self.assertNotIn("KTV trong sheet “Nghỉ việc”", frontend)

    def test_success_log_persists_field_changes_and_failure_reason(self):
        source = (ROOT / "api" / "lib" / "ktv_roster_import.php").read_text(encoding="utf-8")
        insert = re.search(
            r"INSERT INTO roster_import_log \((?P<columns>.*?)\) VALUES",
            source,
            re.DOTALL,
        )
        self.assertIsNotNone(insert)
        columns = insert.group("columns")
        self.assertIn("status", columns)
        self.assertIn("error_details", columns)
        self.assertIn("change_details", columns)


if __name__ == "__main__":
    unittest.main()
