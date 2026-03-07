import os
from celery import Celery

# Establece el módulo de configuración de Django predeterminado
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('identity_service')

# Usar una cadena aquí significa que el trabajador no tiene que serializar
# el objeto de configuración a trabajadores hijos.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carga las tareas de todas las aplicaciones registradas
app.autodiscover_tasks()