import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8080
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, *args, **kwargs)

def open_browser():
    # Wait a moment for the server to start
    time.sleep(1)
    url = f"http://localhost:{PORT}"
    print(f"\n[SUCCESS] Server is running!")
    print(f"[ACTION] Opening {url} in your browser...\n")
    webbrowser.open(url)

if __name__ == "__main__":
    # Explicitly bind to 127.0.0.1 to avoid the [::] IPv6 message
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"\n[SERVER] ISSR Trust Study is now active.")
        print(f"[URL]    http://localhost:{PORT}")
        print(f"[STATUS] Listening for connections...\n")
        
        # Start browser in a separate thread
        threading.Thread(target=open_browser, daemon=True).start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.shutdown()
