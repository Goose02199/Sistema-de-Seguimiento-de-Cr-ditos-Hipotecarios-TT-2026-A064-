import requests
import json

# URL de tu microservicio Django (mortgage-core)
DJANGO_URL = "http://localhost:8001/api/mortgage/recommend-banks/"

def run_test():
    print("=== Prueba de Integración: Django -> FastAPI -> ML (Modo Raw) ===\n")

    payload_valido = {
        "monto_credito": 1500000.0,
        "plazo_anios": 15,
        "ingreso_mensual": 45000.0,
        "valor_vivienda": 2000000.0
    }

    print(f"[*] Enviando perfil a {DJANGO_URL}...")
    try:
        response = requests.post(DJANGO_URL, json=payload_valido)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Conexión Exitosa!\n")
            
            # --- SALIDA EN CRUDO (RAW JSON) ---
            print("--- RESPUESTA EN CRUDO (JSON COMPLETO) ---")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            print("-" * 40 + "\n")

            # --- DESGLOSE AMIGABLE (OPCIONAL) ---
            print(f"Resumen de {len(data['recommendations'])} bancos:")
            for i, rec in enumerate(data.get('recommendations', []), 1):
                print(f"  {i}. {rec['institucion']} - {rec['producto_base']} (CAT Predicho: {rec['CAT_Predicho']:.2f}%)")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")

if __name__ == "__main__":
    run_test()