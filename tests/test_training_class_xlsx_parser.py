import shutil
import subprocess
import unittest
from pathlib import Path


class TrainingClassXlsxParserTests(unittest.TestCase):
    def test_workbook_contract_and_formula_rejection(self):
        php = shutil.which("php")
        if php is None:
            self.skipTest("PHP CLI is not installed")
        root = Path(__file__).resolve().parents[1]
        completed = subprocess.run(
            [php, str(root / "tests" / "test_training_class_xlsx_parser.php")],
            cwd=root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)
        self.assertIn("Training class XLSX parser tests passed.", completed.stdout)


if __name__ == "__main__":
    unittest.main()
