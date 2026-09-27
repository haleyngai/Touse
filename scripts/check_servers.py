import json
import sys
import urllib.request

routes = ["/", "/dashboard", "/scan", "/designs", "/inbox", "/my-furniture", "/resell"]
all_ok = True

for path in routes:
    url = f"http://localhost:3000{path}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "touse-health-check"})
        resp = urllib.request.urlopen(req, timeout=8)
        print(f"  ✅  {resp.status}  {url}")
    except urllib.error.HTTPError as e:
        print(f"  ❌  {e.code}  {url}")
        all_ok = False
    except Exception as e:
        print(f"  ❌  ERR  {url}  →  {e}")
        all_ok = False

try:
    resp = urllib.request.urlopen("http://localhost:8000/health", timeout=5)
    d = json.loads(resp.read())
    print(f"\n  ✅  API  /health  →  {d}")
except Exception as e:
    print(f"\n  ❌  API health failed: {e}")
    all_ok = False

print()
print("All OK!" if all_ok else "Some routes failed — check logs above.")
sys.exit(0 if all_ok else 1)
