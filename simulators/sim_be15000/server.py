import os
from http.server import SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "www")

class H(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        # Rewrite URL if it doesn't have an extension and the file without extension doesn't exist
        path = self.path.split('?')[0].split('#')[0]
        full_path = os.path.join(self.directory, path.lstrip('/'))
        if not os.path.exists(full_path) and os.path.exists(full_path + '.html'):
            self.path = self.path.replace(path, path + '.html', 1)
        return super().do_GET()
