import requests
from django.conf import settings
import logging
from .models import AuditLog

# Configuramos un logger para ver qué pasa en los logs de Docker
logger = logging.getLogger(__name__)

def verify_recaptcha(token):
    """
    Se comunica con la API de Google para validar el token del frontend.
    """
    if not token:
        return False

    secret_key = settings.RECAPTCHA_SECRET_KEY
    print(f"DEBUG: Usando Secret Key: {secret_key[:5]}...")
    if not secret_key:
        logger.error("RECAPTCHA_SECRET_KEY no está configurada en settings.")
        return False

    data = {
        'secret': secret_key,
        'response': token
    }

    try:
        # Llamada Server-to-Server 
        response = requests.post(
            'https://www.google.com/recaptcha/api/siteverify', 
            data=data,
            timeout=5 # No queremos que nuestra API se cuelgue si Google tarda
        )
        result = response.json()
        
        # Google devuelve un booleano en la llave 'success'
        return result.get('success', False)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error conectando con la API de reCAPTCHA: {e}")
        # En caso de error de red, por seguridad fallamos (fail-closed)
        return False
    
def log_audit_event(request, action, user=None, details=None):
    """
    Registra un evento de auditoría capturando IP y User-Agent automáticamente.
    """
    # Intentamos obtener la IP real si estás detrás de un proxy (como Nginx en Docker)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')

    AuditLog.objects.create(
        user=user or (request.user if request.user.is_authenticated else None),
        action=action,
        ip_address=ip,
        user_agent=request.META.get('HTTP_USER_AGENT'),
        details=details or {}
    )