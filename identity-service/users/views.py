from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth.tokens import default_token_generator
from .models import User
from .serializers import (
    RegistroClienteSerializer, 
    EliminarCuentaSerializer, 
    PasswordResetConfirmSerializer, 
    PasswordResetRequestSerializer,
    MyTokenObtainPairSerializer
)
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from rest_framework_simplejwt.views import TokenObtainPairView

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
        serializer = RegistroClienteSerializer(data=request.data)
        if serializer.is_valid():
            # El serializer.save() ahora crea al usuario e invoca a Celery automáticamente [cite: 2026-03-02]
            serializer.save()
            
            return Response({
                "message": "Usuario registrado exitosamente. Por favor, revise su correo electrónico para activar su cuenta."
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Vista de Eliminación de Cuenta (RF61)
@extend_schema(
    request=EliminarCuentaSerializer,
    responses={204: None, 400: EliminarCuentaSerializer},
    description="Eliminación definitiva de cuenta y datos personales (Derecho de Cancelación LFPDPPP)."
)
class EliminarCuentaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = EliminarCuentaSerializer(data=request.data)
        if serializer.is_valid():
            # Validación de seguridad: requerimos contraseña para borrar datos
            if request.user.check_password(serializer.validated_data['password']):
                user_email = request.user.email
                request.user.delete()
                # Se podría disparar una tarea de Celery para enviar confirmación de baja
                return Response(
                    {"message": f"La cuenta asociada a {user_email} ha sido eliminada permanentemente conforme a la LFPDPPP."},
                    status=status.HTTP_200_OK # Cambiado a 200 para poder enviar el mensaje JSON
                )
            return Response({"error": "Contraseña incorrecta"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@extend_schema(
    auth=[],
    request=PasswordResetRequestSerializer,
    responses={200: OpenApiTypes.OBJECT},
    description="Inicia el proceso de recuperación de contraseña (RF6) enviando un link vía Celery."
)
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                # Generamos tokens de recuperación
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                
                # Link que apunta a tu frontend de React [cite: 2026-03-03]
                reset_url = f"https://www.2026-a064.lat/reset-password/{uid}/{token}/"
                
                # Aquí podrías crear otra tarea en tasks.py para correos de recuperación
                # send_recovery_email.delay(user.email, reset_url)
                
                return Response({
                    "message": "Si el correo está registrado, recibirá un enlace de recuperación."
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Por seguridad (LFPDPPP), no confirmamos si el correo existe o no
                return Response({
                    "message": "Si el correo está registrado, recibirá un enlace de recuperación."
                }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@extend_schema(
    auth=[],
    request=PasswordResetConfirmSerializer,
    responses={200: OpenApiTypes.OBJECT},
    description="Finaliza el proceso de recuperación (RF6). Valida el token y establece la nueva contraseña."
)
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        # Usamos el serializer que ya definiste con validate_password
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Decodificamos el ID del usuario [cite: 2026-03-05]
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            # Verificamos la integridad del token (LFPDPPP)
            if user is not None and default_token_generator.check_token(user, token):
                # Aplicamos la nueva contraseña de forma segura (Hashed)
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response(
                    {"message": "Su contraseña ha sido restablecida exitosamente. Ya puede iniciar sesión."}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": "El enlace de recuperación es inválido o ha expirado por seguridad."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileView(APIView):
    # Este es el "guardia" que verifica el JWT [cite: 2026-03-02]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: dict},
        description="Obtiene los datos del perfil del usuario autenticado (Derechos de Acceso LFPDPPP)."
    )
    def get(self, request):
        user = request.user
        # Retornamos los datos que definimos en el modelo personalizado
        return Response({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "date_joined": user.date_joined
        }, status=status.HTTP_200_OK)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer