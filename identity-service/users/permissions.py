from rest_framework import permissions
from django.conf import settings
import os

class IsInternalService(permissions.BasePermission):
    def has_permission(self, request, view):
        # Compara un header personalizado con un secreto en tu .env
        api_key = request.headers.get('X-Internal-Service-Key')
        return api_key == os.getenv('INTERNAL_SERVICE_KEY')