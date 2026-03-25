import requests
import json

# URL de tu microservicio Core (puerto 8001)
# Si lo corres desde fuera de Docker (en WSL2), usa localhost
URL = "http://localhost:8001/api/mortgage/simulate/"

def probar_simulacion(escenario_nombre, datos):
    print(f"\n--- Probando Escenario: {escenario_nombre} ---")
    try:
        response = requests.post(URL, json=datos)
        if response.status_code == 200:
            print("ÉXITO")
            print(json.dumps(response.json(), indent=4, ensure_ascii=False))
        else:
            print(f"ERROR {response.status_code}")
            print(response.json())
    except Exception as e:
        print(f"Error de conexión: {e}")

# Escenario 1: Cliente que cumple perfectamente (Normal)
datos_buenos = {
    "bank_slug": "banorte",
    "product_key": "tradicional",
    "valor_vivienda": 2000000,
    "ingreso_bruto": 60000,
    "pct_enganche": 0.20,
    "plazo_meses": 240
}

# Escenario 2: Cliente con poco ingreso (Activará Modo Rescate)
datos_rescate = {
    "bank_slug": "banorte",
    "product_key": "tradicional",
    "valor_vivienda": 2000000,
    "ingreso_bruto": 15000, # Muy bajo para una casa de 2MDP
    "pct_enganche": 0.10,
    "plazo_meses": 240
}

if __name__ == "__main__":
    probar_simulacion("Cliente Solvente", datos_buenos)
    probar_simulacion("Modo Rescate", datos_rescate)