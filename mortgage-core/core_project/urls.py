from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Aquí irán los endpoints de simulación más adelante
    path('api/mortgage/', include('mortgage_app.urls')),
]