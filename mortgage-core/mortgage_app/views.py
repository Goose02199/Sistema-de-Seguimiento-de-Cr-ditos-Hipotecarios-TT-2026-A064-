from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import IntelligenceClient, MortgageService
from .serializers import BankRecommendationSerializer, RiskAssessmentSerializer, LoanApplicationSerializer

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

class LoanApplicationCreateView(APIView):
    """
    Vista principal para recibir el formulario de crédito,
    persistir los datos y disparar el análisis de IA.
    """
    
    def post(self, request):
        # 1. Validamos los datos de entrada con el serializador del modelo
        serializer = LoanApplicationSerializer(data=request.data)
        
        if serializer.is_valid():
            # 2. Guardamos la solicitud en PostgreSQL
            # Esto genera el ID (int8) y guarda los datos básicos
            application = serializer.save()
            
            try:
                # 3. Disparamos el orquestador de Inteligencia
                # Esto enviará los datos a XGBoost y ExtraTrees, actualizando la instancia
                processed_application = MortgageService.process_full_application(application)
                
                # 4. Devolvemos la solicitud ya con los resultados de la IA
                # El serializador ahora incluirá risk_score, recommendations_data, etc.
                return Response(
                    LoanApplicationSerializer(processed_application).data, 
                    status=status.HTTP_201_CREATED
                )
                
            except Exception as e:
                # Si algo falla en la lógica de servicios, notificamos
                return Response(
                    {
                        "error": "Error al procesar la inteligencia del crédito",
                        "detail": str(e),
                        "application_id": application.id
                    }, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Si los datos del formulario son inválidos (ej. falta el RFC)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)