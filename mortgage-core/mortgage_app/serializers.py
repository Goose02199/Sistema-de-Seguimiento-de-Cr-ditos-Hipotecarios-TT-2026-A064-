from rest_framework import serializers
from .models import LoanApplication, CustomerDocument
import requests
import os
from rest_framework import serializers
from .models import LoanApplication, BrokerAvailability, Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    # Agregamos campos de solo lectura para que el cliente vea el contexto
    meeting_type_display = serializers.CharField(source='get_meeting_type_display', read_only=True)
    broker_name = serializers.CharField(source='application.broker_assigned.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'application', 'meeting_type', 'meeting_type_display', 
            'location', 'duration_minutes', 'scheduled_at', 'status', 
            'notes', 'broker_name'
        ]
        read_only_fields = ['application', 'status']

class LoanApplicationSerializer(serializers.ModelSerializer):
    broker_info = serializers.SerializerMethodField()
    appointment = AppointmentSerializer(read_only=True)
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ('risk_score', 'risk_label', 'prob_low', 'prob_medium', 'prob_high', 'recommendations_data', 'status', 'created_at')

    def get_broker_info(self, obj):
        if not obj.assigned_broker_id:
            return None
            
        try:
            base_url = os.getenv("IDENTITY_SERVICE_URL", "http://identity-service:8000")
            internal_key = os.getenv("INTERNAL_SERVICE_KEY")
            
            # ¡AQUÍ ESTÁ LA CLAVE! Enviamos el secreto al microservicio de identidad
            headers = {
                "X-Internal-Service-Key": internal_key
            }
            
            endpoint = f"{base_url}/brokers/{obj.assigned_broker_id}/info/"
            res = requests.get(endpoint, headers=headers, timeout=3)
            
            if res.status_code == 200:
                user_data = res.json()
                return {
                    "full_name": user_data.get("full_name"),
                    "email": user_data.get("email"),
                    "phone": user_data.get("phone")
                }
        except Exception as e:
            # En producción, podrías loguear este error
            print(f"Error consultando info del bróker: {e}")
            pass
            
        return {
            "full_name": "Bróker Asignado",
            "email": "Contacto no disponible temporalmente",
            "phone": ""
        }
        
class CustomerDocumentSerializer(serializers.ModelSerializer):
    # Esto le manda al frontend el nombre bonito del documento
    document_name = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = CustomerDocument
        fields = ['id', 'document_type', 'document_name', 'file', 'status', 'feedback', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class BankRecommendationSerializer(serializers.Serializer):
    """
    Valida los datos de entrada para el modelo de Recomendación ML.
   
    """
    monto_credito = serializers.FloatField(min_value=100000, help_text="Monto solicitado")
    plazo_anios = serializers.IntegerField(min_value=1, max_value=30, help_text="Plazo en años")
    ingreso_mensual = serializers.FloatField(min_value=5000, help_text="Ingreso bruto mensual")
    valor_vivienda = serializers.FloatField(min_value=100000, help_text="Valor total del inmueble")

    def validate(self, data):
        """Validaciones cruzadas: ej. que el crédito no sea mayor al valor de la casa."""
        if data['monto_credito'] >= data['valor_vivienda']:
            raise serializers.ValidationError(
                {"monto_credito": "El monto del crédito no puede ser mayor o igual al valor de la vivienda."}
            )
        return data

class RiskAssessmentSerializer(serializers.Serializer):
    """
    Valida las 22 variables necesarias para el modelo XGBoost de riesgo.
    """
    # Variables numéricas directas
    loan_amnt_MXN2025 = serializers.FloatField(min_value=0)
    annual_inc_MXN2025 = serializers.FloatField(min_value=0)
    installment_MXN2025 = serializers.FloatField(min_value=0)
    revol_bal_MXN2025 = serializers.FloatField(min_value=0)
    tot_cur_bal_MXN2025 = serializers.FloatField(min_value=0)
    tot_coll_amt_MXN2025 = serializers.FloatField(min_value=0)
    total_rev_hi_lim_MXN2025 = serializers.FloatField(min_value=0)
    dti = serializers.FloatField(min_value=0)
    revol_util = serializers.FloatField(min_value=0, max_value=200) # Porcentaje de uso
    
    # Variables enteras
    delinq_2yrs = serializers.IntegerField(min_value=0)
    inq_last_6mths = serializers.IntegerField(min_value=0)
    open_acc = serializers.IntegerField(min_value=0)
    pub_rec = serializers.IntegerField(min_value=0)
    total_acc = serializers.IntegerField(min_value=0)
    earliest_cr_line = serializers.IntegerField(min_value=1900, max_value=2026) # Año de apertura

    # Variables categóricas (Strings)
    verification_status = serializers.ChoiceField(
        choices=["not_verified", "source_verified", "verified"]
    )
    home_ownership = serializers.ChoiceField(
        choices=["RENT", "OWN", "MORTGAGE", "ANY", "OTHER", "NONE"]
    )

class BrokerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = BrokerAvailability
        fields = ['id', 'date', 'start_time', 'end_time']

