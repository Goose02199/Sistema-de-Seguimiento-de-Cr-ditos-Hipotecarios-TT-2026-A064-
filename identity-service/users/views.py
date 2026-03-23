from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth.tokens import default_token_generator
from .models import User, AuditLog
from .serializers import (
    RegistroClienteSerializer, 
    MyTokenObtainPairSerializer,
    PasswordChangeSerializer,
    ResendActivationSerializer,
    UserProfileSerializer,
)
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from rest_framework_simplejwt.views import TokenObtainPairView
from .tasks import send_activation_email, send_duplicate_registration_notification, send_password_reset_email
from django.contrib.auth import get_user_model
from .utils import verify_recaptcha
from django.core.cache import cache # Django usa Redis a través de esto
import logging
from .utils import log_audit_event
from django.utils import timezone

User = get_user_model()

# Umbral de intentos antes de pedir captcha
logger = logging.getLogger(__name__)
MAX_ATTEMPTS = 3

# Vista de Activación (RF2)
@extend_schema(auth=[], description="Confirma el token enviado por correo para activar la cuenta.")
class ActivacionCuentaView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            # Decodificamos el ID del usuario conforme a los estándares de Django
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            # LFPDPPP: Al activar, el usuario confirma su voluntad de uso del sistema
            user.is_active = True
            user.save()

            log_audit_event(
                request, 
                AuditLog.ActionType.ACCOUNT_ACTIVATION, 
                user=user,
                details={"method": "email_token"}
            )

            return Response({"message": "Cuenta activada exitosamente. Ya puede iniciar sesión."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "El enlace de activación es inválido o ha expirado."}, status=status.HTTP_400_BAD_REQUEST)

