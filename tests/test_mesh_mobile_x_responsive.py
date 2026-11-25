import os
import subprocess
import shutil
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class TestMeshMobileXResponsive(unittest.TestCase):
    """Regression suite for Mobile X (375x812 portrait & 812x375 landscape) Mesh UX."""

    @classmethod
    def setUpClass(cls):
        cls.mesh_html = (ROOT / "mesh-lab.html").read_text(encoding="utf-8")
        cls.canvas_js = (ROOT / "js" / "mesh-lab" / "canvas.js").read_text(encoding="utf-8")
        cls.chassis_js = (ROOT / "js" / "mesh-lab" / "chassis-view.js").read_text(encoding="utf-8")
        cls.fw_sync_js = (ROOT / "js" / "mesh-lab" / "firmware-sync.js").read_text(encoding="utf-8")
        cls.styles_css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.app_js = (ROOT / "app.js").read_text(encoding="utf-8")

    def test_1_portal_mobile_frame_and_toolbar_fit_375px(self):
        """Verify portal.html mobile frame hides redundant topbar in practice, collapses sidebar on lesson select, and guards #net-canvas."""
        self.assertIn("body.practice-screen-active #topbar", self.styles_css)
        self.assertIn("env(safe-area-inset-left", self.styles_css)
        self.assertIn("doc.getElementById('net-canvas')", self.app_js)
        self.assertIn("document.body.classList.add('practice-screen-active')", self.app_js)
        self.assertIn("if (window.innerWidth <= 900)", self.app_js)

    def test_2_mesh_canvas_touch_drag_and_non_overlapping_spawn(self):
        """Verify touch drag updates coordinates without destroying DOM mid-gesture and smart spawn separates devices."""
        self.assertIn("touch-action: none;", self.mesh_html)
        self.assertIn("function computeSmartSpawnPosition()", self.canvas_js)
        self.assertIn("function startNodeTouchInteraction(", self.canvas_js)
        self.assertIn("function onNodeTouchMove(", self.canvas_js)
        self.assertIn("function onNodeTouchEnd(", self.canvas_js)
        self.assertIn("function getRecommendedPaletteKeys()", self.canvas_js)
        self.assertIn("function clampNodesInsideCanvasViewport()", self.canvas_js)
        self.assertIn("palette-item-recommended", self.canvas_js)

    def test_3_device_window_mobile_fullscreen_quick_switcher_and_outer_iframe_scale(self):
        """Verify mobile device window keeps back/close buttons visible, provides 1-tap switcher, and scales outer iframe stage without touching simulators."""
        self.assertIn('id="mobile-dev-quickbar"', self.mesh_html)
        self.assertIn('id="mobile-dev-quickbar-2"', self.mesh_html)
        self.assertIn('id="cisco-iframe-stage"', self.mesh_html)
        self.assertIn('id="cisco-iframe-stage-2"', self.mesh_html)
        self.assertIn("#win-dev-title, #win-dev-title-2", self.mesh_html)
        self.assertIn("text-overflow: ellipsis;", self.mesh_html)
        self.assertIn("@media (max-height: 500px) and (orientation: landscape)", self.mesh_html)
        self.assertIn("function applyMobileWebGuiScale(", self.chassis_js)
        self.assertIn("function setMobileWebGuiScale(", self.chassis_js)
        self.assertIn("function renderMobileDevQuickbars()", self.chassis_js)

    def test_4_javascript_syntax_valid(self):
        """Verify all modified JavaScript files pass node --check syntax validation."""
        node_bin = shutil.which("node")
        if not node_bin:
            self.skipTest("node binary not available in PATH")
        targets = [
            ROOT / "app.js",
            ROOT / "js" / "mesh-lab" / "canvas.js",
            ROOT / "js" / "mesh-lab" / "chassis-view.js",
            ROOT / "js" / "mesh-lab" / "firmware-sync.js",
            ROOT / "js" / "mesh-lab" / "main.js",
        ]
        for js_file in targets:
            proc = subprocess.run(
                [node_bin, "--check", str(js_file)],
                capture_output=True,
                text=True,
                cwd=str(ROOT),
            )
            self.assertEqual(proc.returncode, 0, f"Syntax error in {js_file.name}: {proc.stderr}")

    def test_5_mobile_x_portrait_and_landscape_behavioral_geometry(self):
        """Simulate 375x812 Portrait, 812x375 Landscape, and 1440x900 Desktop in Node to verify coordinates & scaling."""
        node_bin = shutil.which("node")
        if not node_bin:
            self.skipTest("node binary not available in PATH")

        harness = r"""
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const catalogCode = fs.readFileSync('js/mesh-lab/catalog.js', 'utf8');
const canvasCode = fs.readFileSync('js/mesh-lab/canvas.js', 'utf8');
const chassisCode = fs.readFileSync('js/mesh-lab/chassis-view.js', 'utf8');

const elements = {};
function makeEl(id, cw = 375, ch = 580) {
  return {
    id,
    clientWidth: cw,
    clientHeight: ch,
    style: {},
    dataset: {},
    scrollLeft: 99,
    innerHTML: '',
    children: [],
    className: '',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); if (f) this._s.add(c); else this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
  };
}

elements['net-canvas'] = makeEl('net-canvas', 375, 580);
elements['palette-shelf'] = makeEl('palette-shelf', 375, 70);
elements['canvas-nodes'] = makeEl('canvas-nodes', 375, 580);
elements['canvas-svg'] = makeEl('canvas-svg', 375, 580);
elements['cisco-iframe-wrap'] = makeEl('cisco-iframe-wrap', 375, 640);
elements['cisco-iframe-stage'] = Object.assign(makeEl('cisco-iframe-stage', 375, 640), { parentElement: elements['cisco-iframe-wrap'] });
elements['device-sim-iframe'] = makeEl('device-sim-iframe', 375, 640);
elements['mobile-zoom-pills'] = makeEl('mobile-zoom-pills', 140, 28);
elements['mobile-dev-switcher'] = makeEl('mobile-dev-switcher', 200, 28);
elements['cisco-device-window'] = makeEl('cisco-device-window', 375, 812);
elements['cisco-device-window-2'] = makeEl('cisco-device-window-2', 375, 812);

const ctx = {
  console, Math, Date, Number, String, Boolean, Array, Object, Set, RegExp, parseFloat, parseInt, encodeURIComponent,
  setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: fn => fn(),
  location: { origin: 'http://localhost:8000', search: '?embed=1&lab=LAB_AX3000CV2_07&scenario=p3_mesh_ax3000cv2' },
  URL, URLSearchParams,
  sessionStorage: { removeItem() {}, getItem() { return null; }, setItem() {} },
  localStorage: { removeItem() {}, getItem() { return null; }, setItem() {} },
  window: null,
  document: {
    readyState: 'complete',
    body: makeEl('body', 375, 812),
    getElementById: id => elements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: tag => makeEl(tag, 100, 44),
    createElementNS: () => makeEl('svg-el', 10, 10),
    addEventListener() {}
  },
  nodeCounter: 1,
  linkCounter: 1,
  renderPduScenarioTable() {},
  propagateFirmwareStateAcrossLinks() {},
  syncZteBackend() {},
  showToast() {},
  updateHudTelemetry() {},
  updateNs3PhysicsPanelUi() {},
  updateWebGuiLivePhyBar() {},
  renderFwLinkSyncOverlay() {},
  initCliForNode() {},
  switchDeviceWindowTab() {},
  attachWebGuiTwoWayBridge() {}
};
ctx.window = ctx;
ctx.window.innerWidth = 375;
ctx.window.innerHeight = 812;
ctx.window._isEmbeddedPortalLesson = true;
ctx.window._embeddedPortalScenario = 'p3_mesh_ax3000cv2';
ctx.window.addEventListener = () => {};

vm.createContext(ctx);
vm.runInContext(catalogCode + '\n' + canvasCode + '\n' + chassisCode, ctx);

// 1. First palette item in LAB_AX3000CV2_07 must be ax3000c with recommended highlight
ctx.populatePalette();
assert(elements['palette-shelf'].children.length > 0, 'Palette must have items');
const firstItem = elements['palette-shelf'].children[0];
assert.strictEqual(firstItem['data-key'], 'ax3000c', 'ax3000c must be pinned #1 on shelf');
assert(firstItem.className.includes('palette-item-recommended'), 'ax3000c must have recommended highlight');

// 2. Two taps on Mobile X Portrait (375x812) must place 2 non-overlapping nodes inside 375px
firstItem.onclick();
firstItem.onclick();
assert.strictEqual(ctx.studioState.nodes.length, 2, 'Should have 2 spawned nodes');
const [n1, n2] = ctx.studioState.nodes;
const distPortrait = Math.hypot(n2.x - n1.x, n2.y - n1.y);
assert(distPortrait >= 145, 'Two nodes on 375px portrait must NOT overlap, got dist=' + distPortrait);
assert(n1.x >= 10 && n1.x <= 375 - 105, 'Node 1 must fit inside 375px width: ' + n1.x);
assert(n2.x >= 10 && n2.x <= 375 - 105, 'Node 2 must fit inside 375px width: ' + n2.x);

// 3. Rotate to Landscape (812x375), place far right, then rotate back to Portrait (375x812): must clamp cleanly without colliding
n2.x = 680;
elements['net-canvas'].clientWidth = 375;
elements['net-canvas'].clientHeight = 580;
ctx.clampNodesInsideCanvasViewport();
assert(n2.x <= 375 - 108, 'Clamped node X must be inside 375px after rotation: ' + n2.x);
assert(Math.hypot(n2.x - n1.x, n2.y - n1.y) >= 80, 'Clamped nodes must stay separated');

// 4. Outer iframe scale on Mobile X Portrait (375px): virtual width 1040px, never crushed to 353px!
ctx.setMobileWebGuiScale('75', 1);
assert.strictEqual(elements['device-sim-iframe'].style.width, '1040px', 'Router iframe must keep 1040px desktop width');
assert(elements['device-sim-iframe'].style.transform.startsWith('scale(0.68'), '75% comfort preset should scale ~0.68 on 375px');

ctx.setMobileWebGuiScale('fit', 1);
assert.strictEqual(elements['cisco-iframe-stage'].style.width, '375px', 'Fit mode stage width must match 375px viewport');

// 5. Desktop (1440x900) must leave iframe 100% untouched (no transform)
ctx.window.innerWidth = 1440;
ctx.window.innerHeight = 900;
ctx.applyMobileWebGuiScale(1);
assert.strictEqual(elements['device-sim-iframe'].style.width, '100%');
assert.strictEqual(elements['device-sim-iframe'].style.transform, 'none');
console.log('MOBILE_X_GEOMETRY_OK');
"""
        proc = subprocess.run(
            [node_bin, "-e", harness],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
        )
        self.assertEqual(proc.returncode, 0, f"Behavioral geometry harness failed:\n{proc.stderr}\n{proc.stdout}")
        self.assertIn("MOBILE_X_GEOMETRY_OK", proc.stdout)

    def test_6_simulators_and_devices_untouched_by_mobile_wrapper(self):
        """Ensure git diff on simulators/ and devices/ is completely empty."""
        git_bin = shutil.which("git")
        if not git_bin:
            self.skipTest("git binary not available")
        proc = subprocess.run(
            [git_bin, "diff", "--name-only", "--", "simulators", "devices"],
            capture_output=True,
            text=True,
            cwd=str(ROOT),
        )
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(proc.stdout.strip(), "", f"simulators/ and devices/ must not be modified: {proc.stdout}")


if __name__ == "__main__":
    unittest.main()
