import unittest
import os
import re

class TestMeshMultiWindowSplitView(unittest.TestCase):
    """
    Test suite for Multi-Window & 50/50 Split View feature in Mesh Lab (mesh-lab.html)
    """

    def setUp(self):
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.mesh_html_path = os.path.join(self.root_dir, 'mesh-lab.html')
        self.chassis_js_path = os.path.join(self.root_dir, 'js', 'mesh-lab', 'chassis-view.js')
        self.firmware_sync_js_path = os.path.join(self.root_dir, 'js', 'mesh-lab', 'firmware-sync.js')
        self.cli_js_path = os.path.join(self.root_dir, 'js', 'mesh-lab', 'cli-terminal.js')

    def test_1_mesh_lab_html_contains_both_device_windows(self):
        """Verify mesh-lab.html has both #cisco-device-window and #cisco-device-window-2"""
        with open(self.mesh_html_path, 'r', encoding='utf-8') as f:
            html = f.read()

        # Window 1 (Slot 1)
        self.assertIn('id="cisco-device-window"', html)
        self.assertIn('id="device-sim-iframe"', html)
        self.assertIn('id="cisco-win-titlebar"', html)
        self.assertIn('id="cisco-win-split-btn"', html)

        # Window 2 (Slot 2)
        self.assertIn('id="cisco-device-window-2"', html)
        self.assertIn('id="device-sim-iframe-2"', html)
        self.assertIn('id="cisco-win-titlebar-2"', html)
        self.assertIn('id="cisco-win-split-btn-2"', html)
        self.assertIn('id="win-dev-title-2"', html)
        self.assertIn('id="win-dev-ip-2"', html)
        self.assertIn('id="browser-url-bar-2"', html)
        self.assertIn('id="fw-link-sync-overlay-2"', html)
        self.assertIn('id="cisco-term-screen-2"', html)

    def test_2_ribbon_and_split_css_styles_exist(self):
        """Verify 50/50 split view CSS classes and ribbon toolbar button exist"""
        with open(self.mesh_html_path, 'r', encoding='utf-8') as f:
            html = f.read()

        # Ribbon button
        self.assertIn('id="btn-dual-device-split"', html)
        self.assertIn('toggleDualDeviceSplitView()', html)

        # CSS Styles for 50/50 split
        self.assertIn('.cisco-dev-window.split-left', html)
        self.assertIn('.cisco-dev-window.split-right', html)
        self.assertIn('.cisco-dev-window.slot-2-theme', html)
        self.assertIn('50vw', html)

    def test_3_chassis_view_js_has_slot_support_and_dual_window_allocator(self):
        """Verify chassis-view.js defines getSlotEl, bringWindowToFront, and dual-window allocation"""
        with open(self.chassis_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn('function getSlotEl(id, slot = 1)', js)
        self.assertIn('function bringWindowToFront(slot)', js)
        self.assertIn('studioState.activeWindowSlots', js)
        self.assertIn('win2Open', js)
        self.assertIn('device-sim-iframe', js)
        self.assertIn('phys-btn-power', js)

    def test_4_firmware_sync_js_has_split_view_and_cross_window_sync(self):
        """Verify firmware-sync.js supports toggleDualDeviceSplitView, draggable on both windows, and cross-sync"""
        with open(self.firmware_sync_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn('function toggleDualDeviceSplitView()', js)
        self.assertIn('makeDraggable(\'cisco-device-window\', \'cisco-win-titlebar\', 1);', js)
        self.assertIn('makeDraggable(\'cisco-device-window-2\', \'cisco-win-titlebar-2\', 2);', js)
        self.assertIn('device-sim-iframe-2', js)

    def test_5_cli_terminal_js_has_slot_support(self):
        """Verify cli-terminal.js supports slot-based terminals"""
        with open(self.cli_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        self.assertIn('function initCliForNode(node, forceReset = false, slot = 1)', js)
        self.assertIn('function execCliCmd(rawCmd, slot = 1)', js)
        self.assertIn('function clearCliScreen(slot = 1)', js)
        self.assertIn('function handleCliKey(e, slot = 1)', js)

if __name__ == '__main__':
    unittest.main()
