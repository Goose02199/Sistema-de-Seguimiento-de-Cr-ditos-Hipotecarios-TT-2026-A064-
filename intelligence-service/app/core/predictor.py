import joblib
import pandas as pd
import os

class RiskPredictor:
    def __init__(self):
        # Rutas a los archivos cargados
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
        
        self.model = joblib.load(f"{base_path}/modelo_xgb_riesgo_final.joblib")
        self.columns = joblib.load(f"{base_path}/columnas_modelo_xgb.joblib")
        
        # Mapeo de verificación (Ajustar según Data Science si es necesario)
        self.verify_map = {
            "not_verified": 0,
            "source_verified": 1,
            "verified": 2
        }

    def process_and_predict(self, input_data: dict):
        """
        Transforma un JSON amigable en el vector de 22 columnas requerido.
        """
        # 1. Inicializar todas las columnas en 0
        data_row = {col: 0.0 for col in self.columns}

        # 2. Asignar valores numéricos directos
        for key in ['loan_amnt_MXN2025', 'annual_inc_MXN2025', 'installment_MXN2025', 
                    'revol_bal_MXN2025', 'tot_cur_bal_MXN2025', 'tot_coll_amt_MXN2025', 
                    'total_rev_hi_lim_MXN2025', 'dti', 'delinq_2yrs', 'inq_last_6mths', 
                    'open_acc', 'pub_rec', 'total_acc', 'revol_util', 'earliest_cr_line']:
            data_row[key] = float(input_data.get(key, 0))

        # 3. Mapear verification_status
        v_status = input_data.get('verification_status', 'not_verified').lower()
        data_row['verification_status'] = self.verify_map.get(v_status, 0)

        # 4. Procesar One-Hot de home_ownership
        # Si llega 'RENT', se marca 'home_ownership_RENT' como 1
        h_type = input_data.get('home_ownership', 'NONE').upper()
        h_col = f"home_ownership_{h_type}"
        if h_col in data_row:
            data_row[h_col] = 1.0

        # 5. Convertir a DataFrame manteniendo el ORDEN EXACTO del contrato
        df_input = pd.DataFrame([data_row])[self.columns]

        # 6. Predicción
        prediction = self.model.predict(df_input)[0]
        probabilities = self.model.predict_proba(df_input)[0]

        return {
            "risk_score": int(prediction),
            "label": "Riesgo Bajo" if prediction == 0 else "Riesgo Medio" if prediction == 1 else "Riesgo Alto",
            "probabilities": {
                "bajo": float(probabilities[0]),
                "medio": float(probabilities[1]),
                "alto": float(probabilities[2])
            }
        }