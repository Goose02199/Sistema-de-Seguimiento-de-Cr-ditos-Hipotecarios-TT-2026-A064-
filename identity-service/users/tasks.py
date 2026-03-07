from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings

@shared_task
def send_activation_email(email, activation_link):
    subject = 'Activa tu cuenta - Sistema Hipotecario ESCOM'
    message = f'Bienvenido. Para activar tu cuenta, haz clic en el siguiente enlace: {activation_link}'
    email_from = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    # Este envío se ejecutará en segundo plano sin bloquear el registro
    send_mail(subject, message, email_from, recipient_list)