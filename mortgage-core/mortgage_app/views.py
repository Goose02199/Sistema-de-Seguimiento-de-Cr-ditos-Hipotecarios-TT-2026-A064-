from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import LoanApplication, CustomerDocument
from django.shortcuts import get_object_or_404
from .services import IntelligenceClient, MortgageService, IdentityClient
from .serializers import BankRecommendationSerializer, RiskAssessmentSerializer, LoanApplicationSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import CustomerDocumentSerializer
from django.http import FileResponse, Http404, HttpResponse
from django.core.files.base import ContentFile
from .utils.crypto import encrypt_file_data, decrypt_file_data
import mimetypes

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

class LoanApplicationListView(APIView):
    """
    Vista para que el Broker vea todas las solicitudes (Cartera de Clientes).
    Permite filtrar dinámicamente por estado y bróker asignado.
    """
    def get(self, request):
        # 1. Leemos los posibles filtros que manda React en la URL
        broker_id = request.query_params.get('assigned_broker_id')
        status_param = request.query_params.get('status')

        # 2. Iniciamos la consulta base (todas las solicitudes)
        applications = LoanApplication.objects.all()

        # 3. Aplicamos los filtros solo si el frontend los envió
        if broker_id:
            applications = applications.filter(assigned_broker_id=broker_id)
        
        if status_param:
            applications = applications.filter(status=status_param)

        # 4. Ordenamos por '-created_at' para ver lo más nuevo al inicio
        applications = applications.order_by('-created_at')
        
        # 5. Serializamos la lista y retornamos
        serializer = LoanApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class LoanApplicationDetailView(APIView):
    """
    Vista para interactuar con una solicitud específica mediante su ID.
    Ideal para que el bróker actualice estados sin re-disparar la IA.
    """

    def get(self, request, pk):
        application = get_object_or_404(LoanApplication, pk=pk)
        serializer = LoanApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        application = get_object_or_404(LoanApplication, pk=pk)
        new_status = request.data.get('status')
        
        # --- LÓGICA DE DECLINACIÓN Y REASIGNACIÓN ---
        if new_status == 'assigning_broker' and application.assigned_broker_id:
            IdentityClient.release_broker(application.assigned_broker_id)
            rechazados = application.declined_by or []
            rechazados.append(application.assigned_broker_id)
            application.declined_by = list(set(rechazados))
            
            # 2. Desvinculamos al bróker actual
            application.assigned_broker_id = None
            application.status = 'assigning_broker'
            application.save()
            
            asignacion = IdentityClient.assign_broker(
                application.postal_code, 
                excluded_brokers=application.declined_by
            )
            
            if asignacion.get('status') == 'success':
                application.assigned_broker_id = asignacion['data']['broker_id']
                application.status = 'broker_assigned'
                application.save()
                return Response({"message": "Bróker declinado y reasignado con éxito."})
            else:
                # Se queda en assigning_broker hasta que haya alguien disponible
                return Response({"message": "Bróker declinado. En espera de nuevo bróker disponible."})
        
        
        if new_status:
            # 1. Modificamos el estado DIRECTAMENTE en el modelo esquivando el read_only
            application.status = new_status
            application.save()
            
            # 2. Usamos el serializador ÚNICAMENTE para formatear la respuesta de salida
            serializer = LoanApplicationSerializer(application)
            return Response({
                "message": "Status actualizado correctamente",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "No se envió un status a actualizar"}, status=status.HTTP_400_BAD_REQUEST)

