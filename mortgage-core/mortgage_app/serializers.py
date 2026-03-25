from rest_framework import serializers
from .models import LoanApplication

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['status', 'risk_label', 'created_at']

class SimulationInputSerializer(serializers.Serializer):
    bank_slug = serializers.SlugField()
    product_key = serializers.CharField()
    valor_vivienda = serializers.FloatField()
    ingreso_bruto = serializers.FloatField()
    pct_enganche = serializers.FloatField()
    plazo_meses = serializers.IntegerField()
    # Campos opcionales para institucionales
    credito_infonavit = serializers.FloatField(required=False, default=0.0)
    subcuenta_vivienda = serializers.FloatField(required=False, default=0.0)