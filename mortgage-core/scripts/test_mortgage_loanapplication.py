import requests
import json

# URL de tu microservicio Django (mortgage-core)
URL = "http://localhost:8001/api/mortgage/applications/"

def run_full_flow_test():
    print("🚀 Iniciando Prueba Integral: Formulario -> Django -> PostgreSQL -> IA\n")

    payload = {
        "user_id": 1,
        "full_name": "Ángel Gustavo Navarro Guzmán",
        "rfc_curp": "NAGA000000HDF",
        "email": "goose@escom.ipn.mx",
        "employment_type": "privado",
        "job_seniority_years": 3,
        "company_name": "Tech Solutions",
        "loan_amnt": 1500000.0,
        "annual_inc": 600000.0,
        "installment": 15000.0,
        "monthly_expenses": 12000.0,
        "property_value": 2000000.0,
        "loan_term": 15,
        "property_location": "CDMX",
        "financing_type": "bancario",
        "dti": 25.5,
        "revol_bal": 50000.0,
        "revol_util": 35.0,
        "tot_cur_bal": 2000000.0,
        "tot_coll_amt": 0.0,
        "total_rev_hi_lim": 100000.0,
        "delinq_2yrs": 0,
        "inq_last_6mths": 1,
        "open_acc": 10,
        "pub_rec": 0,
        "total_acc": 25,
        "earliest_cr_line_year": 2010,
        "verification_status": "verified",
        "home_ownership": "MORTGAGE"
    }

    try:
        response = requests.post(URL, json=payload, timeout=15)
        
        if response.status_code == 201:
            res_data = response.json()
            print("✅ ¡Solicitud Procesada Exitosamente!")
            
            # --- SALIDA EN CRUDO (RAW JSON) ---
            print("\n--- [RESPUESTA RAW JSON DESDE DJANGO] ---")
            print(json.dumps(res_data, indent=2, ensure_ascii=False))
            print("------------------------------------------\n")
            
            # Un pequeño resumen rápido para confirmar persistencia
            print(f"DEBUG: ID en DB: {res_data.get('id')} | Status: {res_data.get('status')}")

        else:
            print(f"❌ Error {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")

if __name__ == "__main__":
    run_full_flow_test()