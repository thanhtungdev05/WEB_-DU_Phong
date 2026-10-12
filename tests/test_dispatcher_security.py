import gzip
import hashlib
import http.client
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path

# Some legacy simulator modules read sys.argv[1] as a port at import time.
# Isolate the dispatcher import from unittest's module/discovery arguments.
_original_argv = sys.argv
try:
    sys.argv = [sys.argv[0]]
    _repo_root = str(Path(__file__).resolve().parent.parent)
    if _repo_root not in sys.path:
        sys.path.insert(0, _repo_root)
    import run_all
finally:
    sys.argv = _original_argv


class DispatcherSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), run_all.MasterDispatcher)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, path, method='GET', headers=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        try:
            connection.request(method, path, headers=headers or {})
            response = connection.getresponse()
            body = response.read()
            return response.status, dict(response.getheaders()), body
        finally:
            connection.close()

    def test_public_portal_and_dashboard_assets_are_available(self):
        for path in (
            '/',
            '/portal.html',
            '/personal-dashboard.html',
            '/styles.css',
            '/assets/personal-dashboard.css',
            '/assets/personal-dashboard.js',
            '/dashboard/',
            '/dashboard/css/dashboard-professional.css',
            '/dashboard/js/app.js',
            '/devices/ax3000s/data.js',
            '/sim_be6500c/login.html',
            '/sim_ONT_be6500c/login.html',
            '/sim_ONT_be6500c/wifi__general.html',
            '/sim_ONT_be6500c/advanced__lan.html',
        ):
            with self.subTest(path=path):
                status, _, _ = self.request(path)
                self.assertEqual(status, 200)

    def test_liveness_endpoint_does_not_depend_on_database_or_internal_api(self):
        status, headers, body = self.request('/health/live')
        normalized_headers = {key.lower(): value for key, value in headers.items()}

        self.assertEqual(status, 200)
        self.assertEqual(normalized_headers.get('content-type'), 'application/json; charset=utf-8')
        self.assertEqual(body, b'{"ok":true,"service":"dispatcher"}')

        status, _, body = self.request('/health/live', method='HEAD')
        self.assertEqual(status, 200)
        self.assertEqual(body, b'')

        # Backward-compatible alias for older monitors; Docker uses /health/live.
        status, _, _ = self.request('/healthz')
        self.assertEqual(status, 200)

    def test_every_active_device_has_a_non_empty_dispatcher_entry_page(self):
        paths = (
            '/sim_ac1000f/cgi-bin/index.asp?page=home_wan.asp',
            '/sim_ax3000c/',
            '/sim_ax3000gz/cgi-bin/luci/admin/internet/wan',
            '/sim_ax3000hv2/cgi-bin/index.asp?page=home_wan.asp',
            '/sim_ax3000s/app.html',
            '/sim_ac1000HI/cgi-bin/index.asp?page=home_wan.asp',
            '/sim_be6500c/advanced__wan.html',
            '/sim_ONT_be6500c/advanced__wan.html',
        )
        for path in paths:
            with self.subTest(path=path):
                status, _, body = self.request(path)
                self.assertIn(status, (200, 401), path)
                self.assertGreater(len(body), 100, path)

    def test_legacy_frames_and_shared_lan_defaults_do_not_depend_on_mobile_referer(self):
        for simulator in ('sim_ac1000f', 'sim_ax3000hv2'):
            path = f'/{simulator}/cgi-bin/index.asp?page=home_wan.asp'
            status, _, body = self.request(path)
            self.assertEqual(status, 200)
            self.assertIn(f'src="/{simulator}/cgi-bin/'.encode(), body)

        status, _, body = self.request('/sim_ac1000f/cgi-bin/home_lan.asp')
        self.assertEqual(status, 200)
        compact = b' '.join(body.split())
        self.assertRegex(compact, rb'NAME="StartIp"[^>]*VALUE="192\.168\.1\.2"')
        self.assertRegex(compact, rb'NAME="EndIp"[^>]*VALUE="192\.168\.1\.254"')
        self.assertRegex(compact, rb'NAME="dhcp_LeaseTime"[^>]*VALUE="86400"')

    def test_device_rest_path_is_reserved_for_selected_be6500c_simulator(self):
        self.assertFalse(run_all.is_portal_path('/api/v1/data/system/info'))
        self.assertTrue(run_all.is_portal_path('/api/index.php/dashboard'))

        direct_status, _, _ = self.request('/api/v1/data/system/info')
        self.assertEqual(direct_status, 404)

        status, headers, body = self.request(
            '/api/v1/data/system/info',
            headers={'Referer': f'http://127.0.0.1:{self.port}/sim_ONT_be6500c/home__overview.html'},
        )
        self.assertEqual(status, 200)
        self.assertIn('application/json', headers.get('Content-Type', headers.get('content-type', '')))
        self.assertTrue(body)

    def test_dashboard_can_return_to_portal_on_same_keep_alive_connection(self):
        connection = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        try:
            connection.request('GET', '/dashboard/')
            dashboard_response = connection.getresponse()
            dashboard_response.read()
            self.assertEqual(dashboard_response.status, 200)

            connection.request(
                'GET',
                '/portal.html',
                headers={'Referer': f'http://127.0.0.1:{self.port}/dashboard/'},
            )
            portal_response = connection.getresponse()
            portal_body = portal_response.read()

            self.assertEqual(portal_response.status, 200)
            self.assertIn(b'FTC device simulator portal', portal_body)
        finally:
            connection.close()

    def test_roster_template_download_is_an_attachment(self):
        template_path = '/templates/Mau_Import_KTV.xlsx'
        status, headers, body = self.request(template_path)
        normalized_headers = {key.lower(): value for key, value in headers.items()}

        self.assertEqual(status, 200)
        self.assertEqual(
            normalized_headers.get('content-type'),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        self.assertTrue(normalized_headers.get('content-disposition', '').startswith('attachment;'))
        self.assertIn('filename="Mau_Import_KTV.xlsx"', normalized_headers['content-disposition'])
        self.assertNotIn('location', normalized_headers)
        self.assertTrue(body.startswith(b'PK\x03\x04'))

        status, headers, body = self.request(template_path, method='HEAD')
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertTrue(normalized_headers.get('content-disposition', '').startswith('attachment;'))
        self.assertEqual(body, b'')

    def test_login_dispatch_redirects_to_login_index_html(self):
        for request_path, expected_location in (
            ('/login', '/login/index.html'),
            ('/login/', '/login/index.html'),
            ('/login/?redirect=%2Fpersonal-dashboard.html', '/login/index.html?redirect=%2Fpersonal-dashboard.html'),
        ):
            with self.subTest(request_path=request_path):
                status, headers, _ = self.request(request_path)
                normalized_headers = {key.lower(): value for key, value in headers.items()}
                self.assertEqual(status, 302)
                self.assertEqual(normalized_headers.get('location'), expected_location)

        # Following the redirect serves the actual login page (no 404).
        status, _, body = self.request('/login/index.html?redirect=%2Fpersonal-dashboard.html')
        self.assertEqual(status, 200)
        self.assertIn(b'iam-login', body)

    def test_source_configuration_and_directory_listing_are_not_public(self):
        for path in (
            '/run_all.py',
            '/.env',
            '/composer.json',
            '/dashboard-authen/DATABASE_SCHEMA.md',
            '/devices/',
        ):
            with self.subTest(path=path):
                status, _, _ = self.request(path)
                self.assertEqual(status, 404)

    def test_encoded_parent_directory_cannot_bypass_public_prefix(self):
        status, _, _ = self.request('/devices/%2e%2e/composer.json')
        self.assertEqual(status, 404)

    def test_security_headers_and_head_are_supported(self):
        status, headers, body = self.request('/styles.css', method='HEAD')
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertEqual(body, b'')
        self.assertEqual(normalized_headers.get('x-content-type-options'), 'nosniff')
        self.assertEqual(normalized_headers.get('x-frame-options'), 'SAMEORIGIN')
        self.assertIn("frame-ancestors 'self'", normalized_headers.get('content-security-policy', ''))

        stylesheet = Path(run_all.BASE_DIR) / 'dashboard-authen' / 'css' / 'dashboard-professional.css'
        asset_version = hashlib.sha256(stylesheet.read_bytes()).hexdigest()[:16]
        status, headers, body = self.request(
            f'/dashboard/css/dashboard-professional.css?v={asset_version}',
            method='HEAD',
        )
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertEqual(body, b'')
        self.assertIn('immutable', normalized_headers.get('cache-control', ''))

        status, headers, _ = self.request(
            '/dashboard/css/dashboard-professional.css?v=legacy-manual-version',
            method='HEAD',
        )
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertEqual(normalized_headers.get('cache-control'), 'no-cache')

        status, headers, _ = self.request('/portal.html', method='HEAD')
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertEqual(normalized_headers.get('cache-control'), 'no-cache, must-revalidate')
        self.assertNotIn('no-store', normalized_headers.get('cache-control', ''))

        last_modified = normalized_headers.get('last-modified')
        self.assertTrue(last_modified)
        status, _, body = self.request(
            '/portal.html',
            headers={'If-Modified-Since': last_modified},
        )
        self.assertEqual(status, 304)
        self.assertEqual(body, b'')

    def test_ax3000cv2_static_assets_are_cacheable_but_state_endpoints_are_not(self):
        cookie = {'Cookie': 'ftc_session=cache-test-technician'}
        status, headers, body = self.request(
            '/sim_ax3000c/js/chunk-vendors.9b4ab5b7.1726822665278.js',
            headers=cookie,
        )
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertTrue(body)
        self.assertIn('immutable', normalized_headers.get('cache-control', ''))
        self.assertNotIn('no-store', normalized_headers.get('cache-control', ''))

        status, headers, _ = self.request(
            '/sim_ax3000c/ftc-dat-bai?bai=2',
            headers=cookie,
        )
        normalized_headers = {key.lower(): value for key, value in headers.items()}
        self.assertEqual(status, 200)
        self.assertEqual(normalized_headers.get('cache-control'), 'no-store')

    def test_large_json_response_supports_gzip_without_compressing_workbooks(self):
        source = b'{"data":"' + (b'x' * 4096) + b'"}'
        encoded, compressed = run_all.encode_api_response(
            source,
            content_type='application/json; charset=utf-8',
            accept_encoding='br, gzip',
        )
        self.assertTrue(compressed)
        self.assertLess(len(encoded), len(source))
        self.assertEqual(gzip.decompress(encoded), source)

        workbook, workbook_compressed = run_all.encode_api_response(
            source,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            accept_encoding='gzip',
        )
        self.assertFalse(workbook_compressed)
        self.assertEqual(workbook, source)


if __name__ == '__main__':
    unittest.main()
