import requests
import os
import logging
from .models import LoanApplication
from .serializers import RiskAssessmentSerializer, BankRecommendationSerializer

logger = logging.getLogger(__name__)

class IdentityClient:
    """
    Cliente para comunicarse con el microservicio de Identidad.
    Maneja la lógica de asignación de brókers.
    """
    BASE_URL = os.getenv("IDENTITY_SERVICE_URL", "http://identity-service:8000")

    @classmethod
    def assign_broker(cls, postal_code, excluded_brokers=None):
        """
        Solicita al identity-service la asignación del bróker más apto 
        basado en el Código Postal y carga de trabajo, excluyendo a los que ya rechazaron.
        """
        endpoint = f"{cls.BASE_URL}/brokers/assign/"
        
        headers = {
            "X-Internal-Service-Key": os.getenv('INTERNAL_SERVICE_KEY'),
            "Content-Type": "application/json"
        }
        
        # 1. Construimos el payload base
        payload = {"postal_code": str(postal_code)}
        
        # 2. Si hay brókers que excluir, los añadimos al JSON
        if excluded_brokers:
            payload["excluded_brokers"] = excluded_brokers

        try:
            logger.info(f"Llamando a identidad para CP {postal_code}. Excluyendo: {excluded_brokers}")
            
            response = requests.post(
                endpoint, 
                json=payload, 
                headers=headers, 
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                # Caso controlado: No hay brókers disponibles para esa zona
                return {"status": "no_availability", "message": "No brokers found"}
            
            response.raise_for_status()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en comunicación con Identity-Service: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    def release_broker(cls, broker_id):
        """Notifica al servicio de identidad que un bróker ha liberado una carga."""
        endpoint = f"{cls.BASE_URL}/brokers/{broker_id}/release/"
        headers = {"X-Internal-Service-Key": os.getenv('INTERNAL_SERVICE_KEY')}
        
        try:
            res = requests.post(endpoint, headers=headers, timeout=5)
            return res.status_code == 200
        except Exception as e:
            logger.error(f"Error al liberar carga del bróker {broker_id}: {e}")
            return False

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
        
        application.status = "sent_awaiting_ia"
        application.save()

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

        risk_serializer = RiskAssessmentSerializer(data=risk_payload)
        risk_success = False

        if risk_serializer.is_valid():
            risk_res = IntelligenceClient.get_risk_assessment(risk_serializer.validated_data)
            
            if risk_res.get("status") != "error":
                application.risk_score = risk_res.get('risk_score')
                application.risk_label = risk_res.get('label')
                probs = risk_res.get('probabilities', {})
                application.prob_low = probs.get('bajo')
                application.prob_medium = probs.get('medio')
                application.prob_high = probs.get('alto')
                risk_success = True
        else:
            logger.error(f"Error de validación Riesgo (ID: {application.id}): {risk_serializer.errors}")

        # 1.2 Bloque de Recomendación (ExtraTrees - 4 Variables)
        ingreso_mensual_float = float(application.annual_inc) / 12
        rec_payload = {
            "monto_credito": float(application.loan_amnt),
            "plazo_anios": application.loan_term,
            "ingreso_mensual": ingreso_mensual_float,
            "valor_vivienda": float(application.property_value or 0)
        }

        rec_serializer = BankRecommendationSerializer(data=rec_payload)
        rec_success = False

        if rec_serializer.is_valid():
            rec_res = IntelligenceClient.get_bank_recommendations(rec_serializer.validated_data)

            if rec_res.get("status") != "error":
                application.recommendations_data = rec_res
                rec_success = True
        else:
            logger.error(f"Error de validación Recomendación (ID: {application.id}): {rec_serializer.errors}")

        # --- FASE 2: TRANSICIÓN DE ESTADOS ---        
        if risk_success and rec_success:
            application.status = "assigning_broker"
            logger.info(f"IA completada para {application.id}. Iniciando asignación...")
            
            # Llamada al identity-service
            assignment_res = IdentityClient.assign_broker(application.postal_code)
            
            if assignment_res.get("status") == "success":
                application.assigned_broker_id = assignment_res['data']['broker_id']
                application.status = "broker_assigned"
                logger.info(f"Solicitud {application.id} asignada al bróker {application.assigned_broker_id}")
            else:
                logger.warning(f"No se pudo asignar bróker automáticamente para CP {application.postal_code}")
        
        elif not risk_serializer.is_valid() or not rec_serializer.is_valid():
            application.status = "invalid_data"
        else:
            application.status = "error_intelligence"

        application.save()
        return application