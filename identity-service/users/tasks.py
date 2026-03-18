# users/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_activation_email(email, uid, token):
    # Construimos el enlace apuntando a tu Frontend (donde está el componente React)
    # Asegúrate de tener FRONTEND_URL en tu settings.py o cámbialo por tu dominio [cite: 2026-03-05]
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.2026-a064.lat')
    activation_link = f"{frontend_url}/activate/{uid}/{token}/"
    
    subject = 'Activa tu cuenta - Sistema Hipotecario ESCOM'
    message = f'Bienvenido. Para activar tu cuenta, haz clic en el siguiente enlace: {activation_link}'
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    send_mail(subject, message, email_from, recipient_list)

@shared_task
def send_duplicate_registration_notification(email):
    """
    Envía un correo informando que se intentó registrar una cuenta 
    con un email que ya existe en el sistema.
    """
    subject = 'Intento de registro detectado - Sistema Hipotecario ESCOM'
    
    # Texto alineado con la LFPDPPP y seguridad [cite: 2026-03-02]
    message = (
        "Hola,\n\n"
        "Detectamos un intento de registro en nuestro sistema con este correo electrónico.\n\n"
        "Si fuiste tú: Ya tienes una cuenta activa. No es necesario registrarse de nuevo. "
        "Si no recuerdas tu contraseña, puedes recuperarla en la sección '¿Olvidaste tu contraseña?' del inicio de sesión.\n\n"
        "Si NO fuiste tú: No te preocupes. Tus datos están protegidos y no se ha realizado ningún cambio en tu cuenta "
        "ni se ha creado un registro duplicado. No es necesario que realices ninguna acción adicional.\n\n"
        "Atentamente,\nEquipo de Seguridad - Sistema Hipotecario."
    )
    
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    send_mail(subject, message, email_from, recipient_list)

@shared_task
def send_password_reset_email(email, uid, token):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.2026-a064.lat')
    # Ruta específica para resetear contraseña
    reset_link = f"{frontend_url}/password-reset-confirm/{uid}/{token}/"
    
    subject = 'Recupera tu contraseña - Sistema Hipotecario'
    message = (
        f"Hola,\n\n"
        f"Recibimos una solicitud para restablecer tu contraseña. "
        f"Haz clic en el siguiente enlace para crear una nueva: {reset_link}\n\n"
        f"Este enlace expirará pronto por seguridad. Si no solicitaste esto, ignora este correo."
    )
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    send_mail(subject, message, email_from, recipient_list)