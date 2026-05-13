import requests
import json

# Apuntamos al endpoint de Scotiabank
API_URL = "http://localhost:8002/cotizar/scotiabank"

def probar_cotizador_scotia():
    print("Iniciando prueba de integración con el endpoint de Scotiabank...")
    
    # 1. Datos del cliente (Valor vivienda: 2.5M, 10% enganche, plazo 20 años)
    datos_cliente = {
        "nombre": "Cliente Scotiabank Prueba",
        "edad": 35,
        "sexo": "M",
        "ingreso_bruto": 65000.0,
        "valor_vivienda": 2500000.0,
        "pct_enganche": 0.10,     
        "plazo_meses": 240,       
        "tiene_infonavit": False,
        "tiene_fovissste": False
    }

    # 2. Mock de la base de datos (con los JSONs completos y corregidos)
    productos_db = [
        {
          "nombre": "Scotiabank Valora",
          "tasas": [
            {
              "nombre": "Valora 12%",
              "tasa_anual_fija": 0.12,
              "aforo_max": 0.90,
              "enganche_min_pct": 0.05,
              "incremento_anual_pct": 0.02,
              "cat_ref_pct": 14.5,
              "pago_millar_ref": 10.36
            },
            {
              "nombre": "Valora 13%",
              "tasa_anual_fija": 0.13,
              "aforo_max": 0.90,
              "enganche_min_pct": 0.10,
              "incremento_anual_pct": 0.014,
              "cat_ref_pct": 15.2,
              "pago_millar_ref": 11.28
            },
            {
              "nombre": "Valora 14%",
              "tasa_anual_fija": 0.14,
              "aforo_max": 0.85,
              "enganche_min_pct": 0.15,
              "incremento_anual_pct": 0.007,
              "cat_ref_pct": 16.2,
              "pago_millar_ref": 12.13
            }
          ],
          "politicas": {
            "tipo_flujo": "creciente",
            "relacion_ir": 1.67,
            "avaluo_monto": 5750.0,
            "impuestos_pct": 0.03,
            "notariales_pct": 0.02,
            "comision_contratacion_pct": 0.0125,
            "credito_minimo": 250000.0,
            "valor_minimo_inmueble": 400000.0,
            "delta_enganche_pct": 0.02,
            "seguros": {
              "vida": { "monto_mensual": 1100.0 },
              "danos": { "monto_mensual": 600.0 }
            },
            "cat": { "incluye_comision_contratacion_t0": True }
          }
        },
        {
          "nombre": "Scotiabank Pagos Oportunos",
          "tasas": [
            {
              "nombre": "Pagos Oportunos 7 años",
              "plazo_meses": 84,
              "tasa_anual_fija": 0.13,
              "aforo_max": 0.95,
              "enganche_min_pct": 0.05,
              "incremento_anual_pct": 0.0,
              "cat_ref_pct": 14.8,
              "pago_millar_ref": 18.08
            },
            {
              "nombre": "Pagos Oportunos 10 años",
              "plazo_meses": 120,
              "tasa_anual_fija": 0.128,
              "aforo_max": 0.95,
              "enganche_min_pct": 0.05,
              "incremento_anual_pct": 0.0,
              "cat_ref_pct": 14.6,
              "pago_millar_ref": 14.93
            },
            {
              "nombre": "Pagos Oportunos 15 años",
              "plazo_meses": 180,
              "tasa_anual_fija": 0.126,
              "aforo_max": 0.95,
              "enganche_min_pct": 0.05,
              "incremento_anual_pct": 0.0,
              "cat_ref_pct": 14.2,
              "pago_millar_ref": 12.79
            },
            {
              "nombre": "Pagos Oportunos 20 años",
              "plazo_meses": 240,
              "tasa_anual_fija": 0.124,
              "aforo_max": 0.95,
              "enganche_min_pct": 0.05,
              "incremento_anual_pct": 0.0,
              "cat_ref_pct": 13.9,
              "pago_millar_ref": 11.86
            }
          ],
          "politicas": {
            "tipo_flujo": "fijo",
            "relacion_ir": 1.67,
            "avaluo_monto": 5750.0,
            "impuestos_pct": 0.03,
            "notariales_pct": 0.02,
            "comision_contratacion_pct": 0.0125,
            "credito_minimo": 250000.0,
            "valor_minimo_inmueble": 400000.0,
            "delta_enganche_pct": 0.02,
            "seguros": {
              "vida": { "monto_mensual": 1100.0 },
              "danos": { "monto_mensual": 600.0 }
            },
            "cat": { "incluye_comision_contratacion_t0": True }
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
        
        print("\n✅ ¡ÉXITO! La API de Scotiabank respondió correctamente.")
        print(f"Mensaje: {data.get('mensaje')}")
        
        cotizaciones_cliente = data.get("data_usuario", [])
        cotizaciones_broker = data.get("data_broker", [])
        
        print(f"\n--- SE GENERARON {len(cotizaciones_cliente)} COTIZACIONES ---")
        
        print("\n=== VISTA RESUMIDA (CLIENTE) ===")
        for i, cot in enumerate(cotizaciones_cliente):
            # Scotiabank suele manejar "Mensualidad inicial" en vez de "Mensualidad" por los flujos crecientes
            print(f"Opción {i+1}: {cot.get('Producto', 'N/A')} ({cot.get('Escenario / Banda', 'N/A')}) | Tasa: {cot.get('Tasa', 'N/A')} | Mensualidad Inicial: {cot.get('Mensualidad inicial', 'N/A')}")
            
        print("\n=== VISTA DETALLADA (BRÓKER - ESCENARIO 1) ===")
        if cotizaciones_broker:
            print(json.dumps(cotizaciones_broker[0], indent=2, ensure_ascii=False))
            
    except requests.exceptions.HTTPError as err:
        print("\n❌ ERROR HTTP:")
        print(respuesta.text)
    except Exception as e:
        print("\n❌ ERROR DE CONEXIÓN:")
        print(str(e))

if __name__ == "__main__":
    probar_cotizador_scotia()