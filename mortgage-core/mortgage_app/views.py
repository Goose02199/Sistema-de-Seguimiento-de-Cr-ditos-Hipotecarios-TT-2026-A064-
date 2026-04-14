from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import LoanApplication
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
    
    def get(self, request):
        """
        Busca si el usuario ya tiene una solicitud registrada.
        """
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # Buscamos la solicitud más reciente del usuario
        application = LoanApplication.objects.filter(user_id=user_id).first()

        if application:
            return Response(LoanApplicationSerializer(application).data)
        
        return Response({"message": "No hay solicitud activa"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):

        user_id = request.data.get('user_id')

        # --- REGLA: UNA SOLA SOLICITUD ACTIVA ---
        # Verificamos si ya existe una solicitud para este usuario
        existing_app = LoanApplication.objects.filter(user_id=user_id).first()
        
        if existing_app:
            # Si el broker ya la está trabajando, bloqueamos creación
            if existing_app.status == 'under_review':
                return Response(
                    {"error": "Ya tienes una solicitud en revisión por el broker y no se puede modificar."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Nota: Si el status es 'processed', más adelante permitiremos actualizarla 
            # pero por ahora bloqueamos el POST para evitar duplicados.
            return Response(
                {"error": "Ya tienes una solicitud procesada. Usa el modo edición."},
                status=status.HTTP_400_BAD_REQUEST
            )

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

    def patch(self, request):
        """
        Permite actualizar una solicitud existente y re-procesar la IA.
        """
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id es requerido"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Buscamos la solicitud que queremos editar
        application = LoanApplication.objects.filter(user_id=user_id).first()
        
        if not application:
            return Response({"error": "No se encontró una solicitud para actualizar"}, status=status.HTTP_404_NOT_FOUND)

        # 2. REGLA DE NEGOCIO: Bloqueo si el Broker ya está trabajando
        if application.status == 'under_review':
            return Response(
                {"error": "La solicitud está en revisión oficial y no puede modificarse."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Validamos los nuevos datos (partial=True permite enviar solo lo que cambió)
        serializer = LoanApplicationSerializer(application, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Guardamos los cambios en DB
            updated_application = serializer.save()
            
            try:
                # 4. RE-PROCESAMIENTO: El Service vuelve a llamar a XGBoost/ExtraTrees
                # con los nuevos datos actualizados.
                processed_app = MortgageService.process_full_application(updated_application)
                
                return Response(
                    LoanApplicationSerializer(processed_app).data, 
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {"error": "Error al re-procesar la IA", "detail": str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)