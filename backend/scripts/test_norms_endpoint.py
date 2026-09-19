import urllib.request
import urllib.error
import json

login_url = "https://bizki-quality-backend01.onrender.com/auth/login"
norms_url = "https://bizki-quality-backend01.onrender.com/catalogs/norms"

# Step 1: Login
login_payload = {
    "username": "admin",
    "password": "admin123"
}
login_data = json.dumps(login_payload).encode("utf-8")
req_login = urllib.request.Request(
    login_url,
    data=login_data,
    headers={"Content-Type": "application/json"},
    method="POST"
)

try:
    print("Iniciando sesión en:", login_url)
    with urllib.request.urlopen(req_login, timeout=10) as response:
        body = response.read().decode("utf-8")
        token_data = json.loads(body)
        token = token_data["access_token"]
        print("Login exitoso. Token obtenido.")
        
    # Step 2: Get Norms
    print("Obteniendo normas de:", norms_url)
    req_norms = urllib.request.Request(
        norms_url,
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    with urllib.request.urlopen(req_norms, timeout=10) as response:
        status_code = response.getcode()
        body = response.read().decode("utf-8")
        norms = json.loads(body)
        print("Status Code:", status_code)
        print(f"Total normas obtenidas: {len(norms)}")
        if norms:
            print("Primera norma:", norms[0])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("HTTP Response:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
