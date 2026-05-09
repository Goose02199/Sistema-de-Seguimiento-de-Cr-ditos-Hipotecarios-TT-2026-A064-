from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, BrokerServiceArea
from .forms import CustomUserCreationForm, CustomUserChangeForm # Importa los formularios de arriba

class BrokerServiceAreaInline(admin.TabularInline):
    model = BrokerServiceArea
    extra = 1

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    
    # --- ESTA ES LA LÍNEA QUE FALTA ---
    inlines = [BrokerServiceAreaInline] 
    # ----------------------------------

    list_display = ('email', 'full_name', 'role', 'status', 'is_staff')
    list_filter = ('role', 'status', 'is_staff')
    ordering = ('email',)

    # Secciones del formulario de edición
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('full_name', 'phone', 'birth_date', 'curp_rfc')}),
        ('Ubicación y Vivienda', {'fields': ('address', 'postal_code', 'state', 'municipality', 'housing_status')}),
        ('Datos de Bróker', {'fields': ('location', 'admin_creator', 'max_load', 'current_load', 'is_active_for_assignments')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups')}),
    )

    # Campos para el formulario de CREACIÓN (Eliminamos el Inline de aquí)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password'),
        }),
    )

    # ESTO ES LO MÁS IMPORTANTE:
    # Oculta las Áreas de Servicio al crear, solo las muestra al editar
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)

    # Aseguramos que no pida el campo username en ninguna parte
    filter_horizontal = ()