class ApplicationDocumentListView(APIView):
    """
    GET: Lista todos los documentos de un trámite específico.
    POST: El bróker solicita nuevos documentos (crea placeholders).
    """
    def get(self, request, application_id):
        application = get_object_or_404(LoanApplication, id=application_id)
        documents = application.documents.all()
        serializer = CustomerDocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, application_id):
        application = get_object_or_404(LoanApplication, id=application_id)
        document_types = request.data.get('document_types', []) # Ej: ['identificacion', 'ingresos']

        created_docs = []
        for doc_type in document_types:
            # Usamos get_or_create para no duplicar si el bróker da doble clic
            doc, created = CustomerDocument.objects.get_or_create(
                application=application,
                document_type=doc_type,
                defaults={'status': 'requested'}
            )
            created_docs.append(doc)
        
        # ACTUALIZAMOS MACRO-ESTATUS: Si el bróker pide documentos, pasamos a waiting_docs
        if created_docs and application.status != 'waiting_docs':
            application.status = 'waiting_docs'
            application.save()

        serializer = CustomerDocumentSerializer(created_docs, many=True)
        return Response({
            "message": "Documentos solicitados correctamente",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """
    PATCH: Permite al cliente subir el archivo o al bróker revisarlo.
    """
    # IMPORTANTE: Necesitamos estos parsers para poder recibir archivos físicos
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    # Definimos los verdaderos formatos permitidos
    ALLOWED_MIME_TYPES = [
        'application/pdf', 
        'image/jpeg', 
        'image/png'
    ]
    # Límite de 5MB por archivo (protección contra saturación de disco)
    MAX_FILE_SIZE = 5 * 1024 * 1024

    def patch(self, request, pk):
        document = get_object_or_404(CustomerDocument, pk=pk)

        # --- CASO 1: EL CLIENTE SUBE UN ARCHIVO ---
        if 'file' in request.FILES:
            uploaded_file = request.FILES['file']
            
            # --- CAPA 1: Validación de Extensión Exacta ---
            # Extraemos la extensión real del nombre del archivo
            ext = uploaded_file.name.split('.')[-1].lower()
            allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']
            
            if ext not in allowed_extensions:
                return Response({
                    "error": f"Extensión .{ext} no permitida. Por seguridad, solo se aceptan PDF, JPG o PNG."
                }, status=status.HTTP_400_BAD_REQUEST)

            # --- CAPA 2: Validación de MIME Type (Cabecera HTTP) ---
            if uploaded_file.content_type not in self.ALLOWED_MIME_TYPES:
                return Response({
                    "error": f"El formato interno ({uploaded_file.content_type}) no es válido."
                }, status=status.HTTP_400_BAD_REQUEST)

            # --- CAPA 3: Validación de Tamaño (Evitar DDoS por saturación de disco) ---
            if uploaded_file.size > self.MAX_FILE_SIZE:
                return Response({
                    "error": "El archivo es demasiado pesado. El máximo permitido es 5MB."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Si pasa las 3 pruebas de seguridad, procedemos a encriptar
            try:
                # 1. Leemos los bytes originales
                raw_data = uploaded_file.read() 
                
                # 2. Los encriptamos
                encrypted_data = encrypt_file_data(raw_data) 
                
                # 3. Creamos el archivo virtual
                encrypted_file = ContentFile(encrypted_data, name=uploaded_file.name)
                
                # Guardamos
                document.file = encrypted_file
                document.status = 'under_review'
                document.feedback = '' 
                document.save()
                
                serializer = CustomerDocumentSerializer(document)
                return Response({"message": "Archivo cargado y encriptado con éxito", "data": serializer.data})

        # --- CASO 2: EL BRÓKER APRUEBA O RECHAZA ---
        if 'status' in request.data:
            new_status = request.data.get('status')
            
            if new_status not in ['approved', 'rejected']:
                return Response({"error": "Status inválido"}, status=status.HTTP_400_BAD_REQUEST)

            document.status = new_status
            if new_status == 'rejected':
                # Si rechaza, exigimos que haya escrito por qué
                feedback = request.data.get('feedback')
                if not feedback:
                    return Response({"error": "Debe proporcionar un motivo de rechazo"}, status=status.HTTP_400_BAD_REQUEST)
                document.feedback = feedback
            else:
                document.feedback = '' # Si aprueba, limpiamos por si acaso
                
            document.save()
            
            serializer = CustomerDocumentSerializer(document)
            return Response({"message": f"Documento {new_status}", "data": serializer.data})

        return Response({"error": "No se envió archivo ni status"}, status=status.HTTP_400_BAD_REQUEST)

class SecureDocumentView(APIView):
    def get(self, request, pk):
        document = get_object_or_404(CustomerDocument, pk=pk)

        if not document.file or not document.file.name:
            raise Http404("El documento aún no ha sido cargado.")

        try:
            # 1. Averiguamos el formato real (ej. application/pdf)
            content_type, _ = mimetypes.guess_type(document.file.name)
            if not content_type:
                content_type = 'application/octet-stream'

            # 2. Leemos la "sopa de letras" encriptada del disco
            with document.file.open('rb') as f:
                encrypted_data = f.read()

            # 3. Desencriptamos al vuelo en la memoria (RAM)
            decrypted_data = decrypt_file_data(encrypted_data)

            # 4. Usamos HttpResponse en lugar de FileResponse porque estamos 
            # mandando bytes desde la RAM, no un archivo directo del disco.
            response = HttpResponse(decrypted_data, content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{document.id}_{document.document_type}"'
            
            return response
            
        except FileNotFoundError:
            raise Http404("El archivo físico no fue encontrado.")
        except Exception as e: 
            # Imprimimos el error real en la consola de Docker
            import logging
            logging.error(f"ERROR CRÍTICO DESENCRIPTANDO: {str(e)} - Tipo: {type(e)}")
            
            # Y se lo mandamos al frontend para que lo veas en la pestaña Network
            return HttpResponse(f"Error interno del servidor: {type(e).__name__} - {str(e)}", status=500)

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