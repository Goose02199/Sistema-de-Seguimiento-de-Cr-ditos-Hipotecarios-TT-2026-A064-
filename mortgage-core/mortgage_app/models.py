from django.db import models
from django.conf import settings

class LoanApplication(models.Model):
    # --- IDENTIFICACIÓN Y CONTACTO (Sección 1) ---
    user_id = models.IntegerField() 
    full_name = models.CharField(max_length=255, null=True, blank=True) 
    birth_date = models.DateField(null=True, blank=True) 
    rfc_curp = models.CharField(max_length=20, null=True, blank=True) 
    phone = models.CharField(max_length=20, null=True, blank=True) 
    email = models.EmailField(null=True, blank=True) 
    address = models.TextField(null=True, blank=True) 
    postal_code = models.CharField(max_length=10, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True) 
    
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
    status = models.CharField(max_length=20, default='pending') 
    created_at = models.DateTimeField(auto_now_add=True)

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
    PRODUCT_TYPES = [
        ('tradicional', 'Tradicional'),
        ('apoyo', 'Apoyo INFONAVIT'),
        ('cofinavit', 'Cofinavit'),
        ('fpt', 'FPT (FOVISSSTE-Banorte)')
    ]

    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=150) # Ej. "Hipoteca Fuerte Tradicional"
    product_key = models.CharField(max_length=50) # Ej. "tradicional"
    type = models.CharField(max_length=20, choices=PRODUCT_TYPES)
    
    # Políticas de Riesgo y Aforo
    max_ltv = models.DecimalField(max_digits=5, decimal_places=4) # aforo_max (Ej. 0.9000)
    income_payment_ratio = models.FloatField(default=2.0) # relacion_ir (Ej. 2.0)
    
    # Comisiones y Gastos
    opening_commission_pct = models.DecimalField(max_digits=5, decimal_places=4) # 0.01
    is_commission_financed = models.BooleanField(default=True)
    appraisal_pct_mil = models.DecimalField(max_digits=5, decimal_places=4, default=0.0025)
    appraisal_fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notary_fees_pct = models.DecimalField(max_digits=5, decimal_places=4, default=0.0820)
    admin_fee_monthly = models.DecimalField(max_digits=10, decimal_places=2)

    # Configuración de Seguros (Guardado como JSON para flexibilidad entre bancos)
    insurance_config = models.JSONField(help_text="Estructura de seguros de vida y daños")

    def __str__(self):
        return f"{self.bank.name} - {self.name}"
    
class ProductRate(models.Model):
    product = models.ForeignKey(BankProduct, on_delete=models.CASCADE, related_name='rates')
    name = models.CharField(max_length=50) # Ej. "Premium"
    annual_rate = models.DecimalField(max_digits=6, decimal_places=5)

    def __str__(self):
        return f"{self.product.name} - {self.name} ({self.annual_rate})"