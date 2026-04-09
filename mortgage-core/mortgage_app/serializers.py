from rest_framework import serializers
from .models import LoanApplication

from rest_framework import serializers
from .models import LoanApplication

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ('risk_score', 'risk_label', 'prob_low', 'prob_medium', 'prob_high', 'recommendations_data', 'status', 'created_at')

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