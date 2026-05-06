from django.contrib import admin
from .models import LoanApplication, CustomerDocument

class CustomerDocumentInline(admin.TabularInline):
    model = CustomerDocument
    extra = 0
    readonly_fields = ('uploaded_at',) # Para que el admin no los altere por error

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    # Columnas en la tabla principal
    list_display = ('id', 'full_name', 'status', 'risk_score', 'risk_label', 'created_at')
    
    # Filtros laterales para búsqueda rápida
    list_filter = ('status', 'risk_label', 'financing_type')
    
    # Buscador por nombre o RFC
    search_fields = ('full_name', 'rfc_curp', 'email')
    
    # Agrupación de la información financiera
    fieldsets = (
        ('Información General', {
            'fields': ('user_id', 'full_name', 'status', 'assigned_broker')
        }),
        ('Análisis de Riesgo (IA)', {
            'fields': ('risk_score', 'risk_label', 'prob_low', 'prob_medium', 'prob_high', 'recommendations_data')
        }),
        ('Datos Financieros', {
            'fields': ('loan_amnt', 'annual_inc', 'property_value', 'loan_term')
        }),
    )
    
    inlines = [CustomerDocumentInline]

@admin.register(CustomerDocument)
class CustomerDocumentAdmin(admin.ModelAdmin):
    list_display = ('document_type', 'application', 'status', 'uploaded_at')
    list_filter = ('status', 'document_type')