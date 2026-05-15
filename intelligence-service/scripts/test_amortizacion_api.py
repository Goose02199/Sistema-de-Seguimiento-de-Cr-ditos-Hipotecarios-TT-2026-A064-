import requests
import json
import os

# Apuntamos al endpoint de amortización
API_URL = "http://localhost:8002/api/v1/amortizacion/"

# Datos base para usar en todas las pruebas y lograr que el PDF/Excel salgan completos
PAYLOAD_BASE = {
    "monto_credito": 1760000.0,
    "tasa_anual": 10.18,
    "plazo_meses": 240,
    "mensualidad": 19853.81,
    "pago_inicial": 410550.0,
    "datos_usuario": {
        "Cliente": "Gustavo Navarro",
        "Edad": "24 años",
        "Ingreso": "$40,000.00",
        "Instituto": "INFONAVIT",
        "Correo": "gustavo@ejemplo.com",
        "Tel.": "5512345678"
    },
    "datos_credito": {
        "Banco": "Banorte",
        "Producto": "Hipoteca Fuerte Tradicional",
        "Tasa": "10.18%",
        "CAT": "13.4%",
        "Mensualidad": "$19,853.81",
        "Crédito": "$1,760,000.00",
        "Vivienda": "$2,000,000.00",
        "Pago inicial": "$410,550.00",
        "Plazo": "240 meses"
    }
}

def probar_json():
    print("===========================================")
    print("1. PROBANDO ENDPOINT EN FORMATO JSON")
    print("===========================================")
    
    payload = {**PAYLOAD_BASE, "formato": "json"}

    try:
        respuesta = requests.post(API_URL, json=payload)
        respuesta.raise_for_status()
        
        data = respuesta.json()
        print("✅ ¡ÉXITO! La API respondió correctamente en JSON.\n")
        
        resumen = data.get("resumen", {})
        print("--- RESUMEN FINANCIERO ---")
        print(json.dumps(resumen, indent=2, ensure_ascii=False))
        
        tabla = data.get("tabla", [])
        print(f"\n--- TABLA DE AMORTIZACIÓN ({len(tabla)} MESES) ---")
        print("Primeros 2 meses:")
        for fila in tabla[:2]:
            print(fila)
        print("...\nÚltimo Mes:")
        print(tabla[-1])
        
    except Exception as e:
        print(f"\n❌ ERROR JSON: {str(e)}")

def probar_pdf():
    print("\n===========================================")
    print("2. PROBANDO ENDPOINT EN FORMATO PDF")
    print("===========================================")
    
    payload = {**PAYLOAD_BASE, "formato": "pdf"}

    try:
        respuesta = requests.post(API_URL, json=payload, stream=True)
        respuesta.raise_for_status()
        
        nombre_archivo = "test_amortizacion.pdf"
        with open(nombre_archivo, "wb") as f:
            for chunk in respuesta.iter_content(chunk_size=8192):
                f.write(chunk)
                
        print(f"✅ ¡ÉXITO! El PDF se ha guardado localmente.")
        print(f"Ruta: {os.path.abspath(nombre_archivo)}")
        
    except Exception as e:
        print(f"\n❌ ERROR PDF: {str(e)}")

def probar_excel():
    print("\n===========================================")
    print("3. PROBANDO ENDPOINT EN FORMATO EXCEL")
    print("===========================================")
    
    payload = {**PAYLOAD_BASE, "formato": "excel"}

    try:
        respuesta = requests.post(API_URL, json=payload, stream=True)
        respuesta.raise_for_status()
        
        nombre_archivo = "test_amortizacion.xlsx"
        with open(nombre_archivo, "wb") as f:
            for chunk in respuesta.iter_content(chunk_size=8192):
                f.write(chunk)
                
        print(f"✅ ¡ÉXITO! El Excel se ha guardado localmente.")
        print(f"Ruta: {os.path.abspath(nombre_archivo)}")
        
    except Exception as e:
        print(f"\n❌ ERROR EXCEL: {str(e)}")

if __name__ == "__main__":
    probar_json()
    probar_pdf()
    probar_excel()