# Vista de Registro (RF1)
@extend_schema(
    auth=[],
    request=RegistroClienteSerializer,
    responses={201: RegistroClienteSerializer},
    description="Endpoint para el registro de nuevos clientes. Dispara correo de activación vía Celery."
) 
class RegistroClienteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        # 1. Extraemos el token que viene del "Spread Operator" del frontend [cite: 2026-03-05]
        captcha_token = request.data.get('captcha_token')
        
        # 2. Validación de reCAPTCHA (Capa de Integridad)
        if not verify_recaptcha(captcha_token):
            return Response(
                {"error": "La verificación de seguridad falló. Por favor, intenta de nuevo."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data.get('email', '').lower()
        
        # 1. Verificamos si el usuario ya existe (Activo o Inactivo) [cite: 2026-03-02]
        user_exists = User.objects.filter(email=email).first()
        
        if user_exists:
            if user_exists.is_active:
                # Caso A: Ya es usuario activo -> Notificación de seguridad
                send_duplicate_registration_notification.delay(email)
            else:
                # Caso B: Existe pero no está activo -> Reenviamos enlace de activación [cite: 2026-03-05]
                from django.utils.http import urlsafe_base64_encode
                from django.utils.encoding import force_bytes
                from django.contrib.auth.tokens import default_token_generator
                
                uid = urlsafe_base64_encode(force_bytes(user_exists.pk))
                token = default_token_generator.make_token(user_exists)
                send_activation_email.delay(email, uid, token)

            # Respuesta idéntica a un registro nuevo para evitar "Email Enumeration" [cite: 2026-03-02]
            return Response({
                "message": "Usuario registrado exitosamente. Por favor, revise su correo electrónico para activar su cuenta."
            }, status=status.HTTP_201_CREATED)

        # 2. Si no existe, procedemos con el registro normal
        serializer = RegistroClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save() # El serializer ya dispara send_activation_email [cite: 2026-03-05]
            return Response({
                "message": "Usuario registrado exitosamente. Por favor, revise su correo electrónico para activar su cuenta."
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    # Este es el "guardia" que verifica el JWT [cite: 2026-03-02]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: dict},
        description="Obtiene los datos del perfil del usuario autenticado (Derechos de Acceso LFPDPPP)."
    )
    def get(self, request):
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data)
    
    @extend_schema(request=UserProfileSerializer, responses={200: UserProfileSerializer})
    def patch(self, request):
        # Abstracción de escritura y validación
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid(raise_exception=True): # El guardia de seguridad actúa aquí
            serializer.save()
            log_audit_event(request, AuditLog.ActionType.PROFILE_UPDATE)
            return Response(serializer.data)

        
        return Response({"message": "Perfil actualizado exitosamente."}, status=status.HTTP_200_OK)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').lower()
        captcha_token = request.data.get('captcha_token')
        
        # 1. Consultar intentos fallidos en Redis
        attempts = cache.get(f"login_attempts:{email}", 0)
        
        # 2. Bloqueo preventivo: Si superó el umbral, exigir captcha [cite: 2026-03-16]
        if attempts >= MAX_ATTEMPTS:
            if not captcha_token or not verify_recaptcha(captcha_token):
                return Response({
                    "error": "Demasiados intentos. Por favor, resuelve el captcha.",
                    "show_captcha": True
                }, status=status.HTTP_403_FORBIDDEN)

        # 3. Llamar a la lógica original de SimpleJWT
        try:
            response = super().post(request, *args, **kwargs)
            user = User.objects.filter(email=email).first()
            log_audit_event(request, AuditLog.ActionType.LOGIN_SUCCESS, user=user)
            # ÉXITO: Si llegamos aquí, las credenciales fueron correctas [cite: 2026-03-02]
            cache.delete(f"login_attempts:{email}")
            return response

        except Exception as e:
            # FALLO: Registramos quién intentó entrar
            user = User.objects.filter(email=email).first()
            log_audit_event(request, AuditLog.ActionType.LOGIN_FAILED, user=user)

            # FALLO: SimpleJWT lanza excepciones si las credenciales fallan
            new_attempts = attempts + 1
            cache.set(f"login_attempts:{email}", new_attempts, timeout=600) # Expira en 10 min
            
            # Personalizamos la respuesta de error para el frontend adaptativo
            return Response({
                "error": "Credenciales incorrectas o cuenta no activada.",
                "show_captcha": new_attempts >= MAX_ATTEMPTS
            }, status=status.HTTP_401_UNAUTHORIZED)

class ResendActivationView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ResendActivationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                if not user.is_active:
                    # Generamos nuevos tokens [cite: 2026-03-03]
                    uid = urlsafe_base64_encode(force_bytes(user.pk))
                    token = default_token_generator.make_token(user)
                    
                    # Disparamos Celery [cite: 2026-03-05]
                    send_activation_email.delay(user.email, uid, token)
            except User.DoesNotExist:
                pass # No revelamos que el usuario no existe [cite: 2026-03-02]

            return Response(
                {"message": "Si la cuenta existe y no está activa, se ha enviado un nuevo enlace."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordChangeView(APIView):
    # Solo usuarios con JWT válido pueden acceder (Confidencialidad) [cite: 2026-03-02]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Verificamos la identidad con la contraseña anterior [cite: 2026-03-05]
            if not user.check_password(serializer.validated_data.get('old_password')):
                return Response(
                    {"old_password": ["La contraseña actual no es correcta."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Cambiamos y guardamos (set_password se encarga del hashing) [cite: 2026-03-02]
            user.set_password(serializer.validated_data.get('new_password'))
            user.save()
            log_audit_event(request, AuditLog.ActionType.PASSWORD_CHANGE, user=request.user)
            
            return Response(
                {"message": "Contraseña actualizada exitosamente."}, 
                status=status.HTTP_200_OK
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class PasswordResetRequestView(APIView):
    authentication_classes = [] 
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower()
        captcha_token = request.data.get('captcha_token')

        # 1. Validación de reCAPTCHA (Capa 1 de seguridad)
        if not verify_recaptcha(captcha_token):
            return Response({"error": "Validación de seguridad fallida."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Control de Frecuencia (Rate Limiting con Redis) [cite: 2026-03-16]
        cooldown_key = f"password_reset_cooldown:{email}"
        if cache.get(cooldown_key):
            return Response({
                "error": "Por favor, espera un minuto antes de solicitar otro enlace."
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # 3. Lógica de negocio
        user = User.objects.filter(email=email).first()
        if user and user.is_active:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            send_password_reset_email.delay(email, uid, token)
            
            # 4. Establecer el candado en Redis por 60 segundos
            cache.set(cooldown_key, True, timeout=60)

        # Mantenemos la respuesta genérica por privacidad (LFPDPPP)
        return Response({
            "message": "Si el correo está registrado, recibirás un enlace en breve."
        }, status=status.HTTP_200_OK)
    
class PasswordResetConfirmView(APIView):
    authentication_classes = [] # <-- Vital para que funcione desde el link del correo
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            # Decodificamos el ID del usuario
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        # Validamos el token contra el usuario [cite: 2026-03-02]
        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Contraseña restablecida correctamente."}, status=status.HTTP_200_OK)
        
        return Response({"error": "El enlace es inválido o ha expirado."}, status=status.HTTP_400_BAD_REQUEST)
    
class DeactivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get('password')

        if not password or not user.check_password(password):
            return Response({
                "error": "La contraseña proporcionada es incorrecta."
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Guardamos el email original para el log
        original_email = user.email
        now = timezone.now()

        # 2. Renombramos el email para liberar el original
        # Esto permite que se cree una nueva cuenta con el mismo correo
        user.email = f"{original_email}_deleted_{int(now.timestamp())}"
        user.is_active = False
        user.deleted_at = now
        user.status = 'Eliminado'
        user.save()

        # 3. Auditoría completa
        log_audit_event(
            request, 
            AuditLog.ActionType.ACCOUNT_SUSPENSION, 
            user=user,
            details={"original_email": original_email}
        )

        return Response({"message": "Cuenta desactivada correctamente."}, status=status.HTTP_200_OK)