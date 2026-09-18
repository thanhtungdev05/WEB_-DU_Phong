import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_server(relative_path: str, module_name: str):
    path = ROOT / relative_path
    original_argv = sys.argv[:]
    try:
        sys.argv = [str(path)]
        spec = importlib.util.spec_from_file_location(module_name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.argv = original_argv


class SimulatorSessionIsolationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.portal_js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.ac_source = (ROOT / "simulators/sim_ac1000f/server2.py").read_text(encoding="utf-8")
        cls.hv2_source = (ROOT / "simulators/sim_ax3000hv2/server2.py").read_text(encoding="utf-8")
        cls.axc_source = (ROOT / "simulators/sim_ax3000c/server.py").read_text(encoding="utf-8")
        cls.achi_store_source = (ROOT / "simulators/sim_ac1000HI/src/config_store.py").read_text(encoding="utf-8")
        cls.achi_server_source = (ROOT / "simulators/sim_ac1000HI/src/server.py").read_text(encoding="utf-8")
        cls.ap6500_store_source = (ROOT / "simulators/ont_be6500c/src/config_store.py").read_text(encoding="utf-8")
        cls.ont6500_store_source = (ROOT / "simulators/sim_ONT_be6500c/src/config_store.py").read_text(encoding="utf-8")

    def test_ac1000f_and_ax3000hv2_keep_independent_user_state(self):
        for relative_path, module_name in (
            ("simulators/sim_ac1000f/server2.py", "test_sim_ac1000f_server"),
            ("simulators/sim_ax3000hv2/server2.py", "test_sim_ax3000hv2_server"),
        ):
            module = load_server(relative_path, module_name)
            first = module.get_client_state("ktv-a")
            second = module.get_client_state("ktv-b")
            first["ssid"] = "A"
            second["ssid"] = "B"
            self.assertEqual(module.get_client_state("ktv-a")["ssid"], "A")
            self.assertEqual(module.get_client_state("ktv-b")["ssid"], "B")
            self.assertIsNot(first, second)

    def test_reset_endpoints_remove_only_current_client(self):
        for source in (self.ac_source, self.hv2_source, self.axc_source):
            self.assertIn("USER_STATES.pop(", source)
            self.assertNotIn("USER_STATES.clear()", source)
        self.assertNotIn("ACTIVE_SESSIONS.clear()", self.axc_source)

    def test_active_simulators_never_clear_every_users_state_from_reset(self):
        for source in (
            self.achi_store_source,
            self.ap6500_store_source,
            self.ont6500_store_source,
        ):
            self.assertNotIn("USER_STATES.clear()", source)
            self.assertNotIn("_USER_CACHES.clear()", source)
        self.assertNotIn("ACTIVE_SESSIONS.clear()", self.achi_store_source)
        self.assertIn("if sid:\n                kho.dat_lai_factory(sid)", self.achi_server_source)

    def test_portal_waits_for_reset_before_loading_iframe(self):
        self.assertIn("const resetPromise = resetDeviceSession(currentDeviceId)", self.portal_js)
        self.assertIn("Promise.resolve(resetPromise).finally", self.portal_js)
        self.assertIn("credentials: 'same-origin'", self.portal_js)
        self.assertNotIn("currentLessonId = null;\n    resetDeviceSession(device.id);", self.portal_js)


if __name__ == "__main__":
    unittest.main()
