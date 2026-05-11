import uuid
import os
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Programada'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('rescheduled', 'Reagendada'),
    ]

    # Relación principal: A qué trámite pertenece esta cita
    application = models.ForeignKey(
        'LoanApplication', 
        on_delete=models.CASCADE, 
        related_name='appointments'
    )
    
    # Fecha y hora exacta de la cita
    scheduled_at = models.DateTimeField()
    
    # Estado actual de la reunión
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='scheduled'
    )

    # Ubicación (Puede ser una sucursal física o un enlace de Google Meet/Zoom)
    location = models.CharField(max_length=255)
    
    # Notas adicionales (ej. "Traer identificación original" o comentarios del cliente)
    notes = models.TextField(blank=True, null=True)

    # Auditoría de creación
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['scheduled_at']
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'

    def __str__(self):
        return f"Cita para {self.application.id} el {self.scheduled_at.strftime('%Y-%m-%d %H:%M')}"

def get_upload_path(instance, filename):
    """
    Ofuscación de ruta con UUID.
    Ruta: private_documents/app_<id>/<doc_type>_<uuid>.<ext>
    """
    ext = filename.split('.')[-1].lower()
    # Generamos un UUID nuevo para el nombre del archivo
    safe_filename = f"{instance.document_type}_{uuid.uuid4().hex}.{ext}"
    # NOTA: Sugiero cambiar la carpeta a algo que denote que es privado
    return os.path.join(f'private_documents/app_{instance.application.id}', safe_filename)

class CustomerDocument(models.Model):
    DOCUMENT_TYPES = [
        ('identificacion', 'Identificación Oficial'),
        ('domicilio', 'Comprobante de Domicilio'),
        ('ingresos', 'Comprobante de Ingresos'),
        ('fiscal', 'Constancia de Situación Fiscal'),
        ('buro', 'Reporte de Buró de Crédito'),
    ]

    STATUS_CHOICES = [
        ('requested', 'Requerido'),    # <--- NUEVO: El broker lo pide, pero aún no hay archivo
        ('under_review', 'En Revisión'), # <--- El cliente lo subió, falta que el broker lo vea
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    application = models.ForeignKey(
        'LoanApplication', 
        on_delete=models.CASCADE, 
        related_name='documents'
    )
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    
    # MODIFICACIÓN: Permitimos null y blank para poder crear el "placeholder"
    file = models.FileField(
        upload_to=get_upload_path,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        null=True, 
        blank=True
    )
    
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='requested')
    feedback = models.TextField(blank=True, null=True, help_text="Razón del rechazo")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Documento del Cliente"
        verbose_name_plural = "Documentos del Cliente"
        # Regla de negocio: No pedir el mismo documento dos veces para el mismo trámite
        unique_together = ('application', 'document_type') 

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.application.id} ({self.status})"

