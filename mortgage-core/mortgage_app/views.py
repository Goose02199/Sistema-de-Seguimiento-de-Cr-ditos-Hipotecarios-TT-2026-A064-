from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import IntelligenceClient
from .serializers import BankRecommendationSerializer, RiskAssessmentSerializer

class RiskAssessmentView(APIView):
    """
    Endpoint para obtener el nivel de riesgo (Bajo/Medio/Alto) mediante XGBoost.
    """
    def post(self, request):
        serializer = RiskAssessmentSerializer(data=request.data)
        
        if serializer.is_valid():
            result = IntelligenceClient.get_risk_assessment(serializer.validated_data)
            
            if result.get("status") == "error":
                return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            return Response(result, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class BankRecommendationView(APIView):
    """
    Endpoint para obtener el Top 5 de bancos recomendados mediante ML.
   
    """
    def post(self, request):
        # 1. Validamos los datos con el Serializer
        serializer = BankRecommendationSerializer(data=request.data)
        
        if serializer.is_valid():
            # 2. Si son válidos, llamamos al cliente de Inteligencia
            result = IntelligenceClient.get_bank_recommendations(serializer.validated_data)
            
            if result.get("status") == "error":
                return Response(result, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            return Response(result, status=status.HTTP_200_OK)
        
        # 3. Si no son válidos, DRF devuelve automáticamente los errores (400)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)