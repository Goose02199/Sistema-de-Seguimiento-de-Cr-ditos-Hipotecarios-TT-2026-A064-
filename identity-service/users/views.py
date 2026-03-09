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
    MyTokenObtainPairSerializer,
    PasswordChangeSerializer
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
            
            return Response(
                {"message": "Contraseña actualizada exitosamente."}, 
                status=status.HTTP_200_OK
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)