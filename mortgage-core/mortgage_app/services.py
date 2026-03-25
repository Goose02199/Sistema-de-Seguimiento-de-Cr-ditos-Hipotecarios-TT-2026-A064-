import requests
import os

class IntelligenceClient:
    """
    Cliente para comunicarse con el microservicio de Inteligencia.
    """
    # Usamos el nombre del contenedor definido en docker-compose
    BASE_URL = os.getenv("INTELLIGENCE_SERVICE_URL", "http://intelligence-service:8002")

    @classmethod
    def get_simulation(cls, payload):
        """
        Llama al motor financiero para calcular mensualidades y modo rescate.
        """
        endpoint = f"{cls.BASE_URL}/simulate"
        try:
            # Enviamos tanto los datos del usuario como las políticas de la DB
            response = requests.post(endpoint, json=payload, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": "Error en el motor financiero", "details": str(e)}

    @classmethod
    def get_risk_assessment(cls, applicant_data):
        """
        Envía las 22 variables al modelo XGBoost para precalificación de riesgo.
        """
        endpoint = f"{cls.BASE_URL}/analyze-risk"
        try:
            response = requests.post(endpoint, json=applicant_data, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": "Modelo de riesgo no disponible", "details": str(e)}