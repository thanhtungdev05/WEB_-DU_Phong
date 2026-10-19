import os
from http.server import SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

class H(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _gui_reset(self):
        resp = b'{"status":"ok","message":"BE15000 state reset"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(resp)))
        self.end_headers()
        self.wfile.write(resp)

    def _gui_html(self, html_text, code=200):
        data = html_text.encode('utf-8')
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()

        # Kiểm tra trạng thái nguồn AP từ Mesh Engine
        try:
            import mesh_zte_engine
            st = mesh_zte_engine.get_state()
            if not st.get("ap_power", True):
                if not (path.endswith('.css') or path.endswith('.js') or path.endswith('.png') or path.endswith('.ico')):
                    return self._gui_html(
                        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>AP Đang Tắt Nguồn</title></head>'
                        '<body style="background:#090d16;color:#f87171;font-family:system-ui,-apple-system,sans-serif;'
                        'display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">'
                        '<div style="text-align:center;padding:36px;background:#131c2e;border-radius:16px;'
                        'border:1px solid #1e293b;max-width:480px;box-shadow:0 20px 40px rgba(0,0,0,0.5);">'
                        '<div style="font-size:52px;margin-bottom:16px;">🔌❌</div>'
                        '<h2 style="color:#f8fafc;margin:0 0 10px 0;font-size:20px;">AP BE15000Z Đang Tắt Nguồn</h2>'
                        '<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px 0;">'
                        'Thiết bị Access Point đang ở trạng thái ngắt điện. Vui lòng bật nguồn thiết bị trên '
                        '<b>Sơ đồ Đấu nối Topology</b> để truy cập giao diện quản trị.</p>'
                        '<span style="display:inline-block;padding:6px 14px;background:rgba(239,68,68,0.15);'
                        'color:#fca5a5;border-radius:20px;font-size:12px;font-weight:600;">STATUS: POWER_OFF (0V)</span>'
                        '</div></body></html>', 503
                    )
        except Exception:
            pass

        full_path = os.path.join(self.directory, path.lstrip('/'))
        if not os.path.exists(full_path) and os.path.exists(full_path + '.html'):
            self.path = self.path.replace(path, path + '.html', 1)
            full_path = full_path + '.html'

        # Động hóa SSID đồng bộ từ Controller sang trang localNetStatus.html
        if 'localNetStatus' in path and os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8', errors='replace') as fh:
                    content = fh.read()
                try:
                    import mesh_zte_engine
                    synced_ssid = mesh_zte_engine.get_state().get("ap_synced_ssid")
                    if synced_ssid:
                        content = content.replace('title="H6701Q_99A2" \'="">H6701Q_99A2',
                                                  f'title="{synced_ssid}" \'="">{synced_ssid}')
                except Exception:
                    pass
                return self._gui_html(content)
            except Exception:
                pass

        return super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0].split('#')[0]
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()
        return self._gui_reset()

