"""CI-only gateway smoke test with loopback mock upstreams, not application services."""

import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


WEB_HOST = "frota-contratada.hml.seara.com.br"
API_HOST = "api.frota-contratada.hml.seara.com.br"


def mock_server(port, marker):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            payload = json.dumps({
                "upstream": marker,
                "host": self.headers.get("Host"),
                "real_ip": self.headers.get("X-Real-IP"),
                "forwarded_for": self.headers.get("X-Forwarded-For"),
                "proto": self.headers.get("X-Forwarded-Proto"),
                "port": self.headers.get("X-Forwarded-Port"),
                "upgrade": self.headers.get("Upgrade"),
                "connection": self.headers.get("Connection"),
                "path": self.path,
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def curl(*args):
    return subprocess.run(
        ["curl", "--silent", "--show-error", "--noproxy", "*", "--max-time", "5", *args],
        text=True,
        capture_output=True,
    )


def https_request(host, cert, *headers, path="/ci-probe"):
    args = ["--fail", "--cacert", str(cert), "--resolve", f"{host}:443:127.0.0.1"]
    for header in headers:
        args += ["--header", header]
    result = curl(*args, f"https://{host}{path}")
    if result.returncode:
        raise AssertionError(f"TLS request for {host} failed: {result.stderr}")
    return json.loads(result.stdout)


def assert_route(response, marker, host):
    assert response["upstream"] == marker, response
    assert response["host"] == host, response
    assert response["real_ip"] == "127.0.0.1", response
    assert "127.0.0.1" in response["forwarded_for"], response
    assert response["proto"] == "https", response
    assert response["port"] == "443", response


def main():
    image = sys.argv[1]
    cert_dir = Path(sys.argv[2]).resolve()
    cert = cert_dir / "server.crt"
    name = f"frota-gateway-ci-{os.getpid()}"
    web = mock_server(8080, "web-mock")
    api = mock_server(3000, "api-mock")
    ia = mock_server(8000, "ia-mock")
    acompanhamento = mock_server(8081, "acompanhamento-mock")
    started = False
    try:
        subprocess.run([
            "docker", "run", "--detach", "--network", "host", "--name", name,
            "--volume", f"{cert_dir}:/etc/nginx/tls:ro",
            "--env", "WEB_HOST=frota.local",
            "--env", "API_HOST=api.frota.local",
            "--env", "ACOMPANHAMENTO_HOST=acompanhamento.frota.local",
            "--env", "IA_HOST=ia.frota.local",
            image,
        ], check=True, stdout=subprocess.DEVNULL)
        started = True

        for _ in range(30):
            ready = curl("--fail", "http://127.0.0.1/health")
            if ready.returncode == 0 and ready.stdout == "gateway-ok\n":
                break
            time.sleep(1)
        else:
            subprocess.run(["docker", "logs", name], check=False)
            raise AssertionError("Gateway HTTP health did not become ready")

        assert_route(https_request(WEB_HOST, cert), "web-mock", WEB_HOST)
        assert_route(https_request(API_HOST, cert), "api-mock", API_HOST)
        ia_response = https_request(API_HOST, cert, path="/ia/ci-probe")
        assert_route(ia_response, "ia-mock", API_HOST)
        assert ia_response["path"] == "/ci-probe", ia_response
        acompanhamento_response = https_request(WEB_HOST, cert, path="/acompanhamento/ci-probe")
        assert_route(acompanhamento_response, "acompanhamento-mock", WEB_HOST)
        assert acompanhamento_response["path"] == "/ci-probe", acompanhamento_response

        upgraded = https_request(API_HOST, cert, "Connection: Upgrade", "Upgrade: websocket")
        assert_route(upgraded, "api-mock", API_HOST)
        assert upgraded["upgrade"] == "websocket", upgraded
        assert upgraded["connection"].lower() == "upgrade", upgraded

        fallback = curl("--fail", "http://127.0.0.1:8090/ci-probe")
        assert fallback.returncode == 0, fallback.stderr
        assert json.loads(fallback.stdout)["upstream"] == "api-mock"

        unknown = curl(
            "--cacert", str(cert), "--resolve", f"{WEB_HOST}:443:127.0.0.1",
            "--header", "Host: unknown.example", "--output", os.devnull,
            "--write-out", "%{http_code}", f"https://{WEB_HOST}/ci-probe",
        )
        assert unknown.returncode == 0 and unknown.stdout == "421", unknown
        print("CI smoke OK: TLS, WEB/API/IA/acompanhamento routes, forwarded headers, API upgrade, :80, :8090")
    finally:
        if started:
            subprocess.run(["docker", "rm", "--force", name], check=False, stdout=subprocess.DEVNULL)
        web.shutdown()
        api.shutdown()
        ia.shutdown()
        acompanhamento.shutdown()


if __name__ == "__main__":
    main()
