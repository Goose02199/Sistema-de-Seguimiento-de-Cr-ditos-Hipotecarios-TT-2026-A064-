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
        validated_data.pop('confirm_password')
        full_name = f"{validated_data['first_name']} {validated_data['last_name']}"
        
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            full_name=full_name,
            password=validated_data['password'],
            role=User.Role.CLIENTE, 
            is_active=False 
        )

        # --- Lógica de Activación Actualizada ---
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        # Ahora enviamos los 3 argumentos que espera la nueva tarea [cite: 2026-03-05]
        send_activation_email.delay(user.email, uid, token)
        
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Definimos explícitamente los campos que esperamos
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        # Mapeamos 'email' a 'username' internamente para que SimpleJWT no se confunda
        attrs['username'] = attrs.get('email')
        return super().validate(attrs)
    
    @classmethod
    def get_token(cls, user):
        # Llamamos al método original para obtener el token base
        token = super().get_token(user)

        # INYECCIÓN DE DATOS (Payload del JWT) [cite: 2026-03-02]
        # Usamos los campos que confirmamos en tu models.py
        token['role'] = user.role
        token['full_name'] = user.full_name
        
        return token
    
class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, 
        validators=[validate_password] # Sincronización con requisitos de Django [cite: 2026-03-05]
    )
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Las nuevas contraseñas no coinciden."})
        return data

class ResendActivationSerializer(serializers.Serializer):
    email = serializers.EmailField()