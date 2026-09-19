import urllib.request
import urllib.error
import json

url = "https://bizki-quality-backend01.onrender.com/auth/login"
payload = {
    "username": "admin",
    "password": "admin123"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    url,
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    print("Enviando petición a:", url)
    with urllib.request.urlopen(req, timeout=10) as response:
        status_code = response.getcode()
        body = response.read().decode("utf-8")
        print("Status Code:", status_code)
        print("Response JSON:", json.loads(body))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("HTTP Response:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
