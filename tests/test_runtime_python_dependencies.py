import importlib
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_CRYPTOGRAPHY = "cryptography==50.0.2"


class RuntimePythonDependencyTests(unittest.TestCase):
    def test_all_runtime_manifests_install_ax3000gz_v2_crypto_dependency(self):
        manifests = (
            ROOT / "requirements.txt",
            ROOT / "admin_app" / "requirements-admin.txt",
        )
        for manifest in manifests:
            with self.subTest(manifest=manifest.relative_to(ROOT)):
                requirements = {
                    line.strip()
                    for line in manifest.read_text(encoding="utf-8").splitlines()
                    if line.strip() and not line.lstrip().startswith("#")
                }
                self.assertIn(REQUIRED_CRYPTOGRAPHY, requirements)

    def test_crypto_cipher_api_used_by_ax3000gz_v2_is_importable(self):
        ciphers = importlib.import_module("cryptography.hazmat.primitives.ciphers")
        self.assertTrue(hasattr(ciphers, "Cipher"))
        self.assertTrue(hasattr(ciphers, "algorithms"))
        self.assertTrue(hasattr(ciphers, "modes"))


if __name__ == "__main__":
    unittest.main()
