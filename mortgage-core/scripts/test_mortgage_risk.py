import requests
import json

# URL de tu microservicio Django (mortgage-core) en el puerto 8001
DJANGO_URL = "http://localhost:8001/api/mortgage/analyze-risk/"

def run_risk_test():
    print("=== Prueba de Integración: Django -> FastAPI -> XGBoost Riesgo (Modo Raw) ===\n")

    # Perfil simulado con las 22 variables
    perfil_crediticio = {
        "loan_amnt_MXN2025": 1500000.0,
        "annual_inc_MXN2025": 600000.0,
        "installment_MXN2025": 15000.0,
        "revol_bal_MXN2025": 50000.0,
        "tot_cur_bal_MXN2025": 2000000.0,
        "tot_coll_amt_MXN2025": 0.0,
        "total_rev_hi_lim_MXN2025": 100000.0,
        "dti": 25.5,
        "delinq_2yrs": 0,
        "inq_last_6mths": 1,
        "open_acc": 10,
        "pub_rec": 0,
        "total_acc": 25,
        "revol_util": 35.0,
        "earliest_cr_line": 2010,
        "verification_status": "verified",
        "home_ownership": "MORTGAGE"
    }

    print(f"[*] Enviando perfil crediticio a {DJANGO_URL}...")
    try:
        response = requests.post(DJANGO_URL, json=perfil_crediticio)
        
        if response.status_code == 200:
            res = response.json()
            print("✅ Respuesta recibida exitosamente!\n")

            # --- SALIDA EN CRUDO (RAW JSON) ---
            print("--- RESPUESTA EN CRUDO (JSON COMPLETO) ---")
            print(json.dumps(res, indent=2, ensure_ascii=False))
            print("-" * 40 + "\n")

            # --- DESGLOSE AMIGABLE ---
            print("RESUMEN DEL ANÁLISIS:")
            print(f" > ETIQUETA: {res['label']}")
            print(f" > SCORE (ID): {res['risk_score']}")
            print(f" > PROBABILIDADES:")
            print(f"    - Bajo:  {res['probabilities']['bajo']:.4f}")
            print(f"    - Medio: {res['probabilities']['medio']:.4f}")
            print(f"    - Alto:  {res['probabilities']['alto']:.4f}")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")

if __name__ == "__main__":
    run_risk_test()