class LoanApplication(models.Model):
    # --- IDENTIFICACIÓN Y CONTACTO (Sección 1) ---
    user_id = models.IntegerField(db_index=True)
    assigned_broker_id = models.IntegerField('ID del Bróker asignado', null=True, blank=True, db_index=True)
    first_name = models.CharField(max_length=75, null=True, blank=True)
    last_name = models.CharField(max_length=75, null=True, blank=True)   
    full_name = models.CharField(max_length=255, null=True, blank=True) 
    birth_date = models.DateField(null=True, blank=True) 
    rfc_curp = models.CharField(max_length=20, null=True, blank=True) 
    phone = models.CharField(max_length=20, null=True, blank=True) 
    email = models.EmailField(null=True, blank=True, db_index=True) 
    address = models.TextField(null=True, blank=True) 
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True) 
    municipality = models.CharField('Municipio', max_length=50, blank=True) 
    
    # --- SITUACIÓN LABORAL (Sección 2) ---
    EMPLOYMENT_CHOICES = [
        ('nomina', 'Nómina'), ('independiente', 'Independiente'),
        ('publico', 'Público'), ('privado', 'Privado'), ('otro', 'Otro'),
    ]
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES, null=True, blank=True)
    job_seniority_years = models.IntegerField(default=0) 
    job_seniority_months = models.IntegerField(default=0)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    job_title = models.CharField(max_length=255, null=True, blank=True) 
    payroll_at_bank = models.BooleanField(default=False) 

    # --- MODELO DE RIESGO: Inputs Financieros (Sección 3) ---
    loan_amnt = models.DecimalField(max_digits=12, decimal_places=2)
    annual_inc = models.DecimalField(max_digits=12, decimal_places=2) 
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    installment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # --- DETALLES DEL CRÉDITO Y PROPIEDAD (Sección 4) ---
    property_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True) 
    down_payment_pct = models.FloatField(default=10.0) 
    loan_term = models.IntegerField(null=True, blank=True) 
    property_location = models.CharField(max_length=255, null=True, blank=True) 
    
    FINANCING_CHOICES = [
        ('infonavit', 'INFONAVIT'), ('fovissste', 'FOVISSSTE'), ('bancario', 'Bancario'),
    ]
    financing_type = models.CharField(max_length=20, choices=FINANCING_CHOICES, default='bancario')
    institute_credit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    housing_subaccount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # --- MODELO DE RIESGO: Historial y Balance (Sección 5) ---
    dti = models.FloatField(default=0.0) 
    delinq_2yrs = models.IntegerField(default=0)
    inq_last_6mths = models.IntegerField(default=0) 
    open_acc = models.IntegerField(default=0) 
    pub_rec = models.IntegerField(default=0)
    revol_bal = models.DecimalField(max_digits=12, decimal_places=2, default=0) 
    revol_util = models.FloatField(default=0.0)
    total_acc = models.IntegerField(default=0) 
    earliest_cr_line_year = models.IntegerField(default=2000)
    
    # Balance y Cobranza Técnica
    tot_cur_bal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tot_coll_amt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_rev_hi_lim = models.DecimalField(max_digits=15, decimal_places=2, default=0) 
    collections_12_mths_ex_med = models.IntegerField(default=0)

    # Situaciones Especiales (Quitas)
    has_settlements = models.BooleanField(default=False) # 
    settlement_count = models.IntegerField(default=0)
    settlement_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0) 
    collection_recovery_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0) 

    # --- MODELO DE RIESGO: Categorías ---
    HOME_OWNERSHIP_CHOICES = [
        ('RENT', 'Renta'), ('OWN', 'Propia'), ('MORTGAGE', 'Hipotecada'),
        ('OTHER', 'Otro'), ('ANY', 'Cualquiera'), ('NONE', 'Ninguno'),
    ]
    VERIFICATION_CHOICES = [
        ('not_verified', 'No Verificado'), ('source_verified', 'Fuente Verificada'), ('verified', 'Verificado'),
    ]
    home_ownership = models.CharField(max_length=20, choices=HOME_OWNERSHIP_CHOICES, default='RENT')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='not_verified') # [cite: 59]

    # --- MODELO DE RIESGO: Resultados (Persistencia) ---
    risk_score = models.IntegerField(null=True, blank=True)
    risk_label = models.CharField(max_length=50, null=True, blank=True)
    prob_low = models.FloatField(null=True, blank=True)
    prob_medium = models.FloatField(null=True, blank=True)
    prob_high = models.FloatField(null=True, blank=True)

    # Resultados de Recomendación (ExtraTrees)
    recommendations_data = models.JSONField(null=True, blank=True)

    # Metadatos del sistema
    STATUS_CHOICES = [
        # --- ETAPA 1: Formulario e IA ---
        ('draft', 'Llenando Formulario'),
        ('sent_awaiting_ia', 'Enviado (Espera de IA)'),
        
        # --- ETAPA 2: Asignación ---
        ('assigning_broker', 'Asignando Bróker'),
        ('broker_assigned', 'Bróker Asignado'),
        
        # --- ETAPA 3: Cotización (La oferta financiera) ---
        ('reviewing_quote', 'Revisando Cotización (Bróker)'),
        ('quote_approved', 'Cotización Aprobada'),
        ('quote_rejected_broker', 'Rechazada por Bróker'),
        ('waiting_client_approval', 'En espera de aceptación del cliente'),
        ('quote_rejected_client', 'Cotización rechazada por cliente'),

        # --- ETAPA 4: Documentación (KYC) ---
        ('waiting_docs', 'En espera de documentos'),
        ('docs_review', 'Revisando documentos'),
        ('docs_approved', 'Documentos aprobados'),

        # --- ETAPA 5: Cierre ---
        ('waiting_appointment', 'En espera de agendamiento'),
        ('appointment_scheduled', 'Cita agendada'),
        ('finished', 'Proceso finalizado'),

        # errores
        ('invalid_data', ''),
        ('error_intelligence', ''),
    ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    declined_by = ArrayField(
        models.IntegerField(), 
        default=list, 
        blank=True,
        help_text="Lista de IDs de brókers que rechazaron la solicitud"
    )
    
    def check_and_update_document_status(self):
        """
        Evalúa el estado de todos los documentos y actualiza el Macro-Estatus 
        del trámite de forma automática.
        """
        # Obtenemos todos los documentos asociados a este trámite
        docs = self.documents.all()
        
        # Si aún no hay documentos creados, no hacemos nada
        if not docs.exists():
            return

        # Obtenemos un "set" (conjunto único) de todos los estatus actuales
        # Ej: {'approved', 'under_review'} o {'requested'}
        statuses = set(docs.values_list('status', flat=True))

        # REGLA 1: Si hay aunque sea UN documento que el cliente deba subir o corregir
        if 'requested' in statuses or 'rejected' in statuses:
            new_macro_status = 'waiting_docs'

        # REGLA 2: Si el cliente ya subió todo, y hay al menos uno esperando revisión del bróker
        elif 'under_review' in statuses:
            new_macro_status = 'docs_review'

        # REGLA 3: Si el único estatus que existe en la lista es 'approved' (Todos aprobados)
        elif statuses == {'approved'}:
            new_macro_status = 'docs_approved'
            
        else:
            return  # Falla de seguridad por si hay un estado no contemplado

        # Solo hacemos hit a la base de datos si el estatus realmente cambió
        if self.status != new_macro_status:
            self.status = new_macro_status
            # Usamos update_fields para mayor rendimiento, solo guardamos ese campo
            self.save(update_fields=['status'])

    def __str__(self):
        return f"Solicitud {self.id} - Usuario {self.user_id}"

class Bank(models.Model):
    name = models.CharField(max_length=100, unique=True) # Ej. "Banorte"
    slug = models.SlugField(max_length=100, unique=True) # Ej. "banorte"
    logo_url = models.URLField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class BankProduct(models.Model):
    # Relación con el Banco (bank_id)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='products')
    
    # Columnas físicas que SÍ existen en tu backup
    name = models.CharField(max_length=150)
    product_key = models.CharField(max_length=50, unique=True)
    politicas_json = models.JSONField(help_text="Contiene toda la lógica: tasas, aforo, seguros, etc.")

    # --- Propiedades Dinámicas ---
    # Esto permite que hagas 'product.max_ltv' aunque no sea una columna en la DB
    @property
    def max_ltv(self):
        return self.politicas_json.get('politicas', {}).get('aforo_max', 0.90)

    @property
    def product_type(self):
        return self.politicas_json.get('politicas', {}).get('tipo', 'tradicional')

    @property
    def opening_commission(self):
        return self.politicas_json.get('politicas', {}).get('comision_apertura_pct', 0.01)

    def __str__(self):
        return f"{self.bank.name} - {self.name}"
    