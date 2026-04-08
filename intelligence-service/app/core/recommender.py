import joblib
import pandas as pd
import os

class BankRecommender:
    def __init__(self):
        # Rutas automáticas a la carpeta de modelos 
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
        
        # 1. Cargar el sistema integral V2
        model_data = joblib.load(f"{base_path}/prototipo_extratrees_completoV2.joblib")
        
        self.modelo_et = model_data['modelo_principal']
        self.calibrador = model_data['calibrador']
        self.features_entrenamiento = model_data['features']
        self.modelo_kmeans = model_data['kmeans_model']
        self.scaler_kmeans = model_data['scaler_model']
        self.cols_cluster = model_data['columnas_cluster']
        
        # 2. Cargar el catálogo base de los 184 productos
        self.df_productos = pd.read_csv(f"{base_path}/dataset.csv")

    def process_and_recommend(self, input_data: dict):
        """
        Lógica simétrica a process_and_predict: 
        Recibe JSON, transforma y devuelve el Top 5.
        """
        df_pred = self.df_productos.copy()

        # A. Inyección de datos del cliente
        for clave, valor in input_data.items():
            if clave in df_pred.columns:
                df_pred[clave] = valor

        # B. Preprocesamiento (Dummies)
        columnas_cat = ['institucion', 'producto_base', 'programa_adicional', 'tipoIndexacion']
        df_pred_ml = pd.get_dummies(df_pred, columns=columnas_cat, drop_first=True)

        # C. Alineación con las 23 features del entrenamiento
        for col in self.features_entrenamiento:
            if col not in df_pred_ml.columns:
                df_pred_ml[col] = 0
        df_pred_ml = df_pred_ml[self.features_entrenamiento]

        # D. Predicción del CAT y Calibración
        cat_base = self.modelo_et.predict(df_pred_ml)
        ajuste_error = self.calibrador.predict(df_pred_ml)
        df_pred["CAT_Predicho"] = cat_base - ajuste_error

        # E. Segmentación (KMeans)
        X_cluster = df_pred[self.cols_cluster].copy()
        X_cluster['CAT_Pct'] = df_pred["CAT_Predicho"]
        X_scaled = self.scaler_kmeans.transform(X_cluster)
        df_pred['Segmento_ID'] = self.modelo_kmeans.predict(X_scaled)

        # F. Selección de la mejor variante por cada producto_base
        df_top = (
            df_pred.sort_values("CAT_Predicho")
                  .groupby("producto_base", as_index=False)
                  .first()
        )

        # Retornar Top 5 en formato lista de diccionarios
        return df_top.sort_values("CAT_Predicho").head(5).to_dict('records')