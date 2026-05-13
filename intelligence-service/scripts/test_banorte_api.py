import requests
import json

# Ajusta el puerto si tu contenedor de Intelligence-Service corre en otro distinto
API_URL = "http://localhost:8002/cotizar/banorte"

def probar_cotizador():
    print("Iniciando prueba de integración con el endpoint de Banorte...")
    
    # 1. Simulamos los datos del cliente que Django capturaría
    datos_cliente = {
        "nombre": "Cliente de Prueba",
        "edad": 32,
        "sexo": "M",
        "ingreso_bruto": 65000.0,
        "valor_vivienda": 2500000.0,
        "pct_enganche": 0.15,  # 15% de enganche
        "plazo_meses": 240,    # 20 años
        "tiene_infonavit": False,
        "tiene_fovissste": False,
        "infonavit": {},
        "fovissste": {}
    }

    # 2. Simulamos la política extraída de PostgreSQL (Tomada de tu archivo bankproducts.txt)
    productos_db = [
        {
            "nombre": "Hipoteca Fuerte Tradicional",
            "tasas": [
                {"nombre": "Premium", "tasa_anual_fija": 0.0938},
                {"nombre": "Media", "tasa_anual_fija": 0.1068}
            ],
            "politicas": {
                "tipo": "tradicional",
                "aforo_max": 0.90,
                "relacion_ir": 2.0,
                "comision_apertura_pct": 0.01,
                "comision_apertura_financiada": True,
                "avaluo_pct_mil": 0.0025,
                "avaluo_iva_pct": 0.16,
                "notariales": {"modo": "porcentaje", "pct": 0.082},
                "interes": {"metodo": "saldos_insolutos"},
                "seguros": {
                    "suma_asegurable_pct": 1.0,
                    "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.606},
                    "danos": {"metodo": "pormil", "tarifa_pormil_mensual": 0.2227}
                },
                "comision_admin_mensual": 299.00,
                "gastos_aprobacion": 0.0,
                # --- ESTAS SON LAS LLAVES QUE FALTABAN ---
                "cat": {
                    "incluye_apertura_financiada_t0": True
                },
                "apoyos": {
                    "tiene_apoyos": False,
                    "instituto_tiene_credito": False
                }
            }
        }
    ]

    # Armamos el payload final
    payload = {
        "datos_usuario": datos_cliente,
        "productos_banco": productos_db
    }

    print(f"Enviando petición a {API_URL}...")
    
    try:
        # Hacemos el POST simulando a Django
        respuesta = requests.post(API_URL, json=payload)
        
        # Si la API explota con un error 500 o 400
        respuesta.raise_for_status()
        
        data = respuesta.json()
        
        print("\n✅ ¡ÉXITO! La API respondió correctamente.")
        print(f"Mensaje del Motor: {data.get('mensaje')}")
        
        cotizaciones_cliente = data.get("data_usuario", [])
        cotizaciones_broker = data.get("data_broker", [])
        
        print(f"\n--- SE GENERARON {len(cotizaciones_cliente)} COTIZACIONES ---")
        
        print("\n=== VISTA RESUMIDA (PARA EL CLIENTE) ===")
        for i, cot in enumerate(cotizaciones_cliente):
            print(f"Opción {i+1}: {cot['Producto']} | Tasa: {cot['Tasa']} | Mensualidad: {cot['Mensualidad']} | Pago Total: {cot['Pago total']}")
            
        print("\n=== VISTA DETALLADA (PARA EL BRÓKER) ===")
        # Imprimimos solo la primera del broker para que veas el nivel de detalle
        if cotizaciones_broker:
            print(json.dumps(cotizaciones_broker[0], indent=2, ensure_ascii=False))
            
    except requests.exceptions.HTTPError as err:
        print("\n❌ ERROR HTTP:")
        print(err)
        print("Detalle del servidor:", respuesta.text)
    except Exception as e:
        print("\n❌ ERROR DE CONEXIÓN:")
        print(str(e))
        print("¿Está corriendo el contenedor de FastAPI?")

if __name__ == "__main__":
    probar_cotizador()