import json
import pandas as pd
from app.core.predictor import RiskPredictor

predictor = RiskPredictor()

def auditar_prediccion_local(id_prueba, nombre, datos):
    print("\n" + "="*80)
    print(f"🔬 AUDITORÍA LOCAL IA: {id_prueba} - {nombre}")
    print("="*80)

    # 1. Simulación de la lógica interna de predictor.py para visualización
    print("\n--- [DEBUG] ASIGNACIÓN HOME_OWNERSHIP (ONE-HOT) ---")
    h_type = datos.get('home_ownership', 'NONE').upper()
    col_esperada = f"home_ownership_{h_type}"
    
    print(f"Input String:      {h_type}")
    print(f"Columna Objetivo:  {col_esperada}")
    
    # Verificamos si la columna existe en el contrato del modelo
    if col_esperada in predictor.columns:
        print(f"Estado en Vector:  Activada (1.0)")
    else:
        print(f"Estado en Vector:  Error - Columna no encontrada en el contrato")

    # 2. Ejecutar la predicción
    # Nota: El predictor local no tiene las validaciones de Serializer del Core,
    # por lo que procesará incluso el escenario DS_05 (Joven) a menos que falle el modelo.
    try:
        resultado = predictor.process_and_predict(datos)
        
        print("\n--- [VECTOR] VARIABLES CLAVE ENVIADAS AL XGBOOST ---")
        print(f"DTI: {datos.get('dti')}% | Utilización: {datos.get('revol_util')}")
        print(f"Verification Status (Mapeado): {resultado.get('risk_score')} (Label: {resultado.get('label')})")

        print("\n--- [RESULTADO] INFERENCIA LOCAL ---")
        print(json.dumps(resultado, indent=4, ensure_ascii=False))
        
    except Exception as e:
        print(f"\n❌ ERROR EN PROCESAMIENTO: {e}")

# --- DEFINICIÓN DE ESCENARIOS (Sincronizados con Mortgage Core) ---

base_data = {
    "loan_amnt_MXN2025": 1600000.0,
    "annual_inc_MXN2025": 720000.0,
    "installment_MXN2025": 16500.0,
    "revol_bal_MXN2025": 15000.0,
    "tot_cur_bal_MXN2025": 450000.0,
    "tot_coll_amt_MXN2025": 0.0,
    "total_rev_hi_lim_MXN2025": 50000.0,
    "verification_status": "verified",
    "dti": 25.0,
    "delinq_2yrs": 0,
    "inq_last_6mths": 1,
    "open_acc": 4,
    "pub_rec": 0,
    "total_acc": 10,
    "revol_util": 0.30,
    "home_ownership": "MORTGAGE",
    "earliest_cr_line": 2015
}

pruebas = [
    ("DS_01", "CLIENTE ESTÁNDAR", base_data.copy()),
    
    ("DS_02", "SOBRE-ENDEUDAMIENTO (DTI 65%)", 
     {**base_data, "dti": 65.0, "annual_inc_MXN2025": 300000.0, "revol_util": 0.98}),
    
    ("DS_03", "HISTORIAL MORATORIO (PUB_REC 2)", 
     {**base_data, "pub_rec": 2, "delinq_2yrs": 2}),
    
    ("DS_04", "CASO QUITAS (LOCAL IA)", 
     {**base_data, "recoveries": 2}), # Nota: El modelo ignorará esto por no ser feature
    
    ("DS_05", "PERFIL JOVEN (SIN FILTRO CORE)", 
     {**base_data, "earliest_cr_line": 2026, "home_ownership": "RENT"}),
]

if __name__ == "__main__":
    for pid, nom, data in pruebas:
        auditar_prediccion_local(pid, nom, data)