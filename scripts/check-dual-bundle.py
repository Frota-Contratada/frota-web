"""CI-only HTTP and static-bundle checks; never prints bundle contents or API keys."""

import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


LOCAL_HOST = "frota.local"
HML_HOST = "frota-contratada.hml.seara.com.br"
LOCAL_URLS = (
    "http://api.frota.local",
    "http://ia.frota.local",
    "http://acompanhamento.frota.local",
)
HML_URLS = (
    "https://api.frota-contratada.hml.seara.com.br",
    "https://api.frota-contratada.hml.seara.com.br/ia",
    "https://frota-contratada.hml.seara.com.br/acompanhamento",
)


def get(path, host):
    request = urllib.request.Request(f"http://127.0.0.1:18080{path}", headers={"Host": host})
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


def bundle_text(root):
    return "\n".join(path.read_text(errors="replace") for path in root.rglob("*.js"))


def main():
    image = sys.argv[1]
    name = f"frota-web-dual-ci-{os.getpid()}"
    subprocess.run([
        "docker", "run", "--detach", "--name", name,
        "--publish", "127.0.0.1:18080:8080", image,
    ], check=True, stdout=subprocess.DEVNULL)
    try:
        for _ in range(30):
            try:
                health_status, _ = get("/health", "127.0.0.1")
                if health_status == 200:
                    break
            except (urllib.error.URLError, OSError):
                pass
            time.sleep(1)
        else:
            raise AssertionError("Host-independent /health did not become ready")

        local_status, local_index = get("/", LOCAL_HOST)
        hml_status, hml_index = get("/", HML_HOST)
        unknown_status, unknown_body = get("/", "unknown.example")
        assert local_status == hml_status == 200
        assert unknown_status == 421
        assert unknown_body != local_index and unknown_body != hml_index
        assert local_index != hml_index, "The two hosts selected the same index"
        assert get("/deep/link", LOCAL_HOST) == (200, local_index)
        assert get("/deep/link", HML_HOST) == (200, hml_index)

        with tempfile.TemporaryDirectory() as directory:
            subprocess.run([
                "docker", "cp", f"{name}:/usr/share/nginx/html/.", directory,
            ], check=True, stdout=subprocess.DEVNULL)
            root = Path(directory)
            local_root = root / "local"
            hml_root = root / "hml"
            assert local_root.is_dir() and hml_root.is_dir()
            local_text = bundle_text(local_root)
            hml_text = bundle_text(hml_root)
            assert all(url in local_text for url in LOCAL_URLS), "LOCAL URL missing"
            assert all(url in hml_text for url in HML_URLS), "HML URL missing"
            assert not any(url in local_text for url in HML_URLS), "HML URL leaked into LOCAL"
            assert "frota.local" not in hml_text, "LOCAL URL leaked into HML"
            assert "ngrok" not in hml_text.lower(), "ngrok fallback leaked into HML"

            local_entry = next(path for path in local_root.rglob("*.js") if LOCAL_URLS[0] in path.read_text(errors="replace"))
            hml_entry = next(path for path in hml_root.rglob("*.js") if HML_URLS[0] in path.read_text(errors="replace"))
            assert get("/assets/" + local_entry.name, HML_HOST)[0] == 404
            assert get("/assets/" + hml_entry.name, LOCAL_HOST)[0] == 404

        print("Dual Web bundle OK: LOCAL, HML, unknown Host, /health, SPA, URL isolation")
    finally:
        subprocess.run(["docker", "rm", "--force", name], check=False, stdout=subprocess.DEVNULL)


if __name__ == "__main__":
    main()
