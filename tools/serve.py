"""Usage: python3 tools/serve.py [port] - serves the app locally without letting the browser keep old files."""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class FreshHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        del self.headers['If-Modified-Since']
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        if self.path.split('?')[0].endswith(('/', '.html')):
            self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
root = Path(__file__).resolve().parent.parent
ThreadingHTTPServer(('127.0.0.1', port), partial(FreshHandler, directory=root)).serve_forever()
