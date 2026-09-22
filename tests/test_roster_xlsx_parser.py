import shutil
import subprocess
import unittest
from pathlib import Path


class RosterXlsxParserPhpRegressionTests(unittest.TestCase):
    def test_snapshot_and_delta_namespace_workbooks(self):
        php = shutil.which("php")
        if php is None:
            self.skipTest("PHP CLI is not installed in this test environment")

        project_root = Path(__file__).resolve().parents[1]
        script = project_root / "tests" / "test_roster_xlsx_parser.php"
        completed = subprocess.run(
            [php, str(script)],
            cwd=project_root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
            check=False,
        )

        self.assertEqual(
            completed.returncode,
            0,
            msg=(
                "PHP roster XLSX regression script failed.\n"
                f"stdout:\n{completed.stdout}\n"
                f"stderr:\n{completed.stderr}"
            ),
        )
        self.assertIn("Roster XLSX parser regression fixtures passed.", completed.stdout)


if __name__ == "__main__":
    unittest.main()
