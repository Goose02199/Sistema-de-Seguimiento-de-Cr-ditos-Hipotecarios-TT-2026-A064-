import joblib
import pandas as pd
import numpy as np

def run_experiment():
    print("Iniciando experimento con el modelo XGBoost...")

    try:
        # 1. Cargar el contrato (columnas)
        columnas = joblib.load('models/columnas_modelo_xgb.joblib')
        print(f"Contrato cargado. El modelo espera {len(columnas)} variables.")
        
        # Listar columnas para mapeo posterior
        print("\n--- LISTA DE COLUMNAS REQUERIDAS ---")
        for i, col in enumerate(columnas, 1):
            print(f"{i}. {col}")

        # 2. Cargar el cerebro (modelo)
        modelo = joblib.load('models/modelo_xgb_riesgo_final.joblib')
        print("\nModelo XGBoost cargado exitosamente.")

        # 3. Crear un dato de prueba "ficticio" basado en el contrato
        # Creamos un registro con valores en cero o neutros
        test_data = pd.DataFrame(np.zeros((1, len(columnas))), columns=columnas)
        
        # 4. Simular una predicción
        print("\n--- REALIZANDO PREDICCIÓN DE PRUEBA ---")
        prediction = modelo.predict(test_data)
        proba = modelo.predict_proba(test_data)
        
        print(f"Resultado de la clasificación: {prediction[0]}")
        print(f"Probabilidades por clase (0, 1, 2): {proba[0]}")
        print("\nEl modelo responde correctamente.")

    except Exception as e:
        print(f"Error durante el experimento: {e}")

if __name__ == "__main__":
    run_experiment()