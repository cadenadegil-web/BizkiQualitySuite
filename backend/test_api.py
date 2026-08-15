import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:8000/catalogs/areas', timeout=5) as response:
        print(response.status)
        print(json.loads(response.read().decode()))
except Exception as e:
    print(e)
