from django.db import models
from django.conf import settings

class LoanApplication(models.Model):
    # Relación con el usuario (ID proveniente de identity-service)
    user_id = models.IntegerField() 
    
    # Opciones para campos categóricos según el modelo ML
    HOME_OWNERSHIP_CHOICES = [
        ('RENT', 'Renta'),
        ('OWN', 'Propia'),
        ('MORTGAGE', 'Hipotecada'),
        ('OTHER', 'Otro'),
    ]
    
    VERIFICATION_CHOICES = [
        ('not_verified', 'No Verificado'),
        ('source_verified', 'Fuente Verificada'),
        ('verified', 'Verificado'),
    ]

    # Datos Financieros
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    annual_income = models.DecimalField(max_digits=12, decimal_places=2)
    installment = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Historial Crediticio
    dti = models.FloatField(help_text="Debt-to-Income ratio")
    delinq_2yrs = models.IntegerField(default=0)
    inq_last_6mths = models.IntegerField(default=0)
    open_acc = models.IntegerField()
    pub_rec = models.IntegerField(default=0)
    revol_bal = models.DecimalField(max_digits=12, decimal_places=2)
    revol_util = models.FloatField()
    total_acc = models.IntegerField()
    earliest_cr_line_year = models.IntegerField()
    
    # Datos de Balance
    tot_cur_bal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tot_coll_amt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_rev_hi_lim = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    # Datos Categóricos
    home_ownership = models.CharField(max_length=20, choices=HOME_OWNERSHIP_CHOICES)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES)

    # Estado de la solicitud
    status = models.CharField(max_length=20, default='pending') # pending, pre_approved, rejected
    risk_label = models.CharField(max_length=50, null=True, blank=True)
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
    annual_rate = models.DecimalField(max_digits=6, decimal_places=5) # Ej. 0.0938

    def __str__(self):
        return f"{self.product.name} - {self.name} ({self.annual_rate})"