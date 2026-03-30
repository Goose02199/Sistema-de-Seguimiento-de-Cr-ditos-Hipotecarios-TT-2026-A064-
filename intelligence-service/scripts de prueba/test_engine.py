import json
from app.finance_engine import simular_credito

def auditar_engine_local(id_prueba, nombre, payload):
    print("\n" + "="*80)
    print(f"🧮 AUDITORÍA LOCAL ENGINE: {id_prueba} - {nombre}")
    print("="*80)

    # 1. Inputs de la simulación
    u = payload['usuario']
    p = payload['politicas']
    print(f"INPUTS:")
    print(f"  - Producto:  {p['product_key'].upper()}")
    print(f"  - Vivienda:  ${u['valor_vivienda']:,.2f}")
    print(f"  - Ingreso:   ${u['ingreso_bruto']:,.2f}")
    print(f"  - Enganche:  {u['pct_enganche']*100}%")

    # 2. Ejecución del Motor Financiero
    try:
        resultado = simular_credito(payload, u)
        
        if "error" in resultado:
            print(f"\n❌ RESULTADO: {resultado['error']}")
        else:
            print("\n--- [RESULTADO] CÁLCULO FINANCIERO ---")
            print(f"Modo Rescate Activo:  {'SÍ' if resultado['is_rescue_mode_active'] else 'NO'}")
            print(f"Enganche Sugerido:    ${resultado['suggested_down_payment']:,.2f} ({resultado['engine_ltv_ratio']*100:.2f}% LTV)")
            print(f"Mensualidad Sugerida: ${resultado['suggested_installment']:,.2f}")
            print(f"CAT (TIR):           {resultado['calculated_cat']}%")
            print(f"DTI (Capacidad):     {resultado['engine_dti_ratio']*100:.2f}%")
            
            # Verificación visual rápida del JSON de salida
            print("\nJSON Response:")
            print(json.dumps(resultado, indent=4, ensure_ascii=False))

    except Exception as e:
        import traceback
        print(f"\n💥 FALLO CRÍTICO EN EL ENGINE: {e}")
        traceback.print_exc()

# --- CONFIGURACIÓN DE POLÍTICAS (Espejo de la DB y Notebook) ---
#
POL_TRADICIONAL = {
    "product_key": "tradicional", "max_ltv": 0.90, "income_payment_ratio": 2.0,
    "opening_commission_pct": 0.01, "is_commission_financed": True,
    "admin_fee_monthly": 299.0, "appraisal_pct_mil": 0.0025, "approval_fees": 750.0,
    "insurance_config": {
        "seguros": {
            "suma_asegurable_pct": 0.70,
            "vida": {"metodo": "pormil", "tarifa_pormil_mensual": 0.65},
            "danos": {"metodo": "porcentaje_saldo", "tasa_anual": 0.0075, "iva": 0.16}
        }
    }
}

TASAS_STD = [{"name": "Premium", "annual_rate": 0.0938}]

# --- BATERÍA DE PRUEBAS ---
pruebas = [
    ("EN_01", "ESCENARIO NORMAL (VIABLE)", {
        "politicas": POL_TRADICIONAL, "tasas": TASAS_STD,
        "usuario": {"valor_vivienda": 1500000.0, "ingreso_bruto": 50000.0, "pct_enganche": 0.10, "plazo_meses": 240}
    }),

    ("EN_02", "RESCATE POR ENGANCHE (INGRESO INSUFICIENTE)", {
        "politicas": POL_TRADICIONAL, "tasas": TASAS_STD,
        "usuario": {"valor_vivienda": 2500000.0, "ingreso_bruto": 30000.0, "pct_enganche": 0.10, "plazo_meses": 240}
    }),

    ("EN_03", "RESCATE EXITOSO (MAS INGRESO)", {
        "politicas": POL_TRADICIONAL, "tasas": TASAS_STD,
        "usuario": {
            "valor_vivienda": 2500000.0, 
            "ingreso_bruto": 45000.0, # Subimos de 30k a 45k
            "pct_enganche": 0.10, 
            "plazo_meses": 240
        }
    }),
]

if __name__ == "__main__":
    for pid, nom, data in pruebas:
        auditar_engine_local(pid, nom, data)