import json
import pandas as pd
from app.engines.banorte.engine import BanorteEngine
from app.engines.banorte.helpers import seguros_y_admin # Necesario para los 'adders'

# 1. CATALOGO DE PRODUCTO (Simula politicas_json de la DB)
BANORTE_CATALOG = {
    "banorte_tradicional": {
        "nombre": "Hipoteca Fuerte Tradicional",
        "tasas": [
            {"nombre": "Premium", "tasa_anual_fija": 0.0938},
            {"nombre": "Mínima",  "tasa_anual_fija": 0.0988},
            {"nombre": "Baja",    "tasa_anual_fija": 0.1018},
            {"nombre": "Media",   "tasa_anual_fija": 0.1068},
            {"nombre": "Alta",    "tasa_anual_fija": 0.1118}
        ],
        "politicas": {
            "tipo": "tradicional", "aforo_max": 0.90, "relacion_ir": 2.0,
            "comision_apertura_pct": 0.01, "comision_apertura_financiada": True,
            "avaluo_pct_mil": 0.0025, "avaluo_iva_pct": 0.16,
            "notariales": {"modo": "porcentaje", "pct": 0.082},
            "seguros": {
                "suma_asegurable_pct": 0.70,
                "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.65},
                "danos": {"metodo": "porcentaje_saldo", "tasa_anual": 0.0075, "iva": 0.16}
            },
            "comision_admin_mensual": 299.00,
            "gastos_aprobacion": 750.00,
            "apoyos": {"tiene_apoyos": False},
            # --- LLAVE FALTANTE AÑADIDA AQUÍ ---
            "cat": {"incluye_apertura_financiada_t0": True} 
        }
    }
}
# 2. USUARIO DE PRUEBA (Juan Pérez)
# USUARIO_TEST = {
#     "nombre": "Juan Pérez",
#     "ingreso_bruto": 40000.00,
#     "valor_vivienda": 2000000.00,
#     "pct_enganche": 0.10,
#     "plazo_meses": 240,
#     "credito_instituto": 0.0,
#     "subcuenta": 0.0
# }

USUARIO_TEST = {
    "nombre": "Ana García",
    "ingreso_bruto": 35000.00,  # Ingreso menor para forzar rescate
    "valor_vivienda": 2000000.00,
    "pct_enganche": 0.10, 
    "plazo_meses": 240,
    "credito_instituto": 0.0,
    "subcuenta": 0.0
}

def test_engine_logic():
    print(f"=== Auditoría de Lógica Segmentada: {USUARIO_TEST['nombre']} ===\n")
    
    payload = BANORTE_CATALOG["banorte_tradicional"]
    pol = payload["politicas"]
    engine = BanorteEngine(payload)
    
    # Pre-cálculo de 'adders' usando el helper de Banorte (Sección 1)
    sa, sv, sd, ca = seguros_y_admin(USUARIO_TEST['valor_vivienda'], pol)
    adders = sv + sd + ca

    # TEST 1: Obtener Crédito Máximo (Replica _credito_tope_estructura - Sección 3)
    enganche_inicial = USUARIO_TEST['valor_vivienda'] * USUARIO_TEST['pct_enganche']
    credito_max = engine._credito_tope_estructura(
        valor=USUARIO_TEST['valor_vivienda'], 
        enganche=enganche_inicial, 
        credito_inst=USUARIO_TEST['credito_instituto'], 
        subcuenta=USUARIO_TEST['subcuenta']
    )
    print(f"[PASO 1] Crédito Máximo Calculado: ${credito_max:,.2f}")

    # TEST 2: Cálculo de Mensualidad (Replica _mensualidad_total - Sección 3)
    tasa_premium = payload['tasas'][0]['tasa_anual_fija']
    mensualidad_ini = engine._mensualidad_total(
        credito=credito_max,
        tasa_anual=tasa_premium,
        plazo=USUARIO_TEST['plazo_meses'],
        adders=adders,
        subcuenta=USUARIO_TEST['subcuenta']
    )
    
    capacidad = USUARIO_TEST['ingreso_bruto'] / pol['relacion_ir']
    print(f"[PASO 2] Mensualidad Inicial (Tasa 9.38%): ${mensualidad_ini:,.2f}")
    print(f"         Límite de Capacidad (I/R {pol['relacion_ir']}): ${capacidad:,.2f}")

    # TEST 3: Ejecución de Rescate (Replica rescate_por_enganche - Sección 4)
    if mensualidad_ini > capacidad + 50.0:
        print("\n[!] Mensualidad excede capacidad. Iniciando MODO RESCATE...")
        
        # 1. Creamos el DataFrame de tasas que el método ahora exige
        df_tmp = pd.DataFrame([{
            "nombre_tasa": "Premium",
            "tasa_anual_pct": payload['tasas'][0]['tasa_anual_fija'] * 100 # ej: 9.38
        }])

        # 2. Llamamos al método pasando tasas_df
        resultado = engine.rescate_por_enganche(
            valor=USUARIO_TEST['valor_vivienda'],
            enganche_inicial=enganche_inicial,
            ingreso_usuario=USUARIO_TEST['ingreso_bruto'],
            plazo=USUARIO_TEST['plazo_meses'],
            credito_inst=USUARIO_TEST['credito_instituto'],
            subcuenta=USUARIO_TEST['subcuenta'],
            tasas_df=df_tmp, # <-- AGREGADO
            adders=adders,
            enganche_min_pct=0.10
        )
        
        if resultado:
            mejor_opcion, df_todos = resultado
            print(f"✅ RESCATE EXITOSO:")
            print(f"   - Nueva Tasa Sugerida: {mejor_opcion['tasa_nombre']} ({mejor_opcion['tasa_anual_pct']}%)")
            print(f"   - Nuevo % Enganche: {mejor_opcion['pct_enganche_nuevo']*100:.1f}%")
            print(f"   - Mensualidad Final: ${mejor_opcion['mens_compatible']:,.2f}")
        else:
            print("❌ El cliente no es sujeto de crédito ni con rescate.")
    else:
        print("\n✅ El cliente cumple con la capacidad de pago inicial.")

def test_engine_section_5():
    print(f"=== Auditoría Final (Sección 5): {USUARIO_TEST['nombre']} ===\n")
    
    payload = BANORTE_CATALOG["banorte_tradicional"]
    engine = BanorteEngine(payload)
    
    # EJECUCIÓN MAESTRA: El motor procesa todas las tasas automáticamente
    cotizaciones = engine.generar_cotizaciones(USUARIO_TEST)
    
    if not cotizaciones:
        print("❌ No se encontraron opciones viables para el cliente.")
        return

    # Convertimos a DataFrame solo para visualizar bonito en consola
    df_final = pd.DataFrame(cotizaciones)
    
    # Columnas clave para la auditoría
    cols_show = [
        "tasa_nombre", "modo", "tasa_anual_pct", "cat_pct", 
        "mensualidad", "ingreso_req", "pct_enganche", "desembolso_inicial"
    ]
    
    print(df_final[cols_show].to_string(index=False))
    
    print("\n--- NOTAS DE ENGANCHE GENERADAS ---")
    for _, row in df_final.iterrows():
        print(f"[{row['tasa_nombre']}]: {row['nota_enganche']}")


if __name__ == "__main__":
    test_engine_logic()
    test_engine_section_5()
