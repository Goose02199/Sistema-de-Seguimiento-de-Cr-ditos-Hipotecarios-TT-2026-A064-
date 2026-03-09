from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegistroClienteView, 
    ActivacionCuentaView, 
    UserProfileView,
    MyTokenObtainPairView,
    PasswordChangeView,
)

urlpatterns = [
    # RF1: Registro con nombres separados
    path('register/', RegistroClienteView.as_view(), name='register'),
    
    # RF2: Activación (Endpoint de la API) [cite: 2026-03-02]
    path('activate/<uidb64>/<token>/', ActivacionCuentaView.as_view(), name='activate'),
    
    # RF4: Login para obtener JWT
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),

    path('me/', UserProfileView.as_view(), name='user-profile')
]