import requests
import json

# Apuntamos al nuevo endpoint de Santander en tu microservicio
API_URL = "http://localhost:8002/cotizar/santander"

def probar_cotizador_santander():
    print("Iniciando prueba de integración con el endpoint de Santander...")
    
    # 1. Datos del cliente
    datos_cliente = {
        "nombre": "Cliente Perfil Santander",
        "edad": 35,
        "sexo": "M",
        "ingreso_bruto": 85000.0, # Ingreso alto para ver si el perfilador le da buena tasa
        "valor_vivienda": 3000000.0,
        "pct_enganche": 0.20,     # 20% enganche (LTV = 80%)
        "plazo_meses": 240,       # 20 años
        "tiene_infonavit": False,
        "tiene_fovissste": False,
        "infonavit": {},
        "fovissste": {}
    }

    # 2. Mock de la base de datos para Santander (Notar la llave "tasas_perfil")
    productos_db = [
        {
            "nombre": "Hipoteca Santander Tradicional",
            "politicas": {
                "tipo": "adquisicion",
                "aforo_max": 0.90,
                "relacion_ir": 2.5,
                "comision_apertura_pct": 0.01,
                "avaluo_pct_mil": 0.003,
                "avaluo_iva_pct": 0.16,
                "notariales": {"modo": "porcentaje", "pct": 0.08},
                "comision_admin_mensual": 250.0,
                "gastos_aprobacion": 0.0,
                "seguros": {
                    "suma_asegurable_pct": 1.0,
                    "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.50},
                    "danos": {"metodo": "pormil", "tarifa_pormil_mensual": 0.20}
                },
                "cat": {"incluye_apertura_financiada_t0": False}
            },
            "tasas_perfil": {
                "1": {"nombre": "Perfil 1", "tasa": 0.0899},
                "2": {"nombre": "Perfil 2", "tasa": 0.0949},
                "3": {"nombre": "Perfil 3", "tasa": 0.0999},
                "4": {"nombre": "Perfil 4", "tasa": 0.1049},
                "5": {"nombre": "Perfil 5", "tasa": 0.1099}
            }
        },
        {
            "nombre": "Hipoteca Santander Free",
            "politicas": {
                "tipo": "free",
                "aforo_max": 0.90,
                "relacion_ir": 2.5,
                "comision_apertura_pct": 0.0, # El producto Free no cobra apertura
                "avaluo_pct_mil": 0.0,        # Tampoco avalúo
                "avaluo_iva_pct": 0.16,
                "notariales": {"modo": "porcentaje", "pct": 0.08},
                "comision_admin_mensual": 0.0,
                "gastos_aprobacion": 0.0,
                "seguros": {
                    "suma_asegurable_pct": 1.0,
                    "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.50},
                    "danos": {"metodo": "pormil", "tarifa_pormil_mensual": 0.20}
                },
                "cat": {"incluye_apertura_financiada_t0": False}
            },
            "tasas_perfil": {
                "1": {"nombre": "Perfil 1", "tasa": 0.0965},
                "2": {"nombre": "Perfil 2", "tasa": 0.1015},
                "3": {"nombre": "Perfil 3", "tasa": 0.1065},
                "4": {"nombre": "Perfil 4", "tasa": 0.1115},
                "5": {"nombre": "Perfil 5", "tasa": 0.1165}
            }
        }
    ]

    payload = {
        "datos_usuario": datos_cliente,
        "productos_banco": productos_db
    }

    try:
        respuesta = requests.post(API_URL, json=payload)
        respuesta.raise_for_status()
        
        data = respuesta.json()
        
        print("\n✅ ¡ÉXITO! La API de Santander respondió correctamente.")
        print(f"Mensaje: {data.get('mensaje')}")
        
        cotizaciones_cliente = data.get("data_usuario", [])
        cotizaciones_broker = data.get("data_broker", [])
        
        print(f"\n--- SE GENERARON {len(cotizaciones_cliente)} COTIZACIONES ---")
        
        print("\n=== VISTA RESUMIDA (CLIENTE) ===")
        for i, cot in enumerate(cotizaciones_cliente):
            print(f"Opción {i+1}: {cot.get('Producto', 'N/A')} | Tasa: {cot.get('Tasa', 'N/A')} | Mensualidad: {cot.get('Mensualidad', 'N/A')} | CAT: {cot.get('CAT', 'N/A')}")
            
        print("\n=== VISTA DETALLADA (BRÓKER - ESCENARIO 1) ===")
        if cotizaciones_broker:
            print(json.dumps(cotizaciones_broker, indent=2, ensure_ascii=False))
            
    except requests.exceptions.HTTPError as err:
        print("\n❌ ERROR HTTP:")
        print(respuesta.text)
    except Exception as e:
        print("\n❌ ERROR DE CONEXIÓN:")
        print(str(e))

if __name__ == "__main__":
    probar_cotizador_santander()