from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegistroClienteView, 
    ActivacionCuentaView, 
    PasswordResetRequestView, 
    UserProfileView,
    PasswordResetConfirmView, 
    EliminarCuentaView,
    MyTokenObtainPairView
)

urlpatterns = [
    # RF1: Registro con nombres separados
    path('register/', RegistroClienteView.as_view(), name='register'),
    
    # RF2: Activación (Endpoint de la API) [cite: 2026-03-02]
    path('activate/<uidb64>/<token>/', ActivacionCuentaView.as_view(), name='activate'),
    
    # RF4: Login para obtener JWT
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # RF6: Recuperación de Contraseña [cite: 2026-03-02]
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    # Falta el endpoint que recibe el nuevo password:
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # RF61: Eliminación de Cuenta (Derechos ARCO/LFPDPPP)
    path('delete-account/', EliminarCuentaView.as_view(), name='eliminar-cuenta'),

    path('me/', UserProfileView.as_view(), name='user-profile')
]