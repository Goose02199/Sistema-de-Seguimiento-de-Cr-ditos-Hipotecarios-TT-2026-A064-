from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import BankProduct
from .serializers import SimulationInputSerializer
from .services import IntelligenceClient

class SimulationView(APIView):
    def post(self, request):
        serializer = SimulationInputSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            try:
                # 1. Buscar el producto y sus tasas en la DB
                product = BankProduct.objects.get(
                    bank__slug=data['bank_slug'], 
                    product_key=data['product_key']
                )
                rates = product.rates.all()
                
                # 2. Construir el payload de políticas dinámicas
                policies = {
                    "type": product.type,
                    "aforo_max": float(product.max_ltv),
                    "relacion_ir": product.income_payment_ratio,
                    "comision_apertura_pct": float(product.opening_commission_pct),
                    "comision_apertura_financiada": product.is_commission_financed,
                    "comision_admin_mensual": float(product.admin_fee_monthly),
                    "seguros": product.insurance_config,
                    "tasas": [{"nombre": r.name, "tasa_anual_fija": float(r.annual_rate)} for r in rates]
                }

                # 3. Llamar al microservicio de Inteligencia
                payload = {
                    "usuario": data,
                    "politicas": policies
                }
                
                result = IntelligenceClient.get_simulation(payload)
                return Response(result, status=status.HTTP_200_OK)

            except BankProduct.DoesNotExist:
                return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)