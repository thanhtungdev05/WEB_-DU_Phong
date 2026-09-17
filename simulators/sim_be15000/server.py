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

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()
        full_path = os.path.join(self.directory, path.lstrip('/'))
        if not os.path.exists(full_path) and os.path.exists(full_path + '.html'):
            self.path = self.path.replace(path, path + '.html', 1)
        return super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0].split('#')[0]
        if path in ("/api/reset", "/resetsession"):
            return self._gui_reset()
        return self._gui_reset()
