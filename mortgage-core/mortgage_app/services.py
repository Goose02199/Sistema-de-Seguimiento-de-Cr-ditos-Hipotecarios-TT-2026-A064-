import requests
import os

class IntelligenceClient:
    """
    Cliente para comunicarse con el microservicio de Inteligencia.
    """
    # Usamos el nombre del contenedor definido en docker-compose
    BASE_URL = os.getenv("INTELLIGENCE_SERVICE_URL", "http://intelligence-service:8002")

    @classmethod
    def get_risk_assessment(cls, applicant_data):
        """Llama al modelo XGBoost de Riesgo."""
        endpoint = f"{cls.BASE_URL}/analyze-risk"
        try:
            response = requests.post(endpoint, json=applicant_data, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": str(e)}

    @classmethod
    def get_bank_recommendations(cls, data):
        """
        Llama al modelo ExtraTrees de Recomendación.
        Realiza el mapeo a camelCase requerido por FastAPI.
        """
        endpoint = f"{cls.BASE_URL}/recommend-banks"
        payload = {
            "montoCredito": data.get("monto_credito"),
            "plazoAnios": data.get("plazo_anios"),
            "ingresoMensual": data.get("ingreso_mensual"),
            "valorVivienda": data.get("valor_vivienda")
        }
        try:
            response = requests.post(endpoint, json=payload, timeout=7)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": str(e)}