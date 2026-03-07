from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from .tasks import send_activation_email # Importamos la tarea de Celery [cite: 2026-03-02]
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RegistroClienteSerializer(serializers.ModelSerializer):
    # Campos que coinciden con la imagen image_085164.png
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password], # Requisito de seguridad (LFPDPPP)
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        required=True, 
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password']

    def validate(self, data):
        # Validación de coincidencia de contraseñas
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return data

    def create(self, validated_data):
        # Eliminamos confirm_password antes de crear el usuario
        validated_data.pop('confirm_password')
        
        # Concatenamos para el campo full_name que ya tenías o guardamos por separado
        # Si tu modelo tiene full_name:
        full_name = f"{validated_data['first_name']} {validated_data['last_name']}"
        
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            full_name=full_name, # Mantenemos compatibilidad con tu código previo
            password=validated_data['password'],
            role=User.Role.CLIENTE,
            is_active=False # El usuario inicia inactivo (RF2)
        )

        # --- Lógica de Activación vía Celery (RF2) ---
        # Generamos los tokens de activación [cite: 2026-03-02]
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Construimos el link (puedes ajustar el dominio a tu variable de Cloudflare)
        activation_link = f"https://www.2026-a064.lat/activate/{uid}/{token}/"
        
        # Disparamos la tarea asíncrona [cite: 2026-03-02]
        send_activation_email.delay(user.email, activation_link)
        
        return user
    
# 1. Para pedir el correo (Request Reset)
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

# 2. Para el cambio final (Confirm Reset)
class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    re_new_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['re_new_password']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return data
    
class EliminarCuentaSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Definimos explícitamente los campos que esperamos
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        # Mapeamos 'email' a 'username' internamente para que SimpleJWT no se confunda
        attrs['username'] = attrs.get('email')
        return super().validate(attrs)