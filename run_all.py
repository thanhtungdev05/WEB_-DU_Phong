#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Master Server (Port 8080) cho Hệ thống giả lập mạng FPT.
Đóng vai trò điều hướng (Dispatcher) các request tới đúng server con
và proxy /api/* sang PHP nội bộ — toàn bộ chạy trên 1 cổng duy nhất (8080).
"""
import os
import posixpath
import re
import sys
import threading
import time
import webbrowser
import socket
import shutil
import subprocess
import http.client
import ipaddress
import gzip
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

# Reconfigure stdout cho UTF-8 trên Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_DIR = os.path.join(BASE_DIR, 'dashboard-authen')
os.chdir(BASE_DIR)

def load_env():
    """Doc file .env o thu muc goc va nap vao os.environ neu chua co."""
    env_path = os.path.join(BASE_DIR, '.env')
    if os.path.isfile(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    if k and k not in os.environ:
                        os.environ[k] = v
        except Exception:
            pass

load_env()

PORT = int(os.environ.get('PORT', '8080'))
API_PORT = int(os.environ.get('API_PORT', '8082'))
DJANGO_PORT = int(os.environ.get('DJANGO_PORT', '8083'))
try:
    API_PROXY_TIMEOUT_SECONDS = int(os.environ.get('API_PROXY_TIMEOUT_SECONDS', '90'))
except ValueError:
    API_PROXY_TIMEOUT_SECONDS = 90
API_PROXY_TIMEOUT_SECONDS = max(10, min(API_PROXY_TIMEOUT_SECONDS, 300))

# Import các Handler của từng thiết bị
import simulators.sim_ac1000f.server2 as ac1000f
import simulators.sim_ax3000c.server as ax3000c
import simulators.sim_ax3000gz.server as ax3000gz
import simulators.sim_ax3000hv2.server2 as ax3000hv2
import simulators.sim_ax3000s.server as ax3000s
import simulators.sim_be12000.src.server as be12000
import simulators.sim_be15000.server as be15000
import simulators.sim_ac1000HI.src.server as ac1000HI
import simulators.sim_vigor2927.src.server as vigor2927
import simulators.sim_ONT_be6500c.src.server as be6500c
import simulators.ont_be6500c.src.server as ONT_be6500c
import simulators.mikrotik_hexs.src.server as mikrotik_hexs

# Mapping từ device id sang module
SIM_MODULES = {
    'sim_ac1000f': ac1000f,
    'sim_ax3000c': ax3000c,
    'sim_ax3000gz': ax3000gz,
    'sim_ax3000hv2': ax3000hv2,
    'sim_ax3000s': ax3000s,
    'sim_be12000': be12000,
    'sim_be15000': be15000,
    'sim_ac1000HI': ac1000HI,
    'sim_vigor2927': vigor2927,
    'sim_be6500c': be6500c,
    'sim_ONT_be6500c': ONT_be6500c,
    'sim_mikrotik_hexs': mikrotik_hexs
}

# Các class Handler của từng thiết bị
SIM_HANDLERS = {
    'sim_ac1000f': ac1000f.H,
    'sim_ax3000c': ax3000c.Handler,
    'sim_ax3000gz': ax3000gz.H,
    'sim_ax3000hv2': ax3000hv2.H,
    'sim_ax3000s': ax3000s.H,
    'sim_be12000': be12000.Handler,
    'sim_be15000': be15000.H,
    'sim_ac1000HI': ac1000HI.H,
    'sim_vigor2927': vigor2927.H,
    'sim_be6500c': be6500c.H,
    'sim_ONT_be6500c': ONT_be6500c.H,
    'sim_mikrotik_hexs': mikrotik_hexs.H
}

# File/thư mục Portal luôn do Portal phục vụ (chống bị 'cướp' bởi Referer/Cookie)
PORTAL_PATHS = {'/', '/index.html', '/styles.css', '/app.js', '/data.js', '/portal.html',
                '/personal-dashboard.html',
                '/favicon.ico', '/login', '/login/index.html', '/api',
                '/dashboard', '/dashboard/', '/dashboard-authen', '/dashboard-authen/',
                '/admin', '/admin/', '/templates/Mau_Import_KTV.xlsx'}
PORTAL_PREFIXES = ('/devices/', '/assets/', '/login/', '/api/',
                   '/dashboard/', '/dashboard-authen/', '/admin/', '/admin-static/')

PUBLIC_ROOT_FILES = {
    '/index.html', '/portal.html', '/personal-dashboard.html', '/styles.css', '/app.js', '/data.js', '/favicon.ico',
    '/templates/Mau_Import_KTV.xlsx'
}
DOWNLOADABLE_ROOT_FILES = {
    '/templates/Mau_Import_KTV.xlsx': 'Mau_Import_KTV.xlsx',
}
PUBLIC_ROOT_PREFIXES = ('/devices/', '/assets/', '/login/')
DASHBOARD_PUBLIC_PATHS = {
    '/', '/index.html', '/css/styles.css', '/css/dashboard-professional.css', '/js/app.js'
}
SENSITIVE_EXTENSIONS = {
    '.env', '.ini', '.log', '.lock', '.md', '.php', '.py', '.pyc', '.sql',
    '.toml', '.yaml', '.yml', '.sh', '.ps1', '.bat', '.cmd'
}
SENSITIVE_BASENAMES = {
    '.dockerignore', '.env', '.env.example', '.gitattributes', '.gitignore',
    'dockerfile', 'composer.json', 'composer.lock', 'docker-compose.yml',
    'requirements.txt'
}
SIM_DISPATCH_LOCK = threading.RLock()
API_GZIP_MIN_BYTES = 1024
API_GZIP_CONTENT_TYPES = {
    'application/javascript',
    'application/json',
    'application/problem+json',
    'application/xml',
    'image/svg+xml',
}


def accepts_gzip(header_value):
    """Return True when an Accept-Encoding header permits gzip."""
    for part in str(header_value or '').lower().split(','):
        fields = [field.strip() for field in part.split(';') if field.strip()]
        if not fields or fields[0] not in ('gzip', '*'):
            continue
        quality = 1.0
        for parameter in fields[1:]:
            if parameter.startswith('q='):
                try:
                    quality = float(parameter[2:])
                except ValueError:
                    quality = 0.0
        if quality > 0:
            return True
    return False


def encode_api_response(data, content_type='', accept_encoding='', content_encoding='',
                        method='GET', status=200):
    """Compress large textual API responses when the client supports gzip."""
    media_type = str(content_type or '').split(';', 1)[0].strip().lower()
    compressible = media_type.startswith('text/') or media_type in API_GZIP_CONTENT_TYPES
    eligible = (
        method != 'HEAD'
        and 200 <= int(status) < 300
        and int(status) != 204
        and not content_encoding
        and len(data) >= API_GZIP_MIN_BYTES
        and compressible
        and accepts_gzip(accept_encoding)
    )
    if not eligible:
        return data, False
    return gzip.compress(data, compresslevel=5, mtime=0), True


def is_portal_path(path):
    """True neu path thuoc Portal (dung chung cho cac buoc detect_simulator)."""
    if path in PORTAL_PATHS:
        return True
    # Ngoai le cho API cua simulator ONT BE6500C (khong phai cua Portal/PHP)
    if path.startswith('/api/v1/data/'):
        return False
    for prefix in PORTAL_PREFIXES:
        if path.startswith(prefix):
            if prefix == '/assets/':
                file_path = os.path.join(BASE_DIR, path.lstrip('/'))
                if not os.path.exists(file_path):
                    return False
            return True
    return False


def is_sensitive_path(path):
    """Block source, configuration, logs and dot-directories from HTTP access."""
    decoded_path = unquote(urlparse(path).path).replace('\\', '/')
    segments = [segment for segment in decoded_path.split('/') if segment]
    if any(segment.startswith('.') for segment in segments):
        return True
    basename = segments[-1].lower() if segments else ''
    if basename in SENSITIVE_BASENAMES:
        return True
    _, extension = os.path.splitext(basename)
    return extension.lower() in SENSITIVE_EXTENSIONS


def is_public_root_path(path):
    decoded_path = unquote(urlparse(path).path).replace('\\', '/')
    if '\x00' in decoded_path:
        return False
    normalized_path = '/' + posixpath.normpath(decoded_path).lstrip('/')
    if normalized_path == '/':
        return True
    if normalized_path in PUBLIC_ROOT_FILES:
        return True
    return any(normalized_path.startswith(prefix) for prefix in PUBLIC_ROOT_PREFIXES)

class MasterDispatcher(SimpleHTTPRequestHandler):
    server_version = 'FTC'
    sys_version = ''
    protocol_version = 'HTTP/1.1'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        request_url = urlparse(self.path)
        extension = os.path.splitext(request_url.path.lower())[1]
        download_filename = DOWNLOADABLE_ROOT_FILES.get(unquote(request_url.path))
        versioned_asset = extension in {'.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2'} \
            and any(part.startswith('v=') for part in request_url.query.split('&'))
        has_cache_control = any(
            header.lower().startswith(b'cache-control:')
            for header in getattr(self, '_headers_buffer', [])
        )
        has_content_disposition = any(
            header.lower().startswith(b'content-disposition:')
            for header in getattr(self, '_headers_buffer', [])
        )
        if not has_cache_control:
            if versioned_asset:
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
            elif extension in {'.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.woff', '.woff2'}:
                self.send_header('Cache-Control', 'no-cache')
            else:
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        if download_filename and not has_content_disposition:
            self.send_header(
                'Content-Disposition',
                f'attachment; filename="{download_filename}"; filename*=UTF-8\'\'{download_filename}',
            )
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        self.send_header("Content-Security-Policy", "frame-ancestors 'self'")
        SimpleHTTPRequestHandler.end_headers(self)

    def list_directory(self, path):
        self.send_error(404, 'Not Found')
        return None

    def _trusted_client_ip(self):
        remote_ip = str(self.client_address[0]) if getattr(self, 'client_address', None) else ''
        if os.environ.get('TRUST_UPSTREAM_PROXY', '0') == '1':
            forwarded_ip = self.headers.get('X-Forwarded-For', '').split(',', 1)[0].strip()
            try:
                ipaddress.ip_address(forwarded_ip)
                return forwarded_ip
            except ValueError:
                pass
        return remote_ip

    def detect_simulator(self):
        # 0. Các file/thư mục Portal luôn do Portal phục vụ (chống bị 'cướp' bởi Referer/Cookie)
        path = self.path.split('?')[0]
        
        # Ngoại lệ cho BE12000: thiết bị này dùng /?_type=... cho mọi AJAX request.
        # Nếu path là / nhưng có tham số _type=, ta bỏ qua check Portal để nó được
        # route xuống simulator dựa vào Referer/Cookie.
        if path == '/' and ('?_type=' in self.path or '&_type=' in self.path):
            pass
        elif is_portal_path(path):
            return None

        # 1. Kiểm tra prefix trong URL path
        for sim_id in SIM_MODULES.keys():
            prefix = '/' + sim_id
            if path == prefix or path.startswith(prefix + '/'):
                parts = self.path.split('?', 1)
                new_path = parts[0][len(prefix):]
                if not new_path.startswith('/'):
                    new_path = '/' + new_path
                if len(parts) > 1:
                    new_path += '?' + parts[1]
                self.path = new_path
                return sim_id

        # 2. Kiểm tra header Referer
        referer = self.headers.get('Referer', '')
        if referer:
            ref_path = urlparse(referer).path
            for sim_id in SIM_MODULES.keys():
                prefix = '/' + sim_id
                if ref_path == prefix or ref_path.startswith(prefix + '/'):
                    return sim_id

        # 3. Kiểm tra Cookie (Fallback an toàn nhất)
        cookie = self.headers.get('Cookie', '')
        if cookie:
            m = re.search(r'current_sim=(sim_[a-zA-Z0-9_]+)', cookie)
            if m:
                sim_id = m.group(1)
                # Chống cướp quyền (hijacking) Portal: request rõ ràng thuộc Portal thì bỏ qua Cookie
                if sim_id in SIM_MODULES and not is_portal_path(path):
                    return sim_id

        return None

    def _proxy_django(self, method):
        """Reverse proxy /admin/* va /admin-static/* sang Django Admin (127.0.0.1:DJANGO_PORT)."""
        headers = {}
        for k, v in self.headers.items():
            if k.lower() in ('connection', 'keep-alive', 'proxy-connection',
                             'transfer-encoding', 'upgrade', 'content-length'):
                continue
            headers[k] = v

        host_hdr = self.headers.get('Host', f'127.0.0.1:{PORT}')
        headers['X-Forwarded-Host'] = host_hdr
        forwarded_proto = self.headers.get('X-Forwarded-Proto', '').split(',', 1)[0].strip().lower()
        if forwarded_proto not in ('http', 'https'):
            forwarded_proto = 'https' if os.environ.get('APP_BASE_URL', '').lower().startswith('https://') else 'http'
        headers['X-Forwarded-Proto'] = forwarded_proto
        forwarded_port = self.headers.get('X-Forwarded-Port', '').split(',', 1)[0].strip()
        headers['X-Forwarded-Port'] = forwarded_port if forwarded_port.isdigit() else ('443' if forwarded_proto == 'https' else str(PORT))
        client_ip = self._trusted_client_ip()
        if client_ip:
            headers['X-Forwarded-For'] = client_ip
            headers['X-FTC-Client-IP'] = client_ip

        body = b''
        if method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            try:
                length = int(self.headers.get('Content-Length', '0') or 0)
            except ValueError:
                length = 0
            if length > 0:
                body = self.rfile.read(length)

        conn = None
        try:
            conn = http.client.HTTPConnection('127.0.0.1', DJANGO_PORT, timeout=30)
            conn.request(method, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            data = resp.read()
        except Exception as e:
            print('[DJANGO-PROXY] Loi chuyen tiep /admin/* -> Django: %s' % e)
            self.send_error(502, 'Django Admin chua san sang, thu lai sau vai giay.')
            return
        finally:
            if conn is not None:
                conn.close()

        self.send_response(resp.status)
        hop_by_hop = {
            'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade',
            'host', 'date', 'server', 'x-powered-by'
        }
        for k, v in resp.getheaders():
            if k.lower() in hop_by_hop or k.lower() == 'content-length':
                continue
            if k.lower() == 'location':
                # Chuyển hướng về đúng port public 8080 nếu Django trả về port nội bộ 8083
                v = v.replace(f':{DJANGO_PORT}', f':{PORT}')
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if method != 'HEAD':
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def _proxy_api(self, method):
        """Reverse proxy /api/* sang PHP noi bo de giu SINGLE-PORT (chi can 8080).
        Giữ nguyên Host header tu trinh duyet de PHP build dung absolute URL + cookie."""
        headers = {}
        for k, v in self.headers.items():
            if k.lower() in ('connection', 'keep-alive', 'proxy-connection',
                             'transfer-encoding', 'upgrade', 'content-length'):
                continue
            headers[k] = v

        forwarded_proto = self.headers.get('X-Forwarded-Proto', '').split(',', 1)[0].strip().lower()
        if forwarded_proto not in ('http', 'https'):
            forwarded_proto = 'https' if os.environ.get('APP_BASE_URL', '').lower().startswith('https://') else 'http'
        headers['X-Forwarded-Proto'] = forwarded_proto
        forwarded_port = self.headers.get('X-Forwarded-Port', '').split(',', 1)[0].strip()
        headers['X-Forwarded-Port'] = forwarded_port if forwarded_port.isdigit() else ('443' if forwarded_proto == 'https' else str(PORT))

        client_ip = self._trusted_client_ip()
        if client_ip:
            headers['X-Forwarded-For'] = client_ip
            headers['X-FTC-Client-IP'] = client_ip

        body = b''
        if method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            try:
                length = int(self.headers.get('Content-Length', '0') or 0)
            except ValueError:
                length = 0
            if length > 0:
                body = self.rfile.read(length)

        conn = None
        try:
            conn = http.client.HTTPConnection(
                '127.0.0.1',
                API_PORT,
                timeout=API_PROXY_TIMEOUT_SECONDS,
            )
            conn.request(method, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            response_status = resp.status
            response_headers = resp.getheaders()
            data = resp.read()
        except Exception as e:
            print('[API-PROXY] Loi chuyen tiep /api/* -> PHP: %s' % e)
            self.send_error(502, 'Bad Gateway')
            return
        finally:
            if conn is not None:
                conn.close()

        response_header_map = {key.lower(): value for key, value in response_headers}
        data, compressed = encode_api_response(
            data,
            content_type=response_header_map.get('content-type', ''),
            accept_encoding=self.headers.get('Accept-Encoding', ''),
            content_encoding=response_header_map.get('content-encoding', ''),
            method=method,
            status=response_status,
        )

        self.send_response(response_status)
        hop_by_hop = {
            'connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade',
            'host', 'date', 'server', 'x-powered-by'
        }
        vary_values = []
        for k, v in response_headers:
            header_name = k.lower()
            if header_name in hop_by_hop or header_name == 'content-length':
                continue
            if header_name == 'vary':
                vary_values.extend(item.strip() for item in v.split(',') if item.strip())
                continue
            self.send_header(k, v)
        if compressed:
            self.send_header('Content-Encoding', 'gzip')
            if not any(value.lower() == 'accept-encoding' for value in vary_values):
                vary_values.append('Accept-Encoding')
        if vary_values:
            self.send_header('Vary', ', '.join(dict.fromkeys(vary_values)))
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if method != 'HEAD':
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass

    def dispatch(self, method):
        # Chuyen tiep /api/* -> PHP noi bo (browser chi can 1 cong 8080)
        # Ngoai tru /api/v1/data/* thuoc ve simulator ONT BE6500C
        path_only = self.path.split('?')[0]
        if is_sensitive_path(path_only):
            self.send_error(404, 'Not Found')
            return
        if (path_only == '/api' or path_only.startswith('/api/')) and not path_only.startswith('/api/v1/data/'):
            return self._proxy_api(method)

        # Chuyen tiep /admin/* va /admin-static/* -> Django Admin
        if (path_only == '/admin' or path_only.startswith('/admin/')
                or path_only.startswith('/admin-static/')):
            return self._proxy_django(method)

        # Mount dashboard (thu muc dashboard-authen) thanh /dashboard/*.
        # Xu ly TRUOC detect_simulator de tranh bi cookie current_sim cua sim 'cuop' request.
        if method in ('GET', 'HEAD') and (path_only == '/dashboard' or path_only.startswith('/dashboard/') or path_only == '/dashboard-authen' or path_only.startswith('/dashboard-authen/')):
            parts = self.path.split('?', 1)
            prefix = '/dashboard-authen' if path_only.startswith('/dashboard-authen') else '/dashboard'
            sub = parts[0][len(prefix):]
            if sub == '':
                sub = '/'
            if not sub.startswith('/'):
                sub = '/' + sub
            if sub not in DASHBOARD_PUBLIC_PATHS:
                self.send_error(404, 'Not Found')
                return
            original_path = self.path
            original_directory = self.directory
            try:
                self.path = sub + (('?' + parts[1]) if len(parts) > 1 else '')
                self.directory = DASHBOARD_DIR
                return super().do_HEAD() if method == 'HEAD' else super().do_GET()
            finally:
                # A handler instance can serve multiple HTTP/1.1 requests on
                # the same keep-alive connection. Never leak the dashboard
                # document root into the next Portal request.
                self.path = original_path
                self.directory = original_directory

        sim_id = self.detect_simulator()
        if sim_id:
            if sim_id:
                # A few legacy handlers read relative paths from process-wide CWD.
                # Serialize only simulator dispatches so concurrent requests cannot
                # switch each other's working directory or handler class mid-flight.
                # WARNING: sim_mikrotik_hexs uses long-polling and will deadlock if locked!
                needs_lock = (sim_id != 'sim_mikrotik_hexs')
                if needs_lock:
                    SIM_DISPATCH_LOCK.acquire()
                try:
                    mod = SIM_MODULES[sim_id]
                    original_class = self.__class__
                    original_directory = getattr(self, 'directory', None)
                    original_send_header = self.send_header
                    original_end_headers = self.end_headers
                    old_cwd = os.getcwd()
                    try:
                        if hasattr(mod, 'BASE'):
                            os.chdir(mod.BASE)

                        handler_class = SIM_HANDLERS[sim_id]
                        self.__class__ = handler_class
                        if hasattr(mod, 'ROOT'):
                            self.directory = getattr(mod, 'ROOT')
                        elif hasattr(mod, 'WWW'):
                            self.directory = getattr(mod, 'WWW')
                        else:
                            sim_dir_candidates = [
                                os.path.join(BASE_DIR, "simulators", sim_id, "www"),
                                os.path.join(BASE_DIR, sim_id, "www"),
                                os.path.join(BASE_DIR, "simulators", sim_id),
                                os.path.join(BASE_DIR, sim_id),
                            ]
                            for cand in sim_dir_candidates:
                                if os.path.isdir(cand):
                                    self.directory = cand
                                    break

                        def custom_send_header(keyword, value):
                            if keyword.lower() == 'location' and value.startswith('/'):
                                value = '/' + sim_id + value
                            original_send_header(keyword, value)
                        self.send_header = custom_send_header

                        def custom_end_headers():
                            original_send_header('Set-Cookie', f'current_sim={sim_id}; Path=/; SameSite=Lax')
                            original_send_header('Cache-Control', 'no-cache, must-revalidate')
                            original_end_headers()
                        self.end_headers = custom_end_headers

                        handler_method = getattr(self, 'do_' + method, None)
                        if handler_method is None:
                            self.send_error(501, 'Unsupported method')
                            return
                        return handler_method()
                    except Exception as e:
                        import traceback
                        print(f"Error in {sim_id} {method}: {e}")
                        traceback.print_exc()
                        self.__class__ = original_class
                        self.send_error(500, 'Internal Server Error')
                        return
                    finally:
                        self.__class__ = original_class
                        if original_directory is not None:
                            self.directory = original_directory
                        self.send_header = original_send_header
                        self.end_headers = original_end_headers
                        os.chdir(old_cwd)
                finally:
                    if needs_lock:
                        SIM_DISPATCH_LOCK.release()
        
        # Nếu không trúng simulator nào -> phục vụ file tĩnh của Portal
        if method in ('GET', 'HEAD') and is_public_root_path(path_only):
            # Set default index.html if pointing to a directory
            path = self.path.split('?')[0]
            if path == '/':
                self.path = '/index.html'
            return super().do_HEAD() if method == 'HEAD' else super().do_GET()
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        self.dispatch('GET')

    def do_POST(self):
        self.dispatch('POST')
        
    def do_DELETE(self):
        self.dispatch('DELETE')

    def do_HEAD(self):
        self.dispatch('HEAD')

    def do_OPTIONS(self):
        self.dispatch('OPTIONS')

    def do_PUT(self):
        self.dispatch('PUT')

    def do_PATCH(self):
        self.dispatch('PATCH')


class DualStackServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    daemon_threads = True
    # Windows SO_REUSEADDR cho phep bind trung cong -> tat de chi 1 instance chay duoc
    allow_reuse_address = False

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except (AttributeError, OSError):
            pass
        super().server_bind()


def listening_pids(local_target):
    """Tra ve tap PID cac tien trinh dang LISTENING co dia chi cuc bo la local_target.
    local_target vi du: '127.0.0.1:8082' hoac '8080' (moi dia chi)."""
    pids = set()
    try:
        out = subprocess.run(['netstat', '-ano'], capture_output=True, text=True, timeout=10).stdout
    except Exception:
        return pids
    for line in out.splitlines():
        if 'LISTENING' not in line.upper():
            continue
        parts = line.split()
        if len(parts) < 5 or not parts[-1].isdigit():
            continue
        local = parts[1]
        if local_target.isdigit():
            match = local.endswith(':' + local_target)
        else:
            match = local == local_target
        if match:
            pids.add(int(parts[-1]))
    return pids


def process_name(pid):
    """Ten tien trinh (chu thuong) theo PID; tra ve '' neu khong lay duoc."""
    try:
        return subprocess.run(
            ['tasklist', '/fi', 'PID eq %d' % pid, '/fo', 'csv', '/nh'],
            capture_output=True, text=True, timeout=10
        ).stdout.lower()
    except Exception:
        return ''


def wait_port_free(port, timeout=3.0, step=0.3):
    """Doi den khi cong port khong con LISTENING nao (sau taskkill bat dong bo).
    Tra ve True neu da free trong thoi gian cho, False neu van con."""
    waited = 0.0
    while waited < timeout:
        if not listening_pids(str(port)):
            return True
        time.sleep(step)
        waited += step
    return not listening_pids(str(port))


def kill_orphan_php():
    """Dong PHP mo coi (php -S) dang lang nghe 127.0.0.1:API_PORT tu lan chay truoc.
    Chi dong process php.exe tren dung cong API noi bo, khong dong server khac."""
    for pid in listening_pids('127.0.0.1:%d' % API_PORT):
        if 'php' not in process_name(pid):
            continue
        subprocess.run(['taskkill', '/pid', str(pid), '/f'],
                       capture_output=True, text=True, timeout=10)
        print('[API] Da dong PHP mo coi (pid %d) tren 127.0.0.1:%d.' % (pid, API_PORT))


def start_php_api():
    """Tu dong chay PHP API server neu co the (tam dung khi START_PHP=0)."""
    if os.environ.get('START_PHP', '1') == '0':
        print("[API] START_PHP=0 -> khong tu dong chay PHP.")
        return None

    php = shutil.which('php')
    if not php:
        print("[API] KHONG tim thay php trong PATH -> bo qua. Chay thu cong: php -S 0.0.0.0:%d -t ." % API_PORT)
        return None

    # Tu dong dong PHP mo coi cua lan chay truoc (neu co)
    kill_orphan_php()

    # Doi cho cong that su gia phong sau taskkill (bat dong bo)
    if not wait_port_free(API_PORT):
        print("[API] CANH BAO: cong %d van co server la (khong phai PHP) -> dung chung, /api/* co the loi." % API_PORT)
        return None

    try:
        log_path = os.path.join(BASE_DIR, 'php_api.log')
        log_file = open(log_path, 'a', encoding='utf-8', errors='replace')
        proc = subprocess.Popen(
            [php, '-S', '127.0.0.1:%d' % API_PORT, '-t', BASE_DIR],
            cwd=BASE_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )
        print("[API] PHP noi bo chi lang nghe 127.0.0.1:%d (pid %d, log: %s)" % (API_PORT, proc.pid, log_path))
        print("[API] /api/* duoc dispatcher proxy tu http://127.0.0.1:%d" % PORT)
        return proc
    except Exception as exc:
        print("[API] Khong chay duoc PHP: %s" % exc)
        return None


def kill_orphan_django():
    """Dong Django Admin mo coi dang lang nghe 127.0.0.1:DJANGO_PORT tu lan chay truoc."""
    for pid in listening_pids('127.0.0.1:%d' % DJANGO_PORT):
        subprocess.run(['taskkill', '/pid', str(pid), '/f'],
                       capture_output=True, text=True, timeout=10)
        print('[ADMIN] Da dong Django mo coi (pid %d) tren 127.0.0.1:%d.' % (pid, DJANGO_PORT))


def start_django_admin():
    """Tu dong chay Django Admin server tren port noi bo DJANGO_PORT (8083)."""
    if os.environ.get('START_DJANGO', '1') == '0':
        print("[ADMIN] START_DJANGO=0 -> khong tu dong chay Django.")
        return None

    manage_py = os.path.join(BASE_DIR, 'admin_app', 'manage.py')
    if not os.path.isfile(manage_py):
        return None

    kill_orphan_django()

    if not wait_port_free(DJANGO_PORT):
        print("[ADMIN] CANH BAO: cong %d chua giai phong." % DJANGO_PORT)
        return None

    try:
        log_path = os.path.join(BASE_DIR, 'django_admin.log')
        log_file = open(log_path, 'a', encoding='utf-8', errors='replace')
        env = dict(os.environ)
        env.setdefault('DJANGO_SETTINGS_MODULE', 'admin_site.settings')
        proc = subprocess.Popen(
            [sys.executable, manage_py, 'runserver', f'127.0.0.1:{DJANGO_PORT}', '--noreload'],
            cwd=BASE_DIR,
            env=env,
            stdout=log_file,
            stderr=subprocess.STDOUT,
        )
        print("[ADMIN] Django Admin noi bo chi lang nghe 127.0.0.1:%d (pid %d)" % (DJANGO_PORT, proc.pid))
        print("[ADMIN] /admin/ duoc dispatcher proxy tu http://127.0.0.1:%d/admin/" % PORT)
        return proc
    except Exception as exc:
        print("[ADMIN] Khong chay duoc Django Admin: %s" % exc)
        return None


def start_server():
    os.chdir(BASE_DIR)

    # Chong chay 2 instance: neu cong PORT da co trinh lang nghe -> tu dong tat instance cu cua minh
    owners = listening_pids(str(PORT))
    foreign = []
    for pid in sorted(owners):
        name = process_name(pid)
        if 'python' in name or name.strip().startswith('"py'):
            print("[API] Phat hien instance cu (pid %d) dang giu cong %d -> tu dong tat." % (pid, PORT))
            subprocess.run(['taskkill', '/pid', str(pid), '/f', '/t'],
                           capture_output=True, text=True, timeout=10)
        else:
            foreign.append(pid)

    if foreign:
        print("=" * 65)
        print("   [LOI] Cong %d bi tien trinh khac (khong phai run_all.py) chiem giu!" % PORT)
        print("   PID: %s" % ", ".join(str(p) for p in foreign))
        print("   Hay tu tat no roi chay lai, vi du:")
        print("     Get-NetTCPConnection -LocalPort %d -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }" % PORT)
        print("=" * 65)
        return

    if owners and not wait_port_free(PORT, timeout=4.5):
        print("[LOI] Cong %d chua duoc giai phong, tu bo." % PORT)
        return

    php_proc = start_php_api()
    django_proc = start_django_admin()

    try:
        srv = DualStackServer(('::', PORT), MasterDispatcher)
    except (OSError, ValueError):
        fallback_srv = type('IPv4Server', (ThreadingHTTPServer,), {'allow_reuse_address': False})
        srv = fallback_srv(('0.0.0.0', PORT), MasterDispatcher)
    srv.daemon_threads = True
    print("=" * 65)
    print("   HE THONG GIA LAP MANG FPT - MASTER DISPATCHER")
    print("   Tat ca chay tren 1 cong duy nhat (single-port 8080)!")
    print(f"   Portal + Devices + API: http://127.0.0.1:{PORT}")
    print(f"   Quan tri Admin Panel:   http://127.0.0.1:{PORT}/admin/")
    print(f"   API noi bo (/api/*) ->  PHP (127.0.0.1:{API_PORT})")
    print(f"   Admin (/admin/*)    ->  Django (127.0.0.1:{DJANGO_PORT})")
    print("=" * 65)
    

    
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nDa tat may chu.")
    finally:
        if php_proc is not None:
            php_proc.terminate()
        if django_proc is not None:
            django_proc.terminate()

if __name__ == "__main__":
    start_server()
