from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import LoanApplication, CustomerDocument, Appointment, BrokerAvailability, BankProduct, Bank
from django.shortcuts import get_object_or_404
from .services import IntelligenceClient, MortgageService, IdentityClient
from .serializers import AppointmentSerializer, BankRecommendationSerializer, RiskAssessmentSerializer, LoanApplicationSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import CustomerDocumentSerializer
from django.http import FileResponse, Http404, HttpResponse
from django.core.files.base import ContentFile
from .utils.crypto import encrypt_file_data, decrypt_file_data
import mimetypes
from datetime import datetime, timedelta, date
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta, date
from django.db import transaction, IntegrityError
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError

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
        
        application.check_and_update_document_status()

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
            
                # --- LA INTERVENCIÓN CRIPTOGRÁFICA ---
                # 1. Leemos los bytes originales del PDF
                raw_data = uploaded_file.read() 
                
                # 2. Los encriptamos en la RAM
                encrypted_data = encrypt_file_data(raw_data) 
                
                # 3. Creamos un "archivo falso" en memoria con los datos encriptados
                # Mantenemos el nombre original para que la extensión siga siendo .pdf o .jpg
                encrypted_file = ContentFile(encrypted_data, name=uploaded_file.name)
                
                # Guardamos la versión encriptada en el modelo
                document.file = encrypted_file
                
                document.status = 'under_review'
                document.feedback = '' 
                document.save()
                
                document.application.check_and_update_document_status()

                serializer = CustomerDocumentSerializer(document)
                return Response({"message": "Archivo cargado con éxito", "data": serializer.data})

            except Exception as e:
                import logging
                logging.error(f"Error encriptando archivo: {str(e)}")
                return Response({"error": "Hubo un problema al procesar la seguridad del archivo."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

            document.application.check_and_update_document_status()
            
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

class AvailableSlotsView(APIView):
    """
    Calcula dinámicamente los huecos disponibles para una cita específica,
    cruzando la agenda del bróker y evitando colisiones con otras citas.
    """
    def get(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id, status='pending_client')
            
            # --- CAMBIO 1: Usar assigned_broker_id en lugar de broker_assigned ---
            broker_id = appointment.application.assigned_broker_id 
            
            duration = timedelta(minutes=appointment.duration_minutes)
        except Appointment.DoesNotExist:
            return Response({"error": "Cita no encontrada o ya agendada."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Definimos la ventana de búsqueda (Ej: los próximos 14 días)
        today = timezone.now().date()
        end_date = today + timedelta(days=14)

        # 2. Obtenemos las disponibilidades del bróker en esa ventana
        availabilities = BrokerAvailability.objects.filter(
            # --- CAMBIO 2: Usar broker_user_id (el nuevo campo de BrokerAvailability) ---
            broker_user_id=broker_id, 
            date__gte=today,
            date__lte=end_date
        ).order_by('date', 'start_time')

        # 3. Obtenemos las citas que el bróker YA TIENE ocupadas en esa ventana
        busy_appointments = Appointment.objects.filter(
            # --- CAMBIO 3: Usar application__assigned_broker_id ---
            application__assigned_broker_id=broker_id, 
            status='scheduled',
            scheduled_at__date__gte=today,
            scheduled_at__date__lte=end_date
        )

        available_slots = {}

        # 4. El Algoritmo de Chunking (Cortar el pastel en rebanadas)
        for av in availabilities:
            current_dt = datetime.combine(av.date, av.start_time)
            end_dt = datetime.combine(av.date, av.end_time)
            
            # Formato de llave para el diccionario (Ej: "2026-05-18")
            date_str = av.date.strftime('%Y-%m-%d')
            if date_str not in available_slots:
                available_slots[date_str] = []

            # Mientras la rebanada (duración) quepa en el bloque restante de disponibilidad
            while current_dt + duration <= end_dt:
                slot_end_dt = current_dt + duration
                
                # 5. Verificamos si este hueco choca con alguna cita ya ocupada
                # Lógica de colisión: (Inicio A < Fin B) y (Fin A > Inicio B)
                is_overlapping = False
                for busy in busy_appointments:
                    busy_start = timezone.make_naive(busy.scheduled_at) if timezone.is_aware(busy.scheduled_at) else busy.scheduled_at
                    busy_end = busy_start + timedelta(minutes=busy.duration_minutes)
                    
                    if current_dt < busy_end and slot_end_dt > busy_start:
                        is_overlapping = True
                        break # Choca, descartamos este hueco
                
                # Si está libre y además es en el futuro (no horas pasadas de hoy)
                if not is_overlapping and current_dt > datetime.now():
                    available_slots[date_str].append({
                        "start": current_dt.strftime('%H:%M'),
                        "end": slot_end_dt.strftime('%H:%M')
                    })
                
                # Avanzamos el reloj. Calendly suele avanzar en bloques fijos de 30 mins
                # para tener horarios limpios (10:00, 10:30, 11:00) en lugar de (10:00, 11:15, 12:30).
                current_dt += timedelta(minutes=30) 

        # Limpiamos los días que se quedaron vacíos
        clean_slots = {k: v for k, v in available_slots.items() if v}

        return Response({"available_slots": clean_slots})

class BrokerAvailabilityBulkUpdateView(APIView):
    """
    POST: Recibe una lista estructurada de horarios por día y reconstruye la disponibilidad.
    """
    def post(self, request):
        # Extraemos el broker_id del body de la petición
        broker_id = request.data.get('user_id')
        agenda_data = request.data.get('agenda')

        if not broker_id or not agenda_data:
            return Response({"error": "Faltan datos (user_id o agenda)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for date_str, slots in agenda_data.items():
                    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    
                    # Borramos lo anterior
                    BrokerAvailability.objects.filter(broker_user_id=broker_id, date=target_date).delete()

                    new_availabilities = []
                    for slot in slots:
                        start_t = datetime.strptime(slot['start_time'], '%H:%M').time()
                        end_t = datetime.strptime(slot['end_time'], '%H:%M').time()
                        
                        if start_t >= end_t:
                            raise ValueError(f"Hora de inicio debe ser menor a hora de fin en el día {date_str}.")

                        new_availabilities.append(
                            BrokerAvailability(
                                broker_user_id=broker_id, # Pasamos el ID directamente
                                date=target_date,
                                start_time=start_t,
                                end_time=end_t
                            )
                        )
                    
                    if new_availabilities:
                        BrokerAvailability.objects.bulk_create(new_availabilities)

            return Response({"message": "Disponibilidad actualizada correctamente."})
            
        # --- AÑADE ESTE BLOQUE NUEVO ---
        except IntegrityError:
            return Response(
                {"error": "Estás intentando guardar horarios duplicados o superpuestos en el mismo día. Revisa tu agenda e intenta de nuevo."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response({"error": f"Error del servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BrokerScheduleView(APIView):
    """
    GET: Devuelve la disponibilidad del bróker y sus citas ocupadas para los próximos 14 días.
    """
    def get(self, request):
        # --- ESTILO MICROSERVICIO ---
        # Leemos el ID del bróker desde los query params (igual que en tu LoanApplicationListView)
        broker_id = request.query_params.get('user_id')
        
        if not broker_id:
            return Response({"error": "Falta el parámetro user_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        today = timezone.now().date()
        end_date = today + timedelta(days=14)

        # Usamos broker_id en lugar de la instancia de usuario
        availabilities = BrokerAvailability.objects.filter(
            broker_user_id=broker_id,
            date__gte=today,
            date__lte=end_date
        ).order_by('date', 'start_time')

        busy_appointments = Appointment.objects.filter(
            application__assigned_broker_id=broker_id, # Ajustado a tu nomenclatura (assigned_broker_id)
            status='scheduled',
            scheduled_at__date__gte=today,
            scheduled_at__date__lte=end_date
        ).select_related('application')

        schedule_data = {}
        for i in range(15):
            current_date = today + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            schedule_data[date_str] = {'available_slots': [], 'busy_slots': []}

        for av in availabilities:
            date_str = av.date.strftime('%Y-%m-%d')
            schedule_data[date_str]['available_slots'].append({
                'id': av.id,
                'start_time': av.start_time.strftime('%H:%M'),
                'end_time': av.end_time.strftime('%H:%M')
            })

        for appt in busy_appointments:
            appt_dt = timezone.make_naive(appt.scheduled_at) if timezone.is_aware(appt.scheduled_at) else appt.scheduled_at
            date_str = appt_dt.strftime('%Y-%m-%d')
            end_dt = appt_dt + timedelta(minutes=appt.duration_minutes)
            
            if date_str in schedule_data:
                schedule_data[date_str]['busy_slots'].append({
                    'start_time': appt_dt.strftime('%H:%M'),
                    'end_time': end_dt.strftime('%H:%M'),
                    'label': f"Trámite #{appt.application.id}"
                })

        return Response(schedule_data)

class ApplicationAppointmentView(APIView):
    """GET: Obtiene la cita ligada a un trámite específico."""
    def get(self, request, app_id):
        try:
            appointment = Appointment.objects.get(application_id=app_id)
            return Response(AppointmentSerializer(appointment).data)
        except Appointment.DoesNotExist:
            return Response({"error": "No hay cita configurada"}, status=status.HTTP_404_NOT_FOUND)

class ScheduleAppointmentView(APIView):
    """
    Endpoint donde el cliente confirma la fecha y hora exacta de su cita.
    """
    def patch(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id, status='pending_client')
        except Appointment.DoesNotExist:
            return Response(
                {"error": "La cita no existe o ya fue agendada."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 1. Recibimos el string de la fecha/hora desde React (ej. "2026-05-18T10:30:00")
        scheduled_at_str = request.data.get('scheduled_at')
        if not scheduled_at_str:
            return Response(
                {"error": "Debes proporcionar una fecha y hora."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Convertimos el string a un objeto datetime "aware" (con zona horaria)
            scheduled_at = datetime.fromisoformat(scheduled_at_str)
            if timezone.is_naive(scheduled_at):
                scheduled_at = timezone.make_aware(scheduled_at)
        except ValueError:
            return Response(
                {"error": "Formato de fecha inválido. Usa ISO 8601."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. (Opcional pero recomendado) Aquí podrías re-ejecutar una validación rápida 
        # de colisiones por si otro cliente le "ganó" el horario en los últimos 2 minutos.
        
        # 3. Guardamos la cita y actualizamos el Macro-Estatus
        appointment.scheduled_at = scheduled_at
        appointment.status = 'scheduled'
        appointment.save()

        # Actualizamos el trámite al siguiente paso
        application = appointment.application
        application.status = 'appointment_scheduled'
        application.save(update_fields=['status'])

        return Response({
            "message": "Cita agendada correctamente.",
            "data": AppointmentSerializer(appointment).data
        })

class CreateAppointmentInvitationView(APIView):
    """
    POST: Crea o actualiza la configuración inicial de la cita.
    """
    def post(self, request):
        app_id = request.data.get('application')
        
        try:
            application = LoanApplication.objects.get(id=app_id)
        except LoanApplication.DoesNotExist:
            return Response({"error": "Trámite no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        # Usamos el hasattr seguro para recuperar la cita si existe
        appointment = getattr(application, 'appointment', None)
        
        if appointment:
            # --- ACTUALIZAR CITA EXISTENTE ---
            appointment.meeting_type = request.data.get('meeting_type')
            appointment.location = request.data.get('location')
            appointment.duration_minutes = request.data.get('duration_minutes')
        else:
            # --- CREAR NUEVA CITA ---
            appointment = Appointment(
                application=application,
                meeting_type=request.data.get('meeting_type'),
                location=request.data.get('location'),
                duration_minutes=request.data.get('duration_minutes'),
                status='pending_client'
            )

        try:
            appointment.full_clean() 
            appointment.save()
            return Response(
                {"message": "Invitación guardada exitosamente.", "id": appointment.id}, 
                # Retornamos 200 OK si se actualizó, 201 Created si es nueva
                status=status.HTTP_200_OK if appointment.id else status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                e.message_dict if hasattr(e, 'message_dict') else {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class MyAgendaView(APIView):
    """
    GET: Devuelve las citas programadas para el mes y año solicitados, 
    filtradas dinámicamente si es CLIENTE o BROKER.
    """
    def get(self, request):
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        user_id = request.query_params.get('user_id')
        role = request.query_params.get('role')

        if not all([month, year, user_id, role]):
            return Response({"error": "Faltan parámetros de búsqueda."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Buscamos todas las citas agendadas en ese mes/año
            appointments = Appointment.objects.filter(
                status='scheduled',
                scheduled_at__year=year,
                scheduled_at__month=month
            ).select_related('application')

            # 2. Filtramos según el Rol (Microservicios)
            if role == 'BROKER':
                appointments = appointments.filter(application__assigned_broker_id=user_id)
            else:
                # Asumo que tu modelo LoanApplication tiene un campo user_id para el cliente
                appointments = appointments.filter(application__user_id=user_id)

            # 3. Armamos la respuesta para el calendario de React
            data = []
            for appt in appointments:
                data.append({
                    'id': appt.id,
                    'application_id': appt.application.id,
                    'scheduled_at': appt.scheduled_at.isoformat(),
                    'duration_minutes': appt.duration_minutes,
                    'meeting_type': appt.meeting_type,
                    'location': appt.location,
                    'status': appt.status,
                    # Textos genéricos porque estamos en microservicios, 
                    # si necesitas el nombre exacto habría que hacer fetch al Identity Service
                    'client_name': 'Cliente del Trámite', 
                    'broker_name': 'Tu Asesor Asignado' 
                })

            return Response(data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CotizadorView(APIView):
    

    def post(self, request, banco_slug):
        # 1. Extraer datos que vienen del frontend (React)
        datos_usuario = request.data.get('usuario_perfil')
        
        # VALIDACIÓN DEFENSIVA: Evitamos mandar 'None' al microservicio de Inteligencia
        if not datos_usuario:
            return Response(
                {"error": "Falta el objeto 'usuario_perfil' en el cuerpo de la petición."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. Obtener las políticas desde la DB
        productos_db = BankProduct.objects.filter(
            bank__slug=banco_slug,
            bank__is_active=True  # Filtramos por el is_active del modelo Bank
        )
        
        if not productos_db.exists():
            return Response(
                {"error": f"No hay productos activos configurados para '{banco_slug}'."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Extraemos solo el politicas_json de cada objeto para el payload
        politicas_list = [p.politicas_json for p in productos_db]

        # 3. Llamada inter-servicio (Usando el nombre correcto de tu import)
        resultado = IntelligenceClient.obtener_cotizacion(
            banco_slug=banco_slug,
            datos_usuario=datos_usuario,
            productos_json=politicas_list
        )

        # 4. Manejo de la respuesta
        if resultado.get('exito'):
            return Response(resultado, status=status.HTTP_200_OK)
        
        return Response(resultado, status=status.HTTP_400_BAD_REQUEST)