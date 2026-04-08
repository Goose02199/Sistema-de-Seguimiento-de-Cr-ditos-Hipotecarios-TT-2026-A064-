# scripts/simulate_recommendation.py
from app.core.recommender import BankRecommender
import json

def test_recommendation():
    print("=== Iniciando Prueba de Recomendación ML (V2) - Arquitectura Simétrica ===\n")
    
    try:
        # Ya no pasamos rutas; el motor las resuelve solo en el __init__
        # igual que el RiskPredictor
        engine = BankRecommender()
    except Exception as e:
        print(f"❌ Error al inicializar el motor: {e}")
        return

    # Perfil del usuario (Simulado desde el Frontend SPA)
    perfil_cliente = {
        'montoCredito': 1500000.0,
        'plazoAnios': 15,
        'ingresoMensual': 45000.0,
        'valorVivienda': 2000000.0
    }

    # Usamos el nombre de método simétrico process_and_recommend
    recomendaciones = engine.process_and_recommend(perfil_cliente)

    print(f"✅ Se encontraron {len(recomendaciones)} recomendaciones:\n")
    
    for i, rec in enumerate(recomendaciones, 1):
        # Los keys vienen del DataFrame procesado en el motor
        print(f"{i}. [{rec['institucion']}] {rec['producto_base']}")
        print(f"   - Programa: {rec['programa_adicional']}")
        print(f"   - CAT Predicho: {rec['CAT_Predicho']:.2f}%")
        print(f"   - Segmento ID: {rec['Segmento_ID']}")
        print("-" * 40)

if __name__ == "__main__":
    test_recommendation()