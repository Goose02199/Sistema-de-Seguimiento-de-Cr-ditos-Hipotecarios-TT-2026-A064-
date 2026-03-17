import requests
from django.conf import settings
import logging

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