import requests
import os
import logging
from .models import LoanApplication
from .serializers import RiskAssessmentSerializer, BankRecommendationSerializer

logger = logging.getLogger(__name__)

class IntelligenceClient:
    """
    Cliente para comunicarse con el microservicio de Inteligencia.
    """
    # Usamos el nombre del contenedor definido en docker-compose
    BASE_URL = os.getenv("INTELLIGENCE_SERVICE_URL", "http://intelligence-service:8002")

    @classmethod
    def get_risk_assessment(cls, applicant_data):
        """Llama al modelo XGBoost de Riesgo."""
        endpoint = f"{cls.BASE_URL}/analyze-risk/"
        try:
            response = requests.post(endpoint, json=applicant_data, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en Risk Assessment: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    def get_bank_recommendations(cls, data):
        """
        Llama al modelo ExtraTrees de Recomendación.
        Realiza el mapeo a camelCase requerido por FastAPI.
        """
        endpoint = f"{cls.BASE_URL}/recommend-banks/"
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
            logger.error(f"Error en Bank Recommendations: {e}")
            return {"status": "error", "message": str(e)}

class MortgageService:
    @staticmethod
    def process_full_application(application: LoanApplication):
        """
        Orquestador: Extrae, valida con Serializers y envía datos a la IA.
        """
        
        # --- BLOQUE 1: RIESGO (17 Variables - XGBoost) ---
        risk_payload = {
            "loan_amnt_MXN2025": float(application.loan_amnt),
            "annual_inc_MXN2025": float(application.annual_inc),
            "installment_MXN2025": float(application.installment),
            "revol_bal_MXN2025": float(application.revol_bal),
            "tot_cur_bal_MXN2025": float(application.tot_cur_bal),
            "tot_coll_amt_MXN2025": float(application.tot_coll_amt),
            "total_rev_hi_lim_MXN2025": float(application.total_rev_hi_lim),
            "dti": float(application.dti),
            "delinq_2yrs": application.delinq_2yrs,
            "inq_last_6mths": application.inq_last_6mths,
            "open_acc": application.open_acc,
            "pub_rec": application.pub_rec,
            "total_acc": application.total_acc,
            "revol_util": float(application.revol_util),
            "earliest_cr_line": application.earliest_cr_line_year,
            "verification_status": application.verification_status,
            "home_ownership": application.home_ownership
        }

        # Validación Quirúrgica para Riesgo
        risk_serializer = RiskAssessmentSerializer(data=risk_payload)
        if risk_serializer.is_valid():
            risk_res = IntelligenceClient.get_risk_assessment(risk_serializer.validated_data)
            
            if risk_res.get("status") != "error":
                application.risk_score = risk_res.get('risk_score')
                application.risk_label = risk_res.get('label')
                probs = risk_res.get('probabilities', {})
                application.prob_low = probs.get('bajo')
                application.prob_medium = probs.get('medio')
                application.prob_high = probs.get('alto')
        else:
            logger.error(f"Error de validación para Riesgo en solicitud {application.id}: {risk_serializer.errors}")

        # --- BLOQUE 2: RECOMENDACIÓN (4 Variables - ExtraTrees) ---
        ingreso_mensual_float = float(application.annual_inc) / 12

        rec_payload = {
            "monto_credito": float(application.loan_amnt),
            "plazo_anios": application.loan_term,
            "ingreso_mensual": ingreso_mensual_float,
            "valor_vivienda": float(application.property_value or 0)
        }

        # Validación Quirúrgica para Recomendación
        rec_serializer = BankRecommendationSerializer(data=rec_payload)
        if rec_serializer.is_valid():
            rec_res = IntelligenceClient.get_bank_recommendations(rec_serializer.validated_data)

            if rec_res.get("status") != "error":
                application.recommendations_data = rec_res
                application.status = "processed"
            else:
                application.status = "error_intelligence"
        else:
            logger.error(f"Error de validación para Recomendación en solicitud {application.id}: {rec_serializer.errors}")
            application.status = "invalid_data"

        # Guardamos todos los resultados (o el estado de error) en la base de datos
        application.save()
        return application